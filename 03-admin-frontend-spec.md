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

#### Manual Order Creation
- **Create**: `POST /api/v1/admin/orders`
- **Auth**: Admin required (`requireAdmin`)
- **Body**:
```typescript
interface ManualOrderItemInput {
  productId: string;
  quantity: number; // integer > 0
}

interface ManualOrderCreateInput {
  source?: 'website' | 'facebook' | 'phone' | 'physical_store' | 'in_person' | 'whatsapp' | 'telegram' | 'other';
  status?: 'pending' | 'completed' | 'canceled';
  items: ManualOrderItemInput[];
  shippingAddress?: string;
  customerEmail?: string;
  whatsappNumber?: string;
  facebookProfileLink?: string;
  externalCustomerName?: string;
  externalCustomerPhone?: string;
  externalCustomerFacebookProfileLink?: string;
  notes?: string;
}
```
- **Allowed `source` values**:
  - `website`
  - `facebook`
  - `phone`
  - `physical_store`
  - `in_person`
  - `whatsapp`
  - `telegram`
  - `other`
- **Validation**:
  - Must be authenticated as an admin.
  - `items` is required and must contain at least one item.
  - Each item must include a valid product ID and a positive integer quantity.
  - Product existence is checked on the server.
  - Stock is validated against the product's current stock before the order is created.
  - No client-supplied price, product name, or subtotal is trusted. The backend loads the authoritative product record and calculates totals/profit server-side.
  - `shippingAddress`, `customerEmail`, `whatsappNumber`, and `facebookProfileLink` are optional for external/manual orders but are stored on the order if provided.
  - `externalCustomerName`, `externalCustomerPhone`, and `externalCustomerFacebookProfileLink` are optional additional fields used for non-website customers.
  - `status` defaults to `pending` if omitted.
- **Inventory behavior**:
  - If the order is valid, product stock is deducted in the same transaction as order creation.
  - A failed order creation must not leave product stock deducted.
  - The resulting document is a normal `Order` with a `source`, `items`, `subtotal`, `total`, `profit`, and `statusHistory`.
- **Success response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user": null,
    "source": "facebook",
    "items": [
      {
        "product": "productId",
        "name": "Example Product",
        "quantity": 2,
        "price": 1200,
        "costPrice": 700
      }
    ],
    "status": "completed",
    "subtotal": 2400,
    "total": 2400,
    "profit": 1000,
    "shippingAddress": "",
    "customerEmail": "",
    "whatsappNumber": "",
    "facebookProfileLink": "",
    "externalCustomerName": "John Doe",
    "externalCustomerPhone": "+8801712345678",
    "externalCustomerFacebookProfileLink": "https://facebook.com/john.doe",
    "statusHistory": [
      {
        "status": "completed",
        "note": "Manual order created",
        "changedAt": "2026-08-28T12:00:00.000Z"
      }
    ],
    "notes": "Customer called for pickup",
    "createdAt": "2026-08-28T12:00:00.000Z",
    "updatedAt": "2026-08-28T12:00:00.000Z"
  }
}
```
- **Common error responses**:
  - `401 Unauthorized` when no valid admin session is present.
  - `403 Forbidden` when the user does not have `role === 'admin'`.
  - `400 Bad Request` for invalid payloads or missing items.
  - `404 Not Found` when any selected product does not exist.
  - `400 Bad Request` when stock is insufficient for any selected product.
- **Notes**:
  - Manual orders are stored in the same `Order` collection as website orders.
  - Analytics naturally include completed manual orders because they are normal `Order` documents with valid `status`, `total`, `profit`, and `createdAt` values.
  - This route does not send customer notifications automatically. Status notifications continue to be sent only through the existing status update lifecycle.

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
