const express = require('express');
const { getSubscriptions, getSubscription } = require('../controllers/subscriptions');
const SubscriptionProduct = require('../models/SubscriptionProduct');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router();

router
  .route('/')
  .get(advancedResults(SubscriptionProduct), getSubscriptions);

router
  .route('/:idOrSlug')
  .get(getSubscription);

module.exports = router;

