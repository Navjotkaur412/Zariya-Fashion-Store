const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Create a new order from the user's cart
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentIntentId, isPaid } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const itemsPrice = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice > 150 ? 0 : 9.99;
    const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
    const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((i) => ({
        product: i.product,
        name: i.name,
        image: i.image,
        brand: i.brand,
        price: i.price,
        size: i.size,
        quantity: i.quantity,
      })),
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentIntentId,
      isPaid: !!isPaid,
      paidAt: isPaid ? new Date() : undefined,
      status: isPaid ? 'paid' : 'pending',
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single order by id (owner only)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getOrderById };
