const express = require('express');
const { getRegionChangeProducts, getRegionChangeProduct } = require('../controllers/regionChangeProducts');
const RegionChangeProduct = require('../models/RegionChangeProduct');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(RegionChangeProduct), getRegionChangeProducts);

router
  .route('/:idOrSlug')
  .get(getRegionChangeProduct);

module.exports = router;

