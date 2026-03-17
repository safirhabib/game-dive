const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fsSync = require('fs');

const RUNNING_OFFERS_LIMIT = 12;

/**
 * Scrapes the "Running Offers" section (exactly 12 products) from gamecastlebd.com.
 * Tries the dedicated Running Offers category first, then falls back to on-sale.
 * List-only: does not visit individual product pages.
 */
class RunningOffersScraper {
  constructor() {
    this.baseUrl = 'https://gamecastlebd.com';
    this.categoryUrls = [
      `${this.baseUrl}/product-category/games/running-offers`,
      `${this.baseUrl}/product-category/running-offers`,
      `${this.baseUrl}/product-category/games/on-sale`
    ];
    this.axios = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://gamecastlebd.com/'
      },
      timeout: 30000
    });
    this.products = [];
    this.dataDir = path.join(process.cwd(), 'data');
    this.scrapedUrls = new Set();

    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    try {
      const response = await this.axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract price from a cheerio-wrapped .price element (list view).
   * Handles: sale (del + ins), single price, and price range (min – max).
   */
  extractPrice(priceElement) {
    if (!priceElement || !priceElement.length) {
      return { current: 0, original: 0, discount: 0 };
    }

    const salePrice = priceElement.find('ins .woocommerce-Price-amount bdi');
    const originalPrice = priceElement.find('del .woocommerce-Price-amount bdi').first();
    if (salePrice.length && originalPrice.length) {
      const current = parseFloat(salePrice.first().text().replace(/[^0-9.]/g, ''));
      const original = parseFloat(originalPrice.text().replace(/[^0-9.]/g, ''));
      const discount =
        original > 0 ? Math.round(((original - current) / original) * 100) : 0;
      return { current, original, discount };
    }

    const regularPrice = priceElement.find('.woocommerce-Price-amount bdi').first();
    if (regularPrice.length) {
      const text = regularPrice.text().trim();
      const priceMatch = text.match(/[\d,]+(?:\.\d{1,2})?/g);
      if (priceMatch && priceMatch.length >= 1) {
        const current = parseFloat(priceMatch[0].replace(/,/g, ''));
        if (priceMatch.length >= 2) {
          const original = parseFloat(priceMatch[1].replace(/,/g, ''));
          const discount =
            original > 0 ? Math.round(((original - current) / original) * 100) : 0;
          return { current, original: original || current, discount };
        }
        return { current, original: current, discount: 0 };
      }
    }

    const priceText = priceElement.text().trim();
    const priceMatch = priceText.match(/[\d,]+(?:\.\d{1,2})?/g);
    if (!priceMatch || priceMatch.length === 0) return { current: 0, original: 0, discount: 0 };
    const current = parseFloat(priceMatch[0].replace(/,/g, ''));
    const original =
      priceMatch.length > 1 ? parseFloat(priceMatch[1].replace(/,/g, '')) : current;
    const discount =
      original > 0 && original > current
        ? Math.round(((original - current) / original) * 100)
        : 0;
    return { current, original, discount };
  }

  /**
   * Parse a single list item (li.product) and return product data.
   */
  parseProductItem($, el) {
    const $el = $(el);
    const link = $el.find('a.woocommerce-LoopProduct-link').attr('href');
    if (!link) return null;

    if (this.scrapedUrls.has(link)) return null;
    this.scrapedUrls.add(link);

    const title =
      $el.find('h2.woocommerce-loop-product__title').text().trim() ||
      $el.find('a.ast-loop-product__link').text().trim();
    if (!title) return null;

    const img = $el.find('img.attachment-woocommerce_thumbnail').attr('src');
    const imageUrl = img || '';

    const categoryEl = $el.find('span.ast-woo-product-category').first();
    const category = categoryEl.text().trim() || '';

    const priceEl = $el.find('span.price').first();
    const price = this.extractPrice(priceEl);

    // Slug for matching to DB: last path segment of product URL
    const urlPath = link.replace(/\/$/, '');
    const slug = urlPath.split('/').pop() || '';

    return {
      title,
      url: link,
      slug,
      imageUrl,
      category,
      price: {
        current: price.current,
        original: price.original,
        discount: price.discount,
        currency: 'BDT'
      },
      scrapedAt: new Date().toISOString()
    };
  }

  async scrapeListPage(url, page = 1) {
    const pageUrl = page === 1 ? url : `${url}/page/${page}`;
    const html = await this.fetchPage(pageUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const items = [];
    $('ul.products li.product').each((i, el) => {
      if (items.length >= RUNNING_OFFERS_LIMIT) return false;
      const product = this.parseProductItem($, el);
      if (product) items.push(product);
    });
    return items;
  }

  async run() {
    console.log('Scraping Running Offers (exactly 12)...');
    let all = [];
    for (const baseUrl of this.categoryUrls) {
      this.scrapedUrls.clear();
      all = [];
      for (let p = 1; p <= 2; p++) {
        const items = await this.scrapeListPage(baseUrl, p);
        all.push(...items);
        if (items.length === 0) break;
        if (all.length >= RUNNING_OFFERS_LIMIT) break;
        await this.delay(600);
      }
      if (all.length >= RUNNING_OFFERS_LIMIT) {
        console.log(`Using category: ${baseUrl}`);
        break;
      }
    }
    this.products = all.slice(0, RUNNING_OFFERS_LIMIT);
    console.log(`Collected ${this.products.length} running offer products.`);
    return this.products;
  }

  getProducts() {
    return this.products;
  }
}

module.exports = RunningOffersScraper;
