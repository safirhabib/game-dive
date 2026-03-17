const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Load .env file manually to ensure it's loaded before anything else
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

console.log('Environment variables loaded');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'undefined');

// Load models
const Game = require('../src/models/Game');

// MongoDB connection string - using the Atlas connection string directly
const MONGODB_URI = 'mongodb+srv://habibsafir2020:T0FCyqfHzMuQre2h@cluster0.todtcdj.mongodb.net/gamecastledb?retryWrites=true&w=majority&appName=Cluster0';

console.log('Using MongoDB Atlas connection string');

// Connect to DB with enhanced options
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', MONGODB_URI.substring(0, 50) + '...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('Successfully connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Connection string used:', MONGODB_URI);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Read JSON file
const games = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../scraper/data/global_game_keys_updated.json'), 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('Clearing existing games...');
    await Game.deleteMany({});
    console.log('Existing games cleared');
    
    // Process games
    console.log(`Processing ${games.length} games...`);
    const processedGames = games.map((game, index) => {
      // Ensure required fields
      if (!game.title) {
        console.warn('Skipping game with no title:', game);
        return null;
      }
      
      // Process price
      const price = {
        currentInBdt: game.price?.currentInBdt || 0,
        originalInBdt: game.price?.originalInBdt || game.price?.currentInBdt || 0,
        currentInCAD: game.price?.currentInCAD || 0,
        originalInCAD: game.price?.originalInCAD || game.price?.currentInCAD || 0,
        discount: game.price?.discount || 0,
        currency: 'BDT'
      };
      
      // Calculate discount if not provided
      if (!game.price?.discount && price.originalInBdt > 0 && price.currentInBdt < price.originalInBdt) {
        price.discount = Math.round(((price.originalInBdt - price.currentInBdt) / price.originalInBdt) * 100);
      }
      
      // Process categories and tags
      const categories = Array.isArray(game.categories) 
        ? game.categories 
        : (game.category ? [game.category] : ['Games']);
      
      const tags = Array.isArray(game.tags) 
        ? game.tags 
        : [];
      
      // Extract platform from categories or use default
      let platform = 'PC'; // Default platform
      const platformKeywords = ['PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Origin', 'Epic', 'GOG', 'Ubisoft', 'Battle.net'];
      
      // Try to find platform in categories
      for (const cat of [...categories, ...tags]) {
        const catStr = String(cat).toLowerCase();
        if (catStr.includes('playstation') || catStr.includes('ps4') || catStr.includes('ps5')) {
          platform = 'PlayStation';
          break;
        } else if (catStr.includes('xbox')) {
          platform = 'Xbox';
          break;
        } else if (catStr.includes('nintendo') || catStr.includes('switch')) {
          platform = 'Nintendo';
          break;
        }
      }
      
      // Process stock status
      const stockMatch = game.availability?.match(/\d+/);
      const stockQuantity = stockMatch ? parseInt(stockMatch[0], 10) : 0;
      const isInStock = stockQuantity > 0 || !game.availability || 
                       String(game.availability).toLowerCase().includes('in stock');
      
      // Create game object
      return {
        title: game.title.trim(),
        slug: game.title.trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // Remove special chars
          .replace(/\s+/g, '-')      // Replace spaces with -
          .replace(/--+/g, '-'),     // Replace multiple - with single -
        description: game.description || `${game.title} - Digital Download`,
        fullDescription: game.fullDescription || game.description || `${game.title} - Digital Download`,
        price,
        platform,
        categories,
        relevantCategories: categories.slice(0, 3), // First 3 categories as relevant
        tags,
        imageUrl: game.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image+Available',
        screenshots: game.screenshots || [],
        isInStock,
        stockQuantity,
        isOnSale: price.discount > 0,
        sku: game.sku || `GC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        releaseDate: game.releaseDate || new Date(),
        developer: game.developer || 'Unknown',
        publisher: game.publisher || 'Unknown',
        features: game.features || [],
        systemRequirements: game.systemRequirements || {},
        rating: game.rating || 0,
        numReviews: game.numReviews || 0,
        viewCount: game.viewCount || 0,
        url: game.url || `https://gamecastlebd.com/game/${game.title.trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')}`,
        metadata: {
          scrapedAt: game.scrapedAt || new Date(),
          ...(game.metadata || {})
        }
      };
    }).filter(Boolean); // Remove any null entries
    
    // Insert games
    await Game.insertMany(processedGames);
    console.log(`Successfully imported ${processedGames.length} games`);
    
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Game.deleteMany();
    console.log('Data destroyed successfully');
    process.exit();
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}
