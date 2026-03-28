import jwt from 'jsonwebtoken';
import { User } from "../model/user.model.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { asyncHandler } from "../utills/asyncHandler.js";

const buildCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

const sanitizeUser = async (userId) => {
    return User.findById(userId).select("-password -refreshToken");
};

const buildGuestEmail = (username) => {
    const safeUsername = username.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'guest';
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return `${safeUsername}.${uniqueSuffix}@guest.truthndare.local`;
};

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if ([email, username, password].some(field => !field || field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
    if (existUser) {
        throw new ApiError(409, "User already exists");
    }

    const user = await User.create({ email: normalizedEmail, username: normalizedUsername, password });
    const createdUser = await sanitizeUser(user._id);

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new ApiError(404, "User not registered");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const loggedInUser = await sanitizeUser(user._id);
    const options = buildCookieOptions();

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const guestId = asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username || username?.trim() === "") {
        throw new ApiError(400, "Guest username is required");
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existUser = await User.findOne({ username: normalizedUsername });
    if (existUser) {
        throw new ApiError(409, "User already exists");
    }

    const user = await User.create({
        username: normalizedUsername,
        email: buildGuestEmail(normalizedUsername)
    });
    const createdUser = await sanitizeUser(user._id);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const options = buildCookieOptions();

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, { user: createdUser, accessToken, refreshToken }, "Guest session created successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);
        const options = buildCookieOptions();

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const logout = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (req.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
                }
            },
            {
                new: true
            }
        );
    } else if (incomingRefreshToken) {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        await User.findByIdAndUpdate(decodedToken?._id, {
            $unset: {
                refreshToken: 1
            }
        });
    }

    const options = buildCookieOptions();

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { guestId, login, logout, refreshAccessToken, registerUser };
