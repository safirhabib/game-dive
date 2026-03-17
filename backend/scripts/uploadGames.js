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
  tags: { type: [String], default: [] },
  additionalInfo: { type: Object, default: {} },
  availability: { type: String, default: 'In Stock' },
  url: { type: String, required: true },
  platform: { type: String, default: 'PC' },
  scrapedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

async function uploadGames() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Read the cleaned data
    const dataPath = path.join(__dirname, '../../scraper/data/global_game_keys_updated.json');
    console.log(`📖 Reading data from: ${dataPath}`);
    const data = await fs.readFile(dataPath, 'utf8');
    const games = JSON.parse(data);

    console.log(`Found ${games.length} games to upload`);

    // Clear existing data
    console.log('🧹 Clearing existing games...');
    await Game.deleteMany({});
    console.log('✅ Cleared existing games');

    // Insert new data
    console.log('⬆️  Uploading games...');
    const result = await Game.insertMany(games);
    console.log(`✅ Successfully uploaded ${result.length} games`);

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
      platform: sampleGame.platform,
      categories: sampleGame.categories
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the upload
uploadGames();
