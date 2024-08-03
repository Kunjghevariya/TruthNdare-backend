import express from 'express';
import gameRouter from './routes/game.routes.js';
import roomRouter from './routes/room.routes.js';
import userRouter from './routes/user.routes.js';
import cors from 'cors';

const app = express();

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:8081', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));

// Define routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/room', roomRouter);
app.use('/api/v1/game', gameRouter);

export { app };
