# 02-Customer Frontend Specification

This document specifies the API requirements for the customer-facing application.

## API Endpoints

### Products

#### List Products
- **Endpoint**: `GET /api/v1/products`
- **Auth**: Public
- **Query Params**:
    - `page` (optional, default: 1): Page number.
    - `limit` (optional, default: 12): Items per page (max 100).
    - `search` (optional): Case-insensitive search in name or brief description.
    - `categoryId` (optional): Filter by category ID.
    - `tagId` (optional): Filter by tag ID.
    - `isActive` (optional, default: true): Filter by visibility.
- **Response**:
    - `success`: true
    - `data`: `Product[]`
    - `pagination`: `{ page, limit, total, pages }`
- **TypeScript Interface**:
```typescript
interface ProductBrief {
  _id: string;
  name: string;
  briefDescription: string;
  price: number;
  stock: number;
  categories: { _id: string; name: string; slug: string }[];
  tags: { _id: string; name: string; slug: string }[];
  images: string[];
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

#### Get Product Details
- **Endpoint**: `GET /api/v1/products/:productId`
- **Auth**: Public
- **Path Params**: `productId`
- **Response**:
    - `success`: true
    - `data`: `{ ...Product, reviews: Review[] }`
- **TypeScript Interface**:
```typescript
interface ProductDetail extends ProductBrief {
  detailedDescription: string;
  costPrice: number;
  reviews: Review[];
}

interface Review {
  _id: string;
  user: { name: string };
  comment: string;
  rating: number;
  createdAt: string;
}
```

#### List Product Reviews
- **Endpoint**: `GET /api/v1/products/:productId/reviews`
- **Auth**: Public
- **Path Params**: `productId`
- **Response**:
    - `success`: true
    - `data`: `Review[]`

#### Create/Update Review
- **Endpoint**: `POST /api/v1/products/:productId/reviews`
- **Auth**: Verified User
- **Body**:
    - `rating`: number (1-5, required)
    - `comment`: string (2-2000 chars, required)
- **Response**:
    - `success`: true
    - `data`: `Review`

#### Delete Review
- **Endpoint**: `DELETE /api/v1/products/:productId/reviews`
- **Auth**: Verified User
- **Path Params**: `productId`
- **Response**:
    - `success`: true
    - `message`: "Review deleted successfully"

---

### Categories & Tags

#### List Categories
- **Endpoint**: `GET /api/v1/categories`
- **Auth**: Public
- **Response**:
    - `success`: true
    - `data`: `Category[]`
- **TypeScript Interface**:
```typescript
interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}
```

#### List Tags
- **Endpoint**: `GET /api/v1/tags`
- **Auth**: Public
- **Response**:
    - `success`: true
    - `data`: `Tag[]`
- **TypeScript Interface**:
```typescript
interface Tag {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
```

---

### User Account

#### Get Current User
- **Endpoint**: `GET /api/v1/users/me`
- **Auth**: Verified User
- **Response**:
    - `success`: true
    - `data`: `User`
- **TypeScript Interface**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### Shopping Cart

#### View Cart
- **Endpoint**: `GET /api/v1/cart`
- **Auth**: Verified User
- **Response**:
    - `success`: true
    - `data`: `Cart`
- **TypeScript Interface**:
```typescript
interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  product: ProductBrief;
  quantity: number;
  priceSnapshot: number;
}
```

#### Add to Cart
- **Endpoint**: `POST /api/v1/cart/items`
- **Auth**: Verified User
- **Body**:
    - `productId`: string (required)
    - `quantity`: number (positive integer, required)
- **Response**:
    - `success`: true
    - `data`: `Cart`

#### Update Cart Item Quantity
- **Endpoint**: `PATCH /api/v1/cart/items/:productId`
- **Auth**: Verified User
- **Path Params**: `productId`
- **Body**:
    - `quantity`: number (positive integer, required)
- **Response**:
    - `success`: true
    - `data`: `Cart`

#### Remove Item from Cart
- **Endpoint**: `DELETE /api/v1/cart/items/:productId`
- **Auth**: Verified User
- **Path Params**: `productId`
- **Response**:
    - `success`: true
    - `data`: `Cart`

#### Clear Cart
- **Endpoint**: `DELETE /api/v1/cart`
- **Auth**: Verified User
- **Response**:
    - `success`: true
    - `message`: "Cart cleared successfully"

---

### Orders

#### Place Order (Checkout)
- **Endpoint**: `POST /api/v1/orders`
- **Auth**: Verified User
- **Body**:
    - `shippingAddress`: string (10-500 chars, required)
    - `customerEmail`: string (email, optional)
    - `notes`: string (max 1000, optional)
- **Response**:
    - `success`: true
    - `data`: `Order`
- **TypeScript Interface**:
```typescript
interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  status: 'pending' | 'completed' | 'canceled';
  subtotal: number;
  total: number;
  profit: number;
  shippingAddress: string;
  customerEmail: string;
  statusHistory: OrderStatusHistory[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
}

interface OrderStatusHistory {
  status: 'pending' | 'completed' | 'canceled';
  note: string;
  changedBy: string | null;
  changedAt: string;
}
```

#### List My Orders
- **Endpoint**: `GET /api/v1/orders`
- **Auth**: Verified User
- **Response**:
    - `success`: true
    - `data`: `Order[]`

#### Get Order Details
- **Endpoint**: `GET /api/v1/orders/:orderId`
- **Auth**: Verified User
- **Path Params**: `orderId`
- **Response**:
    - `success`: true
    - `data`: `Order`

---

## End-to-End User Flows

### 1. Onboarding & Authentication
**UI Action** $\rightarrow$ **API Call** $\rightarrow$ **Backend Behavior** $\rightarrow$ **Response** $\rightarrow$ **Frontend Update**
- Register $\rightarrow$ `POST /api/auth/sign-up` $\rightarrow$ Creates user, sends verification email $\rightarrow$ `200 OK` $\rightarrow$ Show "Verify Email" screen.
- Verify Email $\rightarrow$ `GET /api/auth/verify-email?token=...` $\rightarrow$ Sets `emailVerified: true` $\rightarrow$ `200 OK` $\rightarrow$ Redirect to Home.
- Login $\rightarrow$ `POST /api/auth/sign-in/email` $\rightarrow$ Validates credentials, creates session cookie $\rightarrow$ `200 OK` $\rightarrow$ Store user state, redirect to Home.
- Logout $\rightarrow$ `POST /api/auth/sign-out` $\rightarrow$ Destroys session $\rightarrow$ `200 OK` $\rightarrow$ Clear user state, redirect to Login.

### 2. Product Discovery
- Browse $\rightarrow$ `GET /api/v1/products` $\rightarrow$ Fetches active products with pagination $\rightarrow$ `200 OK` $\rightarrow$ Render product grid.
- Search $\rightarrow$ `GET /api/v1/products?search=...` $\rightarrow$ Regex search on name/description $\rightarrow$ `200 OK` $\rightarrow$ Update product grid.
- Filter $\rightarrow$ `GET /api/v1/products?categoryId=...` $\rightarrow$ Filters by category ID $\rightarrow$ `200 OK` $\rightarrow$ Update product grid.
- View $\rightarrow$ `GET /api/v1/products/:id` $\rightarrow$ Fetches full details + reviews $\rightarrow$ `200 OK` $\rightarrow$ Render product page.

### 3. Purchase Process
- Add to Cart $\rightarrow$ `POST /api/v1/cart/items` $\rightarrow$ Checks stock, adds to Cart model $\rightarrow$ `201 Created` $\rightarrow$ Update cart badge, show toast.
- Manage Cart $\rightarrow$ `PATCH /api/v1/cart/items/:id` $\rightarrow$ Updates quantity, checks stock $\rightarrow$ `200 OK` $\rightarrow$ Update cart totals.
- Checkout $\rightarrow$ `POST /api/v1/orders` $\rightarrow$ Atomic transaction: deducts stock, creates Order, clears Cart $\rightarrow$ `201 Created` $\rightarrow$ Redirect to Success page.

### 4. Post-Purchase
- History $\rightarrow$ `GET /api/v1/orders` $\rightarrow$ Fetches orders for current user $\rightarrow$ `200 OK` $\rightarrow$ Render order list.
- Review $\rightarrow$ `POST /api/v1/products/:id/reviews` $\rightarrow$ Upserts review, recalculates product rating $\rightarrow$ `201 Created` $\rightarrow$ Update review section.

## Frontend Notes

### Caching & State
- **Catalog**: Products and Categories can be cached (e.g., TanStack Query) for 5-10 minutes.
- **Cart**: The cart should be treated as server-state. Fetch on mount and refresh after any mutation.
- **Auth**: Use a Global Context to store the `User` object from `/api/v1/users/me`.

### Loading & Empty States
- **Product Grid**: Show skeleton loaders during `GET /api/v1/products`.
- **Empty Cart**: When `Cart.items` is empty, show a "Your cart is empty" message with a "Continue Shopping" button.
- **No Results**: When search returns `data: []`, show "No products found matching your search".

### Error Handling
- **401 Unauthorized**: Redirect to `/login`.
- **403 Forbidden (Verification)**: Redirect to `/verify-email` with a prompt to resend.
- **400 Bad Request (Stock)**: Display the specific error message (e.g., "Not enough stock available") in a toast.
