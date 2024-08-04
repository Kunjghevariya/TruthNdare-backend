import express from 'express';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://truthndare.netlify.app',
  'http://localhost:8081'
];

// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Initialize Socket.io with CORS options
const io = new socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomID) => {
    socket.join(roomID);
    console.log(`User joined room: ${roomID}`);
  });

  socket.on('start', (roomID) => {
    console.log(`Game started in room: ${roomID}`);
    io.to(roomID).emit('start'); // This emits the 'start' event to the specific room
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = 8002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { io };
