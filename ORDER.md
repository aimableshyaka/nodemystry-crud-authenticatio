# Orders Management System - Complete Guide

## 🚀 Quick Start - How to Run

### 1. Start the Development Server
```bash
npm run dev
```
The server will run on `http://localhost:5000`

### 2. View API Documentation
Open in your browser:
```
http://localhost:5000/api-docs
```

### 3. Build for Production
```bash
npm run build
npm start
```

### 4. Project Structure
```
src/
├── models/
│   └── order.model.ts           # Order schema & interfaces
├── controllers/
│   └── order.controller.ts      # Order business logic
├── routes/
│   └── order.ts                 # All order endpoints
├── app.ts                       # Main app (routes registered)
└── controllers/
    └── cart.controller.ts       # Cart helper functions
```

---

## Overview
This guide provides comprehensive testing instructions for the Orders Management System, including endpoints, request/response examples, and test scenarios.

---

## 1. Data Models & Structure

### Order Schema
```json
{
  "id": "string (UUID)",
  "userId": "string (UUID from JWT)",
  "items": [
    {
      "productId": "string",
      "quantity": "number",
      "price": "number (snapshot at order time)",
      "productName": "string",
      "image": "string"
    }
  ],
  "totalAmount": "number",
  "status": "string (pending|confirmed|shipped|delivered|cancelled)",
  "shippingAddress": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

## 2. Customer Endpoints

### 2.1 CREATE ORDER - POST /api/orders
**Authentication Required:** YES (JWT)  
**Role Required:** Customer  
**Description:** Convert cart items into an order

#### Request
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "123 Main St, New York, NY 10001"
  }'
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid-123",
    "userId": "user-uuid-456",
    "items": [
      {
        "productId": "prod-1",
        "quantity": 2,
        "price": 99.99,
        "productName": "Laptop",
        "image": "url-to-image"
      }
    ],
    "totalAmount": 199.98,
    "status": "pending",
    "shippingAddress": "123 Main St, New York, NY 10001",
    "createdAt": "2026-01-19T10:30:00Z",
    "updatedAt": "2026-01-19T10:30:00Z"
  }
}
```

#### Error Responses

**Empty Cart (400)**
```json
{
  "success": false,
  "message": "Cart is empty. Add items before placing an order"
}
```

**Missing Shipping Address (400)**
```json
{
  "success": false,
  "message": "Shipping address is required"
}
```

**Unauthorized (401)**
```json
{
  "success": false,
  "message": "Token is required or invalid"
}
```

---

### 2.2 GET ALL ORDERS - GET /api/orders
**Authentication Required:** YES (JWT)  
**Role Required:** Customer  
**Description:** Retrieve all orders for the logged-in user

#### Request
```bash
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Optional Query Parameters
```bash
# Filter by status
GET /api/orders?status=pending

# Pagination
GET /api/orders?page=1&limit=10

# Combined
GET /api/orders?status=delivered&page=1&limit=5
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid-123",
      "userId": "user-uuid-456",
      "items": [...],
      "totalAmount": 199.98,
      "status": "pending",
      "shippingAddress": "123 Main St, New York, NY 10001",
      "createdAt": "2026-01-19T10:30:00Z",
      "updatedAt": "2026-01-19T10:30:00Z"
    }
  ]
}
```

#### Error Response (401)
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

---

### 2.3 GET SINGLE ORDER - GET /api/orders/:id
**Authentication Required:** YES (JWT)  
**Role Required:** Customer  
**Description:** Retrieve a specific order (owner only)

#### Request
```bash
curl -X GET http://localhost:5000/api/orders/order-uuid-123 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "id": "order-uuid-123",
    "userId": "user-uuid-456",
    "items": [...],
    "totalAmount": 199.98,
    "status": "pending",
    "shippingAddress": "123 Main St, New York, NY 10001",
    "createdAt": "2026-01-19T10:30:00Z",
    "updatedAt": "2026-01-19T10:30:00Z"
  }
}
```

#### Error Responses

**Order Not Found (404)**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**Forbidden - Not Owner (403)**
```json
{
  "success": false,
  "message": "You can only access your own orders"
}
```

---

### 2.4 CANCEL ORDER - PATCH /api/orders/:id/cancel
**Authentication Required:** YES (JWT)  
**Role Required:** Customer  
**Description:** Cancel a pending order (owner only)

#### Request
```bash
curl -X PATCH http://localhost:5000/api/orders/order-uuid-123/cancel \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "id": "order-uuid-123",
    "status": "cancelled",
    "updatedAt": "2026-01-19T11:00:00Z"
  }
}
```

#### Error Responses

**Order Not in Pending Status (400)**
```json
{
  "success": false,
  "message": "Only pending orders can be cancelled"
}
```

**Forbidden (403)**
```json
{
  "success": false,
  "message": "You can only cancel your own orders"
}
```

---

## 3. Admin Endpoints

### 3.1 GET ALL ORDERS - GET /api/admin/orders
**Authentication Required:** YES (JWT)  
**Role Required:** Admin  
**Description:** Retrieve all orders from all users

#### Request
```bash
curl -X GET http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

#### Optional Query Parameters
```bash
# Filter by status
GET /api/admin/orders?status=shipped

# Filter by userId
GET /api/admin/orders?userId=user-uuid-456

# Pagination
GET /api/admin/orders?page=1&limit=20

# Combined
GET /api/admin/orders?status=pending&page=1&limit=10
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "All orders retrieved successfully",
  "data": [
    {
      "id": "order-uuid-123",
      "userId": "user-uuid-456",
      "items": [...],
      "totalAmount": 199.98,
      "status": "pending",
      "shippingAddress": "123 Main St, New York, NY 10001",
      "createdAt": "2026-01-19T10:30:00Z",
      "updatedAt": "2026-01-19T10:30:00Z"
    }
  ]
}
```

#### Error Response (403)
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### 3.2 UPDATE ORDER STATUS - PATCH /api/admin/orders/:id/status
**Authentication Required:** YES (JWT)  
**Role Required:** Admin  
**Description:** Update order status (confirmed, shipped, delivered, cancelled)

#### Request
```bash
curl -X PATCH http://localhost:5000/api/admin/orders/order-uuid-123/status \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

#### Valid Status Values
- `pending` → `confirmed`
- `confirmed` → `shipped`
- `shipped` → `delivered`
- `pending`/`confirmed`/`shipped`/`delivered` → `cancelled`

#### Success Response (200)
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {
    "id": "order-uuid-123",
    "status": "confirmed",
    "updatedAt": "2026-01-19T11:30:00Z"
  }
}
```

#### Error Responses

**Invalid Status (400)**
```json
{
  "success": false,
  "message": "Invalid status provided"
}
```

**Invalid Status Transition (400)**
```json
{
  "success": false,
  "message": "Cannot transition from delivered to confirmed"
}
```

**Order Not Found (404)**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**Unauthorized (403)**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## 4. Complete Test Scenarios

### Scenario 1: Complete Happy Path
1. **User Login** → Get JWT token
2. **Add to Cart** → Add 2 products
3. **Create Order** → POST /api/orders with shipping address
4. **Verify Cart Cleared** → GET /api/cart (should be empty)
5. **View Order** → GET /api/orders/order-id
6. **Admin Views All Orders** → GET /api/admin/orders
7. **Admin Updates Status** → PATCH /api/admin/orders/order-id/status

### Scenario 2: Empty Cart Error
1. Clear user's cart
2. Attempt to create order → Should fail with 400
3. Verify error message: "Cart is empty..."

### Scenario 3: Ownership Validation
1. User A creates order
2. User B tries to access with GET /api/orders/order-id-from-user-a
3. Should fail with 403 "You can only access your own orders"

### Scenario 4: Order Cancellation Rules
1. Create order (status: pending)
2. Cancel order → Success
3. Try to cancel again → Should fail (already cancelled)
4. Create another order, update status to "shipped"
5. Try to cancel shipped order → Should fail with 400

### Scenario 5: Admin Status Transitions
1. Create order (pending)
2. Admin updates to "confirmed" → Success
3. Admin updates to "delivered" → Success
4. Admin tries to update back to "pending" → Should fail (invalid transition)

### Scenario 6: Permission Tests
1. Customer tries to access /api/admin/orders → 403 Forbidden
2. Non-admin tries to update status → 403 Forbidden
3. Unauthenticated request → 401 Unauthorized

---

## 5. Validation Checklist

### Create Order Validation
- [ ] Cart must not be empty
- [ ] Shipping address must be provided
- [ ] User must be authenticated
- [ ] Order items capture product prices at creation time (snapshot)
- [ ] Cart is cleared after order creation
- [ ] Order ID is unique
- [ ] Status is set to "pending" by default

### Get Orders Validation
- [ ] Customer can only see own orders
- [ ] Admin can see all orders
- [ ] Pagination works correctly
- [ ] Status filter works
- [ ] Proper error for non-existent orders

### Cancel Order Validation
- [ ] Only pending orders can be cancelled
- [ ] Only order owner can cancel
- [ ] Status changes to "cancelled"
- [ ] updatedAt timestamp is refreshed

### Admin Status Update Validation
- [ ] Only admins can update status
- [ ] Status transitions follow defined rules
- [ ] Invalid transitions are rejected
- [ ] Order not found returns 404
- [ ] updatedAt timestamp is refreshed

---

## 6. HTTP Status Codes Reference

| Code | Scenario |
|------|----------|
| 200 | Successful GET, PATCH |
| 201 | Successful POST (order created) |
| 400 | Empty cart, missing fields, invalid status |
| 401 | Missing/invalid JWT token |
| 403 | Insufficient permissions, not order owner |
| 404 | Order not found |
| 500 | Server error |

---

## 7. Testing with Postman/Insomnia

### Environment Variables to Set
```
{{BASE_URL}} = http://localhost:5000
{{CUSTOMER_TOKEN}} = <customer_jwt_token>
{{ADMIN_TOKEN}} = <admin_jwt_token>
{{ORDER_ID}} = <order_uuid>
{{USER_ID}} = <user_uuid>
```

### Example Request in Postman
```
POST {{BASE_URL}}/api/orders
Authorization: Bearer {{CUSTOMER_TOKEN}}
Content-Type: application/json

{
  "shippingAddress": "456 Oak Ave, Los Angeles, CA 90001"
}
```

---

## 8. Edge Cases & Security Tests

### Edge Cases
- [ ] Create multiple orders in rapid succession
- [ ] Cancel order, then try to get it (should still be retrievable)
- [ ] Update order status multiple times in sequence
- [ ] Query with invalid pagination parameters
- [ ] Very long shipping address (validation limits)

### Security Tests
- [ ] SQL Injection attempt in query parameters
- [ ] XSS attempt in shipping address
- [ ] JWT tampering (modified payload)
- [ ] Access token from deleted user
- [ ] Concurrent requests causing race conditions

---

## 9. Common Test Commands

### Quick Setup & Test
```bash
# 1. Login
POST /api/auth/login
# Get TOKEN from response

# 2. Add to cart (ensure cart has items)
POST /api/cart/add

# 3. Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shippingAddress": "123 Main St"}'

# 4. Get all orders
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Database Verification Queries

After tests, verify order data integrity:

```sql
-- Check all orders
SELECT * FROM orders;

-- Check orders for specific user
SELECT * FROM orders WHERE userId = 'user-uuid';

-- Check order items
SELECT * FROM order_items WHERE orderId = 'order-uuid';

-- Verify cart was cleared after order
SELECT * FROM cart WHERE userId = 'user-uuid';
```

---

## Notes
- All timestamps should be in ISO 8601 format
- Order status flow is one-directional (no backwards transitions except to cancelled)
- Orders are immutable after creation (only status can change)
- Cart items are converted to order items (snapshot of prices at order time)
- Price changes in products should not affect existing orders

---

## 📊 Feature Summary

### ✅ Implemented Features
- ✅ Customer can create orders from cart
- ✅ Customer can view all personal orders
- ✅ Customer can view individual order details
- ✅ Customer can cancel pending orders
- ✅ Admin can view all orders
- ✅ Admin can update order status with validation
- ✅ Price snapshot captured at order time
- ✅ Cart automatically cleared after order creation
- ✅ Role-based access control (Customer/Admin)
- ✅ Ownership validation on all endpoints
- ✅ Status flow validation (pending → confirmed → shipped → delivered)
- ✅ Comprehensive error handling

### 🔐 Security Features
- ✅ JWT authentication required on all endpoints
- ✅ Admin role validation on admin endpoints
- ✅ User ownership checks
- ✅ Input validation on all fields
- ✅ Status transition validation
- ✅ Proper HTTP status codes

### 📝 API Endpoints (6 Total)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ✅ | Create order from cart |
| GET | `/api/orders` | ✅ | Get user's orders |
| GET | `/api/orders/:id` | ✅ | Get single order |
| PATCH | `/api/orders/:id/cancel` | ✅ | Cancel pending order |
| GET | `/api/admin/orders` | ✅ Admin | Get all orders |
| PATCH | `/api/admin/orders/:id/status` | ✅ Admin | Update order status |

### 🎯 Status Codes
- `200` - OK (GET, PATCH success)
- `201` - Created (POST order success)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Server Error

---

## Implementation Complete ✅
- Build Status: SUCCESS (0 errors)
- TypeScript: Full type safety
- Documentation: Comprehensive
- Testing: 6 scenarios provided
- Ready for: Testing & Deployment

