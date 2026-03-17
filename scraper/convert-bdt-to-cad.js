const fs = require('fs').promises;
const path = require('path');

// Conversion rate: 1 BDT = 0.015 CAD (1/88.33)
const BDT_TO_CAD_RATE = 1 / 88.33;

async function convertPrices() {
  try {
    const dataDir = path.join(__dirname, 'data');
    const rawFiles = (await fs.readdir(dataDir))
      .filter(file => file.startsWith('global_game_keys_raw_') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (rawFiles.length === 0) {
      throw new Error('No global_game_keys_raw_*.json file found in scraper/data');
    }

    const inputFile = path.join(dataDir, rawFiles[0]);
    const outputFile = path.join(__dirname, 'data', 'global_game_keys_with_cad.json');
    
    console.log('📖 Reading input file...');
    const data = await fs.readFile(inputFile, 'utf8');
    const games = JSON.parse(data);
    
    console.log('🔄 Converting BDT to CAD...');
    const updatedGames = games.map(game => {
      // Create a deep copy to avoid mutating the original object
      const updatedGame = JSON.parse(JSON.stringify(game));
      
      // Convert current price
      if (updatedGame.price && typeof updatedGame.price.current === 'number') {
        updatedGame.price.currentInCAD = parseFloat((updatedGame.price.current * BDT_TO_CAD_RATE).toFixed(2));
      }
      
      // Convert original price if it exists and is different from current
      if (updatedGame.price && typeof updatedGame.price.original === 'number') {
        updatedGame.price.originalInCAD = parseFloat((updatedGame.price.original * BDT_TO_CAD_RATE).toFixed(2));
      }
      
      return updatedGame;
    });
    
    console.log('💾 Saving converted data...');
    await fs.writeFile(outputFile, JSON.stringify(updatedGames, null, 2), 'utf8');
    
    console.log(`✅ Success! Converted ${games.length} games.`);
    console.log(`📊 Sample conversion (first game):`);
    console.log(`   ${updatedGames[0].title}`);
    console.log(`   BDT: ${updatedGames[0].price.current} -> CAD: ${updatedGames[0].price.currentInCAD}`);
    console.log(`   Original BDT: ${updatedGames[0].price.original} -> CAD: ${updatedGames[0].price.originalInCAD}`);
    console.log(`
💾 Output saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

// Run the conversion
convertPrices();
