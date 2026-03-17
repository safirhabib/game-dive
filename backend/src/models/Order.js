const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true
    },
    title: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceInBdt: {
      type: Number,
      required: true,
      min: 0
    },
    priceInCad: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    email: {
      type: String
    },
    items: {
      type: [OrderItemSchema],
      required: true
    },
    totalInBdt: {
      type: Number,
      required: true,
      min: 0
    },
    totalInCad: {
      type: Number,
      required: true,
      min: 0
    },
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,
    paypalOrderId: { type: String, unique: true, sparse: true },
    paypalCaptureId: String,
    status: {
      type: String,
      enum: ['paid', 'in_progress', 'closed'],
      default: 'in_progress'
    },
    adminMessage: { type: String },
    adminMessageSentAt: { type: Date }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', OrderSchema);

