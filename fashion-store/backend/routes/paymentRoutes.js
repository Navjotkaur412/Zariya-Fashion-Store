const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-checkout-session', protect, createCheckoutSession);
// Note: the webhook route is mounted separately in server.js with raw body parsing
router.stripeWebhook = stripeWebhook;

module.exports = router;
