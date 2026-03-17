const PCGamesScraper = require('./src/services/pcGamesScraper');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const PC_CATEGORY_PATH = '/product-category/games/pc-games';
const PC_MAX_PAGES = 13;

// Validation functions
const validateGame = (game) => {
  if (!game) return false;
  
  const requiredFields = ['title', 'price', 'url'];
  const hasAllRequired = requiredFields.every(field => {
    const exists = game[field] !== undefined && game[field] !== null;
    if (!exists) console.error(`Missing required field: ${field}`);
    return exists;
  });
  
  const hasValidPrice = game.price && 
                       typeof game.price.current === 'number' && 
                       game.price.current > 0;
  
  return hasAllRequired && hasValidPrice;
};

// Data processing
const processScrapedData = (games) => {
  console.log(`\nProcessing ${games.length} scraped games...`);
  
  // Validate and clean data
  const validGames = [];
  const invalidGames = [];
  
  games.forEach(game => {
    // Clean up the data
    if (game.title) game.title = game.title.trim();
    if (game.description) game.description = game.description.trim();
    
    // Validate the game data
    if (validateGame(game)) {
      validGames.push(game);
    } else {
      invalidGames.push(game);
    }
  });
  
  console.log(`✅ Valid games: ${validGames.length}`);
  console.log(`❌ Invalid games: ${invalidGames.length}`);
  
  if (invalidGames.length > 0) {
    console.log('\nSample of invalid games:');
    invalidGames.slice(0, 3).forEach((game, i) => {
      console.log(`\n${i + 1}. ${game.title || 'No Title'}`);
      console.log(`   URL: ${game.url}`);
      console.log(`   Price: ${game.price?.current || 'N/A'}`);
    });
  }
  
  return { validGames, invalidGames };
};

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  return dataDir;
}

async function collectOrderRanks(orderby) {
  const client = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://gamecastlebd.com/'
    },
    timeout: 30000
  });
  const ranks = new Map();
  let rank = 1;
  for (let page = 1; page <= PC_MAX_PAGES; page++) {
    const pagePath = page === 1 ? '' : `/page/${page}/`;
    const query = orderby ? `?orderby=${orderby}` : '';
    const url = `https://gamecastlebd.com${PC_CATEGORY_PATH}${pagePath}${query}`;
    const html = await client.get(url).then((r) => r.data).catch(() => null);
    if (!html) continue;
    const $ = cheerio.load(html);
    const links = [];
    $('a.woocommerce-LoopProduct-link.woocommerce-loop-product__link').each((i, el) => {
      const href = $(el).attr('href');
      if (href) links.push(href);
    });
    if (links.length === 0) break;
    for (const href of links) {
      if (!ranks.has(href)) {
        ranks.set(href, rank);
        rank += 1;
      }
    }
  }
  return ranks;
}

async function main() {
  try {
    console.log('🚀 Starting Game Castle BD Scraper...');
    
    // Ensure data directory exists
    await ensureDataDir();
    
    // Initialize scraper with 13 pages
    const scraper = new PCGamesScraper(13);
    
    // Run the scraper
    console.log('🔍 Scraping PC games...');
    const games = await scraper.run();
    
    if (!games || games.length === 0) {
      throw new Error('No games were scraped. Check the website structure or your internet connection.');
    }
    
    // Process and validate the data
    const { validGames, invalidGames } = processScrapedData(games);
    
    console.log('📈 Collecting order-by ranks (popularity/price)...');
    const [popRanks, lowRanks, highRanks] = await Promise.all([
      collectOrderRanks('popularity'),
      collectOrderRanks('price'),
      collectOrderRanks('price-desc')
    ]);
    const enrichedGames = validGames.map((g, idx) => ({
      ...g,
      orderRanks: {
        default: idx + 1,
        popularity: popRanks.get(g.url) || null,
        priceLowToHigh: lowRanks.get(g.url) || null,
        priceHighToLow: highRanks.get(g.url) || null
      }
    }));

    // Save valid games
    if (validGames.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `pc_games_${timestamp}.json`;
      const filePath = path.join('data', fileName);
      
      await fs.writeFile(
        filePath,
        JSON.stringify(enrichedGames, null, 2),
        'utf8'
      );

      await fs.writeFile(
        path.join('data', 'pc_games.json'),
        JSON.stringify(enrichedGames, null, 2),
        'utf8'
      );
      
      console.log(`\n💾 Successfully saved ${enrichedGames.length} games to ${filePath}`);
    }
    
    // Save invalid games for review if any
    if (invalidGames.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const errorFileName = `invalid_games_${timestamp}.json`;
      const errorFilePath = path.join('data', errorFileName);
      
      await fs.writeFile(
        errorFilePath,
        JSON.stringify(invalidGames, null, 2),
        'utf8'
      );
      
      console.log(`\n⚠️  Saved ${invalidGames.length} invalid games to ${errorFilePath} for review`);
    }
    
    console.log('\n✨ Scraping completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error in main process:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
