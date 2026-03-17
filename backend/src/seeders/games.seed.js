const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Game = require('../models/Game');
const games = require('../data/games');

// Load environment variables
dotenv.config({ path: '../config/config.env' });

const seedGames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB...'.cyan.underline.bold);

    // Clear existing games
    await Game.deleteMany();
    console.log('Cleared games collection'.yellow);

    // Add sample games
    const createdGames = await Game.create(games);
    console.log(`Added ${createdGames.length} games`.green);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB'.red.underline.bold);
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

// Run the seeder
if (process.argv[2] === '--import') {
  seedGames();
} else {
  console.log('Please use --import to seed the database');
  process.exit(1);
}
