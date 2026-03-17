const express = require('express');
const {
  getGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  updateGameImage,
  addGameScreenshots,
  removeGameScreenshot,
  searchGames,
  getGamesByPlatform,
  getGamesByCategory,
  getFeaturedGames,
  getNewReleases,
  getOnSaleGames,
  getRunningOffers
} = require('../controllers/games');

const Game = require('../models/Game');
const Review = require('../models/Review');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Include other resource routers
const reviewRouter = require('./reviews');

const router = express.Router();

// Re-route into other resource routers
router.use('/:gameId/reviews', reviewRouter);

// Public routes
router.get('/search', searchGames);
router.get('/platform/:platform', getGamesByPlatform);
router.get('/category/:category', getGamesByCategory);
router.get('/featured', getFeaturedGames);
router.get('/new-releases', getNewReleases);
router.get('/on-sale', getOnSaleGames);
router.get('/running-offers', getRunningOffers);

// Public metadata endpoint
router.get('/metadata', async (req, res, next) => {
  try {
    const platforms = await Game.distinct('platform');
    const categories = await Game.distinct('categories');
    const tags = await Game.distinct('tags');
    
    res.status(200).json({
      success: true,
      data: {
        platforms,
        categories: [...new Set(categories.flat())],
        tags: [...new Set(tags.flat())]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Main game routes with advanced results
router
  .route('/')
  .get(advancedResults(Game, {
    path: 'reviews',
    select: 'rating comment user',
    populate: {
      path: 'user',
      select: 'username avatar'
    }
  }), getGames)
  .post(protect, authorize('admin'), createGame);

// Single game operations
router
  .route('/:idOrSlug')
  .get(getGame)
  .put(protect, authorize('admin'), updateGame)
  .delete(protect, authorize('admin'), deleteGame);

// Game media operations (protected)
router.put('/:id/image', protect, authorize('admin'), updateGameImage);
router.post('/:id/screenshots', protect, authorize('admin'), addGameScreenshots);
router.delete('/:id/screenshots/:screenshotUrl', protect, authorize('admin'), removeGameScreenshot);

// Admin-only bulk operations
router.route('/bulk/import')
  .post(protect, authorize('admin'), async (req, res, next) => {
    // Implementation for bulk import
    res.status(501).json({ success: false, message: 'Bulk import not implemented yet' });
  });

module.exports = router;
