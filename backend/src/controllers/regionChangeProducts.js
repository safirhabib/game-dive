const RegionChangeProduct = require('../models/RegionChangeProduct');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all region change products
// @route   GET /api/v1/region-change
// @access  Public
exports.getRegionChangeProducts = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single region change product by id or slug
// @route   GET /api/v1/region-change/:idOrSlug
// @access  Public
exports.getRegionChangeProduct = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const query = isObjectId
    ? RegionChangeProduct.findById(idOrSlug)
    : RegionChangeProduct.findOne({ slug: idOrSlug });

  const product = await query;

  if (!product) {
    return next(new ErrorResponse(`Region change product not found with id or slug of ${idOrSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

