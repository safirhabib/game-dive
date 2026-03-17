const axios = require('axios');
const Game = require('../models/Game');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const { createPendingOrderFromCart, markOrderPaidByPaymentId } = require('./orders');
const Order = require('../models/Order');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET_KEY;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

// Use sandbox by default unless PAYPAL_ENV=live is explicitly set
const isSandbox = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase() !== 'live';
const paypalBase = isSandbox
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  // eslint-disable-next-line no-console
  console.warn('PAYPAL_CLIENT_ID or PAYPAL_SECRET_KEY not set; payment endpoints may not work.');
}

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const { data } = await axios.post(
    `${paypalBase}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return data.access_token;
}

// @desc    Create PayPal order and our pending order
// @route   POST /api/v1/payments/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    return next(new ErrorResponse('PayPal is not configured', 500));
  }

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return next(new ErrorResponse('Cart is empty', 400));
  }

  const gameIds = items.map((i) => i.gameId);
  const games = await Game.find({ _id: { $in: gameIds } });

  let totalCad = 0;
  const purchaseUnits = [];

  for (const cartItem of items) {
    const game = games.find((g) => g.id === cartItem.gameId);
    if (!game) throw new Error(`Game not found: ${cartItem.gameId}`);
    const qty = cartItem.quantity || 1;
    const priceCad = typeof game.price?.currentInCAD === 'number' ? game.price.currentInCAD : 0;
    const unitValue = (priceCad * qty).toFixed(2);
    totalCad += priceCad * qty;
    purchaseUnits.push({
      amount: {
        currency_code: 'CAD',
        value: unitValue
      },
      description: `${game.title}${qty > 1 ? ` x${qty}` : ''}`
    });
  }

  if (totalCad <= 0) {
    return next(new ErrorResponse('Invalid cart total', 400));
  }

  const accessToken = await getPayPalAccessToken();
  const paypalOrderPayload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'CAD',
          value: totalCad.toFixed(2)
        },
        description: purchaseUnits.map((u) => u.description).join(', ')
      }
    ]
  };

  const { data: paypalOrder } = await axios.post(
    `${paypalBase}/v2/checkout/orders`,
    paypalOrderPayload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const paypalOrderId = paypalOrder.id;
  try {
    await createPendingOrderFromCart({
      user: req.user || null,
      email: req.user?.email || null,
      items,
      paypalOrderId
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to create pending order:', e.message);
    return next(new ErrorResponse('Failed to create order', 500));
  }

  res.status(200).json({ orderId: paypalOrderId });
});

// @desc    Capture PayPal order and mark our order as paid
// @route   POST /api/v1/payments/capture
// @access  Private
exports.captureOrder = asyncHandler(async (req, res, next) => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    return next(new ErrorResponse('PayPal is not configured', 500));
  }

  const { orderId: paypalOrderId } = req.body;
  if (!paypalOrderId) {
    return next(new ErrorResponse('Order ID is required', 400));
  }

  const accessToken = await getPayPalAccessToken();
  const { data: captureData } = await axios.post(
    `${paypalBase}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const captureId =
    captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
  const payerEmail =
    captureData.payer?.email_address || null;

  await markOrderPaidByPaymentId({
    paypalOrderId,
    captureId,
    email: payerEmail
  });

  res.status(200).json({
    success: true,
    orderId: paypalOrderId,
    captureId
  });
});

// @desc    PayPal webhook – verify and process PAYMENT.CAPTURE.COMPLETED
// @route   POST /api/v1/payments/webhook
// @access  Public (PayPal only)
exports.paypalWebhook = asyncHandler(async (req, res, next) => {
  const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body || {});
  const headers = {
    'PAYPAL-AUTH-ALGO': req.headers['paypal-auth-algo'],
    'PAYPAL-CERT-URL': req.headers['paypal-cert-url'],
    'PAYPAL-TRANSMISSION-ID': req.headers['paypal-transmission-id'],
    'PAYPAL-TRANSMISSION-SIG': req.headers['paypal-transmission-sig'],
    'PAYPAL-TRANSMISSION-TIME': req.headers['paypal-transmission-time']
  };

  if (PAYPAL_WEBHOOK_ID) {
    try {
      const token = await getPayPalAccessToken();
      await axios.post(
        `${paypalBase}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['PAYPAL-AUTH-ALGO'],
          cert_url: headers['PAYPAL-CERT-URL'],
          transmission_id: headers['PAYPAL-TRANSMISSION-ID'],
          transmission_sig: headers['PAYPAL-TRANSMISSION-SIG'],
          transmission_time: headers['PAYPAL-TRANSMISSION-TIME'],
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: typeof req.body === 'object' ? req.body : JSON.parse(rawBody)
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        }
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('PayPal webhook verification failed:', err.response?.data || err.message);
      return res.status(400).send('Webhook verification failed');
    }
  }

  const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
  const eventType = event.event_type;

  if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource || {};
    const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;
    const captureId = resource.id;
    try {
      const order = paypalOrderId
        ? await Order.findOne({ paypalOrderId })
        : captureId
        ? await Order.findOne({ paypalCaptureId: captureId })
        : null;
      if (order && order.status !== 'paid') {
        await markOrderPaidByPaymentId({
          paypalOrderId: order.paypalOrderId,
          captureId: resource.id,
          email: resource.payer?.email_address
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark order paid from webhook:', e.message);
    }
  }

  res.status(200).json({ received: true });
});
