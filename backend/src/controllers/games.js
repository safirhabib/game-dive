const Game = require('../models/Game');
const RunningOffer = require('../models/RunningOffer');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const path = require('path');
const axios = require('axios');

// @desc    Get current exchange rate for BDT to CAD
// @access  Private
const getExchangeRate = async () => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/BDT');
    return response.data.rates.CAD || 0.015; // Fallback rate if API fails
  } catch (error) {
    console.error('Error fetching exchange rate:', error.message);
    return 0.015; // Default fallback rate
  }
};

// @desc    Search games by query
// @route   GET /api/v1/games/search
// @access  Public
exports.searchGames = asyncHandler(async (req, res, next) => {
  try {
    const { q, platform, category, minPrice, maxPrice, sortBy, order = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Platform filter
    if (platform) {
      query.platform = { $in: platform.split(',') };
    }
    
    // Category filter
    if (category) {
      query.$or = [
        { categories: { $in: category.split(',') } },
        { relevantCategories: { $in: category.split(',') } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      query['price.currentInBdt'] = {};
      if (minPrice) query['price.currentInBdt'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.currentInBdt'].$lte = parseFloat(maxPrice);
    }
    
    // Build sort object
    let sort = {};
    if (sortBy) {
      const sortFields = sortBy.split(',');
      sortFields.forEach(field => {
        const [key, value] = field.split(':');
        sort[key] = value === 'desc' ? -1 : 1;
      });
    } else {
      sort = { createdAt: -1 }; // Default sort by newest
    }
    
    // Execute query with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
      Game.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('title slug price imageUrl platform categories isInStock isOnSale averageRating')
        .lean(),
      Game.countDocuments(query)
    ]);
    
    // Calculate pagination
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      success: true,
      count: games.length,
      total,
      page,
      pages,
      data: games
    });
  } catch (error) {
    console.error('Error in searchGames:', error);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @desc    Get all games with filtering, sorting, and pagination
// @route   GET /api/v1/games
// @access  Public
exports.getGames = asyncHandler(async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'platform', 'category', 'search', 'inStock', 'onSale'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query object
    let queryObj = { ...reqQuery };

    // Handle platform filter
    if (req.query.platform) {
      queryObj.platform = { $in: req.query.platform.split(',') };
    }

    // Handle category filter
    if (req.query.category) {
      queryObj.$or = [
        { categories: { $in: req.query.category.split(',') } },
        { relevantCategories: { $in: req.query.category.split(',') } }
      ];
    }

    // Handle stock filter
    if (req.query.inStock === 'true') {
      queryObj.isInStock = true;
      queryObj['stockQuantity'] = { $gt: 0 };
    }

    // Handle sale filter
    if (req.query.onSale === 'true') {
      queryObj.isOnSale = true;
      queryObj['price.discount'] = { $gt: 0 };
    }

    // Handle search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      queryObj.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { 'developer': { $regex: searchRegex } },
        { 'publisher': { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Create query string
    let queryStr = JSON.stringify(queryObj);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Game.find(JSON.parse(queryStr)).populate({
      path: 'reviews',
      select: 'rating comment user',
      populate: {
        path: 'user',
        select: 'username avatar'
      }
    });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Default selected fields
      query = query.select('title slug description fullDescription price imageUrl platform categories relevantCategories isInStock isOnSale averageRating numOfReviews');
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sort
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Game.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const games = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: games.length,
      pagination,
      data: games
    });
  } catch (error) {
    console.error('Error in getGames:', error);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @desc    Get single game by ID or slug
// @route   GET /api/v1/games/:idOrSlug
// @access  Public
exports.getGame = asyncHandler(async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    
    // Check if the parameter is a valid MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isObjectId) {
      query = Game.findById(idOrSlug).select('+fullDescription');
    } else {
      query = Game.findOne({ slug: idOrSlug }).select('+fullDescription');
    }

    const game = await query.populate({
      path: 'reviews',
      select: 'rating comment user createdAt',
      options: { sort: { createdAt: -1 } },
      populate: {
        path: 'user',
        select: 'username avatar'
      }
    });

    if (!game) {
      return next(
        new ErrorResponse(`Game not found with id or slug of ${idOrSlug}`, 404)
      );
    }

    // Increment view count (optional)
    game.views = (game.views || 0) + 1;
    await game.save();

    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Error in getGame:', error);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @desc    Create new game
// @route   POST /api/v1/games
// @access  Private/Admin
exports.createGame = asyncHandler(async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Calculate CAD prices if not provided
    if (req.body.price) {
      const exchangeRate = await getExchangeRate();
      
      if (req.body.price.currentInBdt && !req.body.price.currentInCAD) {
        req.body.price.currentInCAD = parseFloat((req.body.price.currentInBdt * exchangeRate).toFixed(2));
      }
      
      if (req.body.price.originalInBdt && !req.body.price.originalInCAD) {
        req.body.price.originalInCAD = parseFloat((req.body.price.originalInBdt * exchangeRate).toFixed(2));
      }

      // Calculate discount if not provided
      if (req.body.price.originalInBdt && req.body.price.currentInBdt && !req.body.price.discount) {
        const original = parseFloat(req.body.price.originalInBdt);
        const current = parseFloat(req.body.price.currentInBdt);
        if (original > 0 && original > current) {
          req.body.price.discount = Math.round(((original - current) / original) * 100);
          req.body.isOnSale = true;
        }
      }
    }

    // Handle categories
    if (req.body.categories && typeof req.body.categories === 'string') {
      req.body.categories = req.body.categories.split(',').map(cat => cat.trim());
    }

    // Handle relevantCategories
    if (req.body.relevantCategories && typeof req.body.relevantCategories === 'string') {
      req.body.relevantCategories = req.body.relevantCategories.split(',').map(cat => cat.trim());
    }

    // Handle tags
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    // Set stock status
    if (req.body.stockQuantity !== undefined) {
      req.body.isInStock = parseInt(req.body.stockQuantity) > 0;
    }

    const game = await Game.create(req.body);

    res.status(201).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Error in createGame:', error);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @desc    Update game
// @route   PUT /api/v1/games/:id
// @access  Private/Admin
exports.updateGame = asyncHandler(async (req, res, next) => {
  try {
    let game = await Game.findById(req.params.id);

    if (!game) {
      return next(
        new ErrorResponse(`Game not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is game owner or admin
    if (game.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this game`,
          401
        )
      );
    }

    // Handle price updates
    if (req.body.price) {
      const exchangeRate = await getExchangeRate();
      const priceUpdates = {};

      // Update BDT prices if changed
      if (req.body.price.currentInBdt !== undefined) {
        priceUpdates['price.currentInBdt'] = parseFloat(req.body.price.currentInBdt);
        priceUpdates['price.currentInCAD'] = parseFloat((priceUpdates['price.currentInBdt'] * exchangeRate).toFixed(2));
      }

      if (req.body.price.originalInBdt !== undefined) {
        priceUpdates['price.originalInBdt'] = parseFloat(req.body.price.originalInBdt);
        priceUpdates['price.originalInCAD'] = parseFloat((priceUpdates['price.originalInBdt'] * exchangeRate).toFixed(2));
      }

      // Update CAD prices directly if provided
      if (req.body.price.currentInCAD !== undefined) {
        priceUpdates['price.currentInCAD'] = parseFloat(req.body.price.currentInCAD);
      }

      if (req.body.price.originalInCAD !== undefined) {
        priceUpdates['price.originalInCAD'] = parseFloat(req.body.price.originalInCAD);
      }

      // Calculate discount if not provided
      if (priceUpdates['price.originalInBdt'] !== undefined && priceUpdates['price.currentInBdt'] !== undefined) {
        const original = priceUpdates['price.originalInBdt'];
        const current = priceUpdates['price.currentInBdt'];
        if (original > 0 && original > current) {
          priceUpdates['price.discount'] = Math.round(((original - current) / original) * 100);
          req.body.isOnSale = true;
        } else {
          priceUpdates['price.discount'] = 0;
          req.body.isOnSale = false;
        }
      }

      // Merge price updates with other updates
      req.body = {
        ...req.body,
        price: {
          ...game.price.toObject(),
          ...priceUpdates
        }
      };
    }

    // Handle stock updates
    if (req.body.stockQuantity !== undefined) {
      req.body.isInStock = parseInt(req.body.stockQuantity) > 0;
    }

    // Handle array fields
    const arrayFields = ['categories', 'relevantCategories', 'tags', 'screenshots'];
    arrayFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].split(',').map(item => item.trim());
      }
    });

    // Update the game
    game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('Error in updateGame:', error);
    next(new ErrorResponse('Server Error', 500));
  }
});

// @desc    Delete game
// @route   DELETE /api/v1/games/:id
// @access  Private/Admin
exports.deleteGame = asyncHandler(async (req, res, next) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    return next(
      new ErrorResponse(`Game not found with id of ${req.params.id}`, 404)
    );
  }

  await game.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get games by platform
// @route   GET /api/v1/games/platform/:platform
// @access  Public
exports.getGamesByPlatform = asyncHandler(async (req, res, next) => {
  const { platform } = req.params;
  const { limit = 12, page = 1 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const query = { 
    platform: new RegExp(platform, 'i'),
    isInStock: true 
  };
  
  const [games, total] = await Promise.all([
    Game.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'price.discount': -1 }),
    Game.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: games.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: games
  });
});

// @desc    Get games by category
// @route   GET /api/v1/games/category/:category
// @access  Public
exports.getGamesByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { limit = 12, page = 1 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const query = {
    $or: [
      { categories: { $in: [new RegExp(category, 'i')] } },
      { relevantCategories: { $in: [new RegExp(category, 'i')] } }
    ],
    isInStock: true
  };
  
  const [games, total] = await Promise.all([
    Game.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'price.discount': -1 }),
    Game.countDocuments(query)
  ]);
  
  res.status(200).json({
    success: true,
    count: games.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: games
  });
});

// @desc    Get featured games
// @route   GET /api/v1/games/featured
// @access  Public
exports.getFeaturedGames = asyncHandler(async (req, res, next) => {
  const games = await Game.find({ 
    isFeatured: true,
    isInStock: true 
  })
  .sort({ 'price.discount': -1 })
  .limit(12);
  
  res.status(200).json({
    success: true,
    count: games.length,
    data: games
  });
});

// @desc    Get new releases
// @route   GET /api/v1/games/new-releases
// @access  Public
exports.getNewReleases = asyncHandler(async (req, res, next) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const games = await Game.find({
    releaseDate: { $gte: oneMonthAgo },
    isInStock: true
  })
  .sort({ releaseDate: -1 })
  .limit(12);
  
  res.status(200).json({
    success: true,
    count: games.length,
    data: games
  });
});

// @desc    Get games on sale
// @route   GET /api/v1/games/on-sale
// @access  Public
exports.getOnSaleGames = asyncHandler(async (req, res, next) => {
  const games = await Game.find({
    'price.discount': { $gt: 0 },
    isInStock: true,
    isOnSale: true
  })
  .sort({ 'price.discount': -1 })
  .limit(12);

  res.status(200).json({
    success: true,
    count: games.length,
    data: games
  });
});

// @desc    Get running offers (curated on-sale list from scraper)
// @route   GET /api/v1/games/running-offers
// @access  Public
exports.getRunningOffers = asyncHandler(async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 12, 24);
  const runningOffers = await RunningOffer.find()
    .sort({ order: 1 })
    .limit(limit)
    .populate({
      path: 'game',
      select: 'title slug description fullDescription price imageUrl platform categories relevantCategories isInStock isOnSale averageRating numOfReviews'
    })
    .lean();

  // Return all 12 items: embedded data + populated game (when linked)
  const data = runningOffers.map((ro) => ({
    _id: ro._id,
    order: ro.order,
    title: ro.title,
    slug: ro.slug,
    imageUrl: ro.imageUrl,
    productUrl: ro.productUrl,
    category: ro.category,
    price: ro.price,
    game: ro.game || null
  }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Update game image URL
// @route   PUT /api/v1/games/:id/image
// @access  Private
exports.updateGameImage = asyncHandler(async (req, res, next) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return next(new ErrorResponse('Please provide an image URL', 400));
  }

  // Validate URL format
  try {
    new URL(imageUrl);
  } catch (error) {
    return next(new ErrorResponse('Please provide a valid URL', 400));
  }

  const game = await Game.findByIdAndUpdate(
    req.params.id,
    { imageUrl },
    {
      new: true,
      runValidators: true
    }
  );

  if (!game) {
    return next(
      new ErrorResponse(`Game not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      imageUrl: game.imageUrl
    }
  });
});

// @desc    Add screenshots to game
// @route   POST /api/v1/games/:id/screenshots
// @access  Private
exports.addGameScreenshots = asyncHandler(async (req, res, next) => {
  const { screenshots } = req.body;
  
  if (!screenshots || !Array.isArray(screenshots) || screenshots.length === 0) {
    return next(new ErrorResponse('Please provide an array of screenshot URLs', 400));
  }

  // Validate URLs
  const invalidUrls = [];
  screenshots.forEach(url => {
    try {
      new URL(url);
    } catch (error) {
      invalidUrls.push(url);
    }
  });

  if (invalidUrls.length > 0) {
    return next(
      new ErrorResponse(`Invalid URLs provided: ${invalidUrls.join(', ')}`, 400)
    );
  }

  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return next(
      new ErrorResponse(`Game not found with id of ${req.params.id}`, 404)
    );
  }

  // Add new screenshots, avoiding duplicates
  const existingScreenshots = new Set(game.screenshots.map(url => url.toString()));
  const newScreenshots = screenshots.filter(url => !existingScreenshots.has(url));
  
  game.screenshots = [...game.screenshots, ...newScreenshots];
  await game.save();

  res.status(200).json({
    success: true,
    count: newScreenshots.length,
    data: game.screenshots
  });
});

// @desc    Remove screenshot from game
// @route   DELETE /api/v1/games/:id/screenshots/:screenshotUrl
// @access  Private
exports.removeGameScreenshot = asyncHandler(async (req, res, next) => {
  const { screenshotUrl } = req.params;
  
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return next(
      new ErrorResponse(`Game not found with id of ${req.params.id}`, 404)
    );
  }

  // Decode the URL parameter to handle special characters
  const decodedScreenshotUrl = decodeURIComponent(screenshotUrl);
  
  // Check if the screenshot exists
  const screenshotIndex = game.screenshots.findIndex(
    url => url.toString() === decodedScreenshotUrl
  );

  if (screenshotIndex === -1) {
    return next(
      new ErrorResponse(`Screenshot not found with URL ${decodedScreenshotUrl}`, 404)
    );
  }

  // Remove the screenshot
  game.screenshots.splice(screenshotIndex, 1);
  await game.save();

  res.status(200).json({
    success: true,
    data: game.screenshots
  });
});
