import bcrypt from 'bcryptjs';
import { Room } from '../model/room.model.js';
import { getIo } from '../socket.js';
import { ensureRoomState, getPublicRoomByCode, getPublicRoomById, removePlayerFromRoom } from '../services/room.service.js';
import { ApiError } from '../utills/ApiError.js';
import { ApiResponse } from '../utills/ApiResponse.js';
import { asyncHandler } from '../utills/asyncHandler.js';

const generateRoomCode = async () => {
    let roomCode = "";
    let isUnique = false;

    while (!isUnique) {
        roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const existingRoom = await Room.findOne({ code: roomCode });
        isUnique = !existingRoom;
    }

    return roomCode;
};

const createRoom = asyncHandler(async (req, res) => {
    const { name, isPrivate, password } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, 'Room name is required');
    }

    if (isPrivate && !password?.trim()) {
        throw new ApiError(400, 'Password is required for private rooms');
    }

    const normalizedName = name.trim();
    const existRoom = await Room.findOne({ name: normalizedName });
    if (existRoom) {
        throw new ApiError(409, 'Room already exists');
    }

    const roomCode = await generateRoomCode();
    const room = await Room.create({
        name: normalizedName,
        isPrivate,
        password: isPrivate ? await bcrypt.hash(password, 10) : undefined,
        code: roomCode,
        leader: req.user.username,
        phase: 'lobby',
        players: [req.user.username]
    });

    const createdRoom = await getPublicRoomById(room._id);

    if (!createdRoom) {
        throw new ApiError(500, 'Something went wrong while creating the room');
    }

    getIo().emit('roomCreated', createdRoom);

    return res.status(201).json(
        new ApiResponse(201, createdRoom, 'Room created successfully')
    );
});

const joinRoom = asyncHandler(async (req, res) => {
    const { name, code, password } = req.body;
    let room;

    if (name) {
        room = await Room.findOne({ name });
    } else if (code) {
        room = await Room.findOne({ code });
    }

    room = await ensureRoomState(room);

    if (!room) {
        throw new ApiError(404, 'Room does not exist');
    }

    if (room.isPrivate) {
        if (!password) {
            throw new ApiError(400, 'Password required for private rooms');
        }
        const isPasswordValid = await bcrypt.compare(password, room.password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Incorrect password');
        }
    }

    if (!room.players.includes(req.user.username)) {
        room.players.push(req.user.username);
        await room.save();
    }

    const updatedRoom = await Room.findById(room._id).select('-password');
    getIo().to(room.code).emit('userJoined', {
        roomCode: room.code,
        roomName: room.name,
        playerName: req.user.username,
        players: updatedRoom.players,
        leader: updatedRoom.leader,
    });

    getIo().to(room.code).emit('roomUpdated', updatedRoom);

    return res.status(200).json(
        new ApiResponse(200, updatedRoom, 'Joined room successfully')
    );
});

const showRoom = asyncHandler(async (req, res) => {
    const { code } = req.query;

    if (!code) {
        throw new ApiError(400, 'Room code is required');
    }

    const room = await getPublicRoomByCode(code);

    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    res.status(200).json(new ApiResponse(200, room, 'Room loaded successfully'));
});

const leaveRoom = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
        throw new ApiError(400, 'Room code is required');
    }

    const result = await removePlayerFromRoom({
        roomCode: code,
        username: req.user.username,
    });

    if (!result.changed && !result.room) {
        throw new ApiError(404, 'Room not found');
    }

    if (result.deleted) {
        getIo().to(code).emit('roomClosed', {
            roomCode: code,
            reason: 'The last player left the room.',
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    deleted: true,
                    roomCode: code,
                },
                'You left the room and it was closed.'
            )
        );
    }

    getIo().to(code).emit('playerLeft', {
        roomCode: code,
        playerName: req.user.username,
        leader: result.room.leader,
        leaderChanged: result.leaderChanged,
        players: result.room.players,
    });
    getIo().to(code).emit('roomUpdated', result.room);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                deleted: false,
                room: result.room,
                leaderChanged: result.leaderChanged,
            },
            result.leaderChanged
                ? 'You left the room and leadership was reassigned.'
                : 'You left the room successfully.'
        )
    );
});

export { createRoom, joinRoom, leaveRoom, showRoom };
