# Codebase Dump



---
## FILE: 01-system-overview.md

```md
# 01-System Overview

## Overview

The Feriwala Server is a robust e-commerce backend providing catalog management, shopping cart functionality, order processing, and an administrative dashboard.

### Technical Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Better Auth
- **Storage**: Local Filesystem (for images)
- **Logging**: Pino

## API Versioning

### Base URLs
- **API Version 1**: `/api/v1`
- **Authentication**: `/api/auth`

### Route Grouping
Routes are grouped by resource:
- `/api/v1/users` - User profile and account management
- `/api/v1/products` - Product catalog and reviews
- `/api/v1/categories` - Product categories
- `/api/v1/tags` - Product tags
- `/api/v1/cart` - Shopping cart management
- `/api/v1/orders` - Order placement and history
- `/api/v1/admin` - Administrative tools and analytics

## Authentication

The system utilizes **Better Auth** for session-based authentication.

### Flow
1. **Registration/Login**: Handled via `/api/auth/*` endpoints.
2. **Session Lifecycle**: Better Auth manages sessions in MongoDB.
3. **Validation**: The `requireAuth` middleware validates the session using request headers.
4. **Verification**: Some endpoints require `emailVerified: true` via the `requireVerifiedUser` middleware.

### Cookie Behavior
- **Storage**: Sessions are stored in cookies.
- **Security**: Cookies are configured as `HttpOnly` and `Secure` (in production) to prevent XSS and MITM attacks.
- **SameSite**: Configured to prevent CSRF.

## Authorization

The system implements Role-Based Access Control (RBAC).

| Role | Permissions | Restricted Actions |
| :--- | :--- | :--- |
| `user` | View products, manage own cart, place orders, write reviews. | Cannot access `/api/v1/admin` or modify other users' data. |
| `admin` | Full access to all endpoints, including catalog and user management. | No restrictions. |

## Global Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "details": { ... }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "pages": 9
  }
}
```

## Global Error Handling

The system uses a centralized error middleware (`errorHandler.ts`) and a custom `ApiError` class.

- **400 Bad Request**: Validation errors (Zod) or Multer upload errors.
- **401 Unauthorized**: Missing or invalid session.
- **403 Forbidden**: Insufficient permissions (e.g., non-admin accessing admin routes) or unverified email.
- **404 Not Found**: Resource not found or route does not exist.
- **409 Conflict**: Duplicate resource (MongoDB code 11000).
- **500 Internal Server Error**: Unexpected server failures.

## Upload System

- **Accepted MIME Types**: Images only (`image/*`).
- **File Size Limit**: 5 MB per file.
- **Upload Storage**:
    - Products: `/uploads/products`
    - Verifications: `/uploads/verifications`
- **Field Names**: Defined by the specific route (usually `images` or `file`).

## Data Models

### User
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | - | Full name of the user |
| `email` | String | Yes | - | Unique email address |
| `role` | String | Yes | `user` | `user` or `admin` |
| `emailVerified` | Boolean | Yes | `false` | Whether the email is verified |
| `lastLoginAt` | Date | No | `null` | Timestamp of last login |

### Product
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | - | Product name |
| `briefDescription` | String | Yes | - | Short summary |
| `detailedDescription` | String | Yes | - | Full product details |
| `price` | Number | Yes | - | Selling price |
| `costPrice` | Number | No | `0` | Cost to acquire |
| `stock` | Number | Yes | `0` | Current inventory count |
| `categories` | ObjectId[] | No | `[]` | References to Category model |
| `tags` | ObjectId[] | No | `[]` | References to Tag model |
| `images` | String[] | No | `[]` | URLs to image files |
| `isActive` | Boolean | No | `true` | Visibility status |
| `averageRating` | Number | No | `0` | Calculated average |
| `reviewCount` | Number | No | `0` | Total number of reviews |

### Category
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | - | Unique category name |
| `slug` | String | Yes | - | URL-friendly name |
| `description` | String | No | `''` | Category description |
| `isActive` | Boolean | No | `true` | Visibility status |

### Tag
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | - | Unique tag name |
| `slug` | String | Yes | - | URL-friendly name |
| `isActive` | Boolean | No | `true` | Visibility status |

### Cart
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user` | ObjectId | Yes | - | Reference to User |
| `items` | Array | No | `[]` | List of cart items (product, quantity, priceSnapshot) |

### Order
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user` | ObjectId | Yes | - | Reference to User |
| `items` | Array | No | `[]` | Order items (product, name, quantity, price, costPrice) |
| `status` | String | Yes | `pending` | `pending`, `completed`, `canceled` |
| `subtotal` | Number | Yes | - | Sum of item prices |
| `total` | Number | Yes | - | Final amount paid |
| `profit` | Number | Yes | - | total - (sum of costPrices) |
| `shippingAddress` | String | Yes | - | Delivery address |
| `customerEmail` | String | Yes | - | Notification email |
| `statusHistory` | Array | No | `[]` | History of status changes |
| `notes` | String | No | `''` | Additional order notes |

### Review
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user` | ObjectId | Yes | - | Reference to User |
| `product` | ObjectId | Yes | - | Reference to Product |
| `comment` | String | Yes | - | Review text |
| `rating` | Number | Yes | - | 1 to 5 stars |

### NotificationRecipient
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | Yes | - | Unique email address |
| `isActive` | Boolean | No | `true` | Notification status |
| `notificationTypes` | String[] | No | `['order-status']` | Types of alerts to send |
| `createdBy` | ObjectId | No | `null` | Admin who added recipient |

```


---
## FILE: 02-customer-frontend-spec.md

```md
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

```


---
## FILE: 03-admin-frontend-spec.md

```md
# 03-Admin Frontend Specification

This document defines the requirements for the Administrative Dashboard.

## Admin Authorization & Security

### Admin Guard
All admin endpoints are protected by the `requireAdmin` middleware. 
- **Check**: Validates that the session user has `role === 'admin'`.
- **Failure**: Returns `403 Forbidden` with message "Administrator access required".

### Frontend Implementation
The admin dashboard must be wrapped in a Higher-Order Component (HOC) or a Route Guard that:
1. Checks if the user is authenticated.
2. Verifies `user.role === 'admin'`.
3. Redirects non-admins to the customer home page or an "Unauthorized" page.

---

## Admin API Endpoints

### Dashboard & Analytics

#### Dashboard Overview
- **Endpoint**: `GET /api/v1/admin/dashboard`
- **Auth**: Admin
- **Response**:
    - `success`: true
    - `data`: `{ users, products, orders, analytics: AnalyticsSummary }`

#### detailed Analytics
- **Endpoint**: `GET /api/v1/admin/analytics`
- **Auth**: Admin
- **Response**:
    - `success`: true
    - `data`: `AnalyticsSummary`
- **TypeScript Interface**:
```typescript
interface AnalyticsSummary {
  totals: { revenue: number; profit: number; sales: number };
  last30Days: Array<{ date: string; revenue: number; profit: number; sales: number }>;
  monthly: Array<{ month: string; revenue: number; profit: number; sales: number }>;
  yearly: Array<{ year: string; revenue: number; profit: number; sales: number }>;
}
```

#### Inventory Summary
- **Endpoint**: `GET /api/v1/admin/inventory`
- **Auth**: Admin
- **Response**:
    - `success`: true
    - `data`: `{ lowStockProducts: ProductBrief[], totals: { totalProducts, totalInventoryUnits } }`

---

### Catalog Management

#### Product CRUD
- **Create**: `POST /api/v1/products`
    - **Body**: `ProductCreateSchema` (name, briefDescription, detailedDescription, price, costPrice, stock, categoryIds, tagIds, images)
- **Update**: `PATCH /api/v1/products/:productId`
    - **Body**: `ProductUpdateSchema` (Partial of Create)
- **Inventory Only**: `PATCH /api/v1/products/:productId/inventory`
    - **Body**: `{ stock: number }`
- **Delete**: `DELETE /api/v1/products/:productId` (Soft delete: sets `isActive: false`)

#### Category CRUD
- **Create**: `POST /api/v1/categories`
    - **Body**: `{ name, description }`
- **Update**: `PATCH /api/v1/categories/:categoryId`
    - **Body**: `{ name, description, isActive }` (Partial)
- **Delete**: `DELETE /api/v1/categories/:categoryId`

#### Tag CRUD
- **Create**: `POST /api/v1/tags`
    - **Body**: `{ name }`
- **Update**: `PATCH /api/v1/tags/:tagId`
    - **Body**: `{ name, isActive }` (Partial)
- **Delete**: `DELETE /api/v1/tags/:tagId`

---

### User & Order Management

#### User Management
- **List All**: `GET /api/v1/users`
- **Get One**: `GET /api/v1/users/:userId`
- **Update**: `PATCH /api/v1/users/:userId`
    - **Body**: `{ role, isActive, name, email }` (Partial)
- **Delete**: `DELETE /api/v1/users/:userId`

#### Order Moderation
- **Update Status**: `PATCH /api/v1/orders/:orderId/status`
    - **Body**: `{ status: 'pending'|'completed'|'canceled', note: string }`
    - **Effect**: Updates order status, adds to `statusHistory`, and triggers email notification.

---

### Notification Management

#### Recipient CRUD
- **List**: `GET /api/v1/admin/notification-emails`
- **Create**: `POST /api/v1/admin/notification-emails`
    - **Body**: `{ email, isActive, notificationTypes }`
- **Update**: `PATCH /api/v1/admin/notification-emails/:recipientId`
    - **Body**: `{ email, isActive, notificationTypes }` (Partial)
- **Delete**: `DELETE /api/v1/admin/notification-emails/:recipientId`

---

## Frontend Integration Guide

### Suggested API Layer (Axios Example)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  updateOrderStatus: (id: string, data: { status: string, note: string }) => 
    api.patch(`/orders/${id}/status`, data),
  // ... other methods
};
```

### Suggested State Management (RTK Query Example)
```typescript
export const adminApiSlice = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v1', prepareHeaders: (headers) => {
    // Better Auth uses cookies, so withCredentials is handled by fetchBaseQuery
    return headers;
  }}),
  endpoints: (builder) => ({
    getAnalytics: builder.query<AnalyticsResponse, void>({
      query: () => '/admin/analytics',
    }),
    updateOrder: builder.mutation<OrderResponse, { id: string, data: any }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});
```

### Suggested Folder Structure
```text
src/
├── api/
│   ├── client.ts          # Axios instance
│   ├── customerApi.ts     # Customer endpoints
│   └── adminApi.ts        # Admin endpoints
├── components/
│   ├── admin/
│   │   ├── Dashboard/
│   │   ├── Catalog/
│   │   └── Users/
│   └── shared/
├── hooks/
│   └── useAuth.ts         # Context for user role and session
├── pages/
│   ├── admin/
│   │   ├── DashboardPage.tsx
│   │   ├── ProductManagePage.tsx
│   │   └── UserManagePage.tsx
│   └── customer/
└── App.tsx                # Route guards implemented here
```

### Suggested Route Protection
```tsx
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/unauthorized" />;
  
  return children;
};

// Usage in Router
<Route path="/admin" element={
  <AdminRoute>
    <AdminLayout />
  </AdminRoute>
}>
  <Route index element={<DashboardPage />} />
  <Route path="products" element={<ProductManagePage />} />
</Route>
```

```


---
## FILE: POSTMAN_TESTING_GUIDE.md

```md
# Postman API Testing Guide

This guide provides step-by-step instructions to verify the backend API functionality.

## 1. Environment Setup

### Base URL
Set your Postman environment variable `baseUrl` to:
`http://localhost:5000/api/v1` (or your actual server URL)

### Authentication
The API uses **Better Auth**. To authenticate:
1. Use the `/api/auth/sign-up` and `/api/auth/sign-in` endpoints (managed by Better Auth).
2. After login, the server sets a session cookie.
3. **Postman Setup**: Postman automatically handles cookies. Ensure "Cookie Jar" is enabled.

### Test Accounts
If you have run the seeder script:
- **Customer Account**:
  - Email: `seed.user@example.com`
  - Password: `TestPassword123!`
- **Admin Account**: Create one using `npm run admin:add`.

---

## 2. Testing Sequence (Recommended)

Follow this order to test a complete user journey:
1. **User**: Login $\rightarrow$ Get Profile (`/users/me`)
2. **Catalog**: Browse Categories $\rightarrow$ Browse Tags $\rightarrow$ List Products $\rightarrow$ Product Details
3. **Cart**: Add items to cart $\rightarrow$ View Cart $\rightarrow$ Update item quantity $\rightarrow$ Remove item
4. **Order**: Checkout (Create Order) $\rightarrow$ List my orders $\rightarrow$ View order details
5. **Review**: Create a review for a product $\rightarrow$ View product reviews
6. **Admin**: (Login as Admin) $\rightarrow$ Dashboard $\rightarrow$ Manage Products $\rightarrow$ Manage Orders $\rightarrow$ Manage Users

---

## 3. Endpoint Documentation

### User Management

#### Get My Profile
- **Method**: `GET`
- **URL**: `{{baseUrl}}/users/me`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `200 OK` with user object.

#### List All Users (Admin Only)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/users`
- **Auth**: Admin
- **Success Response**: `200 OK` with array of users.

#### Get User by ID (Admin Only)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/users/:userId`
- **Auth**: Admin
- **Success Response**: `200 OK` with user object.

#### Update User (Admin Only)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/users/:userId`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "role": "user",
    "name": "Updated Name",
    "email": "updated@example.com"
  }
  ```
- **Success Response**: `200 OK` with updated user.

#### Delete User (Admin Only)
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/users/:userId`
- **Auth**: Admin
- **Success Response**: `204 No Content`

---

### Product Catalog

#### List Products
- **Method**: `GET`
- **URL**: `{{baseUrl}}/products`
- **Auth**: Public
- **Query Params**: `page`, `limit`, `category`, `tag`, `search`, `sort`
- **Success Response**: `200 OK` with paginated products list.

#### Create Product (Admin Only)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/products`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "name": "Gaming Mouse",
    "briefDescription": "High DPI wireless mouse",
    "detailedDescription": "A professional gaming mouse with 20k DPI and RGB lighting...",
    "price": 59.99,
    "costPrice": 30.00,
    "stock": 100,
    "categoryIds": ["CATEGORY_ID"],
    "tagIds": ["TAG_ID"],
    "images": ["https://example.com/image.jpg"]
  }
  ```
- **Success Response**: `201 Created`

#### Get Product Details
- **Method**: `GET`
- **URL**: `{{baseUrl}}/products/:productId`
- **Auth**: Public
- **Success Response**: `200 OK` with product object.

#### Update Product (Admin Only)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/products/:productId`
- **Auth**: Admin
- **Request Body**: (Partial product object)
- **Success Response**: `200 OK`

#### Update Inventory (Admin Only)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/products/:productId/inventory`
- **Auth**: Admin
- **Request Body**:
  ```json
  { "stock": 150 }
  ```
- **Success Response**: `200 OK`

#### Delete Product (Admin Only)
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/products/:productId`
- **Auth**: Admin
- **Success Response**: `204 No Content`

---

### Category & Tag Management

#### Categories
- **List**: `GET {{baseUrl}}/categories` (Public)
- **Create**: `POST {{baseUrl}}/categories` (Admin) - Body: `{"name": "Electronics", "description": "..."}`
- **Update**: `PATCH {{baseUrl}}/categories/:id` (Admin) - Body: `{"name": "Updated"}`
- **Delete**: `DELETE {{baseUrl}}/categories/:id` (Admin)

#### Tags
- **List**: `GET {{baseUrl}}/tags` (Public)
- **Create**: `POST {{baseUrl}}/tags` (Admin) - Body: `{"name": "New Arrival"}`
- **Update**: `PATCH {{baseUrl}}/tags/:id` (Admin) - Body: `{"name": "Updated"}`
- **Delete**: `DELETE {{baseUrl}}/tags/:id` (Admin)

---

### Shopping Cart

#### View Cart
- **Method**: `GET`
- **URL**: `{{baseUrl}}/cart`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `200 OK` with cart items.

#### Add Item to Cart
- **Method**: `POST`
- **URL**: `{{baseUrl}}/cart/items`
- **Auth**: Authenticated (Verified User)
- **Request Body**:
  ```json
  {
    "productId": "PRODUCT_ID",
    "quantity": 2
  }
  ```
- **Success Response**: `200 OK`

#### Update Item Quantity
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/cart/items/:productId`
- **Auth**: Authenticated (Verified User)
- **Request Body**: `{ "quantity": 5 }`
- **Success Response**: `200 OK`

#### Remove Item from Cart
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/cart/items/:productId`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `204 No Content`

#### Clear Cart
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/cart`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `204 No Content`

---

### Orders

#### Checkout (Create Order)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/orders`
- **Auth**: Authenticated (Verified User)
- **Request Body**:
  ```json
  {
    "shippingAddress": "123 Test Street, City, Country",
    "customerEmail": "user@example.com",
    "notes": "Leave at the front door"
  }
  ```
- **Success Response**: `201 Created`

#### List My Orders
- **Method**: `GET`
- **URL**: `{{baseUrl}}/orders`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `200 OK` with order history.

#### Get Order Details
- **Method**: `GET`
- **URL**: `{{baseUrl}}/orders/:orderId`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `200 OK`

#### Update Order Status (Admin Only)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/orders/:orderId/status`
- **Auth**: Admin
- **Request Body**:
  ```json
  {
    "status": "completed",
    "note": "Package delivered to customer"
  }
  ```
- **Success Response**: `200 OK`

---

### Product Reviews

#### List Reviews for Product
- **Method**: `GET`
- **URL**: `{{baseUrl}}/products/:productId/reviews`
- **Auth**: Public
- **Success Response**: `200 OK`

#### Create Review
- **Method**: `POST`
- **URL**: `{{baseUrl}}/products/:productId/reviews`
- **Auth**: Authenticated (Verified User)
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Excellent product, highly recommended!"
  }
  ```
- **Success Response**: `201 Created`

#### Delete Review
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/products/:productId/reviews`
- **Auth**: Authenticated (Verified User)
- **Success Response**: `204 No Content`

---

### Admin Dashboard & Settings

#### Dashboard Overview
- **Method**: `GET`
- **URL**: `{{baseUrl}}/admin/dashboard`
- **Auth**: Admin

#### Analytics
- **Method**: `GET`
- **URL**: `{{baseUrl}}/admin/analytics`
- **Auth**: Admin

#### Inventory Summary
- **Method**: `GET`
- **URL**: `{{baseUrl}}/admin/inventory`
- **Auth**: Admin

#### Notification Emails
- **List**: `GET {{baseUrl}}/admin/notification-emails` (Admin)
- **Create**: `POST {{baseUrl}}/admin/notification-emails` (Admin) - Body: `{"email": "admin@example.com", "notificationTypes": ["order-status"]}`
- **Update**: `PATCH {{baseUrl}}/admin/notification-emails/:id` (Admin) - Body: `{"isActive": false}`
- **Delete**: `DELETE {{baseUrl}}/admin/notification-emails/:id` (Admin)

---

## 4. Validation & Error Testing

To ensure the API is robust, test the following cases:

### 1. Missing Required Fields
- Send a `POST` request to `/products` with an empty body.
- **Expected**: `400 Bad Request` with Zod validation errors.

### 2. Invalid Data Types
- Send a `PATCH` to `/products/:id/inventory` with `{"stock": "not-a-number"}`.
- **Expected**: `400 Bad Request`.

### 3. Invalid IDs
- Use a random string as `:productId` (e.g., `/products/123`).
- **Expected**: `404 Not Found` or `400 Bad Request` (CastError).

### 4. Unauthorized Access
- Call `/users/me` without a session cookie.
- **Expected**: `401 Authentication required`.

### 5. Forbidden Access
- Call `/admin/dashboard` with a regular user account.
- **Expected**: `403 Administrator access required`.

### 6. Unverified User Access
- Call `/cart` with a user account where `emailVerified: false`.
- **Expected**: `403 Please verify your email to access this feature`.

---

## 5. File Upload Testing (If Applicable)
If products require image uploads via Multipart form-data:
- **Postman Setup**: Set body to `form-data`.
- **Key**: `images` (change type to 'File').
- **Value**: Select an image file from your local machine.
- **Max Size**: Check `src/middleware/upload.ts` for limits.

```


---
## FILE: README.md

```md
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

```


---
## FILE: dump-codebase.js

```js
const fs = require("fs");
const path = require("path");

const ROOT_DIR = "./"; // change if needed
const OUTPUT_FILE = "codebase_dump.md";

// folders to ignore
const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next"];

// file extensions to include
const ALLOWED_EXT = [".js", ".ts", ".jsx", ".tsx", ".json", ".md", ".css", ".html"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(dir => filePath.includes(dir));
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);

    if (shouldIgnore(fullPath)) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      const ext = path.extname(fullPath);
      if (ALLOWED_EXT.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  });

  return fileList;
}

function generateDump() {
  const files = walk(ROOT_DIR);

  let output = "# Codebase Dump\n\n";

  files.forEach(file => {
    const content = fs.readFileSync(file, "utf-8");

    output += `\n\n---\n`;
    output += `## FILE: ${file}\n\n`;
    output += "```" + path.extname(file).slice(1) + "\n";
    output += content + "\n";
    output += "```\n";
  });

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`✅ Dump created: ${OUTPUT_FILE}`);
}

generateDump();

```


---
## FILE: package-lock.json

```json
{
  "name": "feriwala-server",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "feriwala-server",
      "version": "1.0.0",
      "dependencies": {
        "better-auth": "^1.6.16",
        "cors": "^2.8.6",
        "dotenv": "^17.4.2",
        "express": "^5.2.1",
        "helmet": "^8.2.0",
        "mongodb": "^7.3.0",
        "mongoose": "^9.7.0",
        "multer": "^2.1.1",
        "nodemailer": "^8.0.10",
        "pino": "^10.3.1",
        "pino-http": "^11.0.0",
        "slugify": "^1.6.9",
        "zod": "^4.4.3"
      },
      "devDependencies": {
        "@types/cors": "^2.8.19",
        "@types/express": "^5.0.6",
        "@types/multer": "^2.1.0",
        "@types/node": "^25.9.2",
        "@types/nodemailer": "^8.0.0",
        "tsx": "^4.22.4",
        "typescript": "^6.0.3"
      }
    },
    "node_modules/@better-auth/core": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/core/-/core-1.6.16.tgz",
      "integrity": "sha512-a0+ZNaaYYxOdFXFXmOE36TgtYN8QDzSYDozaAH0zsiWB0oyljsENyCxHJSekysISftb0rFpVXNdw525aEAOa6w==",
      "license": "MIT",
      "dependencies": {
        "@opentelemetry/semantic-conventions": "^1.39.0",
        "@standard-schema/spec": "^1.1.0",
        "zod": "^4.3.6"
      },
      "peerDependencies": {
        "@better-auth/utils": "0.4.1",
        "@better-fetch/fetch": "1.2.2",
        "@cloudflare/workers-types": ">=4",
        "@opentelemetry/api": "^1.9.0",
        "better-call": "1.3.6",
        "jose": "^6.1.0",
        "kysely": "^0.28.5 || ^0.29.0",
        "nanostores": "^1.0.1"
      },
      "peerDependenciesMeta": {
        "@cloudflare/workers-types": {
          "optional": true
        },
        "@opentelemetry/api": {
          "optional": true
        }
      }
    },
    "node_modules/@better-auth/drizzle-adapter": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/drizzle-adapter/-/drizzle-adapter-1.6.16.tgz",
      "integrity": "sha512-AZjswadpR7zlQduj3fRSsu1R5ldQRR9AeFqoxXRI4colrQhevOVY+tJr8RTJv9Nh18e9FMYDXUju2GX+QWHDzg==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1",
        "drizzle-orm": "^0.45.2"
      },
      "peerDependenciesMeta": {
        "drizzle-orm": {
          "optional": true
        }
      }
    },
    "node_modules/@better-auth/kysely-adapter": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/kysely-adapter/-/kysely-adapter-1.6.16.tgz",
      "integrity": "sha512-ys/feL1p6By3/rQlMZ8QTgf9K2tZAIp1p+fGqT2krIoG5r+UsH3gMkUdbHlYxLt790Bo+Njkiqt59P0BMNsi+g==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1",
        "kysely": "^0.28.17 || ^0.29.0"
      },
      "peerDependenciesMeta": {
        "kysely": {
          "optional": true
        }
      }
    },
    "node_modules/@better-auth/memory-adapter": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/memory-adapter/-/memory-adapter-1.6.16.tgz",
      "integrity": "sha512-8mDqe+2PMF9hUxjGNP1NOcqU1AqjUgmE8YC1HTtxa+LjnO7zsAPSxGSyo1L+7buFNLtiNyGFxccHpwOkO4/Msw==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1"
      }
    },
    "node_modules/@better-auth/mongo-adapter": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/mongo-adapter/-/mongo-adapter-1.6.16.tgz",
      "integrity": "sha512-JbUg/v3m9WUX94ivVdUOF8t/w2mWNBWvqYMqyWybfHQEPR8cvcqsqpfYvwg9HLBrYwhKXBS3KcJ1Rtk6gZ19Yw==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1",
        "mongodb": "^6.0.0 || ^7.0.0"
      },
      "peerDependenciesMeta": {
        "mongodb": {
          "optional": true
        }
      }
    },
    "node_modules/@better-auth/prisma-adapter": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/prisma-adapter/-/prisma-adapter-1.6.16.tgz",
      "integrity": "sha512-2bIlA7wjBx+4N2QcM32xL/YojRuJpDvskXqT/dGYKToDIEl/7yr12cLYlqeaFLL0O0s5qNZ8jbDtlCz20eogeQ==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1",
        "@prisma/client": "^5.0.0 || ^6.0.0 || ^7.0.0",
        "prisma": "^5.0.0 || ^6.0.0 || ^7.0.0"
      },
      "peerDependenciesMeta": {
        "@prisma/client": {
          "optional": true
        },
        "prisma": {
          "optional": true
        }
      }
    },
    "node_modules/@better-auth/telemetry": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/@better-auth/telemetry/-/telemetry-1.6.16.tgz",
      "integrity": "sha512-A782UQvlqZBddw0j2Q6tdroHulIpMlqQh/pbw2up30drLi66jz1ttgShRmryfOLAqN4DHqteuRrSsqDDrsp/pA==",
      "license": "MIT",
      "peerDependencies": {
        "@better-auth/core": "^1.6.16",
        "@better-auth/utils": "0.4.1",
        "@better-fetch/fetch": "1.2.2"
      }
    },
    "node_modules/@better-auth/utils": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/@better-auth/utils/-/utils-0.4.1.tgz",
      "integrity": "sha512-SZBPRPF3z0nBvE5ygOkxae35wnnXPRShmqFo78S+qslLeFoPu/pMgnXAuNKFMMybac3tiLaVg1e3MQW5MC+1iA==",
      "license": "MIT",
      "dependencies": {
        "@noble/hashes": "^2.0.1"
      }
    },
    "node_modules/@better-fetch/fetch": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@better-fetch/fetch/-/fetch-1.2.2.tgz",
      "integrity": "sha512-xlgQcYROGFgKg5FY7ZLppFmG7rR5Hkmz7tgDuQeR79i5KhKRjr2QC9xsBG2qEGPJJjf9bxzg/NMW2hEUWs5OnA=="
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.0.tgz",
      "integrity": "sha512-lhRUCeuOyJQURhTxl4WkpFTjIsbDayJHih5kZC1giwE+MhIzAb7mEsQMqMf18rHLsrb5qI1tafG20mLxEWcWlA==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.0.tgz",
      "integrity": "sha512-wqh0ByljabXLKHeWXYLqoJ5jKC4XBaw6Hk08OfMrCRd2nP2ZQ5eleDZC41XHyCNgktBGYMbqnrJKq/K/lzPMSQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.0.tgz",
      "integrity": "sha512-+WzIXQOSaGs33tLEgYPYe/yQHf0WTU0X42Jca3y8NWMbUVhp7rUnw+vAsRC/QiDrdD31IszMrZy+qwPOPjd+rw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.0.tgz",
      "integrity": "sha512-+VJggoaKhk2VNNqVL7f6S189UzShHC/mR9EE8rDdSkdpN0KflSwWY/gWjDrNxxisg8Fp1ZCD9jLMo4m0OUfeUA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.0.tgz",
      "integrity": "sha512-0T+A9WZm+bZ84nZBtk1ckYsOvyA3x7e2Acj1KdVfV4/2tdG4fzUp91YHx+GArWLtwqp77pBXVCPn2We7Letr0Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.0.tgz",
      "integrity": "sha512-fyzLm/DLDl/84OCfp2f/XQ4flmORsjU7VKt8HLjvIXChJoFFOIL6pLJPH4Yhd1n1gGFF9mPwtlN5Wf82DZs+LQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.0.tgz",
      "integrity": "sha512-l9GeW5UZBT9k9brBYI+0WDffcRxgHQD8ShN2Ur4xWq/NFzUKm3k5lsH4PdaRgb2w7mI9u61nr2gI2mLI27Nh3Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.0.tgz",
      "integrity": "sha512-BXoQai/A0wPO6Es3yFJ7APCiKGc1tdAEOgeTNy3SsB491S3aHn4S4r3e976eUnPdU+NbdtmBuLncYir2tMU9Nw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.0.tgz",
      "integrity": "sha512-CjaaREJagqJp7iTaNQjjidaNbCKYcd4IDkzbwwxtSvjI7NZm79qiHc8HqciMddQ6CKvJT6aBd8lO9kN/ZudLlw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.0.tgz",
      "integrity": "sha512-RVyzfb3FWsGA55n6WY0MEIEPURL1FcbhFE6BffZEMEekfCzCIMtB5yyDcFnVbTnwk+CLAgTujmV/Lgvih56W+A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.0.tgz",
      "integrity": "sha512-KBnSTt1kxl9x70q+ydterVdl+Cn0H18ngRMRCEQfrbqdUuntQQ0LoMZv47uB97NljZFzY6HcfqEZ2SAyIUTQBQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.0.tgz",
      "integrity": "sha512-zpSlUce1mnxzgBADvxKXX5sl8aYQHo2ezvMNI8I0lbblJtp8V4odlm3Yzlj7gPyt3T8ReksE6bK+pT3WD+aJRg==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.0.tgz",
      "integrity": "sha512-2jIfP6mmjkdmeTlsX/9vmdmhBmKADrWqN7zcdtHIeNSCH1SqIoNI63cYsjQR8J+wGa4Y5izRcSHSm8K3QWmk3w==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.0.tgz",
      "integrity": "sha512-bc0FE9wWeC0WBm49IQMPSPILRocGTQt3j5KPCA8os6VprfuJ7KD+5PzESSrJ6GmPIPJK965ZJHTUlSA6GNYEhg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.0.tgz",
      "integrity": "sha512-SQPZOwoTTT/HXFXQJG/vBX8sOFagGqvZyXcgLA3NhIqcBv1BJU1d46c0rGcrij2B56Z2rNiSLaZOYW5cUk7yLQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.0.tgz",
      "integrity": "sha512-SCfR0HN8CEEjnYnySJTd2cw0k9OHB/YFzt5zgJEwa+wL/T/raGWYMBqwDNAC6dqFKmJYZoQBRfHjgwLHGSrn3Q==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.0.tgz",
      "integrity": "sha512-us0dSb9iFxIi8srnpl931Nvs65it/Jd2a2K3qs7fz2WfGPHqzfzZTfec7oxZJRNPXPnNYZtanmRc4AL/JwVzHQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.0.tgz",
      "integrity": "sha512-CR/RYotgtCKwtftMwJlUU7xCVNg3lMYZ0RzTmAHSfLCXw3NtZtNpswLEj/Kkf6kEL3Gw+BpOekRX0BYCtklhUw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.0.tgz",
      "integrity": "sha512-nU1yhmYutL+fQ71Kxnhg8uEOdC0pwEW9entHykTgEbna2pw2dkbFSMeqjjyHZoCmt8SBkOSvV+yNmm94aUrrqw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.0.tgz",
      "integrity": "sha512-cXb5vApOsRsxsEl4mcZ1XY3D4DzcoMxR/nnc4IyqYs0rTI8ZKmW6kyyg+11Z8yvgMfAEldKzP7AdP64HnSC/6g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.0.tgz",
      "integrity": "sha512-8wZM2qqtv9UP3mzy7HiGYNH/zjTA355mpeuA+859TyR+e+Tc08IHYpLJuMsfpDJwoLo1ikIJI8jC3GFjnRClzA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.0.tgz",
      "integrity": "sha512-FLGfyizszcef5C3YtoyQDACyg95+dndv79i2EekILBofh5wpCa1KuBqOWKrEHZg3zrL3t5ouE5jgr94vA+Wb2w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.0.tgz",
      "integrity": "sha512-1ZgjUoEdHZZl/YlV76TSCz9Hqj9h9YmMGAgAPYd+q4SicWNX3G5GCyx9uhQWSLcbvPW8Ni7lj4gDa1T40akdlw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.0.tgz",
      "integrity": "sha512-Q9StnDmQ/enxnpxCCLSg0oo4+34B9TdXpuyPeTedN/6+iXBJ4J+zwfQI28u/Jl40nOYAxGoNi7mFP40RUtkmUA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.0.tgz",
      "integrity": "sha512-zF3ag/gfiCe6U2iczcRzSYJKH1DCI+ByzSENHlM2FcDbEeo5Zd2C86Aq0tKUYAJJ1obRP84ymxIAksZUcdztHA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.0.tgz",
      "integrity": "sha512-pEl1bO9mfAmIC+tW5btTmrKaujg3zGtUmWNdCw/xs70FBjwAL3o9OEKNHvNmnyylD6ubxUERiEhdsL0xBQ9efw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@mongodb-js/saslprep": {
      "version": "1.4.11",
      "resolved": "https://registry.npmjs.org/@mongodb-js/saslprep/-/saslprep-1.4.11.tgz",
      "integrity": "sha512-o9rAHc0IpIjuPSxRutWpE1F62x7n+4mVS4rCNHkzhIUMQcc18bb6xEq5wd2NdN0WjepIyXIppRshYI2kQDOZVA==",
      "license": "MIT",
      "dependencies": {
        "sparse-bitfield": "^3.0.3"
      }
    },
    "node_modules/@noble/ciphers": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@noble/ciphers/-/ciphers-2.2.0.tgz",
      "integrity": "sha512-Z6pjIZ/8IJcCGzb2S/0Px5J81yij85xASuk1teLNeg75bfT07MV3a/O2Mtn1I2se43k3lkVEcFaR10N4cgQcZA==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@noble/hashes": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@noble/hashes/-/hashes-2.2.0.tgz",
      "integrity": "sha512-IYqDGiTXab6FniAgnSdZwgWbomxpy9FtYvLKs7wCUs2a8RkITG+DFGO1DM9cr+E3/RgADRpFjrKVaJ1z6sjtEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 20.19.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      }
    },
    "node_modules/@opentelemetry/semantic-conventions": {
      "version": "1.41.1",
      "resolved": "https://registry.npmjs.org/@opentelemetry/semantic-conventions/-/semantic-conventions-1.41.1.tgz",
      "integrity": "sha512-/UhIkaZgPutTFmQ7RnIJGgDXZmtEJ7Dvi86xNTFWcnRxVRNk/aotsqDJYeEvDP+FSMB2SdW+pQzNMcWP0rwuNA==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@pinojs/redact": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/@pinojs/redact/-/redact-0.4.0.tgz",
      "integrity": "sha512-k2ENnmBugE/rzQfEcdWHcCY+/FM3VLzH9cYEsbdsoqrvzAKRhUZeRNhAZvB8OitQJ1TBed3yqWtdjzS6wJKBwg==",
      "license": "MIT"
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@types/body-parser": {
      "version": "1.19.6",
      "resolved": "https://registry.npmjs.org/@types/body-parser/-/body-parser-1.19.6.tgz",
      "integrity": "sha512-HLFeCYgz89uk22N5Qg3dvGvsv46B8GLvKKo1zKG4NybA8U2DiEO3w9lqGg29t/tfLRJpJ6iQxnVw4OnB7MoM9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/connect": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/connect": {
      "version": "3.4.38",
      "resolved": "https://registry.npmjs.org/@types/connect/-/connect-3.4.38.tgz",
      "integrity": "sha512-K6uROf1LD88uDQqJCktA4yzL1YYAK6NgfsI0v/mTgyPKWsX1CnJ0XPSDhViejru1GcRkLWb8RlzFYJRqGUbaug==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/cors": {
      "version": "2.8.19",
      "resolved": "https://registry.npmjs.org/@types/cors/-/cors-2.8.19.tgz",
      "integrity": "sha512-mFNylyeyqN93lfe/9CSxOGREz8cpzAhH+E93xJ4xWQf62V8sQ/24reV2nyzUWM6H6Xji+GGHpkbLe7pVoUEskg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/express": {
      "version": "5.0.6",
      "resolved": "https://registry.npmjs.org/@types/express/-/express-5.0.6.tgz",
      "integrity": "sha512-sKYVuV7Sv9fbPIt/442koC7+IIwK5olP1KWeD88e/idgoJqDm3JV/YUiPwkoKK92ylff2MGxSz1CSjsXelx0YA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/body-parser": "*",
        "@types/express-serve-static-core": "^5.0.0",
        "@types/serve-static": "^2"
      }
    },
    "node_modules/@types/express-serve-static-core": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/@types/express-serve-static-core/-/express-serve-static-core-5.1.1.tgz",
      "integrity": "sha512-v4zIMr/cX7/d2BpAEX3KNKL/JrT1s43s96lLvvdTmza1oEvDudCqK9aF/djc/SWgy8Yh0h30TZx5VpzqFCxk5A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*",
        "@types/qs": "*",
        "@types/range-parser": "*",
        "@types/send": "*"
      }
    },
    "node_modules/@types/http-errors": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@types/http-errors/-/http-errors-2.0.5.tgz",
      "integrity": "sha512-r8Tayk8HJnX0FztbZN7oVqGccWgw98T/0neJphO91KkmOzug1KkofZURD4UaD5uH8AqcFLfdPErnBod0u71/qg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/multer": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@types/multer/-/multer-2.1.0.tgz",
      "integrity": "sha512-zYZb0+nJhOHtPpGDb3vqPjwpdeGlGC157VpkqNQL+UU2qwoacoQ7MpsAmUptI/0Oa127X32JzWDqQVEXp2RcIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/express": "*"
      }
    },
    "node_modules/@types/node": {
      "version": "25.9.2",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-25.9.2.tgz",
      "integrity": "sha512-G05zqtJhcDLb8uslf5EjCxXg9G1KQxiV8OS0R26IC//Eoyitzqe8z37I7cqvnZlrlSfgocQRfSn/AHBZJJFyGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": ">=7.24.0 <7.24.7"
      }
    },
    "node_modules/@types/nodemailer": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/@types/nodemailer/-/nodemailer-8.0.0.tgz",
      "integrity": "sha512-fyf8jWULsCo0d0BuoQ75i6IeoHs47qcqxWc7yUdUcV0pOZGjUTTOvwdG1PRXUDqN/8A64yQdQdnA2pZgcdi+cA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/qs": {
      "version": "6.15.1",
      "resolved": "https://registry.npmjs.org/@types/qs/-/qs-6.15.1.tgz",
      "integrity": "sha512-GZHUBZR9hckSUhrxmp1nG6NwdpM9fCunJwyThLW1X3AyHgd9IlHb6VANpQQqDr2o/qQp6McZ3y/IA2rVzKzSbw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/range-parser": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/@types/range-parser/-/range-parser-1.2.7.tgz",
      "integrity": "sha512-hKormJbkJqzQGhziax5PItDUTMAM9uE2XXQmM37dyd4hVM+5aVl7oVxMVUiVQn2oCQFN/LKCZdvSM0pFRqbSmQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@types/send/-/send-1.2.1.tgz",
      "integrity": "sha512-arsCikDvlU99zl1g69TcAB3mzZPpxgw0UQnaHeC1Nwb015xp8bknZv5rIfri9xTOcMuaVgvabfIRA7PSZVuZIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/serve-static": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@types/serve-static/-/serve-static-2.2.0.tgz",
      "integrity": "sha512-8mam4H1NHLtu7nmtalF7eyBH14QyOASmcxHhSfEoRyr0nP/YdoesEtU+uSRvMe96TW/HPTtkoKqQLl53N7UXMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/http-errors": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/webidl-conversions": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/@types/webidl-conversions/-/webidl-conversions-7.0.3.tgz",
      "integrity": "sha512-CiJJvcRtIgzadHCYXw7dqEnMNRjhGZlYK05Mj9OyktqV8uVT8fD2BFOB7S1uwBE3Kj2Z+4UyPmFw/Ixgw/LAlA==",
      "license": "MIT"
    },
    "node_modules/@types/whatwg-url": {
      "version": "13.0.0",
      "resolved": "https://registry.npmjs.org/@types/whatwg-url/-/whatwg-url-13.0.0.tgz",
      "integrity": "sha512-N8WXpbE6Wgri7KUSvrmQcqrMllKZ9uxkYWMt+mCSGwNc0Hsw9VQTW7ApqI4XNrx6/SaM2QQJCzMPDEXE058s+Q==",
      "license": "MIT",
      "dependencies": {
        "@types/webidl-conversions": "*"
      }
    },
    "node_modules/accepts": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-2.0.0.tgz",
      "integrity": "sha512-5cvg6CtKwfgdmVqY1WIiXKc3Q1bkRqGLi+2W/6ao+6Y7gu/RCwRuAhGEzh5B4KlszSuTLgZYuqFqo5bImjNKng==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "^3.0.0",
        "negotiator": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/append-field": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/append-field/-/append-field-1.0.0.tgz",
      "integrity": "sha512-klpgFSWLW1ZEs8svjfb7g4qWY0YS5imI82dTg+QahUvJ8YqAY0P10Uk8tTyh9ZGuYEZEMaeJYCF5BFuX552hsw==",
      "license": "MIT"
    },
    "node_modules/atomic-sleep": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/atomic-sleep/-/atomic-sleep-1.0.0.tgz",
      "integrity": "sha512-kNOjDqAh7px0XWNI+4QbzoiR/nTkHAWNud2uvnJquD1/x5a7EQZMJT0AczqK0Qn67oY/TTQ1LbUKajZpp3I9tQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/better-auth": {
      "version": "1.6.16",
      "resolved": "https://registry.npmjs.org/better-auth/-/better-auth-1.6.16.tgz",
      "integrity": "sha512-YlBITnH3LIBRD+JpR1XRIToJAVVpoQvZzRc4sm5W0/bnPZKLbsmtXbVWJF3ypo9TVnF6geczJKprG/CsWT07Wg==",
      "license": "MIT",
      "dependencies": {
        "@better-auth/core": "1.6.16",
        "@better-auth/drizzle-adapter": "1.6.16",
        "@better-auth/kysely-adapter": "1.6.16",
        "@better-auth/memory-adapter": "1.6.16",
        "@better-auth/mongo-adapter": "1.6.16",
        "@better-auth/prisma-adapter": "1.6.16",
        "@better-auth/telemetry": "1.6.16",
        "@better-auth/utils": "0.4.1",
        "@better-fetch/fetch": "1.2.2",
        "@noble/ciphers": "^2.1.1",
        "@noble/hashes": "^2.0.1",
        "better-call": "1.3.6",
        "defu": "^6.1.4",
        "jose": "^6.1.3",
        "kysely": "^0.28.17 || ^0.29.0",
        "nanostores": "^1.1.1",
        "zod": "^4.3.6"
      },
      "peerDependencies": {
        "@lynx-js/react": "*",
        "@prisma/client": "^5.0.0 || ^6.0.0 || ^7.0.0",
        "@sveltejs/kit": "^2.0.0",
        "@tanstack/react-start": "^1.0.0",
        "@tanstack/solid-start": "^1.0.0",
        "better-sqlite3": "^12.0.0",
        "drizzle-kit": ">=0.31.4",
        "drizzle-orm": "^0.45.2",
        "mongodb": "^6.0.0 || ^7.0.0",
        "mysql2": "^3.0.0",
        "next": "^14.0.0 || ^15.0.0 || ^16.0.0",
        "pg": "^8.0.0",
        "prisma": "^5.0.0 || ^6.0.0 || ^7.0.0",
        "react": "^18.0.0 || ^19.0.0",
        "react-dom": "^18.0.0 || ^19.0.0",
        "solid-js": "^1.0.0",
        "svelte": "^4.0.0 || ^5.0.0",
        "vitest": "^2.0.0 || ^3.0.0 || ^4.0.0",
        "vue": "^3.0.0"
      },
      "peerDependenciesMeta": {
        "@lynx-js/react": {
          "optional": true
        },
        "@prisma/client": {
          "optional": true
        },
        "@sveltejs/kit": {
          "optional": true
        },
        "@tanstack/react-start": {
          "optional": true
        },
        "@tanstack/solid-start": {
          "optional": true
        },
        "better-sqlite3": {
          "optional": true
        },
        "drizzle-kit": {
          "optional": true
        },
        "drizzle-orm": {
          "optional": true
        },
        "mongodb": {
          "optional": true
        },
        "mysql2": {
          "optional": true
        },
        "next": {
          "optional": true
        },
        "pg": {
          "optional": true
        },
        "prisma": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "react-dom": {
          "optional": true
        },
        "solid-js": {
          "optional": true
        },
        "svelte": {
          "optional": true
        },
        "vitest": {
          "optional": true
        },
        "vue": {
          "optional": true
        }
      }
    },
    "node_modules/better-call": {
      "version": "1.3.6",
      "resolved": "https://registry.npmjs.org/better-call/-/better-call-1.3.6.tgz",
      "integrity": "sha512-no1jI+h6Bkxs1NVBo4rONbVIzsPjZ8IUu7IHaJBiFwVX1XEQGN8KpHots5fSWmXe9nNyLuLIcgx6WEUcE6EDaA==",
      "license": "MIT",
      "dependencies": {
        "@better-auth/utils": "^0.4.0",
        "@better-fetch/fetch": "^1.1.21",
        "rou3": "^0.7.12",
        "set-cookie-parser": "^3.0.1"
      },
      "peerDependencies": {
        "zod": "^4.0.0"
      },
      "peerDependenciesMeta": {
        "zod": {
          "optional": true
        }
      }
    },
    "node_modules/body-parser": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-2.2.2.tgz",
      "integrity": "sha512-oP5VkATKlNwcgvxi0vM0p/D3n2C3EReYVX+DNYs5TjZFn/oQt2j+4sVJtSMr18pdRr8wjTcBl6LoV+FUwzPmNA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "^3.1.2",
        "content-type": "^1.0.5",
        "debug": "^4.4.3",
        "http-errors": "^2.0.0",
        "iconv-lite": "^0.7.0",
        "on-finished": "^2.4.1",
        "qs": "^6.14.1",
        "raw-body": "^3.0.1",
        "type-is": "^2.0.1"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/bson": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/bson/-/bson-7.2.0.tgz",
      "integrity": "sha512-YCEo7KjMlbNlyHhz7zAZNDpIpQbd+wOEHJYezv0nMYTn4x31eIUM2yomNNubclAt63dObUzKHWsBLJ9QcZNSnQ==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/buffer-from/-/buffer-from-1.1.2.tgz",
      "integrity": "sha512-E+XQCRwSbaaiChtv6k6Dwgc+bx+Bs6vuKJHHl5kox/BaKbhiXzqQOwK4cO22yElGp2OCmjwVhT3HmxgyPGnJfQ==",
      "license": "MIT"
    },
    "node_modules/busboy": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/busboy/-/busboy-1.6.0.tgz",
      "integrity": "sha512-8SFQbg/0hQ9xy3UNTB0YEnsNBbWfhf7RtnzpL7TkBiTBRfrQ9Fxcnz7VJsleJpyp6rVLvXiuORqjlHi5q+PYuA==",
      "dependencies": {
        "streamsearch": "^1.1.0"
      },
      "engines": {
        "node": ">=10.16.0"
      }
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/concat-stream": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/concat-stream/-/concat-stream-2.0.0.tgz",
      "integrity": "sha512-MWufYdFw53ccGjCA+Ol7XJYpAlW6/prSMzuPOTRnJGcGzuhLn4Scrz7qf6o8bROZ514ltazcIFJZevcfbo0x7A==",
      "engines": [
        "node >= 6.0"
      ],
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "inherits": "^2.0.3",
        "readable-stream": "^3.0.2",
        "typedarray": "^0.0.6"
      }
    },
    "node_modules/content-disposition": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-1.1.0.tgz",
      "integrity": "sha512-5jRCH9Z/+DRP7rkvY83B+yGIGX96OYdJmzngqnw2SBSxqCFPd0w2km3s5iawpGX8krnwSGmF0FW5Nhr0Hfai3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.2.2.tgz",
      "integrity": "sha512-D76uU73ulSXrD1UXF4KE2TMxVVwhsnCgfAyTg9k8P6KGZjlXKrOLe4dJQKI3Bxi5wjesZoFXJWElNWBjPZMbhg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.6.0"
      }
    },
    "node_modules/cors": {
      "version": "2.8.6",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.6.tgz",
      "integrity": "sha512-tJtZBBHA6vjIAaF6EnIaq6laBBP9aq/Y3ouVJjEfoHbRBcHBAHYcMh/w8LDrk2PvIMMq8gmopa5D4V8RmbrxGw==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/defu": {
      "version": "6.1.7",
      "resolved": "https://registry.npmjs.org/defu/-/defu-6.1.7.tgz",
      "integrity": "sha512-7z22QmUWiQ/2d0KkdYmANbRUVABpZ9SNYyH5vx6PZ+nE5bcC0l7uFvEfHlyld/HcGBFTL536ClDt3DEcSlEJAQ==",
      "license": "MIT"
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/dotenv": {
      "version": "17.4.2",
      "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-17.4.2.tgz",
      "integrity": "sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://dotenvx.com"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/esbuild": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.0.tgz",
      "integrity": "sha512-sNR9MHpXSUV/XB4zmsFKN+QgVG82Cc7+/aaxJ8Adi8hyOac+EXptIp45QBPaVyX3N70664wRbTcLTOemCAnyqw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.28.0",
        "@esbuild/android-arm": "0.28.0",
        "@esbuild/android-arm64": "0.28.0",
        "@esbuild/android-x64": "0.28.0",
        "@esbuild/darwin-arm64": "0.28.0",
        "@esbuild/darwin-x64": "0.28.0",
        "@esbuild/freebsd-arm64": "0.28.0",
        "@esbuild/freebsd-x64": "0.28.0",
        "@esbuild/linux-arm": "0.28.0",
        "@esbuild/linux-arm64": "0.28.0",
        "@esbuild/linux-ia32": "0.28.0",
        "@esbuild/linux-loong64": "0.28.0",
        "@esbuild/linux-mips64el": "0.28.0",
        "@esbuild/linux-ppc64": "0.28.0",
        "@esbuild/linux-riscv64": "0.28.0",
        "@esbuild/linux-s390x": "0.28.0",
        "@esbuild/linux-x64": "0.28.0",
        "@esbuild/netbsd-arm64": "0.28.0",
        "@esbuild/netbsd-x64": "0.28.0",
        "@esbuild/openbsd-arm64": "0.28.0",
        "@esbuild/openbsd-x64": "0.28.0",
        "@esbuild/openharmony-arm64": "0.28.0",
        "@esbuild/sunos-x64": "0.28.0",
        "@esbuild/win32-arm64": "0.28.0",
        "@esbuild/win32-ia32": "0.28.0",
        "@esbuild/win32-x64": "0.28.0"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/express": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/express/-/express-5.2.1.tgz",
      "integrity": "sha512-hIS4idWWai69NezIdRt2xFVofaF4j+6INOpJlVOLDO8zXGpUVEVzIYk12UUi2JzjEzWL3IOAxcTubgz9Po0yXw==",
      "license": "MIT",
      "dependencies": {
        "accepts": "^2.0.0",
        "body-parser": "^2.2.1",
        "content-disposition": "^1.0.0",
        "content-type": "^1.0.5",
        "cookie": "^0.7.1",
        "cookie-signature": "^1.2.1",
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "finalhandler": "^2.1.0",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.0",
        "merge-descriptors": "^2.0.0",
        "mime-types": "^3.0.0",
        "on-finished": "^2.4.1",
        "once": "^1.4.0",
        "parseurl": "^1.3.3",
        "proxy-addr": "^2.0.7",
        "qs": "^6.14.0",
        "range-parser": "^1.2.1",
        "router": "^2.2.0",
        "send": "^1.1.0",
        "serve-static": "^2.2.0",
        "statuses": "^2.0.1",
        "type-is": "^2.0.1",
        "vary": "^1.1.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/finalhandler": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-2.1.1.tgz",
      "integrity": "sha512-S8KoZgRZN+a5rNwqTxlZZePjT/4cnm0ROV70LedRHZ0p8u9fRID0hJUZQpkKLzro8LfmC8sx23bY6tVNxv8pQA==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "on-finished": "^2.4.1",
        "parseurl": "^1.3.3",
        "statuses": "^2.0.1"
      },
      "engines": {
        "node": ">= 18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-2.0.0.tgz",
      "integrity": "sha512-Rx/WycZ60HOaqLKAi6cHRKKI7zxWbJ31MhntmtwMoaTeF7XFH9hhBp8vITaMidfljRQ6eYWCKkaTK+ykVJHP2A==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/helmet": {
      "version": "8.2.0",
      "resolved": "https://registry.npmjs.org/helmet/-/helmet-8.2.0.tgz",
      "integrity": "sha512-DRgTIUgnWcJ62KyarxxziuqYxKGnR6Rgg19BlbucN/dpmJbl1XOit6qvoOX0ZT+HhWe5OUVhU/a1zpGyc1xA0Q==",
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/EvanHahn"
      }
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.2.tgz",
      "integrity": "sha512-im9DjEDQ55s9fL4EYzOAv0yMqmMBSZp6G0VvFyTMPKWxiSBHUj9NW/qqLmXUwXrrM7AvqSlTCfvqRb0cM8yYqw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-promise": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/is-promise/-/is-promise-4.0.0.tgz",
      "integrity": "sha512-hvpoI6korhJMnej285dSg6nu1+e6uxs7zG3BYAm5byqDsgJNWwxzM6z6iZiAgQR4TJ30JmBTOwqZUw3WlyH3AQ==",
      "license": "MIT"
    },
    "node_modules/jose": {
      "version": "6.2.3",
      "resolved": "https://registry.npmjs.org/jose/-/jose-6.2.3.tgz",
      "integrity": "sha512-YYVDInQKFJfR/xa3ojUTl8c2KoTwiL1R5Wg9YCydwH0x0B9grbzlg5HC7mMjCtUJjbQ/YnGEZIhI5tCgfTb4Hw==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/kareem": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/kareem/-/kareem-3.3.0.tgz",
      "integrity": "sha512-kpSuLD3/7RenBnjnJdOHXCKC8dTd1JzeOiJhN0necWWci6cC+qX+VuwPnMVgb+a4+KNJSfgqahpnfWaeDXCimw==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/kysely": {
      "version": "0.29.2",
      "resolved": "https://registry.npmjs.org/kysely/-/kysely-0.29.2.tgz",
      "integrity": "sha512-s6WVJyEZrbm6jhBpiKHsGHyePMrVQKJ85wZCFCr9W4QHv6WTjWIrdvTmO9hDEA3bNK0xkrE2DqrHsXMLWuZpQg==",
      "license": "MIT",
      "engines": {
        "node": ">=22.0.0"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-1.1.0.tgz",
      "integrity": "sha512-aisnrDP4GNe06UcKFnV5bfMNPBUw4jsLGaWwWfnH3v02GnBuXX2MCVn5RbrWo0j3pczUilYblq7fQ7Nw2t5XKw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/memory-pager": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/memory-pager/-/memory-pager-1.5.0.tgz",
      "integrity": "sha512-ZS4Bp4r/Zoeq6+NLJpP+0Zzm0pR8whtGPf1XExKLJBAczGMnSi3It14OiNCStjQjM6NU1okjQGSxgEZN8eBYKg==",
      "license": "MIT"
    },
    "node_modules/merge-descriptors": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-2.0.0.tgz",
      "integrity": "sha512-Snk314V5ayFLhp3fkUREub6WtjBfPdCPY1Ln8/8munuLuiYhsABgBVWsozAG+MWMbVEvcdcpbi9R7ww22l9Q3g==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mime-db": {
      "version": "1.54.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.54.0.tgz",
      "integrity": "sha512-aU5EJuIN2WDemCcAp2vFBfp/m4EAhWJnUNSSw0ixs7/kXbd6Pg64EmwJkNdFhB8aWt1sH2CTXrLxo/iAGV3oPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-3.0.2.tgz",
      "integrity": "sha512-Lbgzdk0h4juoQ9fCKXW4by0UJqj+nOOrI9MJ1sSj4nI8aI2eo1qmvQEie4VD1glsS250n15LsWsYtCugiStS5A==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "^1.54.0"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/mongodb": {
      "version": "7.3.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-7.3.0.tgz",
      "integrity": "sha512-WpCqSx7JAU9vcyjm/SU7ydnHls2YrfU3Y3sx4Ml9D7sPe4mXPlaapndiurDXrQ7/VvJkB4/i7b7WovHb8bd8sg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.3.0",
        "bson": "^7.2.0",
        "mongodb-connection-string-url": "^7.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.806.0",
        "@mongodb-js/zstd": "^7.0.0",
        "gcp-metadata": "^7.0.1",
        "kerberos": "^7.0.0",
        "mongodb-client-encryption": ">=7.0.0 <7.1.0",
        "snappy": "^7.3.2",
        "socks": "^2.8.6"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mongodb-connection-string-url": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/mongodb-connection-string-url/-/mongodb-connection-string-url-7.0.1.tgz",
      "integrity": "sha512-h0AZ9A7IDVwwHyMxmdMXKy+9oNlF0zFoahHiX3vQ8e3KFcSP3VmsmfvtRSuLPxmyv2vjIDxqty8smTgie/SNRQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@types/whatwg-url": "^13.0.0",
        "whatwg-url": "^14.1.0"
      },
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/mongoose": {
      "version": "9.7.0",
      "resolved": "https://registry.npmjs.org/mongoose/-/mongoose-9.7.0.tgz",
      "integrity": "sha512-pkrLZ6U41pD4Ai0ju/FYL7o5I5k+rV3RZINQTG937hbhnLGKRuqqYm1Dlt/kTQ+M4FHijzV6JawzsdHKRGt7QA==",
      "license": "MIT",
      "dependencies": {
        "kareem": "3.3.0",
        "mongodb": "~7.2",
        "mpath": "0.9.0",
        "mquery": "6.0.0",
        "ms": "2.1.3",
        "sift": "17.1.3"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mongoose"
      }
    },
    "node_modules/mongoose/node_modules/mongodb": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/mongodb/-/mongodb-7.2.0.tgz",
      "integrity": "sha512-F/2+BMZtLVhY30ioZp0dAmZ+IRZMBqI+nrv6t5+9/1AIwCa8sMRC3jBf81lpxMhnZgqq8CoUD503Z1oZWq1/sw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@mongodb-js/saslprep": "^1.3.0",
        "bson": "^7.2.0",
        "mongodb-connection-string-url": "^7.0.0"
      },
      "engines": {
        "node": ">=20.19.0"
      },
      "peerDependencies": {
        "@aws-sdk/credential-providers": "^3.806.0",
        "@mongodb-js/zstd": "^7.0.0",
        "gcp-metadata": "^7.0.1",
        "kerberos": "^7.0.0",
        "mongodb-client-encryption": ">=7.0.0 <7.1.0",
        "snappy": "^7.3.2",
        "socks": "^2.8.6"
      },
      "peerDependenciesMeta": {
        "@aws-sdk/credential-providers": {
          "optional": true
        },
        "@mongodb-js/zstd": {
          "optional": true
        },
        "gcp-metadata": {
          "optional": true
        },
        "kerberos": {
          "optional": true
        },
        "mongodb-client-encryption": {
          "optional": true
        },
        "snappy": {
          "optional": true
        },
        "socks": {
          "optional": true
        }
      }
    },
    "node_modules/mpath": {
      "version": "0.9.0",
      "resolved": "https://registry.npmjs.org/mpath/-/mpath-0.9.0.tgz",
      "integrity": "sha512-ikJRQTk8hw5DEoFVxHG1Gn9T/xcjtdnOKIU1JTmGjZZlg9LST2mBLmcX3/ICIbgJydT2GOc15RnNy5mHmzfSew==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/mquery": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/mquery/-/mquery-6.0.0.tgz",
      "integrity": "sha512-b2KQNsmgtkscfeDgkYMcWGn9vZI9YoXh802VDEwE6qc50zxBFQ0Oo8ROkawbPAsXCY1/Z1yp0MagqsZStPWJjw==",
      "license": "MIT",
      "engines": {
        "node": ">=20.19.0"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/multer": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/multer/-/multer-2.1.1.tgz",
      "integrity": "sha512-mo+QTzKlx8R7E5ylSXxWzGoXoZbOsRMpyitcht8By2KHvMbf3tjwosZ/Mu/XYU6UuJ3VZnODIrak5ZrPiPyB6A==",
      "license": "MIT",
      "dependencies": {
        "append-field": "^1.0.0",
        "busboy": "^1.6.0",
        "concat-stream": "^2.0.0",
        "type-is": "^1.6.18"
      },
      "engines": {
        "node": ">= 10.16.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/multer/node_modules/media-typer": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/multer/node_modules/type-is": {
      "version": "1.6.18",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
      "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
      "license": "MIT",
      "dependencies": {
        "media-typer": "0.3.0",
        "mime-types": "~2.1.24"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/nanostores": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/nanostores/-/nanostores-1.3.0.tgz",
      "integrity": "sha512-XPUa/jz+P1oJvN9VBxw4L9MtdFfaH3DAryqPssqhb2kXjmb9npz0dly6rCsgFWOPr4Yg9mTfM3MDZgZZ+7A3lA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": "^20.0.0 || >=22.0.0"
      }
    },
    "node_modules/negotiator": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-1.0.0.tgz",
      "integrity": "sha512-8Ofs/AUQh8MaEcrlq5xOX0CQ9ypTF5dl78mjlMNfOK08fzpgTHQRQPBxcPlEtIw0yRpws+Zo/3r+5WRby7u3Gg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/nodemailer": {
      "version": "8.0.10",
      "resolved": "https://registry.npmjs.org/nodemailer/-/nodemailer-8.0.10.tgz",
      "integrity": "sha512-BLFuSth7QtHOkBzyqTehWWyub0NTRDuK2Q2SQfnGLsrJnzyU+Yeh4WpV1eZGuARFj1xQJHIdnTuJZLP+b9R1GQ==",
      "license": "MIT-0",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-exit-leak-free": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/on-exit-leak-free/-/on-exit-leak-free-2.1.2.tgz",
      "integrity": "sha512-0eJJY6hXLGf1udHwfNftBqH+g73EU4B504nZeKpz1sYRKafAghwxEJunB2O7rDZkL4PGfsMVnTXZ2EjibbqcsA==",
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "8.4.2",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/pino": {
      "version": "10.3.1",
      "resolved": "https://registry.npmjs.org/pino/-/pino-10.3.1.tgz",
      "integrity": "sha512-r34yH/GlQpKZbU1BvFFqOjhISRo1MNx1tWYsYvmj6KIRHSPMT2+yHOEb1SG6NMvRoHRF0a07kCOox/9yakl1vg==",
      "license": "MIT",
      "dependencies": {
        "@pinojs/redact": "^0.4.0",
        "atomic-sleep": "^1.0.0",
        "on-exit-leak-free": "^2.1.0",
        "pino-abstract-transport": "^3.0.0",
        "pino-std-serializers": "^7.0.0",
        "process-warning": "^5.0.0",
        "quick-format-unescaped": "^4.0.3",
        "real-require": "^0.2.0",
        "safe-stable-stringify": "^2.3.1",
        "sonic-boom": "^4.0.1",
        "thread-stream": "^4.0.0"
      },
      "bin": {
        "pino": "bin.js"
      }
    },
    "node_modules/pino-abstract-transport": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/pino-abstract-transport/-/pino-abstract-transport-3.0.0.tgz",
      "integrity": "sha512-wlfUczU+n7Hy/Ha5j9a/gZNy7We5+cXp8YL+X+PG8S0KXxw7n/JXA3c46Y0zQznIJ83URJiwy7Lh56WLokNuxg==",
      "license": "MIT",
      "dependencies": {
        "split2": "^4.0.0"
      }
    },
    "node_modules/pino-http": {
      "version": "11.0.0",
      "resolved": "https://registry.npmjs.org/pino-http/-/pino-http-11.0.0.tgz",
      "integrity": "sha512-wqg5XIAGRRIWtTk8qPGxkbrfiwEWz1lgedVLvhLALudKXvg1/L2lTFgTGPJ4Z2e3qcRmxoFxDuSdMdMGNM6I1g==",
      "license": "MIT",
      "dependencies": {
        "get-caller-file": "^2.0.5",
        "pino": "^10.0.0",
        "pino-std-serializers": "^7.0.0",
        "process-warning": "^5.0.0"
      }
    },
    "node_modules/pino-std-serializers": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/pino-std-serializers/-/pino-std-serializers-7.1.0.tgz",
      "integrity": "sha512-BndPH67/JxGExRgiX1dX0w1FvZck5Wa4aal9198SrRhZjH3GxKQUKIBnYJTdj2HDN3UQAS06HlfcSbQj2OHmaw==",
      "license": "MIT"
    },
    "node_modules/process-warning": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/process-warning/-/process-warning-5.0.0.tgz",
      "integrity": "sha512-a39t9ApHNx2L4+HBnQKqxxHNs1r7KF+Intd8Q/g1bUh6q0WIp9voPXJ/x0j+ZL45KF1pJd9+q2jLIRMfvEshkA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fastify"
        },
        {
          "type": "opencollective",
          "url": "https://opencollective.com/fastify"
        }
      ],
      "license": "MIT"
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qs": {
      "version": "6.15.2",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.15.2.tgz",
      "integrity": "sha512-Rzq0KEyX/w/tEybncDgdkZrJgVUsUMk3xjh3t5bv3S1HTAtg+uOYt72+ZfwiQwKdysThkTBdL/rTi6HDmX9Ddw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/quick-format-unescaped": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/quick-format-unescaped/-/quick-format-unescaped-4.0.4.tgz",
      "integrity": "sha512-tYC1Q1hgyRuHgloV/YXs2w15unPVh8qfu/qCTfhTYamaw7fyhumKa2yGpdSo87vY32rIclj+4fWYQXUMs9EHvg==",
      "license": "MIT"
    },
    "node_modules/range-parser": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/raw-body": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-3.0.2.tgz",
      "integrity": "sha512-K5zQjDllxWkf7Z5xJdV0/B0WTNqx6vxG70zJE4N0kBs4LovmEYWJzQGxC9bS9RAKu3bgM40lrd5zoLJ12MQ5BA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.7.0",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/real-require": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/real-require/-/real-require-0.2.0.tgz",
      "integrity": "sha512-57frrGM/OCTLqLOAh0mhVA9VBMHd+9U7Zb2THMGdBUoZVOtGbJzjxsYGDJ3A9AYYCP4hn6y1TVbaOfzWtm5GFg==",
      "license": "MIT",
      "engines": {
        "node": ">= 12.13.0"
      }
    },
    "node_modules/rou3": {
      "version": "0.7.12",
      "resolved": "https://registry.npmjs.org/rou3/-/rou3-0.7.12.tgz",
      "integrity": "sha512-iFE4hLDuloSWcD7mjdCDhx2bKcIsYbtOTpfH5MHHLSKMOUyjqQXTeZVa289uuwEGEKFoE/BAPbhaU4B774nceg==",
      "license": "MIT"
    },
    "node_modules/router": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/router/-/router-2.2.0.tgz",
      "integrity": "sha512-nLTrUKm2UyiL7rlhapu/Zl45FwNgkZGaCpZbIHajDYgwlJCOzLSk+cIPAnsEqV955GjILJnKbdQC1nVPz+gAYQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.0",
        "depd": "^2.0.0",
        "is-promise": "^4.0.0",
        "parseurl": "^1.3.3",
        "path-to-regexp": "^8.0.0"
      },
      "engines": {
        "node": ">= 18"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safe-stable-stringify": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/safe-stable-stringify/-/safe-stable-stringify-2.5.0.tgz",
      "integrity": "sha512-b3rppTKm9T+PsVCBEOUR46GWI7fdOs00VKZ1+9c1EWDaDMvjQc6tUwuFyIprgGgTcWoVHSKrU8H31ZHA2e0RHA==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/send/-/send-1.2.1.tgz",
      "integrity": "sha512-1gnZf7DFcoIcajTjTwjwuDjzuz4PPcY2StKPlsGAQ1+YH20IRVrBaXSWmdjowTJ6u8Rc01PoYOGHXfP1mYcZNQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "^4.4.3",
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "etag": "^1.8.1",
        "fresh": "^2.0.0",
        "http-errors": "^2.0.1",
        "mime-types": "^3.0.2",
        "ms": "^2.1.3",
        "on-finished": "^2.4.1",
        "range-parser": "^1.2.1",
        "statuses": "^2.0.2"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/serve-static": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-2.2.1.tgz",
      "integrity": "sha512-xRXBn0pPqQTVQiC8wyQrKs2MOlX24zQ0POGaj0kultvoOCstBQM5yvOhAVSUwOMjQtTvsPWoNCHfPGwaaQJhTw==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "^2.0.0",
        "escape-html": "^1.0.3",
        "parseurl": "^1.3.3",
        "send": "^1.2.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/set-cookie-parser": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-3.1.0.tgz",
      "integrity": "sha512-kjnC1DXBHcxaOaOXBHBeRtltsDG2nUiUni+jP92M9gYdW12rsmx92UsfpH7o5tDRs7I1ZZPSQJQGv3UaRfCiuw==",
      "license": "MIT"
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sift": {
      "version": "17.1.3",
      "resolved": "https://registry.npmjs.org/sift/-/sift-17.1.3.tgz",
      "integrity": "sha512-Rtlj66/b0ICeFzYTuNvX/EF1igRbbnGSvEyT79McoZa/DeGhMyC5pWKOEsZKnpkqtSeovd5FL/bjHWC3CIIvCQ==",
      "license": "MIT"
    },
    "node_modules/slugify": {
      "version": "1.6.9",
      "resolved": "https://registry.npmjs.org/slugify/-/slugify-1.6.9.tgz",
      "integrity": "sha512-vZ7rfeehZui7wQs438JXBckYLkIIdfHOXsaVEUMyS5fHo1483l1bMdo0EDSWYclY0yZKFOipDy4KHuKs6ssvdg==",
      "license": "MIT",
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/sonic-boom": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/sonic-boom/-/sonic-boom-4.2.1.tgz",
      "integrity": "sha512-w6AxtubXa2wTXAUsZMMWERrsIRAdrK0Sc+FUytWvYAhBJLyuI4llrMIC1DtlNSdI99EI86KZum2MMq3EAZlF9Q==",
      "license": "MIT",
      "dependencies": {
        "atomic-sleep": "^1.0.0"
      }
    },
    "node_modules/sparse-bitfield": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/sparse-bitfield/-/sparse-bitfield-3.0.3.tgz",
      "integrity": "sha512-kvzhi7vqKTfkh0PZU+2D2PIllw2ymqJKujUcyPMd9Y75Nv4nPbGJZXNhxsgdQab2BmlDct1YnfQCguEvHr7VsQ==",
      "license": "MIT",
      "dependencies": {
        "memory-pager": "^1.0.2"
      }
    },
    "node_modules/split2": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/split2/-/split2-4.2.0.tgz",
      "integrity": "sha512-UcjcJOWknrNkF6PLX83qcHM6KHgVKNkV62Y8a5uYDVv9ydGQVwAHMKqHdJje1VTWpljG0WYpCDhrCdAOYH4TWg==",
      "license": "ISC",
      "engines": {
        "node": ">= 10.x"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/streamsearch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/streamsearch/-/streamsearch-1.1.0.tgz",
      "integrity": "sha512-Mcc5wHehp9aXz1ax6bZUyY5afg9u2rv5cqQI3mRrYkGC8rW2hM02jWuwjtL++LS5qinSyhj2QfLyNsuc+VsExg==",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/thread-stream": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/thread-stream/-/thread-stream-4.2.0.tgz",
      "integrity": "sha512-e2zZ96wSChazBsbENf/Pcm/4swHt2cEKQ92rhUjkL9GCKiTDJIaTBenjE/m9DXi0QBmTMDkFDdOomUy20A1tDQ==",
      "license": "MIT",
      "dependencies": {
        "real-require": "^1.0.0"
      },
      "engines": {
        "node": ">=20"
      }
    },
    "node_modules/thread-stream/node_modules/real-require": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/real-require/-/real-require-1.0.0.tgz",
      "integrity": "sha512-P4nbQYQfePJxRSmY+v/KINxVucm4NF3p3s7pJveMTtom52FR4YGltUQLB8idDXwDDWW+eYrWDFbuzUnjoWHF7g==",
      "license": "MIT"
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/tr46": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-5.1.1.tgz",
      "integrity": "sha512-hdF5ZgjTqgAntKkklYw0R03MG2x/bSzTtkxmIRw/sTNV8YXsCJ1tfLAX23lhxhHJlEf3CRCOCGGWw3vI3GaSPw==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^2.3.1"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/tsx": {
      "version": "4.22.4",
      "resolved": "https://registry.npmjs.org/tsx/-/tsx-4.22.4.tgz",
      "integrity": "sha512-X8EX+XV4QR5xCsrgxaED954zTDfY8KqlDtskKEL0cHhyS/P8b4IFOvGDQpsC9Q1XnLq915wEfwwY/zzskCtmhg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "~0.28.0"
      },
      "bin": {
        "tsx": "dist/cli.mjs"
      },
      "engines": {
        "node": ">=18.0.0"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      }
    },
    "node_modules/type-is": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-2.1.0.tgz",
      "integrity": "sha512-faYHw0anBbc/kWF3zFTEnxSFOAGUX9GFbOBthvDdLsIlEoWOFOtS0zgCiQYwIskL9iGXZL3kAXD8OoZ4GmMATA==",
      "license": "MIT",
      "dependencies": {
        "content-type": "^2.0.0",
        "media-typer": "^1.1.0",
        "mime-types": "^3.0.0"
      },
      "engines": {
        "node": ">= 18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/type-is/node_modules/content-type": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-2.0.0.tgz",
      "integrity": "sha512-j/O/d7GcZCyNl7/hwZAb606rzqkyvaDctLmckbxLzHvFBzTJHuGEdodATcP3yIRoDrLHkIATJuvzbFlp/ki2cQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/typedarray": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/typedarray/-/typedarray-0.0.6.tgz",
      "integrity": "sha512-/aCDEGatGvZ2BIk+HmLf4ifCJFwvKFNb9/JeZPMulfgFracn9QFcAf5GO8B/mweUjSoblS5In0cWhqpfs/5PQA==",
      "license": "MIT"
    },
    "node_modules/typescript": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-6.0.3.tgz",
      "integrity": "sha512-y2TvuxSZPDyQakkFRPZHKFm+KKVqIisdg9/CZwm9ftvKXLP8NRWj38/ODjNbr43SsoXqNuAisEf1GdCxqWcdBw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/undici-types": {
      "version": "7.24.6",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-7.24.6.tgz",
      "integrity": "sha512-WRNW+sJgj5OBN4/0JpHFqtqzhpbnV0GuB+OozA9gCL7a993SmU+1JBZCzLNxYsbMfIeDL+lTsphD5jN5N+n0zg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/whatwg-url": {
      "version": "14.2.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-14.2.0.tgz",
      "integrity": "sha512-De72GdQZzNTUBBChsXueQUnPKDkg/5A5zp7pFDuQAj5UFoENpiACU0wlCvzpAGnTkj++ihpKwKyYewn/XNUbKw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "^5.1.0",
        "webidl-conversions": "^7.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC"
    },
    "node_modules/zod": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.4.3.tgz",
      "integrity": "sha512-ytENFjIJFl2UwYglde2jchW2Hwm4GJFLDiSXWdTrJQBIN9Fcyp7n4DhxJEiWNAJMV1/BqWfW/kkg71UDcHJyTQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    }
  }
}

```


---
## FILE: package.json

```json
{
  "name": "feriwala-server",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "tsc -p tsconfig.json --noEmit",
    "admin:add": "tsx src/scripts/addAdmin.ts",
    "admin:delete": "tsx src/scripts/deleteAdmin.ts",
    "db:seed": "tsx src/scripts/seed.ts",
    "db:cleanup": "tsx src/scripts/cleanup.ts"
  },
  "dependencies": {
    "better-auth": "^1.6.16",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "helmet": "^8.2.0",
    "mongodb": "^7.3.0",
    "mongoose": "^9.7.0",
    "multer": "^2.1.1",
    "nodemailer": "^8.0.10",
    "pino": "^10.3.1",
    "pino-http": "^11.0.0",
    "slugify": "^1.6.9",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/multer": "^2.1.0",
    "@types/node": "^25.9.2",
    "@types/nodemailer": "^8.0.0",
    "tsx": "^4.22.4",
    "typescript": "^6.0.3"
  }
}

```


---
## FILE: src/app.ts

```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import v1Router from './routes/v1';
import { CORS_ORIGINS, ENV } from './config/environment';
import { httpLogger } from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { auth } from './lib/auth';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true
  })
);

app.use(httpLogger);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(`/${ENV.UPLOAD_DIR}`, express.static(path.join(process.cwd(), ENV.UPLOAD_DIR)));

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.all(/\/api\/auth\/.*/, async (req, res) => {
  // Better Auth's handler expects a standard Web Request object
  const webReq = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const response = await auth.handler(webReq);
  
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.text();
  res.status(response.status).send(body);
});

app.use('/api/v1', v1Router);
app.use(notFound);
app.use(errorHandler);

export default app;


```


---
## FILE: src/config/db.ts

```ts
import mongoose from 'mongoose';
import { ENV } from './environment';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }
};

```


---
## FILE: src/config/environment.ts

```ts
import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: parseNumber(process.env.PORT, 3000),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  CLIENT_FRONTEND_URL: process.env.CLIENT_FRONTEND_URL?.trim() || 'http://localhost:3000',
  ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL?.trim() || 'http://localhost:3001',
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: requireEnv('BETTER_AUTH_URL'),
  EMAIL_HOST: requireEnv('EMAIL_HOST'),
  EMAIL_PORT: parseNumber(process.env.EMAIL_PORT, 587),
  EMAIL_USER: requireEnv('EMAIL_USER'),
  EMAIL_PASS: requireEnv('EMAIL_PASS'),
  EMAIL_FROM: requireEnv('EMAIL_FROM'),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR?.trim() || 'uploads'
};

export const CORS_ORIGINS = [ENV.CLIENT_FRONTEND_URL, ENV.ADMIN_FRONTEND_URL].filter(Boolean);

```


---
## FILE: src/config/logger.ts

```ts
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ENV } from './environment';

export const logger = pino({
  level: ENV.NODE_ENV === 'production' ? 'info' : 'debug'
});

export const httpLogger = pinoHttp({
  logger
});

```


---
## FILE: src/controllers/adminController.ts

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { buildAnalyticsSummary } from '../services/analyticsService';
import { ProductModel } from '../models/Product';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const getAnalytics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const summary = await buildAnalyticsSummary();
  res.json({ success: true, data: summary });
});

export const getInventorySummary = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const lowStockProducts = await ProductModel.find({ stock: { $lte: 10 } })
    .select('name stock price averageRating reviewCount')
    .sort({ stock: 1 });

  const totals = await ProductModel.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalInventoryUnits: { $sum: '$stock' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      lowStockProducts,
      totals: totals[0] ?? { totalProducts: 0, totalInventoryUnits: 0 }
    }
  });
});

export const getDashboardOverview = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const [users, products, orders, analytics] = await Promise.all([
    UserModel.countDocuments(),
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    buildAnalyticsSummary()
  ]);

  res.json({
    success: true,
    data: {
      users,
      products,
      orders,
      analytics
    }
  });
});

export const listNotificationEmails = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const recipients = await NotificationRecipientModel.find().sort({ createdAt: -1 });
  res.json({ success: true, data: recipients });
});

export const createNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, isActive, notificationTypes } = req.body as {
    email: string;
    isActive?: boolean;
    notificationTypes?: string[];
  };

  const recipient = await NotificationRecipientModel.create({
    email,
    isActive: isActive ?? true,
    notificationTypes: notificationTypes ?? ['order-status'],
    createdBy: req.user!.id
  });

  res.status(201).json({ success: true, data: recipient });
});

export const updateNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const recipient = await NotificationRecipientModel.findById(req.params.recipientId);
  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  const { email, isActive, notificationTypes } = req.body as {
    email?: string;
    isActive?: boolean;
    notificationTypes?: string[];
  };

  if (email !== undefined) recipient.email = email;
  if (typeof isActive === 'boolean') recipient.isActive = isActive;
  if (notificationTypes !== undefined) recipient.notificationTypes = notificationTypes;

  await recipient.save();
  res.json({ success: true, data: recipient });
});

export const deleteNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const recipient = await NotificationRecipientModel.findById(req.params.recipientId);
  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  await recipient.deleteOne();
  res.json({ success: true, message: 'Notification recipient deleted successfully' });
});

```


---
## FILE: src/controllers/cartController.ts

```ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import { CartDocument } from '../models/Cart';

const getOrCreateCart = async (userId: Types.ObjectId): Promise<CartDocument> => {
  const existingCart = await CartModel.findOne({ user: userId });
  if (existingCart) {
    return existingCart;
  }
  return CartModel.create({ user: userId, items: [] });
};

export const viewCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(new Types.ObjectId(req.user!.id));
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  const product = await ProductModel.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }
  if (product.stock < quantity) {
    throw new ApiError(400, 'Not enough stock available');
  }

  const cart = await getOrCreateCart(new Types.ObjectId(req.user!.id));
  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.priceSnapshot = product.price;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      priceSnapshot: product.price
    });
  }

  await cart.save();
  await cart.populate('items.product');
  res.status(201).json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { quantity } = req.body as { quantity: number };
  const cart = await getOrCreateCart(new Types.ObjectId(req.user!.id));
  const item = cart.items.find((entry) => entry.product.toString() === req.params.productId);
  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }
  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(new Types.ObjectId(req.user!.id));
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(new Types.ObjectId(req.user!.id));
  cart.items = [];
  await cart.save();
  res.json({ success: true, message: 'Cart cleared successfully' });
});

```


---
## FILE: src/controllers/categoryController.ts

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CategoryModel } from '../models/Category';
import { createSlug } from '../utils/slug';

export const listCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await CategoryModel.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body as { name: string; description?: string };
  const category = await CategoryModel.create({
    name,
    description,
    slug: createSlug(name)
  });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await CategoryModel.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const { name, description, isActive } = req.body as { name?: string; description?: string; isActive?: boolean };
  if (name !== undefined) {
    category.name = name;
    category.slug = createSlug(name);
  }
  if (description !== undefined) category.description = description;
  if (typeof isActive === 'boolean') category.isActive = isActive;

  await category.save();
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await CategoryModel.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted successfully' });
});


```


---
## FILE: src/controllers/orderController.ts

```ts
import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CartModel } from '../models/Cart';
import { OrderModel, OrderStatus } from '../models/Order';
import { ProductModel } from '../models/Product';
import { notifyOrderStatusChange } from '../services/orderNotificationService';

const calculateOrderTotals = (items: Array<{ quantity: number; price: number; costPrice: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;
  const profit = items.reduce((sum, item) => sum + (item.price - item.costPrice) * item.quantity, 0);
  return { subtotal, total, profit };
};

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { shippingAddress, customerEmail, notes } = req.body as {
    shippingAddress: string;
    customerEmail?: string;
    notes?: string;
  };

  try {
    const cart = await CartModel.findOne({ user: req.user!.id });
    if (!cart || !cart.items.length) {
      throw new ApiError(400, 'Cart is empty');
    }

    const orderItems = [];
    for (const item of cart.items) {
      const product = await ProductModel.findById(item.product);
      if (!product) {
        throw new ApiError(404, 'A product in the cart was not found');
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.priceSnapshot,
        costPrice: product.costPrice
      });
    }

    const totals = calculateOrderTotals(orderItems);
    const order = await OrderModel.create(
      [
        {
          user: new Types.ObjectId(req.user!.id),
          items: orderItems,
          status: 'pending',
          subtotal: totals.subtotal,
          total: totals.total,
          profit: totals.profit,
          shippingAddress,
          customerEmail: customerEmail ?? req.user!.email,
          notes: notes ?? '',
          statusHistory: [
            {
              status: 'pending',
              note: 'Order created'
            }
          ]
        }
      ]
    );

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order[0] });
  } catch (error) {
    throw error;
  }
});

export const listOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filter = req.user!.role === 'admin' ? {} : { user: req.user!.id };
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).populate('user', 'name email');
  res.json({ success: true, data: orders });
});

export const getOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await OrderModel.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const orderUserId = typeof (order.user as any)?._id !== 'undefined' ? String((order.user as any)._id) : String(order.user);
  if (req.user!.role !== 'admin' && orderUserId !== req.user!.id) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await OrderModel.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const { status, note } = req.body as { status: OrderStatus; note?: string };
  order.status = status;
    order.statusHistory.push({
      status,
      note,
      changedBy: new Types.ObjectId(req.user!.id),
      changedAt: new Date()
    });

  await order.save();
  await notifyOrderStatusChange(order, req.user!, note);

  res.json({ success: true, data: order });
});

```


---
## FILE: src/controllers/productController.ts

```ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { TagModel } from '../models/Tag';
import { ReviewModel } from '../models/Review';

const parseObjectIdArray = (values: unknown): Types.ObjectId[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === 'string' && Types.ObjectId.isValid(value))
    .map((value) => new Types.ObjectId(value));
};

const briefProductProjection =
  'name briefDescription price stock categories tags images isActive averageRating reviewCount createdAt updatedAt';

export const listProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 12), 1), 100);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : '';
  const tagId = typeof req.query.tagId === 'string' ? req.query.tagId : '';
  const isActive = req.query.isActive === 'false' ? false : true;

  const filter: any = { isActive };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { briefDescription: { $regex: search, $options: 'i' } }
    ];
  }
  if (Types.ObjectId.isValid(categoryId)) {
    filter.categories = new Types.ObjectId(categoryId);
  }
  if (Types.ObjectId.isValid(tagId)) {
    filter.tags = new Types.ObjectId(tagId);
  }

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .select(briefProductProjection)
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId)
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const reviews = await ReviewModel.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name')
    .lean();

  res.json({
    success: true,
    data: {
      ...product.toObject(),
      reviews
    }
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    briefDescription,
    detailedDescription,
    price,
    costPrice,
    stock,
    categoryIds,
    tagIds,
    images
  } = req.body as Record<string, unknown>;

  const product = await ProductModel.create({
    name: String(name),
    briefDescription: String(briefDescription),
    detailedDescription: String(detailedDescription),
    price: Number(price),
    costPrice: Number(costPrice ?? 0),
    stock: Number(stock),
    categories: parseObjectIdArray(categoryIds),
    tags: parseObjectIdArray(tagIds),
    images: Array.isArray(images) ? images.map(String) : []
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const {
    name,
    briefDescription,
    detailedDescription,
    price,
    costPrice,
    stock,
    categoryIds,
    tagIds,
    images,
    isActive
  } = req.body as Record<string, unknown>;

  if (name !== undefined) product.name = String(name);
  if (briefDescription !== undefined) product.briefDescription = String(briefDescription);
  if (detailedDescription !== undefined) product.detailedDescription = String(detailedDescription);
  if (price !== undefined) product.price = Number(price);
  if (costPrice !== undefined) product.costPrice = Number(costPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (categoryIds !== undefined) product.categories = parseObjectIdArray(categoryIds);
  if (tagIds !== undefined) product.tags = parseObjectIdArray(tagIds);
  if (images !== undefined) product.images = Array.isArray(images) ? images.map(String) : product.images;
  if (typeof isActive === 'boolean') product.isActive = isActive;

  await product.save();
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product deactivated successfully' });
});

export const updateInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const { stock } = req.body as { stock: number };
  product.stock = stock;
  await product.save();

  res.json({ success: true, data: product });
});

```


---
## FILE: src/controllers/reviewController.ts

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ReviewModel } from '../models/Review';
import { ProductModel } from '../models/Product';
import { recalculateProductRating } from '../services/productMetricsService';

export const listReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reviews = await ReviewModel.find({ product: req.params.productId })
    .sort({ createdAt: -1 })
    .populate('user', 'name');

  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { rating, comment } = req.body as { rating: number; comment: string };
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const review = await ReviewModel.findOneAndUpdate(
    { product: product._id, user: req.user!.id },
    { rating, comment },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await recalculateProductRating(product._id);
  res.status(201).json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await ReviewModel.findOneAndDelete({ product: req.params.productId, user: req.user!.id });
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  await recalculateProductRating(String(req.params.productId));
  res.json({ success: true, message: 'Review deleted successfully' });
});

```


---
## FILE: src/controllers/tagController.ts

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { TagModel } from '../models/Tag';
import { createSlug } from '../utils/slug';

export const listTags = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const tags = await TagModel.find().sort({ name: 1 });
  res.json({ success: true, data: tags });
});

export const createTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  const tag = await TagModel.create({
    name,
    slug: createSlug(name)
  });
  res.status(201).json({ success: true, data: tag });
});

export const updateTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tag = await TagModel.findById(req.params.tagId);
  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }

  const { name, isActive } = req.body as { name?: string; isActive?: boolean };
  if (name !== undefined) {
    tag.name = name;
    tag.slug = createSlug(name);
  }
  if (typeof isActive === 'boolean') tag.isActive = isActive;

  await tag.save();
  res.json({ success: true, data: tag });
});

export const deleteTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tag = await TagModel.findById(req.params.tagId);
  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }
  await tag.deleteOne();
  res.json({ success: true, message: 'Tag deleted successfully' });
});


```


---
## FILE: src/controllers/userController.ts

```ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { UserModel } from '../models/User';

const sanitizeUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const listUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const users = await UserModel.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users.map(sanitizeUser) });
});

export const getMe = asyncHandler(async (req: any, res: Response): Promise<void> => {
  res.json({ success: true, data: sanitizeUser(req.user!) });
});

export const getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ success: true, data: sanitizeUser(user) });
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, email, role } = req.body as {
    name?: string;
    email?: string;
    role?: 'user' | 'admin';
  };

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;

  await user.save();
  res.json({ success: true, data: sanitizeUser(user) });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await UserModel.findByIdAndDelete(req.params.userId);
  res.json({ success: true, message: 'User deleted successfully' });
});

```


---
## FILE: src/index.ts

```ts
import app from './app';
import { ENV } from './config/environment';
import { connectDB } from './config/db';
import { logger } from './config/logger';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(ENV.PORT, () => {
    logger.info(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  });
};

void startServer();


```


---
## FILE: src/lib/auth.ts

```ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { ENV } from "../config/environment";
import { sendEmail } from "../services/emailService";

const client = new MongoClient(ENV.MONGODB_URI);

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    emailAndPassword: {
        enabled: true,
        async sendVerificationEmail({ user, url }: { user: any; url: string }) {
            await sendEmail(
                user.email,
                "Verify your email",
                `Please verify your email by clicking this link: ${url}`,
                `<p>Please verify your email by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
            );
        },
        async sendResetPasswordEmail({ user, url }: { user: any; url: string }) {
            await sendEmail(
                user.email,
                "Reset your password",
                `Reset your password by clicking this link: ${url}`,
                `<p>Reset your password by clicking the link below:</p><p><a href="${url}">${url}</a></p>`
            );
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
            },
        },
    },
    trustedOrigins: [ENV.CLIENT_FRONTEND_URL, ENV.ADMIN_FRONTEND_URL],
});

```


---
## FILE: src/middleware/auth.ts

```ts
import { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

const getHeaders = (req: Request) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  });
  return headers;
};

export const requireAuth = async (req: AuthRequest): Promise<void> => {
  const session = await auth.api.getSession({
    headers: getHeaders(req),
  });

  if (!session) {
    throw new ApiError(401, 'Authentication required');
  }

  req.user = session.user;
  req.session = session.session;
};

export const requireVerifiedUser = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await requireAuth(req);
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
 
    if (!req.user.emailVerified) {
      throw new ApiError(403, 'Please verify your email to access this feature');
    }
 
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await requireAuth(req);
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(403, 'Administrator access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: getHeaders(req),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }
    next();
  } catch {
    next();
  }
};

```


---
## FILE: src/middleware/errorHandler.ts

```ts
import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Route not found'));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof MulterError) {
    apiError = new ApiError(400, error.message, error);
  } else if (error instanceof Error && error.message === 'Only image uploads are allowed') {
    apiError = new ApiError(400, error.message, error);
  } else if (typeof error === 'object' && error && (error as { code?: number }).code === 11000) {
    apiError = new ApiError(409, 'Duplicate resource', error);
  } else {
    apiError = new ApiError(500, 'Internal server error', error);
  }

  const safeError = (err: unknown) => {
    if (err instanceof Error) {
      return { message: err.message, stack: err.stack };
    }
    return err;
  };

  logger.error({ error: safeError(error) }, apiError.message);
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    details: apiError.details
  });
};

```


---
## FILE: src/middleware/upload.ts

```ts
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ENV } from '../config/environment';

const ensureDirectory = (directory: string): void => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const createStorage = (folder: string) => {
  const destination = path.join(process.cwd(), ENV.UPLOAD_DIR, folder);
  ensureDirectory(destination);

  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destination),
    filename: (_req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = path.extname(file.originalname);
      callback(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
  });
};

const imageFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
    return;
  }
  callback(new Error('Only image uploads are allowed'));
};

const createUploader = (folder: string) =>
  multer({
    storage: createStorage(folder),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  });

export const uploadVerificationImage = createUploader('verifications');
export const uploadProductImages = createUploader('products');

```


---
## FILE: src/models/Cart.ts

```ts
import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [CartItemSchema], default: [] }
  },
  { timestamps: true }
);

export const CartModel = model<ICart>('Cart', CartSchema);
export type CartDocument = HydratedDocument<ICart>;

```


---
## FILE: src/models/Category.ts

```ts
import { HydratedDocument, model, Schema } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const CategoryModel = model<ICategory>('Category', CategorySchema);
export type CategoryDocument = HydratedDocument<ICategory>;

```


---
## FILE: src/models/NotificationRecipient.ts

```ts
import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface INotificationRecipient {
  email: string;
  isActive: boolean;
  notificationTypes: string[];
  createdBy?: Types.ObjectId | null;
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    notificationTypes: { type: [String], default: ['order-status'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const NotificationRecipientModel = model<INotificationRecipient>('NotificationRecipient', NotificationRecipientSchema);
export type NotificationRecipientDocument = HydratedDocument<INotificationRecipient>;

```


---
## FILE: src/models/Order.ts

```ts
import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type OrderStatus = 'pending' | 'completed' | 'canceled';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId | null;
  changedAt: Date;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  total: number;
  profit: number;
  shippingAddress: string;
  customerEmail: string;
  statusHistory: IOrderStatusHistory[];
  notes?: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, enum: ['pending', 'completed', 'canceled'], required: true },
    note: { type: String, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], default: [] },
    status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    customerEmail: { type: String, required: true },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>('Order', OrderSchema);
export type OrderDocument = HydratedDocument<IOrder>;

```


---
## FILE: src/models/Product.ts

```ts
import { HydratedDocument, Types, model, Schema } from 'mongoose';

export interface IProduct {
  name: string;
  briefDescription: string;
  detailedDescription: string;
  price: number;
  costPrice: number;
  stock: number;
  categories: Types.ObjectId[];
  tags: Types.ObjectId[];
  images: string[];
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    briefDescription: { type: String, required: true, trim: true },
    detailedDescription: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', default: [] }],
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', default: [] }],
    images: [{ type: String, default: [] }],
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ProductModel = model<IProduct>('Product', ProductSchema);
export type ProductDocument = HydratedDocument<IProduct>;

```


---
## FILE: src/models/Review.ts

```ts
import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface IReview {
  user: Types.ObjectId;
  product: Types.ObjectId;
  comment: string;
  rating: number;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    comment: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
  },
  { timestamps: true }
);

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const ReviewModel = model<IReview>('Review', ReviewSchema);
export type ReviewDocument = HydratedDocument<IReview>;

```


---
## FILE: src/models/Tag.ts

```ts
import { HydratedDocument, model, Schema } from 'mongoose';

export interface ITag {
  name: string;
  slug: string;
  isActive: boolean;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TagModel = model<ITag>('Tag', TagSchema);
export type TagDocument = HydratedDocument<ITag>;

```


---
## FILE: src/models/User.ts

```ts
import { HydratedDocument, model, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser {
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  lastLoginAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', UserSchema);
export type UserDocument = HydratedDocument<IUser>;

```


---
## FILE: src/routes/adminRoutes.ts

```ts
import { Router } from 'express';
import {
  createNotificationEmail,
  deleteNotificationEmail,
  getAnalytics,
  getDashboardOverview,
  getInventorySummary,
  listNotificationEmails,
  updateNotificationEmail
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { notificationEmailSchema } from '../validations/adminValidation';

const router = Router();

router.use(requireAdmin);
router.get('/dashboard', getDashboardOverview);
router.get('/analytics', getAnalytics);
router.get('/inventory', getInventorySummary);
router.get('/notification-emails', listNotificationEmails);
router.post('/notification-emails', validateBody(notificationEmailSchema), createNotificationEmail);
router.patch('/notification-emails/:recipientId', validateBody(notificationEmailSchema.partial()), updateNotificationEmail);
router.delete('/notification-emails/:recipientId', deleteNotificationEmail);

export default router;


```


---
## FILE: src/routes/cartRoutes.ts

```ts
import { Router } from 'express';
import { addToCart, clearCart, removeCartItem, updateCartItem, viewCart } from '../controllers/cartController';
import { requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { cartItemSchema, cartUpdateSchema } from '../validations/cartOrderValidation';

const router = Router();

router.use(requireVerifiedUser);
router.get('/', viewCart);
router.post('/items', validateBody(cartItemSchema), addToCart);
router.patch('/items/:productId', validateBody(cartUpdateSchema), updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;


```


---
## FILE: src/routes/categoryRoutes.ts

```ts
import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { categorySchema } from '../validations/catalogValidation';

const router = Router();

router.get('/', listCategories);
router.post('/', requireAdmin, validateBody(categorySchema), createCategory);
router.patch('/:categoryId', requireAdmin, validateBody(categorySchema.partial()), updateCategory);
router.delete('/:categoryId', requireAdmin, deleteCategory);

export default router;


```


---
## FILE: src/routes/orderRoutes.ts

```ts
import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { checkoutSchema, statusUpdateSchema } from '../validations/cartOrderValidation';

const router = Router();

router.use(requireVerifiedUser);
router.post('/', validateBody(checkoutSchema), createOrder);
router.get('/', listOrders);
router.get('/:orderId', getOrder);
router.patch('/:orderId/status', requireAdmin, validateBody(statusUpdateSchema), updateOrderStatus);

export default router;


```


---
## FILE: src/routes/productRoutes.ts

```ts
import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateInventory,
  updateProduct
} from '../controllers/productController';
import { createReview, deleteReview, listReviews } from '../controllers/reviewController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { inventoryUpdateSchema, productSchema, productUpdateSchema } from '../validations/catalogValidation';
import { reviewSchema } from '../validations/reviewValidation';

const router = Router();

router.get('/', listProducts);
router.post('/', requireAdmin, validateBody(productSchema), createProduct);
router.get('/:productId/reviews', listReviews);
router.post('/:productId/reviews', requireVerifiedUser, validateBody(reviewSchema), createReview);
router.delete('/:productId/reviews', requireVerifiedUser, deleteReview);
router.get('/:productId', getProduct);
router.patch('/:productId', requireAdmin, validateBody(productUpdateSchema), updateProduct);
router.patch('/:productId/inventory', requireAdmin, validateBody(inventoryUpdateSchema), updateInventory);
router.delete('/:productId', requireAdmin, deleteProduct);

export default router;


```


---
## FILE: src/routes/tagRoutes.ts

```ts
import { Router } from 'express';
import { createTag, deleteTag, listTags, updateTag } from '../controllers/tagController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { tagSchema } from '../validations/catalogValidation';

const router = Router();

router.get('/', listTags);
router.post('/', requireAdmin, validateBody(tagSchema), createTag);
router.patch('/:tagId', requireAdmin, validateBody(tagSchema.partial()), updateTag);
router.delete('/:tagId', requireAdmin, deleteTag);

export default router;


```


---
## FILE: src/routes/userRoutes.ts

```ts
import { Router } from 'express';
import { deleteUser, getMe, getUser, listUsers, updateUser } from '../controllers/userController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { userUpdateSchema } from '../validations/adminValidation';

const router = Router();

router.get('/me', requireVerifiedUser, getMe);
router.get('/', requireAdmin, listUsers);
router.get('/:userId', requireAdmin, getUser);
router.patch('/:userId', requireAdmin, validateBody(userUpdateSchema), updateUser);
router.delete('/:userId', requireAdmin, deleteUser);

export default router;


```


---
## FILE: src/routes/v1/index.ts

```ts
import { Router } from 'express';
import userRoutes from '../userRoutes';
import productRoutes from '../productRoutes';
import categoryRoutes from '../categoryRoutes';
import tagRoutes from '../tagRoutes';
import cartRoutes from '../cartRoutes';
import orderRoutes from '../orderRoutes';
import adminRoutes from '../adminRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;

```


---
## FILE: src/scripts/addAdmin.ts

```ts
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { ENV } from '../config/environment';
import { auth } from '../lib/auth';

async function addAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const passwordArg = args.find(arg => arg.startsWith('--password='));

  const email = emailArg ? emailArg.split('=')[1] : ENV.ADMIN_EMAIL;
  const password = passwordArg ? passwordArg.split('=')[1] : ENV.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: Admin email and password are required. Provide them via env variables (ADMIN_EMAIL, ADMIN_PASSWORD) or command line arguments (--email=..., --password=...).');
    process.exit(1);
  }

  const client = new MongoClient(ENV.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('user');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      if (existingUser.role === 'admin') {
        console.log('User is already an admin.');
        return;
      } else {
        console.log('User exists but is not an admin. Upgrading to admin...');
        await usersCollection.updateOne({ _id: existingUser._id }, { $set: { role: 'admin', emailVerified: true } });
        console.log('User upgraded to admin successfully.');
        return;
      }
    }

    console.log(`Creating admin user: ${email}...`);
    
    // Use Better Auth's internal API to sign up the user
    // Since we are in a script, we can simulate a request or use internal methods.
    // Better Auth doesn't have a simple "createUser" method.
    // We can use auth.api.signUpEmail but it might be complex to mock the request.
    
    // Alternative: Use a temporary dummy request to sign up.
    // But that's overkill.
    
    // Let's use the Better Auth internal password hashing if possible.
    // Better Auth uses a specific hashing algorithm.
    
    // Actually, the most reliable way to create a user in Better Auth is to call its API.
    // We can use `fetch` to call the local server if it's running, but the script should work standalone.
    
    // Wait, Better Auth provides a `signUpEmail` method in its API.
    // Let's try to use it by mocking the request.
    
    try {
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: 'Administrator',
            },
        });
        
        // After sign up, we must set the role to admin and mark as verified.
        await usersCollection.updateOne(
            { email },
            { $set: { role: 'admin', emailVerified: true } }
        );
        
        console.log('Admin user created and verified successfully.');
    } catch (error: any) {
        console.error('Error creating user via Better Auth API:', error.message);
        process.exit(1);
    }

  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addAdmin();

```


---
## FILE: src/scripts/cleanup.ts

```ts
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { logger } from '../config/logger';
import { CategoryModel } from '../models/Category';
import { TagModel } from '../models/Tag';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { ReviewModel } from '../models/Review';
import { CartModel } from '../models/Cart';
import { OrderModel } from '../models/Order';
import { NotificationRecipientModel } from '../models/NotificationRecipient';

const SEED_PREFIX = 'AUTOSEED_';

async function cleanup() {
  try {
    await connectDB();
    logger.info('Starting database cleanup...');

    const results: Record<string, number> = {};

    // Order of deletion to avoid dependency issues
    const collections = [
      { name: 'Order', model: OrderModel, field: 'shippingAddress' },
      { name: 'Cart', model: CartModel, field: 'user' }, // we will check if user was seeded
      { name: 'Review', model: ReviewModel, field: 'comment' }, // we'll check comment or user
      { name: 'NotificationRecipient', model: NotificationRecipientModel, field: 'email' },
      { name: 'Product', model: ProductModel, field: 'name' },
      { name: 'Category', model: CategoryModel, field: 'name' },
      { name: 'Tag', model: TagModel, field: 'name' },
      { name: 'User', model: UserModel, field: 'name' },
    ];

    // For Users, we also have a specific test email
    const seededUserEmails = ['seed.user@example.com', 'user1@example.com', 'user2@example.com', 'user3@example.com'];

    for (const col of collections) {
      let deletedCount = 0;

      if (col.name === 'User') {
        const usersToDelete = await UserModel.find({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        });
        deletedCount = await UserModel.deleteMany({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).then(res => res.deletedCount);
      } else if (col.name === 'Order') {
        deletedCount = await OrderModel.deleteMany({
          shippingAddress: { $regex: `^${SEED_PREFIX}` }
        }).then(res => res.deletedCount);
      } else if (col.name === 'NotificationRecipient') {
        deletedCount = await NotificationRecipientModel.deleteMany({
          $or: [
            { email: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).then(res => res.deletedCount);
      } else if (col.name === 'Cart' || col.name === 'Review') {
        // For carts and reviews, we delete those associated with seeded users
        const seededUsers = await UserModel.find({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).select('_id');
        const userIds = seededUsers.map(u => u._id);
        
        deletedCount = await (col.model as any).deleteMany({
          user: { $in: userIds }
        }).then((res: any) => res.deletedCount);
      } else {
        // Regular name-based prefix match
        deletedCount = await (col.model as any).deleteMany({
          [col.field]: { $regex: `^${SEED_PREFIX}` }
        }).then((res: any) => res.deletedCount);
      }

      results[col.name] = deletedCount;
      logger.info(`Deleted ${deletedCount} records from ${col.name}.`);
    }

    logger.info('Cleanup summary:');
    console.table(results);
    logger.info('Database cleanup completed successfully!');
  } catch (error) {
    logger.error({ error }, 'Database cleanup failed');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();

```


---
## FILE: src/scripts/deleteAdmin.ts

```ts
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { ENV } from '../config/environment';

async function deleteAdmin() {
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));

  const email = emailArg ? emailArg.split('=')[1] : ENV.ADMIN_EMAIL;

  if (!email) {
    console.error('Error: Admin email is required. Provide it via env variable (ADMIN_EMAIL) or command line argument (--email=...).');
    process.exit(1);
  }

  const client = new MongoClient(ENV.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.log(`No user found with email ${email}.`);
      return;
    }

    if (user.role !== 'admin') {
      console.error(`Error: User ${email} is not an admin. Only admin accounts can be deleted by this script.`);
      process.exit(1);
    }

    await usersCollection.deleteOne({ _id: user._id });
    
    // Also delete associated sessions and accounts if they exist
    await db.collection('session').deleteMany({ userId: user._id });
    await db.collection('account').deleteMany({ userId: user._id });

    console.log(`Admin user ${email} deleted successfully.`);
  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

deleteAdmin();

```


---
## FILE: src/scripts/seed.ts

```ts
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { logger } from '../config/logger';
import { CategoryModel } from '../models/Category';
import { TagModel } from '../models/Tag';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { ReviewModel } from '../models/Review';
import { CartModel } from '../models/Cart';
import { OrderModel, type OrderStatus } from '../models/Order';
import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { auth } from '../lib/auth';
import slugify from 'slugify';

const SEED_PREFIX = 'AUTOSEED_';

async function seed() {
  try {
    await connectDB();
    logger.info('Starting database seeding...');

    // 1. Seed Categories
    const categoryNames = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty & Health', 'Sports', 'Toys', 'Automotive'];
    const categories = await Promise.all(
      categoryNames.map(async (name) => {
        const fullName = `${SEED_PREFIX}${name}`;
        return await CategoryModel.findOneAndUpdate(
          { slug: slugify(fullName, { lower: true }) },
          {
            name: fullName,
            slug: slugify(fullName, { lower: true }),
            description: `Realistic description for ${fullName} category.`,
            isActive: true,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${categories.length} categories.`);

    // 2. Seed Tags
    const tagNames = ['New Arrival', 'Best Seller', 'Eco-Friendly', 'Premium', 'Discounted', 'Limited Edition', 'Trending', 'Handmade'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        const fullName = `${SEED_PREFIX}${name}`;
        return await TagModel.findOneAndUpdate(
          { slug: slugify(fullName, { lower: true }) },
          {
            name: fullName,
            slug: slugify(fullName, { lower: true }),
            isActive: true,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${tags.length} tags.`);

    // 3. Seed Products
    const productTypes = ['Smartphone', 'Laptop', 'Headphones', 'T-Shirt', 'Jeans', 'Blender', 'Vacuum', 'Novel', 'Textbook', 'Lipstick', 'Moisturizer', 'Yoga Mat', 'Dumbbells', 'Tire', 'Oil Filter'];
    const products = [];
    for (let i = 1; i <= 60; i++) {
      const type = productTypes[i % productTypes.length];
      const name = `${SEED_PREFIX}${type}_${i}`;
      
      // Randomly assign 1-3 categories and 1-3 tags
      const productCategories = categories.slice(
        Math.floor(Math.random() * categories.length),
        Math.floor(Math.random() * categories.length) + 2
      );
      const productTags = tags.slice(
        Math.floor(Math.random() * tags.length),
        Math.floor(Math.random() * tags.length) + 2
      );

      const product = await ProductModel.findOneAndUpdate(
        { name },
        {
          name,
          briefDescription: `High-quality ${name} with great features.`,
          detailedDescription: `This is a detailed description for ${name}. It offers exceptional performance, durability, and value. Perfect for users who need a reliable ${type} for their daily activities.`,
          price: Math.floor(Math.random() * 1000) + 10,
          costPrice: Math.floor(Math.random() * 800) + 5,
          stock: Math.floor(Math.random() * 100) + 10,
          categories: productCategories.map(c => c._id),
          tags: productTags.map(t => t._id),
          images: [`https://picsum.photos/seed/${name}/400/400`, `https://picsum.photos/seed/${name}2/400/400`],
          isActive: true,
          averageRating: 0,
          reviewCount: 0,
        },
        { upsert: true, returnDocument: 'after' }
      );
      products.push(product);
    }
    logger.info(`Seeded ${products.length} products.`);

    // 4. Seed Users
    const testUserEmail = 'seed.user@example.com';
    const testUserName = `${SEED_PREFIX}TestUser`;
    const testUserPassword = 'TestPassword123!';

    try {
        await auth.api.signUpEmail({
            body: {
                email: testUserEmail,
                password: testUserPassword,
                name: testUserName,
            }
        });
    } catch (e) {
        // User likely already exists
    }

    // Ensure test user is verified and has correct role
    await UserModel.updateOne(
        { email: testUserEmail },
        { emailVerified: true, role: 'user' },
        { upsert: true }
    );

    // Other test users
    const otherUserEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
    await Promise.all(
      otherUserEmails.map(async (email, idx) => {
        const name = `${SEED_PREFIX}User_${idx + 1}`;
        try {
            await auth.api.signUpEmail({
                body: {
                    email,
                    password: 'Password123!',
                    name,
                }
            });
        } catch (e) {
            // User likely already exists
        }
      })
    );
    
    // Verify other users
    await UserModel.updateMany(
        { email: { $in: otherUserEmails } },
        { emailVerified: true, role: 'user' }
    );

    const allUsers = await UserModel.find({
        $or: [
            { email: testUserEmail },
            { email: { $in: otherUserEmails } }
        ]
    });
    
    if (!allUsers || allUsers.length === 0) {
        throw new Error('No users were found/seeded. Database seeding cannot proceed without users.');
    }
    logger.info(`Seeded ${allUsers.length} users.`);


    // 5. Seed Reviews
    const reviews = [];
    for (const product of products) {
      const numReviews = Math.floor(Math.random() * 4);
      for (let i = 0; i < numReviews; i++) {
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        const review = await ReviewModel.findOneAndUpdate(
          { user: user._id, product: product._id },
          {
            user: user._id,
            product: product._id,
            comment: `This ${product.name} is amazing! Really loved it.`,
            rating: Math.floor(Math.random() * 5) + 1,
          },
          { upsert: true, returnDocument: 'after' }
        );
        reviews.push(review);
      }
    }
    
    // Update product ratings
    for (const product of products) {
        const productReviews = await ReviewModel.find({ product: product._id });
        if (productReviews.length > 0) {
            const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
            await ProductModel.updateOne({ _id: product._id }, {
                averageRating: avg,
                reviewCount: productReviews.length
            });
        }
    }
    logger.info(`Seeded ${reviews.length} reviews.`);

    // 6. Seed Carts
    const carts = [];
    for (const user of allUsers) {
      const items = [];
      const numItems = Math.floor(Math.random() * 5);
      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        items.push({
          product: product._id,
          quantity: Math.floor(Math.random() * 3) + 1,
          priceSnapshot: product.price,
        });
      }
      
      const cart = await CartModel.findOneAndUpdate(
        { user: user._id },
        { user: user._id, items },
        { upsert: true, returnDocument: 'after' }
      );
      carts.push(cart);
    }
    logger.info(`Seeded ${carts.length} carts.`);

    // 7. Seed Orders
    const orders = [];
    for (const user of allUsers) {
      const numOrders = Math.floor(Math.random() * 3);
      for (let i = 0; i < numOrders; i++) {
        const items = [];
        const numItems = Math.floor(Math.random() * 4) + 1;
        let subtotal = 0;
        let profit = 0;

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({
            product: product._id,
            name: product.name,
            quantity: qty,
            price: product.price,
            costPrice: product.costPrice,
          });
          subtotal += product.price * qty;
          profit += (product.price - product.costPrice) * qty;
        }

        const total = subtotal; // No tax/shipping for simplicity
        const status: OrderStatus = ['pending', 'completed', 'canceled'][Math.floor(Math.random() * 3)] as OrderStatus;

        const order = await OrderModel.create({
          user: user._id,
          items,
          status,
          subtotal,
          total,
          profit,
          shippingAddress: `${SEED_PREFIX}Address ${i+1}, City, Country`,
          customerEmail: user.email,
          statusHistory: [{
            status,
            note: 'Initial order status',
            changedAt: new Date(),
          }],
          notes: `Seed order ${i+1} for ${user.email}`,
        });
        orders.push(order);
      }
    }
    logger.info(`Seeded ${orders.length} orders.`);

    // 8. Seed Notification Recipients
    const recipients = await Promise.all(
      allUsers.map(async (user) => {
        return await NotificationRecipientModel.findOneAndUpdate(
          { email: user.email },
          {
            email: user.email,
            isActive: true,
            notificationTypes: ['order-status'],
            createdBy: user._id,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${recipients.length} notification recipients.`);

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seed();

```


---
## FILE: src/services/analyticsService.ts

```ts
import { OrderModel } from '../models/Order';

const completedOrderMatch = { status: 'completed' as const };

export const buildAnalyticsSummary = async (): Promise<{
  totals: { revenue: number; profit: number; sales: number };
  last30Days: Array<{ date: string; revenue: number; profit: number; sales: number }>;
  monthly: Array<{ month: string; revenue: number; profit: number; sales: number }>;
  yearly: Array<{ year: string; revenue: number; profit: number; sales: number }>;
}> => {
  const [totals] = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    }
  ]);

  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const last30DaysRaw = await OrderModel.aggregate([
    { $match: { ...completedOrderMatch, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthlyRaw = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const yearlyRaw = await OrderModel.aggregate([
    { $match: completedOrderMatch },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y', date: '$createdAt' }
        },
        revenue: { $sum: '$total' },
        profit: { $sum: '$profit' },
        sales: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    totals: {
      revenue: totals?.revenue ?? 0,
      profit: totals?.profit ?? 0,
      sales: totals?.sales ?? 0
    },
    last30Days: last30DaysRaw.map((entry) => ({
      date: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    })),
    monthly: monthlyRaw.map((entry) => ({
      month: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    })),
    yearly: yearlyRaw.map((entry) => ({
      year: entry._id,
      revenue: entry.revenue,
      profit: entry.profit,
      sales: entry.sales
    }))
  };
};


```


---
## FILE: src/services/emailService.ts

```ts
import nodemailer from 'nodemailer';
import { ENV } from '../config/environment';
import { logger } from '../config/logger';

const transport = nodemailer.createTransport({
  host: ENV.EMAIL_HOST,
  port: ENV.EMAIL_PORT,
  secure: ENV.EMAIL_PORT === 465,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS
  }
});

export const sendEmail = async (to: string | string[], subject: string, text: string, html?: string): Promise<void> => {
  await transport.sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });
  logger.info({ to, subject }, 'Email sent');
};

```


---
## FILE: src/services/orderNotificationService.ts

```ts
import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { sendEmail } from './emailService';
import { OrderDocument } from '../models/Order';
import { UserDocument } from '../models/User';
import { logger } from '../config/logger';

export const notifyOrderStatusChange = async (order: OrderDocument, changedBy: UserDocument | undefined, note?: string): Promise<void> => {
  const recipients = await NotificationRecipientModel.find({ isActive: true });
  if (!recipients.length) {
    return;
  }

  const subject = `Order ${order._id} status updated to ${order.status}`;
  const text = [
    `Order ID: ${order._id}`,
    `Status: ${order.status}`,
    `Customer: ${order.customerEmail}`,
    `Changed by: ${changedBy?.email ?? 'system'}`,
    note ? `Note: ${note}` : null
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendEmail(recipients.map((recipient) => recipient.email), subject, text, `<pre>${text}</pre>`);
  } catch (error) {
    logger.error({ error }, 'Failed to send order status notification');
  }
};


```


---
## FILE: src/services/productMetricsService.ts

```ts
import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ReviewModel } from '../models/Review';

export const recalculateProductRating = async (productId: string | Types.ObjectId): Promise<void> => {
  const [stats] = await ReviewModel.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  await ProductModel.findByIdAndUpdate(productId, {
    averageRating: stats?.averageRating ?? 0,
    reviewCount: stats?.reviewCount ?? 0
  });
};


```


---
## FILE: src/types/express/index.d.ts

```ts
import { UserDocument } from '../../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export {};

```


---
## FILE: src/utils/ApiError.ts

```ts
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

```


---
## FILE: src/utils/asyncHandler.ts

```ts
import { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

```


---
## FILE: src/utils/slug.ts

```ts
import slugify from 'slugify';

export const createSlug = (value: string): string =>
  slugify(value, { lower: true, strict: true, trim: true });

```


---
## FILE: src/utils/validate.ts

```ts
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { ApiError } from './ApiError';

export const validateBody = (schema: ZodTypeAny): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ApiError(400, 'Validation failed', result.error.flatten()));
    }
    req.body = result.data;
    next();
  };

export const validateParams = (schema: ZodTypeAny): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new ApiError(400, 'Validation failed', result.error.flatten()));
    }
    Object.assign(req.params, result.data);
    next();
  };

```


---
## FILE: src/validations/adminValidation.ts

```ts
import { z } from 'zod';

export const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional()
});

export const notificationEmailSchema = z.object({
  email: z.string().email(),
  isActive: z.boolean().optional().default(true),
  notificationTypes: z.array(z.string().min(1)).optional().default(['order-status'])
});


```


---
## FILE: src/validations/cartOrderValidation.ts

```ts
import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive()
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().positive()
});

export const checkoutSchema = z.object({
  shippingAddress: z.string().min(10).max(500),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional().default('')
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'completed', 'canceled']),
  note: z.string().max(500).optional().default('')
});


```


---
## FILE: src/validations/catalogValidation.ts

```ts
import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().default('')
});

export const tagSchema = z.object({
  name: z.string().min(2).max(120)
});

export const productSchema = z.object({
  name: z.string().min(2).max(200),
  briefDescription: z.string().min(5).max(300),
  detailedDescription: z.string().min(20).max(5000),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  images: z.array(z.string()).default([])
});

export const productUpdateSchema = productSchema.partial();

export const inventoryUpdateSchema = z.object({
  stock: z.number().int().nonnegative()
});


```


---
## FILE: src/validations/reviewValidation.ts

```ts
import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(2).max(2000)
});


```


---
## FILE: temporary-infos.md

```md
I have successfully replaced the custom authentication system with Better Auth.
Summary of Changes
1. Removed Custom Auth
- Files Deleted:
- src/controllers/authController.ts
- src/routes/authRoutes.ts
- src/validations/authValidation.ts
- src/utils/password.ts
- Dependencies Removed: jsonwebtoken, bcryptjs (and their corresponding @types).
- Logic Removed: Custom JWT generation/verification, image-based signup verification, and custom password hashing.
2. Better Auth Implementation
- Configuration: Created src/lib/auth.ts using the MongoDB adapter.
- Handler: Mounted the Better Auth handler in src/app.ts at /api/auth/*.
- Features Enabled:
- Email/Password authentication.
- Email verification for normal users.
- Password reset functionality.
- Role-based access control (User and Admin roles).
3. Environment Updates
- Removed: JWT_SECRET, AUTH_SECRET, RESET_TOKEN_EXPIRY_MINUTES.
- Added:
- BETTER_AUTH_SECRET: Secret for session management.
- BETTER_AUTH_URL: Base URL for auth endpoints.
- ADMIN_EMAIL: Email for the default admin.
- ADMIN_PASSWORD: Password for the default admin.
4. User Model & Middleware
- User Model: Refactored src/models/User.ts to remove image verification fields and add emailVerified.
- Middleware: Implemented new session-based middleware in src/middleware/auth.ts:
- requireAuth: Ensures the user is logged in.
- requireVerifiedUser: Allows admins or verified normal users.
- requireAdmin: Allows only users with the admin role.
5. Admin Management
- Scripts: Created src/scripts/addAdmin.ts and src/scripts/deleteAdmin.ts.
- npm Scripts: Added admin:add and admin:delete to package.json.
- Admin Workflow: Admins are created via script, are marked as verified by default, and bypass email verification checks.
6. Route Updates
- Updated all protected routes (Cart, Orders, Products, User Profile, and Admin Dashboard) to use the new role-based and verification-based middleware.
Setup and Usage
1. Install dependencies: npm install
2. Configure environment: Add BETTER_AUTH_SECRET, BETTER_AUTH_URL, ADMIN_EMAIL, and ADMIN_PASSWORD to your .env file.
3. Create the first admin:
npm run admin:add
(Alternatively: npm run admin:add -- --email admin@example.com --password yourpassword)
4. Run the server: npm run dev




//
The admin authentication process follows this flow:
1. Admin Creation (Seeding)
Admins are created via a standalone script (src/scripts/addAdmin.ts):
- User Creation: It calls auth.api.signUpEmail to create a user record with a password.
- Privilege Escalation: It manually updates the MongoDB user collection to set role: 'admin' and emailVerified: true for that email.
2. Login Process
- Authentication: The system uses Better Auth (src/lib/auth.ts). The admin logs in using a standard email/password flow.
- Verification: Better Auth's MongoDB adapter matches the credentials against the database. If they match, a session is created.
3. Access Control (Middleware)
Every request to an admin endpoint is filtered through middleware in src/middleware/auth.ts:
- Session Validation: requireAuth verifies the session via auth.api.getSession.
- Role Verification: requireAdmin checks if the authenticated user's role is exactly 'admin'. If not, it returns a 403 Administrator access required error.
- Verification Bypass: In requireVerifiedUser, admins are explicitly allowed to bypass email verification checks.
```


---
## FILE: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],

  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}

```
