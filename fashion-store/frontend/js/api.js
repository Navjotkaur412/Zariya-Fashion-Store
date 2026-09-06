/* Thin API layer. Every call first tries the live backend; if it cannot be
   reached (backend not running, no MongoDB connection, CORS, etc.) it falls
   back to the static FALLBACK_PRODUCTS array so the storefront still works
   as a self-contained demo. */

const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';

const AN_api = {
  offline: false,

  getToken() {
    return localStorage.getItem('an_token');
  },

  authHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  },

  filterFallback(params = {}) {
    let list = [...FALLBACK_PRODUCTS];
    if (params.category) list = list.filter((p) => p.category === params.category);
    if (params.brand) {
      const brands = params.brand.split(',');
      list = list.filter((p) => brands.includes(p.brand));
    }
    if (params.size) {
      const sizes = params.size.split(',');
      list = list.filter((p) => p.sizes.some((s) => sizes.includes(s)));
    }
    if (params.minPrice) list = list.filter((p) => p.price >= Number(params.minPrice));
    if (params.maxPrice) list = list.filter((p) => p.price <= Number(params.maxPrice));
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }
    if (params.featured === 'true') list = list.filter((p) => p.isFeatured);
    if (params.trending === 'true') list = list.filter((p) => p.isTrending);

    switch (params.sort) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }

    const brands = [...new Set(FALLBACK_PRODUCTS.map((p) => p.brand))];
    return { count: list.length, brands, products: list };
  },

  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      const data = await this.request(`/products${query ? `?${query}` : ''}`);
      this.offline = false;
      return data;
    } catch (err) {
      this.offline = true;
      return this.filterFallback(params);
    }
  },

  async getProductById(id) {
    try {
      return await this.request(`/products/${id}`);
    } catch (err) {
      const found = FALLBACK_PRODUCTS.find((p) => p._id === id);
      if (!found) throw new Error('Product not found');
      return found;
    }
  },

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async createCheckoutSession() {
    return this.request('/payment/create-checkout-session', { method: 'POST' });
  },
};
