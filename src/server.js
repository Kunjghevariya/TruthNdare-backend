import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';

const app = express();
const server = http.createServer(app);
const allowedOrigins = ['http://localhost:8081', 'https://your-client-domain.com'];

const io = new socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

const playerNames = {};

io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

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
    io.emit('rotateWheel', data);
  });

  socket.on('disconnect', () => {
    console.log(`User ${playerNames[socket.id]} disconnected`);
    delete playerNames[socket.id];
  });
});

const PORT = 8001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
