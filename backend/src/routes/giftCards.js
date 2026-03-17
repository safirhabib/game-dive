const express = require('express');
const { getGiftCards, getGiftCard } = require('../controllers/giftCards');
const GiftCard = require('../models/GiftCard');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(GiftCard), getGiftCards);

router
  .route('/:idOrSlug')
  .get(getGiftCard);

module.exports = router;

