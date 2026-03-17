const Order = require('../models/Order');
const Game = require('../models/Game');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all orders (admin)
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate('user', 'username email')
    .populate('items.game', 'title slug imageUrl price');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get my orders (current user – by user id or by email for orders created before we attached user)
// @route   GET /api/v1/orders/mine
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const userEmail = (req.user.email || '').trim().toLowerCase();
  const query =
    userEmail.length > 0
      ? {
          $or: [
            { user: req.user.id },
            {
              $and: [
                { $or: [{ user: null }, { user: { $exists: false } }] },
                { email: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
              ]
            }
          ]
        }
      : { user: req.user.id };
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .populate('items.game', 'title slug imageUrl price');

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

// @desc    Get order by payment session/order ID (Stripe session or PayPal order ID)
// @route   GET /api/v1/orders/by-session/:sessionId
// @access  Private
exports.getOrderBySession = asyncHandler(async (req, res, next) => {
  const id = req.params.sessionId;
  const order = await Order.findOne({
    $or: [{ stripeSessionId: id }, { paypalOrderId: id }]
  })
    .populate('items.game', 'title slug imageUrl price');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  const isAdmin = req.user.role === 'admin';
  const orderUserId = order.user && order.user.toString && order.user.toString();
  const userId = req.user.id.toString();
  const isOwnerByUser = orderUserId === userId;
  const orderEmail = (order.email || '').trim().toLowerCase();
  const userEmail = (req.user.email || '').trim().toLowerCase();
  const isOwnerByEmail = !orderUserId && orderEmail.length > 0 && userEmail.length > 0 && orderEmail === userEmail;
  if (!isAdmin && !isOwnerByUser && !isOwnerByEmail) {
    return next(new ErrorResponse('Not authorized to view this order', 403));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Get single order (admin or order owner)
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'username email')
    .populate('items.game', 'title slug imageUrl price');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  const isAdmin = req.user.role === 'admin';
  const orderUserId = order.user && (order.user._id || order.user);
  const isOwnerByUser = orderUserId && orderUserId.toString() === req.user.id;
  const orderEmail = (order.email || '').trim().toLowerCase();
  const userEmail = (req.user.email || '').trim().toLowerCase();
  const isOwnerByEmail = !orderUserId && orderEmail.length > 0 && userEmail.length > 0 && orderEmail === userEmail;
  if (!isAdmin && !isOwnerByUser && !isOwnerByEmail) {
    return next(new ErrorResponse('Not authorized to view this order', 403));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order message (admin) – game key, email, password, instructions
// @route   PATCH /api/v1/orders/:id/message
// @access  Private/Admin
exports.updateOrderMessage = asyncHandler(async (req, res, next) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      adminMessage: req.body.adminMessage || '',
      adminMessageSentAt: req.body.adminMessage ? new Date() : undefined
    },
    { new: true, runValidators: false }
  );

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Update order status (admin)
// @route   PATCH /api/v1/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const status = req.body.status;
  const allowed = ['paid', 'in_progress', 'closed'];
  if (!status || !allowed.includes(status)) {
    return next(new ErrorResponse(`Status must be one of: ${allowed.join(', ')}`, 400));
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Create pending order from cart (Stripe session or PayPal order ID)
// @access  Internal use from payments controller
exports.createPendingOrderFromCart = async ({ user, email, items, stripeSessionId, paypalOrderId }) => {
  if (!stripeSessionId && !paypalOrderId) {
    throw new Error('Either stripeSessionId or paypalOrderId is required');
  }
  const gameIds = items.map((i) => i.gameId);
  const games = await Game.find({ _id: { $in: gameIds } });

  const orderItems = [];
  let totalInBdt = 0;
  let totalInCad = 0;

  items.forEach((ci) => {
    const game = games.find((g) => g.id === ci.gameId);
    if (!game) return;
    const qty = ci.quantity || 1;
    const priceBdt = typeof game.price?.currentInBdt === 'number' ? game.price.currentInBdt : 0;
    const priceCad = typeof game.price?.currentInCAD === 'number' ? game.price.currentInCAD : 0;
    orderItems.push({
      game: game._id,
      title: game.title,
      quantity: qty,
      priceInBdt: priceBdt,
      priceInCad: priceCad
    });
    totalInBdt += priceBdt * qty;
    totalInCad += priceCad * qty;
  });

  if (!orderItems.length) {
    throw new Error('No valid games found for order');
  }

  const order = await Order.create({
    user: user ? user._id : undefined,
    email: email || (user && user.email) || undefined,
    items: orderItems,
    totalInBdt,
    totalInCad,
    ...(stripeSessionId && { stripeSessionId }),
    ...(paypalOrderId && { paypalOrderId }),
    status: 'in_progress'
  });

  return order;
};

// @desc    Mark order as paid (by Stripe session or PayPal order ID)
// @access  Internal use from payments controller
exports.markOrderPaidByPaymentId = async ({ stripeSessionId, paypalOrderId, captureId, email }) => {
  const filter = stripeSessionId
    ? { stripeSessionId }
    : paypalOrderId
    ? { paypalOrderId }
    : null;
  if (!filter) return null;
  const update = {
    status: 'paid',
    ...(captureId && (stripeSessionId ? { stripePaymentIntentId: captureId } : { paypalCaptureId: captureId })),
    ...(email ? { email } : {})
  };
  const order = await Order.findOneAndUpdate(filter, update, { new: true });
  return order;
};

