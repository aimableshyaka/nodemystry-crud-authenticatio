import type { Request, Response } from "express";
import { Cart, CartItem } from "../models/cart.model";
import { randomUUID } from "node:crypto";
import ProductModel from "../models/product.model";

// In-memory storage for carts
const carts: Cart[] = [];

// GET /api/cart - Get user's cart
async function getCart(req: Request, res: Response) {
  // Authentication check
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userId = req.user.userId;
  const cart = carts.find(c => c.userId === userId);

  if (!cart) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  return res.status(200).json({ cart });
}

// POST /api/cart/items - Add item to cart
async function addItemToCart(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        error: "productId and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    // Fetch product to get current price
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.inStock || product.quantity < quantity) {
      return res.status(400).json({ error: "Product is out of stock or insufficient quantity" });
    }

    let cart = carts.find(c => c.userId === userId);

    // Create cart if it doesn't exist
    if (!cart) {
      cart = {
        id: randomUUID(),
        userId: userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      carts.push(cart);
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price; // Update to current price
    } else {
      const newItem: CartItem = {
        id: randomUUID(),
        productId,
        quantity,
        price: product.price, // Use product price from database
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date();

    return res.status(201).json({
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
}

// PUT /api/cart/items/:id - Update cart item
async function updateCartItem(req: Request, res: Response) {
  try {
    // Authentication check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
      return res.status(400).json({
        error: "Quantity is required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const cart = carts.find(c => c.userId === userId);

  if (!cart) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  const cartItem = cart.items.find(item => item.id === id);

  if (!cartItem) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // Fetch product to get current price
    const product = await ProductModel.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update quantity and price
    cartItem.quantity = quantity;
    cartItem.price = product.price; // Always use current product price

    cart.updatedAt = new Date();

    return res.status(200).json({
      message: "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update cart item" });
  }
}

// DELETE /api/cart/items/:id - Delete specific item from cart
function deleteCartItem(req: Request, res: Response) {
  // Authentication check
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userId = req.user.userId;
  const { id } = req.params;

  const cart = carts.find(c => c.userId === userId);

  if (!cart) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  const itemIndex = cart.items.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: "Item not found in cart" });
  }

  cart.items.splice(itemIndex, 1);
  cart.updatedAt = new Date();

  return res.status(200).json({
    message: "Item removed from cart successfully",
    cart,
  });
}

// DELETE /api/cart - Delete entire cart
function deleteCart(req: Request, res: Response) {
  // Authentication check
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const userId = req.user.userId;

  const cartIndex = carts.findIndex(c => c.userId === userId);

  if (cartIndex === -1) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  const deletedCart = carts.splice(cartIndex, 1);

  return res.status(200).json({
    message: "Cart deleted successfully",
    cart: deletedCart[0],
  });
}

// Export carts array for access by other controllers (e.g., orders)
export function getCarts(): Cart[] {
  return carts;
}

export function clearUserCart(userId: string): void {
  const cartIndex = carts.findIndex(c => c.userId === userId);
  if (cartIndex !== -1) {
    carts.splice(cartIndex, 1);
  }
}

export function getUserCart(userId: string): Cart | undefined {
  return carts.find(c => c.userId === userId);
}

export {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
};
