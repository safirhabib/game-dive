const mongoose = require('mongoose');

const SubscriptionProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      unique: true
    },
    sku: {
      type: String,
      default: ''
    },
    price: {
      currentInBdt: {
        type: Number,
        required: [true, 'Please add a price in BDT'],
        min: 0
      },
      originalInBdt: {
        type: Number,
        min: 0
      },
      discount: {
        type: Number,
        min: 0,
        max: 100
      },
      currency: {
        type: String,
        default: 'BDT'
      }
    },
    description: {
      type: String,
      default: ''
    },
    fullDescription: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    categories: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    additionalInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    availability: {
      type: String,
      default: 'In Stock'
    },
    url: {
      type: String,
      required: [true, 'Please add a source URL'],
      unique: true
    },
    type: {
      type: String,
      default: 'Subscription'
    },
    subscriptionDetails: {
      duration: { type: String, default: '' },
      platform: { type: String, default: '' },
      region: { type: String, default: '' }
    },
    isInStock: {
      type: Boolean,
      default: true
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    scrapedAt: {
      type: Date
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

SubscriptionProductSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('SubscriptionProduct', SubscriptionProductSchema);

