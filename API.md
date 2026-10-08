# Karachi Bites API Documentation

## Base URL
`http://localhost:3000/api`

## Endpoints

### 1. GET /api/menu
Retrieve the menu items.

**Request**
```
GET /api/menu
```

**Response**
- Status: 200 OK
- Body: Array of menu items
```json
[
  {
    "id": 1,
    "name": "Chicken Malai Boti",
    "price": 850,
    "category": "Main Course",
    "tags": "mild"
  },
  {
    "id": 2,
    "name": "Beef Seekh Kebab",
    "price": 780,
    "category": "Main Course",
    "tags": null
  }
  // ... more items
]
```

**Error Responses**
- 500 Internal Server Error: `{ "error": "Internal server error" }`

---

### 2. POST /api/orders
Create a new order.

**Request**
```
POST /api/orders
Content-Type: application/json
```
```json
{
  "customer": {
    "name": "Ali",
    "phone": "03001234567",
    "address": "Karachi address"
  },
  "branch": "Clifton",
  "items": [
    { "id": 1, "qty": 2 },
    { "id": 5, "qty": 1 }
  ]
}
```

**Validation**
- `customer.name`: required, string, 2-100 characters
- `customer.phone`: required, Pakistani mobile format (03XXXXXXXXX)
- `customer.address`: required, string, 5-500 characters
- `branch`: required, must be "Clifton"
- `items`: required, non-empty array
- Each item: `id` must exist in menu, `qty` must be positive integer (1-100)

**Response**
- Status: 201 Created
- Body:
```json
{
  "orderId": "KB-20261002-ABC123",
  "total": 1850,
  "status": "Received"
}
```

**Error Responses**
- 400 Bad Request: `{ "error": "Validation error message" }`
  - Missing/invalid customer.name
  - Missing/invalid customer.phone
  - Missing/invalid customer.address
  - Missing/invalid branch
  - Missing/invalid items
  - Invalid item ID
  - Invalid quantity
- 500 Internal Server Error: `{ "error": "Internal server error" }`

---

### 3. GET /api/orders/:id
Retrieve an order by its public ID.

**Request**
```
GET /api/orders/KB-20261002-ABC123
```

**Response**
- Status: 200 OK
- Body:
```json
{
  "orderId": "KB-20261002-ABC123",
  "status": "Received",
  "items": [
    {
      "id": 1,
      "name": "Chicken Malai Boti",
      "quantity": 2,
      "price": 850,
      "lineTotal": 1700
    }
  ],
  "total": 1850,
  "customer": {
    "name": "Ali",
    "phone": "03001234567",
    "address": "Karachi address"
  },
  "branch": "Clifton",
  "createdAt": "2026-10-02T10:30:00.000Z"
}
```

**Error Responses**
- 404 Not Found: `{ "error": "Order not found" }`
- 500 Internal Server Error: `{ "error": "Internal server error" }`

---

### 4. POST /api/auth/login
Authenticate admin/staff user and obtain JWT token.

**Request**
```
POST /api/auth/login
Content-Type: application/json
```
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**
- Status: 200 OK
- Body:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**
- 400 Bad Request: `{ "error": "Username and password are required" }`
- 401 Unauthorized: `{ "error": "Invalid credentials" }`
- 500 Internal Server Error: `{ "error": "Internal server error" }`

---

### 5. GET /api/admin/orders
Retrieve orders with optional filtering (admin only).

**Request**
```
GET /api/admin/orders?branch=Clifton&date=2026-10-02
Authorization: Bearer <token>
```

**Query Parameters**
- `branch`: optional, filter by branch
- `date`: optional, filter by date (YYYY-MM-DD)

**Response**
- Status: 200 OK
- Body: Array of order summaries
```json
[
  {
    "orderId": "KB-20261002-ABC123",
    "status": "Received",
    "total": 1850,
    "branch": "Clifton",
    "customer": {
      "name": "Ali",
      "phone": "03001234567",
      "address": "Karachi address"
    },
    "createdAt": "2026-10-02T10:30:00.000Z"
  }
]
```

**Error Responses**
- 401 Unauthorized: `{ "error": "Authentication required" }` or `{ "error": "Invalid or expired token" }`
- 403 Forbidden: `{ "error": "Admin access required" }`
- 500 Internal Server Error: `{ "error": "Internal server error" }`

---

### 6. PATCH /api/admin/orders/:id/status
Update order status (admin only).

**Request**
```
PATCH /api/admin/orders/KB-20261002-ABC123/status
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "status": "Preparing"
}
```

**Valid Status Transitions**
- Received → Preparing
- Preparing → Out for Delivery
- Out for Delivery → Delivered
- Delivered → (no further transitions)

**Response**
- Status: 200 OK
- Body:
```json
{
  "orderId": "KB-20261002-ABC123",
  "status": "Preparing"
}
```

**Error Responses**
- 400 Bad Request: 
  - `{ "error": "Status is required" }`
  - `{ "error": "Invalid status transition from Received to Delivered" }`
- 401 Unauthorized: `{ "error": "Authentication required" }` or `{ "error": "Invalid or expired token" }`
- 403 Forbidden: `{ "error": "Admin access required" }`
- 404 Not Found: `{ "error": "Order not found" }`
- 500 Internal Server Error: `{ "error": "Internal server error" }`

## Security
- All admin endpoints require valid JWT token in Authorization header: `Bearer <token>`
- Passwords are hashed using bcrypt (cost factor 10)
- JWT tokens are signed with a secret key and expire in 24 hours
- Input validation and sanitization on all endpoints
- Rate limiting: 100 requests per 15 minutes per IP
- Security headers via Helmet.js:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - X-DNS-Prefetch-Control: off
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Referrer-Policy: no-referrer-when-downgrade
- CORS: Not enabled by default (adjust as needed)

## Error Format
All error responses follow the format:
```json
{
  "error": "Human-readable error message"
}
```
No HTML error pages are returned from API routes.

## Database Persistence
- Uses SQLite database
- Data persists across server restarts
- Orders store prices at time of order (not affected by future menu price changes)