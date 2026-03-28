import { Router } from "express";
import { guestId, login, logout, refreshAccessToken, registerUser } from "../controller/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const userRouter = Router()
userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(login)
userRouter.route("/guest").post(guestId)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/logout").post(verifyJWT, logout)

export default userRouter
