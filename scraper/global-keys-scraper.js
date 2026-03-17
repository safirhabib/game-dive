const axios = require('axios');
const cheerio = require('cheerio');
const GlobalKeysScraper = require('./src/services/globalKeysScraper');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://gamecastlebd.com/product-category/games/global-game-keys';
const MAX_PAGES = 4;

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
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
  for (let page = 1; page <= MAX_PAGES; page++) {
    const pagePath = page === 1 ? '' : `/page/${page}/`;
    const query = orderby ? `?orderby=${orderby}` : '';
    const url = `${BASE_URL}${pagePath}${query}`;
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
    console.log('🚀 Starting Global Game Keys Scraper...');
    await ensureDataDir();

    const scraper = new GlobalKeysScraper(MAX_PAGES);
    console.log('🔍 Scraping global game keys...');
    const products = await scraper.run();

    if (!products || products.length === 0) {
      throw new Error('No products were scraped. Check the website structure or your internet connection.');
    }

    console.log('📈 Collecting order-by ranks (popularity/price)...');
    const [popRanks, lowRanks, highRanks] = await Promise.all([
      collectOrderRanks('popularity'),
      collectOrderRanks('price'),
      collectOrderRanks('price-desc')
    ]);

    const enriched = products.map((p, idx) => ({
      ...p,
      orderRanks: {
        default: idx + 1,
        popularity: popRanks.get(p.url) || null,
        priceLowToHigh: lowRanks.get(p.url) || null,
        priceHighToLow: highRanks.get(p.url) || null
      }
    }));

    await fs.writeFile(path.join('data', 'global_game_keys.json'), JSON.stringify(enriched, null, 2), 'utf8');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rawFileName = `global_game_keys_raw_${timestamp}.json`;
    const rawFilePath = path.join('data', rawFileName);
    await fs.writeFile(rawFilePath, JSON.stringify(enriched, null, 2), 'utf8');

    console.log(`\n📦 Raw data saved to: ${rawFilePath}`);
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

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
