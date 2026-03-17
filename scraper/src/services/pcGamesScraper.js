const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const maxPages = 13;

class PCGamesScraper {
  constructor(maxPages = 5) {
    this.baseUrl = 'https://gamecastlebd.com';
    this.pcGamesBaseUrl = `${this.baseUrl}/product-category/games/pc-games`;
    this.maxPages = maxPages;
    this.axios = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://gamecastlebd.com/'
      },
      timeout: 30000 // 30 seconds timeout
    });
    this.games = [];
    this.dataDir = path.join(process.cwd(), 'data');
    this.scrapedUrls = new Set(); // To prevent duplicates
    
    // Ensure data directory exists
    fsSync.mkdirSync(this.dataDir, { recursive: true });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await this.axios.get(url);
      return cheerio.load(response.data);
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  extractPrice(priceElement) {
    if (!priceElement || !priceElement.length) return { current: 0, original: 0, discount: 0 };
    
    // Try getting the price from different possible selectors
    let priceText = '';
    
    // Check for sale price (current and original)
    const salePrice = priceElement.find('ins .woocommerce-Price-amount bdi');
    if (salePrice.length) {
      const originalPrice = priceElement.find('del .woocommerce-Price-amount bdi').first();
      if (originalPrice.length) {
        const current = parseFloat(salePrice.text().replace(/[^0-9.]/g, ''));
        const original = parseFloat(originalPrice.text().replace(/[^0-9.]/g, ''));
        const discount = Math.round(((original - current) / original) * 100);
        return { current, original, discount };
      }
    }
    
    // Try getting regular price
    const regularPrice = priceElement.find('.woocommerce-Price-amount bdi').first();
    if (regularPrice.length) {
      const price = parseFloat(regularPrice.text().replace(/[^0-9.]/g, ''));
      return { current: price, original: price, discount: 0 };
    }
    
    // Fallback to text content
    priceText = priceElement.text().trim();
    const priceMatch = priceText.match(/[\d,]+/g);
    
    if (!priceMatch) return { current: 0, original: 0, discount: 0 };
    
    if (priceMatch.length === 1) {
      const current = parseFloat(priceMatch[0].replace(/,/g, ''));
      return { current, original: current, discount: 0 };
    }
    
    // If there's a sale price (original and current price)
    const original = parseFloat(priceMatch[0].replace(/,/g, ''));
    const current = parseFloat(priceMatch[1].replace(/,/g, ''));
    const discount = Math.round(((original - current) / original) * 100);
    
    return { current, original, discount };
  }

  async scrapeGamePage(url) {
    const $ = await this.fetchPage(url);
    if (!$) return null;

    // Basic Info
    const title = $('h1.product_title').text().trim();
    const priceElement = $('p.price');
    const { current, original, discount } = this.extractPrice(priceElement);
    
    // Description and Details
    const description = $('.woocommerce-product-details__short-description').text().trim();
    const fullDescription = $('.woocommerce-Tabs-panel--description').text().trim();
    const imageUrl = $('.woocommerce-product-gallery__image img').attr('src');
    
    // Categories and Tags
    const categories = [];
    const tags = [];
    
    $('.posted_in a').each((i, el) => {
      categories.push($(el).text().trim());
    });
    
    $('.tagged_as a').each((i, el) => {
      tags.push($(el).text().trim());
    });
    
    // Additional Information
    const additionalInfo = {};
    $('.woocommerce-product-attributes-item').each((i, el) => {
      const label = $(el).find('.woocommerce-product-attributes-item__label').text().trim().replace(':', '');
      const value = $(el).find('.woocommerce-product-attributes-item__value').text().trim();
      if (label && value) {
        additionalInfo[label] = value;
      }
    });

    // Check availability
    const availability = $('.stock').text().trim() || 'In Stock';
    
    // Extract SKU if available
    const sku = $('.sku').text().replace('SKU:', '').trim();

    return {
      title,
      sku,
      price: { 
        current, 
        original, 
        discount,
        currency: 'BDT'
      },
      description,
      fullDescription,
      imageUrl,
      categories,
      tags,
      additionalInfo,
      availability,
      url,
      platform: 'PC',
      scrapedAt: new Date().toISOString()
    };
  }

  async scrapeGamesList(page = 1) {
    try {
      if (page > this.maxPages) {
        console.log(`\n🏁 Reached maximum page limit (${this.maxPages}). Stopping...`);
        return [];
      }

      const pageUrl = page === 1 
        ? this.pcGamesBaseUrl 
        : `${this.pcGamesBaseUrl}/page/${page}`;
      
      console.log(`\n📄 === Scraping Page ${page}/${this.maxPages} ===`);
      const $ = await this.fetchPage(pageUrl);
      if (!$) {
        console.log(`Failed to fetch page ${page}. Skipping...`);
        return [];
      }

      // Get all game links from the current page
      const gameLinks = [];
      $('li.product a.woocommerce-LoopProduct-link').each((i, el) => {
        const href = $(el).attr('href');
        if (href) gameLinks.push(href);
      });

      if (gameLinks.length === 0) {
        console.log('No game links found on this page.');
        return [];
      }

      console.log(`Found ${gameLinks.length} games on page ${page}`);
      
      // Scrape each game page with progress tracking
      const games = [];
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < gameLinks.length; i++) {
        const link = gameLinks[i];
        
        // Skip if we've already scraped this URL
        if (this.scrapedUrls.has(link)) {
          console.log(`\n⏩ Skipping already scraped: ${link}`);
          continue;
        }
        
        const progress = `[${page}/${this.maxPages}] ${i + 1}/${gameLinks.length}`;
        
        try {
          process.stdout.write(`\r${progress} - Scraping: ${link.substring(0, 50)}...`);
          
          const game = await this.scrapeGamePage(link);
          
          if (game && this.validateGameData(game)) {
            this.scrapedUrls.add(link);
            games.push(game);
            successCount++;
            
            // Format price for display
            const priceDisplay = game.price.current ? `${game.price.current.toLocaleString()} BDT` : 'Price N/A';
            const discountDisplay = game.price.discount > 0 ? ` (${game.price.discount}% off)` : '';
            
            process.stdout.write(` Done! ${game.title.substring(0, 30)}... - ${priceDisplay}${discountDisplay}`);
          } else {
            failCount++;
            console.log(`\n❌ Failed validation: ${link}`);
          }
          
          // Add a small delay between requests to avoid overwhelming the server
          if (i < gameLinks.length - 1) {
            const delayTime = 1000 + Math.random() * 1000; // 1-2 seconds
            await this.delay(delayTime);
          }
          
        } catch (error) {
          failCount++;
          console.error(`\nError scraping game: ${error.message}`);
        }
      }
      
      console.log(`\nPage ${page}: Successfully scraped ${successCount} games, ${failCount} failed.`);
      
      // Check if there's a next page and we haven't reached maxPages
      if (page < this.maxPages) {
        const nextPageLink = $('a.next.page-numbers');
        if (nextPageLink.length > 0) {
          console.log(`\n🔄 Moving to page ${page + 1} of ${this.maxPages}...`);
          const nextPageGames = await this.scrapeGamesList(page + 1);
          games.push(...nextPageGames);
        } else {
          console.log('No more pages found.');
        }
      }
      
      return games;
      
    } catch (error) {
      console.error(`Error in scrapeGamesList (page ${page}):`, error.message);
      return [];
    }
  }

  async saveToFile(data, filename = 'pc_games.json') {
    try {
      if (!data || data.length === 0) {
        console.warn('⚠️  No data to save');
        return false;
      }
      
      await fs.mkdir(this.dataDir, { recursive: true });
      const filePath = path.join(this.dataDir, filename);
      
      // Create a backup if file exists
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const backupFile = `${filePath}.bak`;
          await fs.copyFile(filePath, backupFile);
          console.log(`🔐 Created backup: ${backupFile}`);
        }
      } catch (e) {
        // File doesn't exist, no backup needed
      }
      
      // Save with pretty print and sorted keys for better git diffs
      const jsonData = JSON.stringify(data, Object.keys(data[0] || {}).sort(), 2);
      await fs.writeFile(filePath, jsonData);
      
      console.log(`💾 Saved ${data.length} games to ${filePath} (${(jsonData.length / 1024).toFixed(2)} KB)`);
      return true;
      
    } catch (error) {
      console.error('❌ Error saving file:', error);
      return false;
    }
  }

  // Validate game data before saving
  validateGameData(game) {
    if (!game || !game.title || !game.url) return false;
    
    // Basic price validation
    if (!game.price || typeof game.price.current !== 'number' || game.price.current < 0) {
      return false;
    }
    
    // Check for required fields
    const requiredFields = ['title', 'url', 'price'];
    return requiredFields.every(field => game[field] !== undefined && game[field] !== null);
  }

  // Clean and format the data before saving
  cleanGameData(games) {
    return games.map(game => ({
      ...game,
      title: game.title?.trim() || '',
      description: game.description?.trim() || '',
      price: {
        current: Number(game.price?.current || 0),
        original: Number(game.price?.original || game.price?.current || 0),
        discount: Number(game.price?.discount || 0),
        currency: 'BDT'
      },
      platform: game.platform || 'PC',
      categories: Array.isArray(game.categories) ? game.categories.map(c => c.trim()) : [],
      tags: Array.isArray(game.tags) ? game.tags.map(t => t.trim()) : [],
      scrapedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }));
  }

  async run() {
    try {
      console.log('🚀 Starting PC Games Scraper...');
      console.log(`📊 Max pages to scrape: ${this.maxPages}`);
      
      const startTime = Date.now();
      const games = await this.scrapeGamesList(1);
      const cleanedGames = this.cleanGameData(games);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
      
      console.log(`\n✅ Scraping completed in ${duration} minutes`);
      console.log(`📊 Total games found: ${cleanedGames.length}`);
      
      return cleanedGames;
    } catch (error) {
      console.error('❌ Error in PC Games Scraper:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }
}

module.exports = PCGamesScraper;
