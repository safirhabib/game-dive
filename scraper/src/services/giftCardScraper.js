const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class GiftCardScraper {
  constructor(maxPages = 10) {
    this.baseUrl = 'https://gamecastlebd.com';
    this.giftCardsUrl = `${this.baseUrl}/product-category/gift-cards`;
    this.maxPages = maxPages;
    this.axios = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://gamecastlebd.com/'
      },
      timeout: 30000,
      maxRedirects: 5
    });
    this.products = [];
    this.dataDir = path.join(process.cwd(), 'data');
    this.scrapedUrls = new Set();
    
    // Ensure data directory exists
    const fsSync = require('fs');
    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await this.axios.get(url);
        if (response.status === 200) {
          return response.data;
        }
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          console.error(`Failed to fetch ${url} after ${maxRetries} attempts`);
          console.error('Error details:', error.message);
          if (error.response) {
            console.error('Status:', error.response.status);
          }
          throw error;
        }
        await this.delay(2000 * retries);
      }
    }
  }

  extractPrice(priceText) {
    try {
      if (!priceText) return 0;
      
      // Try to find the first price in the text
      const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
      if (!priceMatch) return 0;
      
      // Clean and convert the price
      const cleanPrice = priceMatch[0].replace(/[^\d.]/g, '');
      const price = parseFloat(cleanPrice);
      
      return isNaN(price) ? 0 : Math.round(price);
    } catch (error) {
      console.error('Error in extractPrice:', error);
      return 0;
    }
  }

  async scrapeProductPage(url) {
    try {
      if (this.scrapedUrls.has(url)) return null;
      
      console.log(`Fetching: ${url}`);
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const product = {
        title: $('h1.product_title.entry-title').text().trim(),
        sku: $('.sku_wrapper .sku').text().replace('SKU:', '').trim(),
        price: {
          current: 0,
          original: 0,
          discount: 0,
          currency: 'BDT'
        },
        description: $('.woocommerce-product-details__short-description').text().trim(),
        fullDescription: $('#tab-description').html() || '',
        imageUrl: $('.woocommerce-product-gallery__image a').attr('href') || '',
        categories: [],
        tags: [],
        additionalInfo: {},
        availability: $('.stock').text().trim() || 'In Stock',
        url: url,
        type: 'Gift Card',
        scrapedAt: new Date().toISOString()
      };

      // Extract price information
      const priceContainer = $('.summary p.price').first().length
        ? $('.summary p.price').first()
        : $('p.price').first();
      const priceText = priceContainer.text().trim();
      const salePriceText = priceContainer.find('ins .woocommerce-Price-amount bdi').first().text().trim();
      const originalPriceText = priceContainer.find('del .woocommerce-Price-amount bdi').first().text().trim();
      const regularPriceText = priceContainer.find('.woocommerce-Price-amount bdi').first().text().trim();
      
      if (salePriceText) {
        product.price.current = this.extractPrice(salePriceText);
        product.price.original = this.extractPrice(originalPriceText) || product.price.current;
      } else if (priceText.includes('–')) {
        const [minPrice, maxPrice] = priceText.split('–').map(p => this.extractPrice(p));
        product.price.current = minPrice;
        product.price.original = maxPrice || minPrice;
      } else {
        const price = this.extractPrice(regularPriceText || priceText);
        product.price.current = product.price.original = price;
      }
      
      // Calculate discount if original price is higher than current price
      if (product.price.original > product.price.current) {
        product.price.discount = Math.round(
          ((product.price.original - product.price.current) / product.price.original) * 100
        );
      }

      // Extract categories
      $('.posted_in a').each((i, el) => {
        const category = $(el).text().trim();
        if (category) product.categories.push(category);
      });

      // Extract tags
      $('.tagged_as a').each((i, el) => {
        const tag = $(el).text().trim();
        if (tag) product.tags.push(tag);
      });

      // Extract additional information
      $('.woocommerce-product-attributes-item').each((i, el) => {
        const label = $(el).find('.woocommerce-product-attributes-item__label').text().trim();
        const value = $(el).find('.woocommerce-product-attributes-item__value').text().trim();
        if (label && value) {
          product.additionalInfo[label] = value;
        }
      });

      this.scrapedUrls.add(url);
      return product;
      
    } catch (error) {
      console.error(`Error scraping product page ${url}:`, error.message);
      return null;
    }
  }

  async scrapeProductsList(page = 1) {
    try {
      if (page > this.maxPages) {
        console.log(`\n🏁 Reached maximum page limit (${this.maxPages}). Stopping...`);
        return [];
      }

      const url = page === 1 
        ? this.giftCardsUrl 
        : `${this.giftCardsUrl}/page/${page}/`;
      
      console.log(`\n📄 === Scraping Page ${page} ===`);
      console.log(`Fetching: ${url}`);
      
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      
      const productLinks = [];
      $('a.woocommerce-LoopProduct-link.woocommerce-loop-product__link').each((i, el) => {
        const href = $(el).attr('href');
        if (href) productLinks.push(href);
      });
      
      console.log(`Found ${productLinks.length} products on page ${page}`);
      
      if (productLinks.length === 0) {
        console.log('No more products found. Ending pagination.');
        return [];
      }
      
      const products = [];
      const failedProducts = [];
      
      for (const [index, productUrl] of productLinks.entries()) {
        try {
          process.stdout.write(`\r[${page}/${this.maxPages}] ${index + 1}/${productLinks.length} - Scraping: ${productUrl.substring(0, 50)}...`);
          const product = await this.scrapeProductPage(productUrl);
          
          if (product) {
            products.push(product);
            process.stdout.write(` Done! ${product.title.substring(0, 30)}... - ${product.price.current} BDT${product.price.discount > 0 ? ` (${product.price.discount}% off)` : ''}`);
          } else {
            failedProducts.push(productUrl);
          }
          
          // Add a small delay between requests
          await this.delay(1000 + Math.random() * 1000);
          
        } catch (error) {
          console.error(`\nError processing product:`, error.message);
          failedProducts.push(productUrl);
        }
      }
      
      console.log(`\nPage ${page}: Successfully scraped ${products.length} products, ${failedProducts.length} failed.`);
      
      // Check if there's a next page and we haven't reached maxPages
      if (page < this.maxPages) {
        const nextPageLink = $('a.next.page-numbers');
        if (nextPageLink.length > 0) {
          console.log(`\n🔄 Moving to page ${page + 1} of ${this.maxPages}...`);
          const nextPageProducts = await this.scrapeProductsList(page + 1);
          products.push(...nextPageProducts);
        } else {
          console.log('No more pages found.');
        }
      }
      
      return products;
      
    } catch (error) {
      console.error(`Error in scrapeProductsList (page ${page}):`, error.message);
      return [];
    }
  }

  async saveToFile(data, filename = 'gift_cards.json') {
    try {
      if (!data || data.length === 0) {
        console.warn('⚠️  No data to save');
        return false;
      }
      
      const filePath = path.join(this.dataDir, filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.dataDir, `gift_cards_${timestamp}.json`);
      
      // Create a backup if file exists
      try {
        await fs.copyFile(filePath, backupPath);
        console.log(`\n💾 Created backup: ${backupPath}`);
      } catch (error) {
        // File doesn't exist yet, that's fine
      }
      
      // Save the data
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`\n✅ Successfully saved ${data.length} products to ${filePath}`);
      return true;
      
    } catch (error) {
      console.error('Error saving to file:', error);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Gift Cards Scraper...');
      console.log(`🌐 Base URL: ${this.giftCardsUrl}`);
      console.log(`📊 Max Pages: ${this.maxPages}`);
      
      const startTime = Date.now();
      const products = await this.scrapeProductsList();
      
      if (products.length > 0) {
        await this.saveToFile(products);
      } else {
        console.warn('No products were scraped.');
      }
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 60000).toFixed(2);
      
      console.log(`\n✅ Scraping completed in ${duration} minutes`);
      console.log(`📊 Total products found: ${products.length}`);
      
      return products;
      
    } catch (error) {
      console.error('Error in GiftCardScraper:', error);
      throw error;
    }
  }
}

module.exports = GiftCardScraper;
