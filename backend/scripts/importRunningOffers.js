const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const colors = require('colors');
const Game = require('../src/models/Game');
const RunningOffer = require('../src/models/RunningOffer');

const MONGODB_URI = process.env.MONGODB_URI;
const RUNNING_OFFERS_LIMIT = 12;

if (!MONGODB_URI) {
  console.error(colors.red('Error: MONGODB_URI is not defined in .env'));
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(colors.green('MongoDB connected'));
  } catch (err) {
    console.error(colors.red('MongoDB connection error:'), err.message);
    process.exit(1);
  }
};

function loadRunningOffers() {
  const scrapedPath = path.join(__dirname, '../../scraper/data/running_offers.json');
  const fallbackPath = path.join(__dirname, '../data/running_offers.json');
  for (const p of [scrapedPath, fallbackPath]) {
    try {
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(data);
        const arr = Array.isArray(parsed) ? parsed : [];
        console.log(colors.blue(`Loaded ${arr.length} items from ${p}`));
        return arr.slice(0, RUNNING_OFFERS_LIMIT);
      }
    } catch (e) {
      console.warn(colors.yellow(`Could not read ${p}:`, e.message));
    }
  }
  console.error(colors.red('running_offers.json not found. Run the scraper first: npm run scrape:running-offers'));
  process.exit(1);
}

async function importRunningOffers() {
  await connectDB();

  // Drop legacy unique index on game so multiple offers can have game: null
  try {
    await RunningOffer.collection.dropIndex('game_1');
    console.log(colors.blue('Dropped legacy unique index game_1'));
  } catch (e) {
    if (e.code !== 27 && e.codeName !== 'IndexNotFound') throw e;
  }

  const items = loadRunningOffers();
  if (items.length === 0) {
    console.log(colors.yellow('No items to import.'));
    process.exit(0);
  }

  await RunningOffer.deleteMany({});
  let withGame = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const slug = item.slug || (item.url && item.url.replace(/\/$/, '').split('/').pop());
    const price = item.price || {};
    let gameId = null;
    if (slug) {
      const game = await Game.findOne({ slug });
      if (game) {
        gameId = game._id;
        withGame++;
      }
    }
    await RunningOffer.create({
      order: i,
      title: item.title || 'Untitled',
      slug: slug || undefined,
      imageUrl: item.imageUrl || '',
      productUrl: item.url || undefined,
      category: item.category || '',
      price: {
        current: Number(price.current) || 0,
        original: Number(price.original) || Number(price.current) || 0,
        discount: Number(price.discount) || 0,
        currency: price.currency || 'BDT'
      },
      game: gameId
    });
  }

  console.log(colors.green(`Running offers: ${items.length} imported (${withGame} linked to games).`));
  process.exit(0);
}

importRunningOffers().catch((err) => {
  console.error(colors.red(err));
  process.exit(1);
});
