/* Client-side cart. Persisted to localStorage so it survives refreshes.
   Kept independent of login so visitors can shop before creating an account;
   checkout() attempts a real Stripe session via the backend when the user is
   logged in, and otherwise shows a self-contained confirmation flow. */

const AN_cart = {
  KEY: 'an_cart_items',

  read() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY)) || [];
    } catch {
      return [];
    }
  },

  write(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('an:cart-updated', { detail: { items } }));
  },

  lineId(productId, size) {
    return `${productId}__${size}`;
  },

  add(product, size, quantity = 1) {
    const items = this.read();
    const unitPrice = Math.round(product.price * (1 - (product.discountPercent || 0) / 100) * 100) / 100;
    const id = this.lineId(product._id, size);
    const existing = items.find((i) => i.id === id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        id,
        productId: product._id,
        name: product.name,
        brand: product.brand,
        image: product.images[0],
        price: unitPrice,
        size,
        quantity,
      });
    }
    this.write(items);
  },

  updateQuantity(id, quantity) {
    let items = this.read();
    if (quantity <= 0) {
      items = items.filter((i) => i.id !== id);
    } else {
      const item = items.find((i) => i.id === id);
      if (item) item.quantity = quantity;
    }
    this.write(items);
  },

  remove(id) {
    const items = this.read().filter((i) => i.id !== id);
    this.write(items);
  },

  clear() {
    this.write([]);
  },

  totals() {
    const items = this.read();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = items.length === 0 ? 0 : subtotal > 2999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return { subtotal, shipping, tax, total, count };
  },
};
