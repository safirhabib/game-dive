const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Middleware to validate request using express-validator
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg
    }));
    
    return next(ErrorResponse.badRequest('Validation failed', errorMessages));
  }
  
  next();
};

module.exports = validateRequest;
