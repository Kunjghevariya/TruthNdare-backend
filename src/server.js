import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
const app = express();
const server = http.createServer(app);
const io = new socketIo(server, {

const cors = require('cors');
app.use(cors({
  origin: 'https://truthndare.netlify.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));




io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('joinRoom', (roomID) => {
    socket.join(roomID);
    console.log(`User joined room: ${roomID}`);
  });
  socket.on('start', (roomID) => {
    console.log(`Game started in room: ${roomID}`);
    io.emit('start');
    // io.to(roomID).emit('start');
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
const PORT = 8002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
export { io };
