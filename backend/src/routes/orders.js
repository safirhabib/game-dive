const express = require('express');
const {
  getOrders,
  getOrder,
  getMyOrders,
  getOrderBySession,
  updateOrderMessage,
  updateOrderStatus
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/mine', getMyOrders);
router.get('/by-session/:sessionId', getOrderBySession);
router.patch('/:id/message', authorize('admin'), updateOrderMessage);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);
router.get('/', authorize('admin'), getOrders);
router.get('/:id', getOrder);

module.exports = router;

