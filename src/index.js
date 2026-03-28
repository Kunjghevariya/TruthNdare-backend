import 'dotenv/config';
import http from 'http';
import { Server as socketIo } from 'socket.io';
import connectDB from './db/index.js';
import { app, isOriginAllowed } from './app.js';
import { initializeSocketServer } from './socket.js';

const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});

initializeSocketServer(io);

const PORT = process.env.PORT || 8001;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`⚙️ Server is running at port: ${PORT}`);
  });
});

export { app, io };
