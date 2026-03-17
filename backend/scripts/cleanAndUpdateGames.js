require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Game Schema
const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sku: { type: String, default: '' },
  price: {
    currentInBdt: { type: Number, required: true },
    originalInBdt: { type: Number, required: true },
    currentInCAD: { type: Number, required: true },
    originalInCAD: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' }
  },
  description: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  categories: { type: [String], default: [] },
  relevantCategories: { type: [String], default: [] }, // New field for relevant categories
  tags: { type: [String], default: [] },
  additionalInfo: { type: Object, default: {} },
  availability: { type: String, default: 'In Stock' },
  isInStock: { type: Boolean, default: true }, // New boolean field for stock status
  url: { type: String, required: true },
  platform: { type: String, default: 'PC' },
  scrapedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

// List of relevant categories to keep
const RELEVANT_CATEGORIES = [
  'Call Of Duty',
  'Battlefield',
  'Racing Games',
  'Rockstar Games',
  'Popular AAA games',
  "Assassin's Creed",
  'Microsoft Games',
  'Popular Action Games',
  'Popular Shooter Games',
  'Sports Games',
  'Simulation Games',
  'GOG Games'
];

async function cleanAndUpdateGames() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing all existing games...');
    await Game.deleteMany({});
    console.log('✅ Cleared all existing games');

    // Read the cleaned data
    const dataPath = path.join(__dirname, '../../scraper/data/global_game_keys_updated.json');
    console.log(`📖 Reading data from: ${dataPath}`);
    const data = await fs.readFile(dataPath, 'utf8');
    const games = JSON.parse(data);

    console.log(`Found ${games.length} games to process`);

    // Process each game
    const updatedGames = games.map(game => {
      // Create a deep copy
      const updatedGame = JSON.parse(JSON.stringify(game));
      
      // Add isInStock field
      if (typeof updatedGame.availability === 'string') {
        updatedGame.isInStock = updatedGame.availability.toLowerCase().includes('in stock') || 
                              /\d+\s*(in stock|available)/i.test(updatedGame.availability);
      } else {
        updatedGame.isInStock = false;
      }
      
      // Add relevantCategories
      updatedGame.relevantCategories = [];
      if (updatedGame.categories && Array.isArray(updatedGame.categories)) {
        updatedGame.relevantCategories = updatedGame.categories.filter(category => 
          RELEVANT_CATEGORIES.some(relevantCat => 
            category.toLowerCase().includes(relevantCat.toLowerCase())
          )
        );
      }
      
      return updatedGame;
    });

    // Filter games that have at least one relevant category
    const relevantGames = updatedGames.filter(game => game.relevantCategories.length > 0);
    
    console.log(`✅ Processed ${updatedGames.length} games`);
    console.log(`📊 Found ${relevantGames.length} games with relevant categories`);

    // Insert only relevant games
    if (relevantGames.length > 0) {
      console.log('⬆️  Uploading relevant games...');
      const result = await Game.insertMany(relevantGames);
      console.log(`✅ Successfully uploaded ${result.length} relevant games`);
      
      // Get some stats
      const sampleGame = await Game.findOne();
      console.log('\n📊 Sample game in database:');
      console.log({
        title: sampleGame.title,
        price: {
          currentInBdt: sampleGame.price.currentInBdt,
          currentInCAD: sampleGame.price.currentInCAD,
          discount: sampleGame.price.discount
        },
        isInStock: sampleGame.isInStock,
        relevantCategories: sampleGame.relevantCategories,
        platform: sampleGame.platform
      });
    } else {
      console.log('ℹ️  No relevant games found matching the specified categories');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup and update
cleanAndUpdateGames();
