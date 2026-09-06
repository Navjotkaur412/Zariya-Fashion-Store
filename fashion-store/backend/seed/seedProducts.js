require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const img = (keywords, lock, w = 800, h = 1000) =>
  `https://loremflickr.com/${w}/${h}/${keywords}?lock=${lock}`;

const products = [
  // ---- Men ----
  {
    name: 'Tailored Wool Overcoat',
    brand: 'Raymond',
    category: 'men',
    price: 6999.0,
    discountPercent: 15,
    description:
      'A structured double-breasted overcoat cut from a heavyweight wool blend. Built for cold-weather layering without losing its silhouette.',
    images: [img('man,overcoat,wool', 101), img('man,coat,fashion', 102)],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Camel'],
    stock: 24,
    tags: ['coat', 'winter', 'formal'],
    isFeatured: true,
    isTrending: true,
  },
  {
    name: 'Merino Crewneck Sweater',
    brand: 'Allen Solly',
    category: 'men',
    price: 2499.0,
    description: 'Fine-gauge merino wool knit with a clean crewneck finish, made for everyday layering.',
    images: [img('man,sweater,knitwear', 103), img('man,sweater,fashion', 104)],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Navy', 'Forest', 'Ecru'],
    stock: 40,
    tags: ['knitwear', 'casual'],
    isFeatured: true,
  },
  {
    name: 'Slim Selvedge Denim',
    brand: "Levi's",
    category: 'men',
    price: 3299.0,
    description: 'Rigid Japanese selvedge denim in a slim taper, built to break in and age with wear.',
    images: [img('man,jeans,denim', 105), img('denim,jeans,fashion', 106)],
    sizes: ['30', '32', '34', '36', '38'],
    colors: ['Indigo'],
    stock: 32,
    tags: ['denim', 'casual'],
    isTrending: true,
  },
  {
    name: 'Oxford Cotton Shirt',
    brand: 'Van Heusen',
    category: 'men',
    price: 1799.0,
    description: 'A breathable oxford weave shirt with a clean point collar, equally at home tucked or worn open.',
    images: [img('man,shirt,fashion', 107), img('man,formal,shirt', 108)],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Sky Blue'],
    stock: 55,
    tags: ['shirt', 'formal'],
  },
  {
    name: 'Leather Chelsea Boots',
    brand: 'Red Tape',
    category: 'men',
    price: 4499.0,
    discountPercent: 10,
    description: 'Full-grain leather Chelsea boots with an elastic side panel and a stacked leather heel.',
    images: [img('leather,boots,shoes', 109), img('chelsea,boots,fashion', 110)],
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Black', 'Tan'],
    stock: 18,
    tags: ['boots', 'footwear'],
    isFeatured: true,
  },
  {
    name: 'Technical Shell Jacket',
    brand: 'Wildcraft',
    category: 'men',
    price: 3999.0,
    description: 'A packable, weatherproof shell with taped seams for unpredictable city weather.',
    images: [img('man,jacket,outdoor', 111), img('rain,jacket,fashion', 112)],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Olive'],
    stock: 27,
    tags: ['jacket', 'outerwear'],
    isTrending: true,
  },

  // ---- Women ----
  {
    name: 'Silk Wrap Midi Dress',
    brand: 'Global Desi',
    category: 'women',
    price: 5499.0,
    discountPercent: 20,
    description: 'A fluid silk midi with a self-tie waist, cut to move with you from desk to dinner.',
    images: [img('woman,dress,fashion', 113), img('woman,silk,dress', 114)],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Bordeaux', 'Ink'],
    stock: 22,
    tags: ['dress', 'occasion'],
    isFeatured: true,
    isTrending: true,
  },
  {
    name: 'Cropped Tailored Blazer',
    brand: 'Zara',
    category: 'women',
    price: 4999.0,
    description: 'A sharply tailored blazer with a cropped body and structured shoulder for a modern silhouette.',
    images: [img('woman,blazer,fashion', 115), img('woman,blazer,formal', 116)],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Black', 'Stone'],
    stock: 30,
    tags: ['blazer', 'formal'],
    isFeatured: true,
  },
  {
    name: 'High-Rise Wide Trousers',
    brand: 'W for Woman',
    category: 'women',
    price: 2299.0,
    description: 'Fluid wide-leg trousers with a high rise and a fully lined waistband for a clean drape.',
    images: [img('woman,trousers,fashion', 117), img('woman,pants,fashion', 118)],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Black', 'Camel'],
    stock: 38,
    tags: ['trousers', 'formal'],
  },
  {
    name: 'Ribbed Knit Midi Skirt',
    brand: 'AND',
    category: 'women',
    price: 1899.0,
    description: 'A body-skimming ribbed knit skirt that pairs equally well with boots or heels.',
    images: [img('woman,skirt,fashion', 119), img('woman,skirt,knit', 120)],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Espresso', 'Cream'],
    stock: 33,
    tags: ['skirt', 'knitwear'],
    isTrending: true,
  },
  {
    name: 'Leather Ankle-Strap Heels',
    brand: 'Metro Shoes',
    category: 'women',
    price: 3499.0,
    discountPercent: 12,
    description: 'A refined kitten heel in supple leather with a delicate ankle strap.',
    images: [img('heels,shoes,fashion', 121), img('woman,heels,shoes', 122)],
    sizes: ['36', '37', '38', '39', '40'],
    colors: ['Black', 'Nude'],
    stock: 20,
    tags: ['heels', 'footwear'],
  },
  {
    name: 'Oversized Cashmere Scarf-Coat',
    brand: 'FabIndia',
    category: 'women',
    price: 7499.0,
    description: 'An oversized cashmere-blend coat designed to be worn open, like a wearable scarf.',
    images: [img('woman,coat,winter', 123), img('woman,coat,fashion', 124)],
    sizes: ['XS/S', 'M/L'],
    colors: ['Camel', 'Charcoal'],
    stock: 15,
    tags: ['coat', 'winter'],
    isFeatured: true,
  },

  // ---- Kids ----
  {
    name: 'Organic Cotton Hoodie',
    brand: 'Mothercare',
    category: 'kids',
    price: 1299.0,
    description: 'A soft organic cotton hoodie with a kangaroo pocket, built for everyday play.',
    images: [img('kids,hoodie,child', 125), img('child,hoodie,fashion', 126)],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
    colors: ['Sky Blue', 'Mustard'],
    stock: 45,
    tags: ['hoodie', 'casual'],
    isFeatured: true,
  },
  {
    name: 'Corduroy Dungarees',
    brand: 'Gini & Jony',
    category: 'kids',
    price: 1499.0,
    description: 'Durable corduroy dungarees with adjustable straps and reinforced knees.',
    images: [img('kids,overalls,child', 127), img('child,dungarees,fashion', 128)],
    sizes: ['1-2Y', '2-3Y', '4-5Y'],
    colors: ['Rust', 'Forest'],
    stock: 28,
    tags: ['dungarees', 'casual'],
  },
  {
    name: 'Printed Cotton Dress',
    brand: 'H&M Kids',
    category: 'kids',
    price: 1099.0,
    discountPercent: 10,
    description: 'A lightweight cotton dress with a hand-drawn print and a twirl-friendly hem.',
    images: [img('kids,dress,child', 129), img('child,dress,fashion', 130)],
    sizes: ['2-3Y', '4-5Y', '6-7Y'],
    colors: ['Multi'],
    stock: 26,
    tags: ['dress', 'casual'],
    isTrending: true,
  },
  {
    name: 'Canvas High-Top Sneakers',
    brand: 'Bata',
    category: 'kids',
    price: 1399.0,
    description: 'Sturdy canvas high-tops with a rubber toe cap built for the playground.',
    images: [img('kids,sneakers,shoes', 131), img('child,sneakers,fashion', 132)],
    sizes: ['28', '29', '30', '31', '32'],
    colors: ['White', 'Navy'],
    stock: 34,
    tags: ['sneakers', 'footwear'],
  },

  // ---- Accessories ----
  {
    name: 'Structured Leather Tote',
    brand: 'Baggit',
    category: 'accessories',
    price: 2999.0,
    description: 'A structured tote in vegetable-tanned leather with an interior zip pocket.',
    images: [img('handbag,leather,tote', 133), img('leather,tote,fashion', 134)],
    sizes: ['One Size'],
    colors: ['Black', 'Cognac'],
    stock: 21,
    tags: ['bag', 'leather'],
    isFeatured: true,
    isTrending: true,
  },
  {
    name: 'Merino Wool Beanie',
    brand: 'FabIndia',
    category: 'accessories',
    price: 899.0,
    description: 'A ribbed merino beanie, warm without the bulk.',
    images: [img('beanie,hat,winter', 135), img('woolen,cap,fashion', 136)],
    sizes: ['One Size'],
    colors: ['Charcoal', 'Rust', 'Cream'],
    stock: 60,
    tags: ['hat', 'winter'],
  },
  {
    name: 'Fine Chain Layered Necklace',
    brand: 'CaratLane',
    category: 'accessories',
    price: 2499.0,
    discountPercent: 15,
    description: 'Two fine chains layered at different lengths, finished in gold vermeil.',
    images: [img('necklace,jewelry,gold', 137), img('jewelry,necklace,fashion', 138)],
    sizes: ['One Size'],
    colors: ['Gold'],
    stock: 40,
    tags: ['jewelry'],
    isTrending: true,
  },
  {
    name: 'Aviator Sunglasses',
    brand: 'Ray-Ban',
    category: 'accessories',
    price: 6999.0,
    description: 'Classic aviator sunglasses with polarized lenses and a lightweight metal frame.',
    images: [img('sunglasses,aviator,fashion', 139), img('sunglasses,fashion,accessory', 140)],
    sizes: ['One Size'],
    colors: ['Gunmetal', 'Gold'],
    stock: 37,
    tags: ['sunglasses'],
  },
  {
    name: 'Full-Grain Leather Belt',
    brand: 'Da Milano',
    category: 'accessories',
    price: 1999.0,
    description: 'A full-grain leather belt with a solid brass buckle, built to last for years.',
    images: [img('leather,belt,fashion', 141), img('belt,accessory,fashion', 142)],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Brown'],
    stock: 48,
    tags: ['belt', 'leather'],
  },
];

const sampleReviews = [
  { name: 'Ananya R.', rating: 5, comment: 'Fit is exactly as described, fabric feels genuinely premium.' },
  { name: 'Rohan K.', rating: 4, comment: 'Great quality, runs slightly large so consider sizing down.' },
  { name: 'Priya S.', rating: 5, comment: 'Ordered twice now, stitching and finish are consistently excellent.' },
];

const seed = async () => {
  await connectDB();
  await Product.deleteMany({});

  const withReviews = products.map((p) => {
    const reviews = sampleReviews
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map((r) => ({ ...r }));
    const rating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;
    return { ...p, reviews, rating, numReviews: reviews.length };
  });

  await Product.insertMany(withReviews);
  console.log(`Seeded ${withReviews.length} products.`);
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
