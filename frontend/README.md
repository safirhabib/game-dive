# Game Dive

A modern game store application built with React, Vite, and Node.js.

## Features

- Browse games by category and platform
- Search for games
- View game details
- Shopping cart functionality
- Responsive design

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- MongoDB (for production)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/game-dive.git
   cd game-dive
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Start the development servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # In a new terminal, start frontend
   cd ..
   npm run dev
   ```

5. **Open the app**
   The frontend will be available at http://localhost:5173

## Scrapers

The `scraper/` workspace contains standalone scrapers for different product categories from `gamecastlebd.com`. Scraped JSON is written to `scraper/data/`.

### Install scraper dependencies

```bash
cd scraper
npm install
```

### Run individual scrapers

```bash
cd scraper

# PC games
npm run scrape:pc

# Global game keys
npm run scrape:global-keys

# Offline activation
npm run scrape:offline-activation

# On sale
npm run scrape:on-sale

# Steam / Epic region change
npm run scrape:steam-epic-region-change

# Gift cards
npm run scrape:gift-cards

# In-game points
npm run scrape:in-game-points

# Region change products
npm run scrape:region-change

# Subscriptions
npm run scrape:subscriptions

# Running offers (on-sale list for homepage section)
npm run scrape:running-offers
```

### Run the primary game scraping set in one command

```bash
cd scraper
npm run scrape
```

This runs the five primary game-category scrapers in sequence:

- `pc-games`
- `global-game-keys` (includes popularity / price low-high / price high-low rank metadata)
- `offline-activation`
- `on-sale`
- `steam-epic-region-change`

### Import into database (preserves reviews/ratings)

```bash
cd backend
npm run import:games
```

The importer now reads all category outputs from `scraper/data/`, deduplicates by URL/slug, upserts by slug, and keeps existing review/rating fields.

### Post-process scraper output

```bash
cd scraper

# Merge and normalize scraped PC game files
npm run process:games

# Add CAD price fields to the global keys export
npm run convert:cad

# Rename price fields for the updated global keys export
npm run update:prices
```

### Validate scraped data

```bash
cd scraper
npm run validate:data
```

The validator checks every JSON file in `scraper/data/` and reports missing required fields, suspicious pricing, and blank metadata fields that should usually be populated.

### Running offers (homepage section)

To show the “Running Offers” section on the homepage:

1. From `scraper/`: run `npm run scrape:running-offers` to fetch the on-sale list into `scraper/data/running_offers.json`.
2. From `backend/`: run `npm run import:running-offers` to match those products to games in MongoDB (by slug) and store the ordered list. The frontend then loads this list from `GET /api/v1/games/running-offers`.

## Payments (PayPal)

Checkout uses the PayPal JavaScript SDK and the Orders v2 API. The cart shows a PayPal button; when the user approves, the backend captures the payment and marks the order paid.

### Environment variables

- In `backend/.env`:

```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET_KEY=your_paypal_secret_key
# Optional: for webhook signature verification (from PayPal Developer Dashboard > Webhooks)
PAYPAL_WEBHOOK_ID=your_webhook_id
FRONTEND_URL=http://localhost:5173
```

- In the frontend (root `.env`), set the same client ID for the SDK:

```env
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### Flow

1. User clicks the PayPal button in the cart (must be logged in).
2. Frontend calls `POST /api/v1/payments/create-order` with cart items; backend creates a PayPal order and a pending order in the DB, returns `orderId`.
3. User approves in the PayPal popup.
4. Frontend calls `POST /api/v1/payments/capture` with the PayPal `orderId`; backend captures the payment and marks the order paid.
5. User is redirected to `/checkout/success?session_id=<orderId>`.

### Webhook

Subscribe your app’s webhook URL in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) (e.g. `https://your-api.com/api/v1/payments/webhook`) and subscribe to **Payment capture completed**. Set `PAYPAL_WEBHOOK_ID` to the webhook ID shown there so the backend can verify signatures.

## Testing

### Frontend Tests
```bash
# Run frontend tests
npm run test:frontend

# Run tests in watch mode
npm run test:frontend -- --watch
```

### Backend Tests
```bash
# Run backend tests
cd backend
npm test

# Run tests in watch mode
npm run test:watch
```

### Run All Tests
```bash
# From the root directory
npm test
```

## Building for Production

```bash
# Build frontend
npm run build

# Start production server (from backend directory)
cd backend
npm start
```

## Deployment

### Environment variables

**Frontend (root `.env` or build env)**  
- `VITE_API_URL` – Backend API base URL (no trailing slash). Example: `https://api.yourdomain.com/api/v1`. If unset, build uses `http://localhost:5001/api/v1`.
- `VITE_PAYPAL_CLIENT_ID` – PayPal client ID (same as backend).

**Backend (`backend/.env`)**  
- `NODE_ENV=production`
- `PORT` – Server port (e.g. `5001` or platform default).
- `MONGODB_URI` – MongoDB connection string (e.g. MongoDB Atlas).
- `JWT_SECRET` – Strong secret for JWT signing.
- `FRONTEND_URL` – Full frontend origin (e.g. `https://yourdomain.com`) for redirects.
- `CORS_ORIGIN` – Allowed frontend origin(s), comma-separated (e.g. `https://yourdomain.com`). Must include your frontend URL.
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET_KEY` – PayPal API credentials. Optionally `PAYPAL_WEBHOOK_ID` for webhook verification.
- Optional: Redis (`REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`), AWS, SMTP. See `backend/.env.example`.

### Build and run

1. **Backend**  
   - Copy `backend/.env.example` to `backend/.env` and set production values.  
   - Install and start: `cd backend && npm ci && npm start` (or use your host’s start command).

2. **Frontend**  
   - In project root, set `VITE_API_URL` (and `VITE_STRIPE_PUBLISHABLE_KEY`) in `.env` or your build environment.  
   - Build: `npm ci && npm run build`.  
   - Serve the `dist/` folder with any static host (Vercel, Netlify, nginx, etc.).

3. **PayPal**
   - In the PayPal Developer Dashboard, add webhook URL `https://your-api-domain.com/api/v1/payments/webhook`, subscribe to **Payment capture completed**, and set `PAYPAL_WEBHOOK_ID` in backend env.

### Order status migration (existing data)

If you have orders with the old status values (`pending`, `failed`), update them to the new ones (`in_progress`, `closed`) before or after deploying:

```bash
# MongoDB shell or Compass
db.orders.updateMany({ status: 'pending' }, { $set: { status: 'in_progress' } })
db.orders.updateMany({ status: 'failed' }, { $set: { status: 'closed' } })
```

Or run the migration script from the backend folder:

```bash
cd backend
node scripts/migrateOrderStatuses.js
```

