# Next E-Commerce Premium

Modern full-stack e-commerce scaffold built with Next.js, Tailwind CSS, React, Redux Toolkit, Express, and MongoDB.

## Features
- Next.js frontend with premium glassmorphism UI
- Tailwind CSS styling and Framer Motion animations
- JWT authentication with Google OAuth support
- Product listing, product detail, cart, wishlist, checkout, EMI calculator, and admin dashboard pages
- Express backend with product, cart, wishlist, EMI, orders, and admin routes
- MongoDB data models for `User`, `Product`, `Order`, `EmiPlan`, `Coupon`, `Review`
- Environment example for API keys, Google OAuth, Stripe, Razorpay, and Cloudinary

## Getting started

### 1. Install dependencies

```bash
cd next-ecommerce
npm install
cd server
npm install
```

### 2. Create environment variables

Copy `env.example` to `.env` in the `next-ecommerce` folder and fill in your values.

### 3. Run the backend

```bash
cd next-ecommerce/server
npm run dev
```

### 4. Run the frontend

```bash
cd next-ecommerce
npm run dev
```

### 5. Open the site

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000`

## Notes
- Google OAuth callback is configured for the client URL and requires credentials in `.env`
- Backend API routes are mounted under `/api`
- The frontend uses Axios to communicate with the Express API
- Add actual product data in MongoDB using the admin/RPC endpoints or seed data

## Deployment

1. Build frontend: `npm run build`
2. Build backend: `npm run build`
3. Set environment variables on your hosting platform
4. Serve the frontend from Vercel, Netlify, or custom server
5. Deploy the backend to Heroku, Railway, Render, or a VPS
