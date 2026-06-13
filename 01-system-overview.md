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
