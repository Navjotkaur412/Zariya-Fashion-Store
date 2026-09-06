
const AN_products = {
  state: {
    category: '',
    brands: [],
    sizes: [],
    maxPrice: 8000,
    sort: 'newest',
    search: '',
  },
  allBrands: [],
  currentList: [],

  fmt(n) {
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  },

  starString(rating) {
    const full = Math.round(rating);
    return '&#9733;'.repeat(full) + '&#9734;'.repeat(5 - full);
  },

  priceOf(product) {
    return product.price * (1 - (product.discountPercent || 0) / 100);
  },

  async init() {
    const data = await AN_api.getProducts({});
    this.allBrands = data.brands;
    this.buildBrandFilters(data.brands);
    this.bindFilterEvents();
    await this.refresh();
    this.updateOfflineBadge();
  },

  updateOfflineBadge() {
    const badge = document.getElementById('offlineBadge');
    if (!badge) return;
    badge.classList.toggle('d-none', !AN_api.offline);
  },

  buildBrandFilters(brands) {
    const wrap = document.getElementById('brandFilterList');
    if (!wrap) return;
    wrap.innerHTML = brands
      .map(
        (b, i) => `
        <div class="form-check">
          <input class="form-check-input filter-brand" type="checkbox" value="${b}" id="brand-${i}">
          <label class="form-check-label" for="brand-${i}">${b}</label>
        </div>`
      )
      .join('');
  },

  bindFilterEvents() {
    document.querySelectorAll('.filter-category').forEach((el) =>
      el.addEventListener('change', () => {
        this.state.category = document.querySelector('.filter-category:checked')?.value || '';
        this.refresh();
      })
    );

    document.getElementById('brandFilterList')?.addEventListener('change', () => {
      this.state.brands = [...document.querySelectorAll('.filter-brand:checked')].map((c) => c.value);
      this.refresh();
    });

    document.querySelectorAll('.filter-size').forEach((el) =>
      el.addEventListener('click', () => {
        el.classList.toggle('active');
        this.state.sizes = [...document.querySelectorAll('.filter-size.active')].map((b) => b.dataset.size);
        this.refresh();
      })
    );

    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        this.state.maxPrice = Number(e.target.value);
        document.getElementById('priceRangeValue').textContent = this.fmt(this.state.maxPrice);
        this.refresh();
      });
    }

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.state.sort = e.target.value;
      this.refresh();
    });

    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
      this.state = { category: '', brands: [], sizes: [], maxPrice: 8000, sort: 'newest', search: '' };
      document.querySelectorAll('.filter-category').forEach((el) => (el.checked = el.value === ''));
      document.querySelectorAll('.filter-brand').forEach((el) => (el.checked = false));
      document.querySelectorAll('.filter-size').forEach((el) => el.classList.remove('active'));
      const pr = document.getElementById('priceRange');
      if (pr) pr.value = 8000;
      const prv = document.getElementById('priceRangeValue');
      if (prv) prv.textContent = this.fmt(8000);
      this.refresh();
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.state.search = e.target.value;
      this.refresh();
    });

    document.querySelectorAll('[data-category-jump]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.state.category = el.dataset.categoryJump;
        document.querySelectorAll('.filter-category').forEach((c) => (c.checked = c.value === this.state.category));
        document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
        this.refresh();
      })
    );
  },

  async refresh() {
    const params = {
      category: this.state.category || undefined,
      brand: this.state.brands.length ? this.state.brands.join(',') : undefined,
      size: this.state.sizes.length ? this.state.sizes.join(',') : undefined,
      maxPrice: this.state.maxPrice < 8000 ? this.state.maxPrice : undefined,
      sort: this.state.sort,
      search: this.state.search || undefined,
    };
    const data = await AN_api.getProducts(params);
    this.currentList = data.products;
    this.renderGrid(data.products);
    this.updateOfflineBadge();
  },

  renderGrid(products) {
    const grid = document.getElementById('productGrid');
    const countEl = document.getElementById('resultsCount');
    if (!grid) return;

    if (countEl) countEl.textContent = `${products.length} piece${products.length === 1 ? '' : 's'}`;

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="col-12 empty-state">
          <p class="mb-1">No pieces match those filters yet.</p>
          <p class="text-muted small">Try widening the price range or clearing a filter.</p>
        </div>`;
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const price = this.priceOf(p);
        const hasDiscount = p.discountPercent > 0;
        return `
        <div class="col-6 col-md-4 col-lg-3 product-col">
          <article class="product-card">
            <div class="product-card__media">
              ${hasDiscount ? `<span class="badge-sale">-${p.discountPercent}%</span>` : ''}
              <img src="${p.images[0]}" alt="${p.name}" loading="lazy" class="product-card__img product-card__img--a">
              <img src="${p.images[1] || p.images[0]}" alt="${p.name}" loading="lazy" class="product-card__img product-card__img--b">
              <button class="quick-view-btn" data-product-id="${p._id}" aria-label="Quick view ${p.name}">
                Quick view
              </button>
            </div>
            <div class="product-card__body">
              <p class="product-card__brand">${p.brand}</p>
              <h3 class="product-card__name">${p.name}</h3>
              <div class="product-card__price-row">
                <span class="product-card__price">${this.fmt(price)}</span>
                ${hasDiscount ? `<span class="product-card__price-original">${this.fmt(p.price)}</span>` : ''}
              </div>
              <div class="product-card__sizes">
                ${p.sizes.slice(0, 4).map((s) => `<span>${s}</span>`).join('')}
                ${p.sizes.length > 4 ? `<span>+${p.sizes.length - 4}</span>` : ''}
              </div>
            </div>
          </article>
        </div>`;
      })
      .join('');

    grid.querySelectorAll('.quick-view-btn').forEach((btn) =>
      btn.addEventListener('click', () => this.openModal(btn.dataset.productId))
    );
    grid.querySelectorAll('.product-card__name, .product-card__media img').forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        const card = el.closest('.product-card');
        const id = card.querySelector('.quick-view-btn').dataset.productId;
        this.openModal(id);
      });
    });
  },

  async openModal(id) {
    const product = await AN_api.getProductById(id);
    const price = this.priceOf(product);
    const modalBody = document.getElementById('productModalBody');

    modalBody.innerHTML = `
      <div class="row g-0">
        <div class="col-md-6 pm-gallery">
          <img id="pmMainImage" src="${product.images[0]}" alt="${product.name}">
          <div class="pm-thumbs">
            ${product.images
              .map(
                (img, i) =>
                  `<img src="${img}" data-full="${img}" class="pm-thumb ${i === 0 ? 'active' : ''}" alt="${product.name} view ${i + 1}">`
              )
              .join('')}
          </div>
        </div>
        <div class="col-md-6 pm-details">
          <p class="pm-brand">${product.brand}</p>
          <h2 class="pm-name">${product.name}</h2>
          <div class="pm-rating">
            <span class="stars">${this.starString(product.rating)}</span>
            <span class="text-muted small">${product.rating.toFixed(1)} (${product.numReviews} review${product.numReviews === 1 ? '' : 's'})</span>
          </div>
          <div class="pm-price-row">
            <span class="pm-price">${this.fmt(price)}</span>
            ${product.discountPercent ? `<span class="pm-price-original">${this.fmt(product.price)}</span><span class="badge-sale badge-sale--inline">-${product.discountPercent}%</span>` : ''}
          </div>
          <p class="pm-desc">${product.description}</p>

          <div class="pm-size-section">
            <p class="pm-label">Size</p>
            <div class="pm-size-options">
              ${product.sizes.map((s, i) => `<button type="button" class="size-pill ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}
            </div>
          </div>

          <div class="pm-qty-section">
            <p class="pm-label">Quantity</p>
            <div class="qty-stepper">
              <button type="button" id="pmQtyMinus" aria-label="Decrease quantity">&minus;</button>
              <span id="pmQtyValue">1</span>
              <button type="button" id="pmQtyPlus" aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button class="btn btn-primary-brand w-100 mt-3" id="pmAddToCart">Add to cart</button>
          <p class="pm-stock text-muted small mt-2">${product.stock > 0 ? `${product.stock} in stock` : 'Currently out of stock'}</p>

          <div class="pm-reviews">
            <p class="pm-label">Reviews</p>
            ${
              product.reviews.length
                ? product.reviews
                    .map(
                      (r) => `
              <div class="pm-review">
                <div class="d-flex justify-content-between">
                  <strong>${r.name}</strong>
                  <span class="stars small">${this.starString(r.rating)}</span>
                </div>
                <p class="text-muted small mb-0">${r.comment}</p>
              </div>`
                    )
                    .join('')
                : '<p class="text-muted small">No reviews yet for this piece.</p>'
            }
          </div>
        </div>
      </div>
    `;

    // Thumbnail swap
    modalBody.querySelectorAll('.pm-thumb').forEach((thumb) =>
      thumb.addEventListener('click', () => {
        modalBody.querySelectorAll('.pm-thumb').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        document.getElementById('pmMainImage').src = thumb.dataset.full;
      })
    );

    // Size selection
    let selectedSize = product.sizes[0];
    modalBody.querySelectorAll('.size-pill').forEach((pill) =>
      pill.addEventListener('click', () => {
        modalBody.querySelectorAll('.size-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        selectedSize = pill.dataset.size;
      })
    );

    // Quantity stepper
    let qty = 1;
    const qtyValue = document.getElementById('pmQtyValue');
    document.getElementById('pmQtyMinus').addEventListener('click', () => {
      qty = Math.max(1, qty - 1);
      qtyValue.textContent = qty;
    });
    document.getElementById('pmQtyPlus').addEventListener('click', () => {
      qty = Math.min(product.stock || 99, qty + 1);
      qtyValue.textContent = qty;
    });

    // Add to cart
    document.getElementById('pmAddToCart').addEventListener('click', () => {
      AN_cart.add(product, selectedSize, qty);
      AN_ui.showToast(`Added ${product.name} (${selectedSize}) to your cart`);
      AN_ui.pulseCartIcon();
    });

    const modalEl = document.getElementById('productModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
};
