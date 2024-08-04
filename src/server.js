import express from 'express';
import fs from 'fs';
import https from 'https';
import { Server as socketIo } from 'socket.io';
import cors from 'cors';

const app = express();
const PORT = 8002;

const isProduction = process.env.NODE_ENV === 'production';
const server = isProduction
  ? https.createServer({
      key: fs.readFileSync('/path/to/your/production-key.pem'),
      cert: fs.readFileSync('/path/to/your/production-cert.pem')
    }, app)
  : https.createServer({
      key: fs.readFileSync('localhost-key.pem'),
      cert: fs.readFileSync('localhost.pem')
    }, app);

const io = new socketIo(server, {
  cors: {
    origin: 'https://truthndare.netlify.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const corsOptions = {
  origin: 'https://truthndare.netlify.app',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
