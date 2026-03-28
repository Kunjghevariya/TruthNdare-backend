import { ApiError } from '../utills/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error?.errors || [],
  });
};
