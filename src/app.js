import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import roomRouter from './routes/room.routes.js';
import userRouter from './routes/user.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://localhost:8001',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:19000',
  'http://localhost:19001',
  'http://localhost:19006',
  'https://truthndare.netlify.app',
];
const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGINE || defaultOrigins.join(',');
const allowedOrigins = configuredOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes('*');

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowAllOrigins || process.env.NODE_ENV !== 'production') {
    return true;
  }

  return allowedOrigins.includes(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Truth N Dare backend is healthy.',
  });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/room', roomRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export { allowedOrigins, app, isOriginAllowed };
