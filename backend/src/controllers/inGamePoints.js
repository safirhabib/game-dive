const InGamePoint = require('../models/InGamePoint');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all in-game points products
// @route   GET /api/v1/in-game-points
// @access  Public
exports.getInGamePoints = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single in-game points product by id or slug
// @route   GET /api/v1/in-game-points/:idOrSlug
// @access  Public
exports.getInGamePoint = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const query = isObjectId
    ? InGamePoint.findById(idOrSlug)
    : InGamePoint.findOne({ slug: idOrSlug });

  const product = await query;

  if (!product) {
    return next(new ErrorResponse(`In-game points product not found with id or slug of ${idOrSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

