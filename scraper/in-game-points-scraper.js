const InGamePointsScraper = require('./src/services/inGamePointsScraper');
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
    console.log('🚀 Starting In-Game Points Scraper...');
    
    // Ensure data directory exists
    await ensureDataDir();
    
    // Initialize scraper with max pages (default is 10)
    const scraper = new InGamePointsScraper(10);
    
    // Run the scraper
    console.log('🔍 Scraping in-game points...');
    const products = await scraper.run();
    
    if (!products || products.length === 0) {
      throw new Error('No products were scraped. Check the website structure or your internet connection.');
    }
    
    // Save the raw data with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rawFileName = `in_game_points_raw_${timestamp}.json`;
    const rawFilePath = path.join('data', rawFileName);
    
    await fs.writeFile(
      rawFilePath,
      JSON.stringify(products, null, 2),
      'utf8'
    );
    
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

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
