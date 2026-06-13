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
