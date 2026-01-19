import type { Request, Response } from "express";
import OrderModel, { IOrderDocument, OrderStatus } from "../models/order.model";
import User from "../models/user.model";
import ProductModel from "../models/product.model";
import { getCarts, clearUserCart, getUserCart } from "./cart.controller";
import { Cart } from "../models/cart.model";

/**
 * POST /api/orders
 * Create an order from the current user's cart
 * - Validates cart is not empty
 * - Creates order snapshot with current prices
 * - Clears cart after order creation
 */
async function createOrder(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;
    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== "string" || shippingAddress.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Access cart from in-memory storage
    const carts = getCarts();
    const cart = getUserCart(userId);

    // Validate cart exists and is not empty
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Add items before placing an order",
      });
    }

    // Create order items (snapshot of cart items with product details)
    const orderItems = await Promise.all(
      cart.items.map(async (cartItem) => {
        const product = await ProductModel.findById(cartItem.productId);

        if (!product) {
          throw new Error(`Product ${cartItem.productId} not found`);
        }

        return {
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.price, // Snapshot of price at order time
          productName: product.name,
          image: product.image || "",
        };
      })
    );

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order document
    const order = new OrderModel({
      userId,
      items: orderItems,
      totalAmount,
      status: "pending",
      shippingAddress: shippingAddress.trim(),
    });

    // Save order to database
    const savedOrder = await order.save();

    // Clear user's cart
    clearUserCart(userId);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: (error as Error).message,
    });
  }
}

/**
 * GET /api/orders
 * Get all orders for the authenticated user
 */
async function getUserOrders(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query filters
    const filter: any = { userId };

    if (status && typeof status === "string") {
      const validStatuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (validStatuses.includes(status as OrderStatus)) {
        filter.status = status;
      }
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Query orders
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await OrderModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: (error as Error).message,
    });
  }
}

/**
 * GET /api/orders/:id
 * Get a single order (owner only)
 */
async function getSingleOrder(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Fetch order
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own orders",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching single order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: (error as Error).message,
    });
  }
}

/**
 * PATCH /api/orders/:id/cancel
 * Cancel an order (owner only, only if status is pending)
 */
async function cancelOrder(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Fetch order
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    // Check if order is in pending status
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    // Update order status
    order.status = "cancelled";
    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        id: updatedOrder._id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: (error as Error).message,
    });
  }
}

/**
 * GET /api/admin/orders
 * Get all orders (admin only)
 */
async function getAllOrders(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Role check (admin only)
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { status, userId, page = 1, limit = 20 } = req.query;

    // Build query filters
    const filter: any = {};

    if (status && typeof status === "string") {
      const validStatuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
      if (validStatuses.includes(status as OrderStatus)) {
        filter.status = status;
      }
    }

    if (userId && typeof userId === "string") {
      filter.userId = userId;
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Query orders
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await OrderModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "All orders retrieved successfully",
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: (error as Error).message,
    });
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status (admin only)
 * Validates status transitions
 */
async function updateOrderStatus(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Role check (admin only)
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    const { status: newStatus } = req.body;

    // Validate status is provided
    if (!newStatus || typeof newStatus !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    // Validate status value
    const validStatuses: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(newStatus as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided",
      });
    }

    // Fetch order
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [], // Final status, cannot transition (except cancel, but cancelled orders shouldn't be undelivered)
      cancelled: [], // Final status
    };

    const currentStatus = order.status as OrderStatus;

    // Allow cancelled to remain cancelled or transition to any status if admin force (optional)
    if (currentStatus === "delivered" || currentStatus === "cancelled") {
      if (newStatus !== currentStatus && newStatus !== "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        });
      }
    } else if (!validTransitions[currentStatus].includes(newStatus as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      });
    }

    // Update order status
    order.status = newStatus as OrderStatus;
    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        id: updatedOrder._id,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: (error as Error).message,
    });
  }
}

export {
  createOrder,
  getUserOrders,
  getSingleOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
