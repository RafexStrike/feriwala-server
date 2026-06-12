# Feriwala Backend

Node.js + Express + MongoDB backend for an e-commerce app with auth, products, cart, orders, reviews, analytics, and admin notification email management.

## Run locally

1. Fill in the required values in `.env`.
2. Install dependencies: `npm install`
3. Create the first admin account: `npm run admin:add`
4. Build the project: `npm run build`
5. Start the server: `npm start`

For development, you can use `npm run dev`.

## Authentication

Authentication is handled by Better Auth using email/password login.
Normal users must verify their email before accessing protected user features.
Admin accounts are created via scripts and use role-based access control.

## Main endpoints

- `/api/auth/*` (Better Auth endpoints for signup, login, logout, verification, password reset)
- `GET /api/products`
- `GET /api/products/:productId`
- `GET /api/products/:productId/reviews`
- `POST /api/cart/items`
- `POST /api/orders`
- `GET /api/admin/analytics`
- `GET /health`

## Notes

- Password reset emails and order notifications use the configured SMTP credentials.
- Admin notification recipients are managed through `/api/admin/notification-emails`.
