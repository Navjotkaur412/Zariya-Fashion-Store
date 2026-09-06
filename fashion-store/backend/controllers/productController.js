const Product = require('../models/Product');

// @desc    Get all products with optional filters
// @route   GET /api/products?category=&brand=&size=&minPrice=&maxPrice=&search=&sort=
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, brand, size, minPrice, maxPrice, search, sort, featured, trending } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (brand) filter.brand = { $in: brand.split(',') };
    if (size) filter.sizes = { $in: size.split(',') };
    if (featured === 'true') filter.isFeatured = true;
    if (trending === 'true') filter.isTrending = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let query = Product.find(filter);

    switch (sort) {
      case 'price_asc':
        query = query.sort({ price: 1 });
        break;
      case 'price_desc':
        query = query.sort({ price: -1 });
        break;
      case 'rating':
        query = query.sort({ rating: -1 });
        break;
      case 'newest':
        query = query.sort({ createdAt: -1 });
        break;
      default:
        query = query.sort({ createdAt: -1 });
    }

    const products = await query.exec();
    const brands = await Product.distinct('brand');

    res.json({ count: products.length, brands, products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single product by id
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.reviews.push({ name: req.user.name, rating: Number(rating), comment });
    product.recalculateRating();
    await product.save();

    res.status(201).json({ message: 'Review added', reviews: product.reviews });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
};
