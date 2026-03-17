const SubscriptionProduct = require('../models/SubscriptionProduct');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all subscriptions
// @route   GET /api/v1/subscriptions
// @access  Public
exports.getSubscriptions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single subscription by id or slug
// @route   GET /api/v1/subscriptions/:idOrSlug
// @access  Public
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const query = isObjectId
    ? SubscriptionProduct.findById(idOrSlug)
    : SubscriptionProduct.findOne({ slug: idOrSlug });

  const product = await query;

  if (!product) {
    return next(new ErrorResponse(`Subscription not found with id or slug of ${idOrSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

