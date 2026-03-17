const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const colors = require('colors');
const SubscriptionProduct = require('../src/models/SubscriptionProduct');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(colors.red('Error: MONGODB_URI is not defined in the environment variables'));
  process.exit(1);
}

const connectDB = async () => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(colors.blue(`Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`));

      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      console.log(colors.green('MongoDB Connected Successfully'));
      return;
    } catch (err) {
      retryCount++;
      console.error(colors.red(`MongoDB connection error (Attempt ${retryCount}/${maxRetries}):`), err.message);

      if (retryCount === maxRetries) {
        console.error(colors.red('Failed to connect to MongoDB after multiple attempts'));
        process.exit(1);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

const loadSubscriptions = () => {
  try {
    const filePath = path.join(__dirname, '../../scraper/data/subscriptions.json');
    console.log('Loading subscriptions from:', filePath);
    const data = fs.readFileSync(filePath, 'utf8');
    const items = JSON.parse(data);
    console.log(`Successfully loaded ${items.length} subscriptions`);
    return items;
  } catch (err) {
    console.error('Error reading subscriptions file:', err);
    process.exit(1);
  }
};

const transformSubscription = (item) => {
  const price = {
    currentInBdt: item.price?.current || 0,
    originalInBdt: item.price?.original || item.price?.current || 0,
    discount: item.price?.discount || 0,
    currency: item.price?.currency || 'BDT'
  };

  if (!item.price?.discount && price.originalInBdt > 0 && price.currentInBdt < price.originalInBdt) {
    price.discount = Math.round(((price.originalInBdt - price.currentInBdt) / price.originalInBdt) * 100);
  }

  const availability = item.availability || '';
  const quantityMatch = availability.match(/\d+/);
  const stockQuantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 0;
  const isInStock =
    stockQuantity > 0 ||
    availability.toLowerCase().includes('in stock');

  const subscriptionDetails = {
    duration: item.subscriptionDetails?.duration || '',
    platform: item.subscriptionDetails?.platform || '',
    region: item.subscriptionDetails?.region || ''
  };

  return {
    title: item.title || 'Untitled Subscription',
    slug: item.title
      ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'untitled-subscription',
    sku: item.sku || '',
    price,
    description: item.description || '',
    fullDescription: item.fullDescription || item.description || '',
    imageUrl: item.imageUrl || '',
    categories: Array.isArray(item.categories) ? item.categories : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    additionalInfo: item.additionalInfo || {},
    availability: availability || 'In Stock',
    isInStock,
    stockQuantity,
    url: item.url,
    type: item.type || 'Subscription',
    subscriptionDetails,
    scrapedAt: item.scrapedAt ? new Date(item.scrapedAt) : new Date(),
    lastUpdated: new Date()
  };
};

const importSubscriptions = async () => {
  try {
    await connectDB();

    const rawItems = loadSubscriptions();
    const items = rawItems.map(transformSubscription).filter(i => i.url);

    if (!items.length) {
      console.log('No subscriptions found in source data.');
      process.exit(0);
    }

    const bulkOps = [];
    const urls = [];

    for (const item of items) {
      urls.push(item.url);

      bulkOps.push({
        updateOne: {
          filter: { url: item.url },
          update: {
            $set: {
              title: item.title,
              slug: item.slug,
              sku: item.sku,
              price: item.price,
              description: item.description,
              fullDescription: item.fullDescription,
              imageUrl: item.imageUrl,
              categories: item.categories,
              tags: item.tags,
              additionalInfo: item.additionalInfo,
              availability: item.availability,
              isInStock: item.isInStock,
              stockQuantity: item.stockQuantity,
              type: item.type,
              subscriptionDetails: item.subscriptionDetails,
              scrapedAt: item.scrapedAt,
              lastUpdated: item.lastUpdated
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    console.log(`Upserting ${bulkOps.length} subscriptions...`);
    const result = await SubscriptionProduct.bulkWrite(bulkOps);
    console.log(
      `Subscriptions upsert complete. Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`
    );

    const uniqueUrls = [...new Set(urls)];
    const staleResult = await SubscriptionProduct.updateMany(
      { url: { $nin: uniqueUrls } },
      { $set: { isInStock: false, stockQuantity: 0 } }
    );
    console.log(
      `Marked ${staleResult.modifiedCount} existing subscriptions as out of stock (not in latest import).`
    );

    process.exit(0);
  } catch (err) {
    console.error('Error importing subscriptions:', err);
    process.exit(1);
  }
};

importSubscriptions();

