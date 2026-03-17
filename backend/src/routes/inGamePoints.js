const express = require('express');
const { getInGamePoints, getInGamePoint } = require('../controllers/inGamePoints');
const InGamePoint = require('../models/InGamePoint');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(InGamePoint), getInGamePoints);

router
  .route('/:idOrSlug')
  .get(getInGamePoint);

module.exports = router;

