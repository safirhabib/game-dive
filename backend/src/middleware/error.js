const ErrorResponse = require('../utils/errorResponse');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack.red);

  // Handle ErrorResponse instances
  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      errors: err.errors
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = ErrorResponse.notFound(message);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = ErrorResponse.badRequest(message);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = ErrorResponse.badRequest('Validation Error', messages);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      errors: error.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ErrorResponse.unauthorized('Not authorized');
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = ErrorResponse.unauthorized('Session expired, please login again');
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Default to 500 server error
  console.error('Unhandled Error:', err);
  const serverError = ErrorResponse.serverError('Server Error');
  res.status(serverError.statusCode).json({
    success: false,
    error: serverError.message
  });
};

module.exports = errorHandler;
