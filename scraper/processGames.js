const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class GameDataProcessor {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.outputFile = path.join(this.dataDir, 'pc_games.json');
    
    // Ensure data directory exists
    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async loadAllGameFiles() {
    try {
      const files = await fs.readdir(this.dataDir);
      const gameFiles = files.filter(file => 
        file.startsWith('pc_games') && file.endsWith('.json') && !file.includes('invalid')
      );
      
      let allGames = [];
      
      for (const file of gameFiles) {
        const filePath = path.join(this.dataDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const games = JSON.parse(fileContent);
        
        if (Array.isArray(games)) {
          allGames = [...allGames, ...games];
        }
      }
      
      return allGames;
    } catch (error) {
      console.error('Error loading game files:', error);
      return [];
    }
  }

  processGame(game) {
    if (!game || !game.title) return null;
    
    // Generate a unique ID for each game
    const gameId = uuidv4();
    
    // Extract platform from title or categories
    let platform = 'PC';
    if (game.title.includes('PlayStation') || game.title.includes('PS4') || game.title.includes('PS5')) {
      platform = 'PlayStation';
    } else if (game.title.includes('Xbox')) {
      platform = 'Xbox';
    } else if (game.title.includes('Nintendo') || game.title.includes('Switch')) {
      platform = 'Nintendo';
    }
    
    // Clean up the game data
    return {
      id: gameId,
      title: this.cleanText(game.title),
      slug: this.createSlug(game.title),
      description: this.cleanText(game.description || ''),
      fullDescription: this.cleanText(game.fullDescription || ''),
      price: {
        current: Number(game.price?.current || 0),
        original: Number(game.price?.original || game.price?.current || 0),
        discount: Number(game.price?.discount || 0),
        currency: 'BDT'
      },
      platform,
      imageUrl: game.imageUrl || '',
      productUrl: game.url || '',
      sku: game.sku || '',
      availability: game.availability || 'In Stock',
      categories: this.cleanArray(game.categories || []),
      tags: this.cleanArray(game.tags || []),
      metadata: {
        source: 'Game Castle BD',
        scrapedAt: game.scrapedAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      },
      // Additional fields from the original data
      ...(game.additionalInfo ? { details: game.additionalInfo } : {})
    };
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .trim();
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  cleanArray(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map(item => this.cleanText(item))
      .filter(item => item.length > 0);
  }

  removeDuplicates(games) {
    const uniqueGames = [];
    const seenUrls = new Set();
    
    for (const game of games) {
      if (!game || !game.productUrl) continue;
      
      const url = game.productUrl.toLowerCase();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueGames.push(game);
      }
    }
    
    return uniqueGames;
  }

  async processAndSave() {
    try {
      console.log('🚀 Starting game data processing...');
      
      // Load all scraped game data
      const rawGames = await this.loadAllGameFiles();
      console.log(`📥 Loaded ${rawGames.length} raw game entries`);
      
      // Process each game
      const processedGames = [];
      const failedGames = [];
      
      for (const game of rawGames) {
        try {
          const processed = this.processGame(game);
          if (processed) {
            processedGames.push(processed);
          } else {
            failedGames.push(game);
          }
        } catch (error) {
          console.error(`Error processing game: ${game?.title || 'Unknown'}`, error);
          failedGames.push(game);
        }
      }
      
      // Remove duplicates
      const uniqueGames = this.removeDuplicates(processedGames);
      
      console.log(`\n📊 Processing Results:`);
      console.log(`✅ Successfully processed: ${uniqueGames.length} games`);
      console.log(`❌ Failed to process: ${failedGames.length} games`);
      
      if (failedGames.length > 0) {
        const failedFile = path.join(this.dataDir, 'failed-games.json');
        await fs.writeFile(failedFile, JSON.stringify(failedGames, null, 2));
        console.log(`📝 Failed games saved to: ${failedFile}`);
      }
      
      // Save the final processed data
      await fs.writeFile(
        this.outputFile,
        JSON.stringify(uniqueGames, null, 2)
      );
      
      console.log(`\n✨ Success! Processed games saved to: ${this.outputFile}`);
      console.log(`Total unique games: ${uniqueGames.length}`);
      
      return {
        success: true,
        totalGames: uniqueGames.length,
        failed: failedGames.length,
        outputFile: this.outputFile
      };
      
    } catch (error) {
      console.error('❌ Error processing game data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the processor
if (require.main === module) {
  const processor = new GameDataProcessor();
  processor.processAndSave().catch(console.error);
}

module.exports = GameDataProcessor;
