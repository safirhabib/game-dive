const mongoose = require('mongoose');

const RunningOfferSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    default: 0
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  productUrl: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    current: { type: Number, default: 0 },
    original: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    currency: { type: String, default: 'BDT' }
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

RunningOfferSchema.index({ order: 1 });

module.exports = mongoose.model('RunningOffer', RunningOfferSchema);
