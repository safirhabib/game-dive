const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('MongoDB URI:', process.env.MONGODB_URI);

// Import route files
const games = require('./src/routes/games');
const auth = require('./src/routes/auth');
const users = require('./src/routes/users');
const reviews = require('./src/routes/reviews');
const newsletter = require('./src/routes/newsletterRoutes');
const proxy = require('./src/routes/proxy');
const giftCards = require('./src/routes/giftCards');
const inGamePoints = require('./src/routes/inGamePoints');
const regionChange = require('./src/routes/regionChange');
const subscriptions = require('./src/routes/subscriptions');
const payments = require('./src/routes/payments');
const orders = require('./src/routes/orders');

// Import middleware
const errorHandler = require('./src/middleware/error');
const { validateRequest } = require('./src/middleware/validateRequest');

// Create Express app
const app = express();

// PayPal webhook must receive raw body for signature verification – mount before express.json()
const paypalWebhook = require('./src/controllers/payments').paypalWebhook;
app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    try {
      req.rawBody = req.body;
      req.body = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).send('Invalid JSON');
    }
    next();
  },
  paypalWebhook
);

// Body parser (JSON)
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
// Allow the frontend (different origin) to read API responses.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});

// Cache middleware
const cache = require('./src/middleware/redis');

// Enable CORS with specific configuration
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5001'];
const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

// Enable CORS with specific configuration
app.use(cors(corsOptions));

// Only relax CORS for the image proxy endpoint (no credentials needed).
// Do NOT set wildcard CORS globally because it conflicts with `credentials: true`.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/proxy/image/')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  next();
});

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/games', games);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/newsletter', newsletter);
app.use('/api/v1/proxy', proxy);
app.use('/api/v1/gift-cards', giftCards);
app.use('/api/v1/in-game-points', inGamePoints);
app.use('/api/v1/region-change', regionChange);
app.use('/api/v1/subscriptions', subscriptions);
app.use('/api/v1/payments', payments);
app.use('/api/v1/orders', orders);

// Apply rate limiting
app.use(limiter);

// Apply caching
app.use(cache);

// Prevent http param pollution
app.use(hpp());

// Error handler middleware (must be after all routes)
app.use(errorHandler);

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...'.yellow);
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
    
    // Import mock data if needed
    try {
      const Game = require('./src/models/Game');
      const count = await Game.countDocuments();
      
      if (count === 0) {
        console.log('No games found. Importing mock data...'.yellow);
        try {
          const mockGames = require('./src/data/games');
          await Game.insertMany(mockGames);
          console.log('Mock data imported successfully'.green);
        } catch (mockErr) {
          console.error('Error importing mock data:'.red, mockErr.message);
        }
      }
    } catch (dbErr) {
      console.error('Error setting up database:'.red, dbErr.message);
    }
    
    return true;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`.red);
    console.log('Retrying connection in 5 seconds...'.yellow);
    await new Promise(resolve => setTimeout(resolve, 5000));
    return connectDB();
  }
};

// Start the server
const startServer = async () => {
  try {
    // Try to connect to MongoDB first
    await connectDB();
    
    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=== Server Information ===`.cyan.bold);
      console.log(`Environment: ${process.env.NODE_ENV}`.yellow);
      console.log(`Server running on: http://localhost:${PORT}`.green);
      console.log(`MongoDB: Connected`.green);
      console.log(`==========================\n`.cyan.bold);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nError: Port ${PORT} is already in use.`.red);
        console.log('Please either:'.yellow);
        console.log(`1. Kill the process using port ${PORT}`);
        console.log(`2. Or change the PORT in your .env file`);
      } else {
        console.error('Server error:'.red, err);
      }
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\nGracefully shutting down...'.yellow);
      server.close(() => {
        console.log('Server closed'.red);
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed'.red);
          process.exit(0);
        });
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`.red);
      // Gracefully close the server
      server.close(() => {
        console.log('Server closed due to unhandled rejection'.red);
        process.exit(1);
      });
    });

  } catch (err) {
    console.error('Fatal error:'.red, err.message);
    process.exit(1);
  }
};

// Start the application
startServer();