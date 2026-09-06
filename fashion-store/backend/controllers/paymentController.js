const Stripe = require('stripe');
const Cart = require('../models/Cart');

const getStripe = () => Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc    Create a Stripe Checkout session for the logged-in user's cart
// @route   POST /api/payment/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5500';

    const line_items = cart.items.map((item) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: `${item.brand} - ${item.name} (Size ${item.size})`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${clientUrl}/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/index.html?payment=cancelled`,
      customer_email: req.user.email,
      metadata: { userId: req.user._id.toString() },
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Stripe webhook to confirm payment events
// @route   POST /api/payment/webhook
// @access  Public (verified via Stripe signature)
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // TODO: mark the matching order as paid using session.metadata.userId
    console.log(`Payment confirmed for user ${session.metadata?.userId}`);
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, stripeWebhook };
