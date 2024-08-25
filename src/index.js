import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import connectDB from './db/index.js';
import gameRouter from './routes/game.routes.js';
import roomRouter from './routes/room.routes.js';
import userRouter from './routes/user.routes.js';


dotenv.config({
    path: './.env'
});


const app = express();


const corsOptions = {
    origin: ['http://localhost:8081', 'https://truthndare.netlify.app'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));


app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));


connectDB()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MONGO DB connection failed!!!', err);
    });


app.use('/api/v1/users', userRouter);
app.use('/api/v1/room', roomRouter);
app.use('/api/v1/game', gameRouter);


const server = http.createServer(app);
const io = new socketIo(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || corsOptions.origin.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});


const playerNames = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (data) => {
        const { roomID, playerName } = data;
        socket.join(roomID);
        playerNames[socket.id] = playerName;
        console.log(`User ${playerName} joined room: ${roomID}`);
    });

    socket.on('sendMessage', ({ roomID, text }) => {
        const playerName = playerNames[socket.id] || 'Anonymous';
        console.log(`Message received in room ${roomID} from ${playerName}: ${text}`);
        io.to(roomID).emit('message', { playerName, text });
    });

    socket.on('start', (roomID) => {
        console.log(`Game started in room: ${roomID}`);
        io.to(roomID).emit('start');
    });

    socket.on('rotateWheel', (data) => {
        console.log('rotateWheel event received:', data);
        io.emit('rotateWheel', data); // Broadcast to all clients
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        delete playerNames[socket.id];
    });
});

io.engine.on("connection_error", (err) => {
    console.error('Socket.io connection error:', err.message);
    console.error('Error code:', err.code);
    console.error('Additional context:', err.context);
});


const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
    console.log(`⚙️ Server is running at port: ${PORT}`);
});

export { app, io };

