const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const colors = require('colors');
const Game = require('../src/models/Game');

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(colors.red('Error: MONGODB_URI is not defined in the environment variables'));
  console.log(colors.yellow('Please make sure you have a .env file with the correct MongoDB connection string'));
  console.log(colors.cyan('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname'));
  process.exit(1);
}

console.log('MongoDB URI:', MONGODB_URI);

// Connect to MongoDB with retry logic
const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(colors.blue(`Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`));
      
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
      });
      
      console.log(colors.green('MongoDB Connected Successfully'));
      return;
    } catch (err) {
      retryCount++;
      console.error(colors.red(`MongoDB connection error (Attempt ${retryCount}/${maxRetries}):`), err.message);
      
      if (retryCount === maxRetries) {
        console.error(colors.red('Failed to connect to MongoDB after multiple attempts'));
        process.exit(1);
      }
      
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Read and merge category scraper outputs
const loadGames = () => {
  const sources = [
    'pc_games.json',
    'global_game_keys.json',
    'offline_activation_games.json',
    'on_sale_games.json',
    'region_change_games.json',
    'global_game_keys_updated.json'
  ];

  const all = [];
  for (const filename of sources) {
    const gamesPath = path.join(__dirname, '../../scraper/data', filename);
    if (!fs.existsSync(gamesPath)) continue;
    try {
      const data = fs.readFileSync(gamesPath, 'utf8');
      const parsed = JSON.parse(data);
      const arr = Array.isArray(parsed) ? parsed : [];
      console.log(`Loaded ${arr.length} games from ${filename}`);
      all.push(...arr);
    } catch (err) {
      console.warn(`Skipping ${filename}:`, err.message);
    }
  }

  if (!all.length) {
    console.error('No game files found in scraper/data. Run scraper first.');
    process.exit(1);
  }

  // Deduplicate by url (fallback to slug/title)
  const seen = new Map();
  for (const game of all) {
    const key =
      (game.url || game.productUrl || '').toLowerCase().trim() ||
      (game.slug || '').toLowerCase().trim() ||
      (game.title || '').toLowerCase().trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.set(key, game);
      continue;
    }
    // Merge category/tag metadata from duplicates
    const prev = seen.get(key);
    const merged = {
      ...prev,
      ...game,
      categories: [...new Set([...(prev.categories || []), ...(game.categories || [])])],
      relevantCategories: [...new Set([...(prev.relevantCategories || []), ...(game.relevantCategories || [])])],
      tags: [...new Set([...(prev.tags || []), ...(game.tags || [])])]
    };
    seen.set(key, merged);
  }

  const games = [...seen.values()];
  console.log(`Successfully loaded ${games.length} unique games from category scrapers`);
  return games;
};

// Transform game data to match the schema
const transformGame = (game) => {
  // Ensure price object has all required fields
  const cadRate = Number(process.env.BDT_TO_CAD_RATE || 0.015);
  const currentInBdt = Number(game.price?.currentInBdt ?? game.price?.current ?? 0);
  const originalInBdt = Number(game.price?.originalInBdt ?? game.price?.original ?? currentInBdt);
  const currentInCAD = Number(game.price?.currentInCAD ?? (currentInBdt * cadRate).toFixed(2));
  const originalInCAD = Number(game.price?.originalInCAD ?? (originalInBdt * cadRate).toFixed(2));

  const price = {
    currentInBdt,
    originalInBdt,
    currentInCAD,
    originalInCAD,
    discount: Number(game.price?.discount || 0),
    currency: 'BDT'
  };

  // Calculate discount if not provided
  if (!game.price?.discount && price.originalInBdt > 0 && price.currentInBdt < price.originalInBdt) {
    price.discount = Math.round(((price.originalInBdt - price.currentInBdt) / price.originalInBdt) * 100);
  }

  // Transform categories and tags
  const categories = Array.isArray(game.categories) ? game.categories : [];
  const relevantCategories = Array.isArray(game.relevantCategories) ? game.relevantCategories : [];
  const tags = Array.isArray(game.tags) ? game.tags : [];

  // Determine stock status and quantity
  const availability = game.availability || '';
  const quantityMatch = availability.match(/\d+/);
  const stockQuantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 0;
  const isInStock =
    stockQuantity > 0 ||
    availability.toLowerCase().includes('in stock') ||
    (typeof game.isInStock === 'boolean' ? game.isInStock : true);

  // Default values for required fields
  const transformedGame = {
    title: game.title || 'Untitled Game',
    slug: game.title ? game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'untitled-game',
    description: game.description || 'No description available',
    fullDescription: game.fullDescription || game.description || 'No description available',
    price,
    categories,
    relevantCategories,
    tags,
    orderRanks: game.orderRanks || {},
    availability: availability || 'In Stock',
    isInStock,
    stockQuantity,
    imageUrl: game.imageUrl || '',
    screenshots: Array.isArray(game.screenshots) ? game.screenshots : [],
    platform: game.platform || 'PC',
    url: game.url || game.productUrl || '',
    publisher: game.publisher || 'Unknown Publisher',
    developer: game.developer || 'Unknown Developer',
    releaseDate: game.releaseDate || new Date(),
    rating: {
      average: game.rating?.average || 0,
      count: game.rating?.count || 0
    },
    features: Array.isArray(game.features) ? game.features : [],
    systemRequirements: game.systemRequirements || {},
    scrapedAt: game.scrapedAt ? new Date(game.scrapedAt) : new Date(),
    lastUpdated: new Date()
  };

  return transformedGame;
};

// Import games to database with upsert logic
const importGames = async () => {
  try {
    await connectDB();

    // Load and transform games
    const gamesData = loadGames();
    const games = gamesData.map(game => transformGame(game));

    if (!games.length) {
      console.log('No games found in source data.');
      process.exit(0);
    }

    const bulkOps = [];
    const slugs = [];

    for (const game of games) {
      if (!game.slug) {
        console.warn(`Skipping game without slug: ${game.title}`);
        continue;
      }

      slugs.push(game.slug);

      // We deliberately do not touch averageRating, numOfReviews, or any
      // future per-game analytics fields here so existing values are preserved.
      bulkOps.push({
        updateOne: {
          filter: { slug: game.slug },
          update: {
            $set: {
              title: game.title,
              slug: game.slug,
              description: game.description,
              fullDescription: game.fullDescription,
              price: game.price,
              categories: game.categories,
              relevantCategories: game.relevantCategories,
              tags: game.tags,
              orderRanks: game.orderRanks,
              availability: game.availability,
              isInStock: game.isInStock,
              stockQuantity: game.stockQuantity,
              imageUrl: game.imageUrl,
              screenshots: game.screenshots,
              platform: game.platform,
              publisher: game.publisher,
              developer: game.developer,
              releaseDate: game.releaseDate,
              features: game.features,
              systemRequirements: game.systemRequirements,
              scrapedAt: game.scrapedAt,
              lastUpdated: game.lastUpdated
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    if (!bulkOps.length) {
      console.log('No valid games to upsert (all missing slug).');
      process.exit(0);
    }

    console.log(`Upserting ${bulkOps.length} games...`);
    const result = await Game.bulkWrite(bulkOps);
    console.log(
      `Upsert complete. Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`
    );

    // Soft-update games that disappeared from the latest scrape:
    // mark them out of stock but keep their documents, reviews, and ratings.
    const uniqueSlugs = [...new Set(slugs)];
    const staleResult = await Game.updateMany(
      { slug: { $nin: uniqueSlugs } },
      { $set: { isInStock: false, stockQuantity: 0 } }
    );
    console.log(
      `Marked ${staleResult.modifiedCount} existing games as out of stock (not in latest import).`
    );

    process.exit(0);
  } catch (err) {
    console.error('Error importing games:', err);
    process.exit(1);
  }
};

// Run the import
importGames();
