import express from 'express';
import gameRouter from './routes/game.routes.js';
import roomRouter from './routes/room.routes.js';
import userRouter from './routes/user.routes.js';
import cors from 'cors';

const app = express();
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
