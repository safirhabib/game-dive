const RunningOffersScraper = require('./src/services/runningOffersScraper');
const fs = require('fs').promises;
const path = require('path');

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  return dataDir;
}

async function main() {
  try {
    console.log('Starting Running Offers scraper...');
    await ensureDataDir();

    const scraper = new RunningOffersScraper();
    const products = await scraper.run();

    if (!products || products.length === 0) {
      console.warn('No running offer products scraped.');
    }

    const outPath = path.join('data', 'running_offers.json');
    await fs.writeFile(outPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Saved ${products.length} items to ${outPath}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
