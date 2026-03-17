const GiftCard = require('../models/GiftCard');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all gift cards
// @route   GET /api/v1/gift-cards
// @access  Public
exports.getGiftCards = asyncHandler(async (req, res, next) => {
  // Uses advancedResults middleware
  res.status(200).json(res.advancedResults);
});

// @desc    Get single gift card by id or slug
// @route   GET /api/v1/gift-cards/:idOrSlug
// @access  Public
exports.getGiftCard = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const query = isObjectId
    ? GiftCard.findById(idOrSlug)
    : GiftCard.findOne({ slug: idOrSlug });

  const card = await query;

  if (!card) {
    return next(new ErrorResponse(`Gift card not found with id or slug of ${idOrSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: card
  });
});

