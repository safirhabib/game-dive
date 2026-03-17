const fs = require('fs').promises;
const path = require('path');

async function updatePriceFields() {
  try {
    // Input and output file paths
    const inputFile = path.join(__dirname, 'data', 'global_game_keys_with_cad.json');
    const outputFile = path.join(__dirname, 'data', 'global_game_keys_updated.json');
    
    console.log('📖 Reading input file...');
    const data = await fs.readFile(inputFile, 'utf8');
    const games = JSON.parse(data);
    
    console.log('🔄 Updating price fields...');
    const updatedGames = games.map(game => {
      // Create a new object to avoid mutating the original
      const updatedGame = { ...game };
      
      // Rename price fields
      if (updatedGame.price) {
        updatedGame.price = {
          currentInBdt: updatedGame.price.current,
          originalInBdt: updatedGame.price.original,
          currentInCAD: updatedGame.price.currentInCAD,
          originalInCAD: updatedGame.price.originalInCAD,
          // Keep discount if it exists
          ...(updatedGame.price.discount !== undefined && { discount: updatedGame.price.discount })
        };
      }
      
      return updatedGame;
    });
    
    console.log('💾 Saving updated data...');
    await fs.writeFile(outputFile, JSON.stringify(updatedGames, null, 2), 'utf8');
    
    console.log(`✅ Success! Updated ${games.length} games.`);
    console.log(`📊 Sample update (first game):`);
    console.log(JSON.stringify(updatedGames[0].price, null, 2));
    console.log(`
💾 Output saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error during update:', error);
    process.exit(1);
  }
}

// Run the update
updatePriceFields();
