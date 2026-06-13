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
