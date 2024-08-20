import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "*",
  },
});

// Store player names and their corresponding socket IDs
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

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete playerNames[socket.id];
  });
});

const PORT = 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io };
