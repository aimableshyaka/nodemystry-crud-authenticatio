import express from "express";
import {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorization.middleware";

const orderRoute = express.Router();

/**
 * @swagger
 * tags:
 *   - name: orders
 *     description: Order management endpoints (authenticated)
 */

// ==================== CUSTOMER ROUTES ====================

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - orders
 *     summary: Create order from cart
 *     description: Convert user's cart items into an order. Cart is cleared after successful order creation.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: string
 *                 description: Full shipping address (min 10 chars, max 500 chars)
 *                 example: "123 Main St, New York, NY 10001"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart empty or invalid shipping address
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.post("/orders", authenticateToken, createOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - orders
 *     summary: Get all user orders
 *     description: Retrieve all orders for the authenticated user with optional filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.get("/orders", authenticateToken, getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - orders
 *     summary: Get single order
 *     description: Retrieve a specific order (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       403:
 *         description: Forbidden - you can only access your own orders
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.get("/orders/:id", authenticateToken, getSingleOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     tags:
 *       - orders
 *     summary: Cancel order
 *     description: Cancel a pending order (owner only). Only pending orders can be cancelled.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order is not in pending status
 *       403:
 *         description: Forbidden - you can only cancel your own orders
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.patch("/orders/:id/cancel", authenticateToken, cancelOrder);

// ==================== ADMIN ROUTES ====================

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     tags:
 *       - orders
 *     summary: Get all orders (admin)
 *     description: Retrieve all orders from all users with optional filtering and pagination. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipped, delivered, cancelled]
 *         description: Filter orders by status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter orders by specific user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: All orders retrieved successfully
 *       403:
 *         description: Forbidden - admin access required
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.get("/admin/orders", authenticateToken, authorize(["admin"]), getAllOrders);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     tags:
 *       - orders
 *     summary: Update order status (admin)
 *     description: Update order status with validation of status transitions. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipped, delivered, cancelled]
 *                 description: New order status
 *                 example: "confirmed"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status or invalid status transition
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
orderRoute.patch("/admin/orders/:id/status", authenticateToken, authorize(["admin"]), updateOrderStatus);

export default orderRoute;
