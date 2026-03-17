const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Log incoming headers for debugging
  console.log('Authorization Header:', req.headers.authorization);
  console.log('Cookies:', req.cookies);

  // Get token from header or cookie
  const authHeader = req.headers.authorization || '';
  
  if (authHeader.startsWith('Bearer ')) {
    // Set token from Bearer token in header
    token = authHeader.split(' ')[1]?.trim();
    console.log('Token from header:', token ? 'Found' : 'Not found');
  } else if (req.cookies && req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
    console.log('Token from cookie:', token ? 'Found' : 'Not found');
  }

  // Make sure token exists
  if (!token) {
    console.error('No token provided');
    return next(new ErrorResponse('Not authorized to access this route - No token provided', 401));
  }

  try {
    // Verify token
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Get user from the token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.error('User not found with id:', decoded.id);
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Add user to request object
    req.user = user;
    console.log('User authenticated:', user.id);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return next(new ErrorResponse(`Not authorized to access this route - ${err.message}`, 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};