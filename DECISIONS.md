# Karachi Bites Backend Design Decisions

## Validation and Security

### Input Validation
All customer inputs are validated on the server side. Never trust the client.

**Phone Number Validation**
- Format: 03XXXXXXXXX (11 digits starting with 03)
- Reason: Standard Pakistani mobile numbers (e.g., Jazz, Warid, Zong, Telenor)
- Regex: `/^03\d{9}$/`

**Name Validation**
- Length: 2-100 characters
- Reason: Prevent excessively short or long names that could cause UI/storage issues

**Address Validation**
- Length: 5-500 characters
- Reason: Ensure minimum meaningful length while allowing detailed addresses

**Quantity Validation**
- Range: 1-100
- Reason: Prevent abuse while allowing reasonable bulk orders

**Branch Validation**
- Only "Clifton" is currently supported
- Reason: Simplicity for initial deployment; easily extensible

### Authentication and Authorization
- JWT (JSON Web Tokens) used for stateless authentication
- Secret key stored in environment variable (never hardcoded)
- Passwords hashed using bcrypt with cost factor 10
- Admin routes require role = 'admin'
- Staff can login but cannot access admin routes (403 Forbidden)
- Tokens expire in 24 hours to balance security and usability

### Password Handling
- Never store plaintext passwords
- Never return password hashes in API responses
- Use bcrypt for secure password hashing
- Environment variable for admin/default passwords in seed data (should be changed in production)

### SQL Injection Prevention
- Use parameterized queries via sqlite3 library
- Never concatenate user input into SQL strings

### Error Handling
- Consistent JSON error format: `{ "error": "message" }`
- Never leak stack traces or internal details in error responses
- Log errors server-side for debugging
- Return appropriate HTTP status codes:
  - 400: Client errors (validation)
  - 401: Authentication required
  - 403: Forbidden (insufficient permissions)
  - 404: Resource not found
  - 429: Rate limit exceeded (via express-rate-limit)
  - 500: Server errors

### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents brute-force attacks and abuse
- Implemented using express-rate-limit middleware

### Security Headers
- Helmet.js middleware to set various HTTP headers:
  - X-DNS-Prefetch-Control
  - X-Frame-Options
  - X-Powered-By
  - X-XSS-Protection
  - Strict-Transport-Security (if HTTPS)
  - Content-Security-Policy
  - And others

### Database Design
- Separate tables for menu_items, branches, users, orders, order_items
- Orders store prices at time of order (price_at_order) to preserve historical accuracy
- Order items store name_at_order for same reason
- Foreign key constraints with CASCADE DELETE for order items
- Indexes on frequently queried fields (public_order_id, branch, status, created_at)

### Status Transition Enforcement
- Hardcoded valid status transitions:
  - Received → Preparing
  - Preparing → Out for Delivery
  - Out for Delivery → Delivered
  - Delivered → (terminal state)
- Prevents invalid workflows (e.g., jumping from Received to Delivered)
- Enforced in both service layer and route handler

### Delivery Fee
- Fixed delivery fee of Rs. 150 per order
- Calculated server-side: total = subtotal + delivery fee
- Never trust delivery fee or total sent by client

### Public Order ID Generation
- Format: KB-YYYYMMDD-XXXXXX
  - KB: Karachi Bites prefix
  - YYYYMMDD: Current date
  - XXXXXX: 6-character uppercase random string
- Generated server-side, never from client
- Ensures uniqueness and readability

### Environment Configuration
- .env file for development (never commit production secrets)
- Environment variables for:
  - PORT
  - NODE_ENV
  - JWT_SECRET (must be strong and changed in production)
  - DATABASE_PATH
  - DELIVERY_FEE
- Default values provided for development only

### Testing Approach
- Automated tests for success and failure cases
- Test database persistence across server restarts
- Test authentication and authorization
- Test validation rules
- Test status transition enforcement
- Tests run against actual server instance (not mocked)

### Extensibility
- Adding new menu items: Insert into menu_items table
- Adding new branches: Insert into branches table
- Adding new user roles: Modify validation and auth logic as needed
- Adding new statuses: Update VALID_STATUS and VALID_TRANSITIONS in validate.js
- Changing delivery fee: Update DELIVERY_FEE in .env