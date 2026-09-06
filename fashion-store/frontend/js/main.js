const AN_ui = {
  fmt(n) {
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  },

  showToast(message) {
    const container = document.getElementById('toastContainer');
    const toastEl = document.createElement('div');
    toastEl.className = 'an-toast';
    toastEl.innerHTML = `<span class="an-toast__dot"></span><span>${message}</span>`;
    container.appendChild(toastEl);
    requestAnimationFrame(() => toastEl.classList.add('show'));
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }, 2800);
  },

  pulseCartIcon() {
    const icon = document.getElementById('cartIconWrap');
    if (!icon) return;
    icon.classList.remove('pulse');
    void icon.offsetWidth;
    icon.classList.add('pulse');
  },

  renderCart() {
    const items = AN_cart.read();
    const { subtotal, shipping, tax, total, count } = AN_cart.totals();

    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('d-none', count === 0);
    });

    const list = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('cartEmptyState');
    const summary = document.getElementById('cartSummary');

    if (items.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('d-none');
      summary.classList.add('d-none');
      return;
    }

    emptyState.classList.add('d-none');
    summary.classList.remove('d-none');

    list.innerHTML = items
      .map(
        (item) => `
      <div class="cart-line" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-line__img">
        <div class="cart-line__info">
          <p class="cart-line__brand">${item.brand}</p>
          <p class="cart-line__name">${item.name}</p>
          <p class="cart-line__meta">Size ${item.size}</p>
          <div class="qty-stepper qty-stepper--sm">
            <button type="button" class="cart-qty-minus" aria-label="Decrease quantity">&minus;</button>
            <span>${item.quantity}</span>
            <button type="button" class="cart-qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-line__end">
          <span class="cart-line__price">${this.fmt(item.price * item.quantity)}</span>
          <button type="button" class="cart-line__remove" aria-label="Remove item">Remove</button>
        </div>
      </div>`
      )
      .join('');

    document.getElementById('cartSubtotal').textContent = this.fmt(subtotal);
    document.getElementById('cartShipping').textContent = shipping === 0 ? 'Free' : this.fmt(shipping);
    document.getElementById('cartTax').textContent = this.fmt(tax);
    document.getElementById('cartTotal').textContent = this.fmt(total);

    list.querySelectorAll('.cart-line').forEach((line) => {
      const id = line.dataset.id;
      line.querySelector('.cart-qty-minus').addEventListener('click', () => {
        const item = AN_cart.read().find((i) => i.id === id);
        AN_cart.updateQuantity(id, item.quantity - 1);
      });
      line.querySelector('.cart-qty-plus').addEventListener('click', () => {
        const item = AN_cart.read().find((i) => i.id === id);
        AN_cart.updateQuantity(id, item.quantity + 1);
      });
      line.querySelector('.cart-line__remove').addEventListener('click', () => {
        AN_cart.remove(id);
        this.showToast('Removed from cart');
      });
    });
  },

  async openCheckout() {
    const { total } = AN_cart.totals();
    if (AN_cart.read().length === 0) return;

    const user = AN_auth.getUser();

    // Attempt a real Stripe Checkout session if the backend + Stripe are configured.
    if (user) {
      try {
        const session = await AN_api.createCheckoutSession();
        if (session?.url) {
          window.location.href = session.url;
          return;
        }
      } catch (err) {
        // Backend/Stripe not configured — fall through to the demo payment flow.
      }
    }

    bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'))?.hide();
    document.getElementById('paymentTotal').textContent = this.fmt(total);
    document.getElementById('paymentForm').classList.remove('d-none');
    document.getElementById('paymentSuccess').classList.add('d-none');
    document.getElementById('paymentSubmitBtn').disabled = false;
    document.getElementById('paymentSubmitBtn').textContent = `Pay ${this.fmt(total)}`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('paymentModal')).show();
  },

  bindPaymentForm() {
    const form = document.getElementById('paymentForm');
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');
    const cardCvc = document.getElementById('cardCvc');

    cardNumber?.addEventListener('input', () => {
      cardNumber.value = cardNumber.value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
    });
    cardExpiry?.addEventListener('input', () => {
      let v = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
      cardExpiry.value = v;
    });
    cardCvc?.addEventListener('input', () => {
      cardCvc.value = cardCvc.value.replace(/\D/g, '').slice(0, 4);
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById('paymentSubmitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing…';

      setTimeout(() => {
        form.classList.add('d-none');
        document.getElementById('paymentSuccess').classList.remove('d-none');
        AN_cart.clear();
      }, 1400);
    });
  },

  bindNavAndHero() {
    const navbar = document.getElementById('mainNavbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    // Single orchestrated hero entrance
    document.querySelectorAll('.hero-line').forEach((el, i) => {
      el.style.animationDelay = `${0.15 + i * 0.12}s`;
      el.classList.add('animate-in');
    });
  },

  bindScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => io.observe(t));
  },

  bindNewsletter() {
    const form = document.getElementById('newsletterForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (!input.value) return;
      form.querySelector('button').textContent = 'Subscribed';
      input.value = '';
      this.showToast('You are on the list for early access');
    });
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('yearNow').textContent = new Date().getFullYear();

  await AN_products.init();
  AN_ui.renderCart();
  AN_auth.init();
  AN_ui.bindPaymentForm();
  AN_ui.bindNavAndHero();
  AN_ui.bindScrollReveal();
  AN_ui.bindNewsletter();

  document.getElementById('checkoutBtn')?.addEventListener('click', () => AN_ui.openCheckout());
  document.addEventListener('an:cart-updated', () => AN_ui.renderCart());
});
