import { Room } from '../model/room.model.js';
import { io } from '../server.js';
import { ApiError } from '../utills/ApiError.js';
import { ApiResponse } from '../utills/ApiResponse.js';
import { asyncHandler } from '../utills/asyncHandler.js';

const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createRoom = asyncHandler(async (req, res) => {
    const { name, isPrivate, password } = req.body;

    const existRoom = await Room.findOne({ name });
    if (existRoom) {
        throw new ApiError(409, 'Room already exists');
    }

    const roomCode = generateRoomCode();
    const room = await Room.create({
        name,
        isPrivate,
        password,
        code: roomCode,
        players: [req.user.username]
    });

    const createdRoom = await Room.findById(room._id).select('-password');

    if (!createdRoom) {
        throw new ApiError(500, 'Something went wrong while creating the room');
    }

    io.emit('roomCreated', createdRoom);

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

    if (!room) {
        throw new ApiError(404, 'Room does not exist');
    }

    if (room.isPrivate) {
        if (!password) {
            throw new ApiError(400, 'Password required for private rooms');
        }
        if (room.password !== password) {
            throw new ApiError(401, 'Incorrect password');
        }
    }

    if (!room.players.includes(req.user.username)) {
        room.players.push(req.user.username);
        await room.save();
    }

    io.to(room._id.toString()).emit('userJoined', req.user.username);

    const updatedRoom = await Room.findById(room._id).select('-password');
    return res.status(200).json(
        new ApiResponse(200, updatedRoom, 'Joined room successfully')
    );
});

const showRoom = asyncHandler(async (req, res) => {
    const { code } = req.query;
    console.log('Received code:', code);

    const room = await Room.findOne({ code });
    console.log('Room found:', room);

    if (!room) {
        throw new ApiError(404, 'Room not found');
    }

    res.status(200).json(room);
});

export { createRoom, joinRoom, showRoom };
