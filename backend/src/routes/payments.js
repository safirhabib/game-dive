const express = require('express');
const { createOrder, captureOrder, paypalWebhook } = require('../controllers/payments');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/capture', protect, captureOrder);
// POST /webhook is mounted in server.js with express.raw() for PayPal signature verification

module.exports = router;

