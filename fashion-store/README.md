# Zariya — Online Fashion Shopping Website

A full-stack fashion e-commerce site: a responsive Bootstrap 5 frontend and an
Express + MongoDB backend, with Stripe checkout wired in.

```
fashion-store/
├── frontend/     Static HTML/CSS/JS storefront (no build step required)
└── backend/      Express REST API + MongoDB models + Stripe integration
```

The frontend works two ways:
- **Standalone demo** — open `frontend/index.html` directly (or serve the
  folder) and it runs entirely on built-in sample data, no backend required.
- **Full stack** — run the backend and it automatically switches to live
  data, real accounts, and real Stripe checkout sessions. A small "Demo
  data · backend offline" badge above the product grid tells you which mode
  you're in.

## 1. Run the frontend

You only need a static file server (opening `index.html` directly also
works, but a local server avoids browser file:// restrictions):

```bash
cd frontend
npx serve -l 5500
# then open http://localhost:5500
```

## 2. Run the backend

Requirements: Node.js 18+, and a MongoDB instance (local `mongod`, Docker, or
MongoDB Atlas).

```bash
cd backend
cp .env.example .env      
npm install
npm run seed               
npm run dev                 # starts the API on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### Environment variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin, used for CORS and Stripe redirect URLs |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `STRIPE_SECRET_KEY` | From the Stripe dashboard (test mode key starts with `sk_test_`) |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` or your Stripe webhook endpoint |

If you change the API port or host, set `window.API_BASE_URL` before the
other scripts load in `frontend/index.html`, e.g.:

```html
<script>window.API_BASE_URL = 'https://your-api.example.com/api';</script>
```

## 3. Payments

The backend exposes `POST /api/payment/create-checkout-session`, which
creates a real Stripe Checkout session from the logged-in user's cart and
returns its URL. The frontend calls this automatically at checkout when a
user is logged in and the backend is reachable; if either condition isn't
met, it falls back to a self-contained demo payment modal so checkout is
still fully clickable in a pure static-file walkthrough.

To test real payments:
1. Add your Stripe test secret key to `backend/.env`.
2. Forward webhooks locally: `stripe listen --forward-to localhost:5000/api/payment/webhook`.
3. Log in on the site, add items to the bag, and click **Checkout** — you'll
   land on Stripe's hosted checkout page. Use card `4242 4242 4242 4242`,
   any future expiry, and any CVC.

## 4. API reference (summary)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products; query params: `category, brand, size, minPrice, maxPrice, search, sort, featured, trending` |
| GET | `/api/products/:id` | Public | Single product with reviews |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |
| POST | `/api/products/:id/reviews` | Private | Add a review |
| POST | `/api/auth/register` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in, returns a JWT |
| GET | `/api/auth/me` | Private | Current user |
| GET/POST/PUT/DELETE | `/api/cart` | Private | Server-side cart (the frontend uses a local cart by default; this is available if you want cart sync across devices) |
| POST | `/api/orders` | Private | Create an order from the server-side cart |
| GET | `/api/orders/my` | Private | Current user's orders |
| POST | `/api/payment/create-checkout-session` | Private | Create a Stripe Checkout session |

## 5. Features implemented

- Homepage sections for Men's, Women's, Kids' and Accessories
- Responsive navbar: Home, Products, Categories, Offers, Cart, Login
- Product cards with image, brand, price (with sale pricing) and sizes
- Promotional carousel for seasonal sales, discounts and trending pieces
- Filtering by brand, price, category and size
- Product modal with details, reviews, size selection and add-to-cart
- Dynamic cart: add/remove, quantity update, live price calculation
- Stripe-backed payment gateway, with a demo fallback flow
- Fully responsive layout from mobile through desktop

## 6. Notes

- Product photography uses placeholder images (Picsum) — swap the URLs in
  `backend/seed/seedProducts.js` and `frontend/js/data.js` for real product
  photos in production.
- The client-side cart in `frontend/js/cart.js` is intentionally
  login-independent so visitors can shop before creating an account; the
  server-side cart API is there if you'd rather keep carts on the backend.
