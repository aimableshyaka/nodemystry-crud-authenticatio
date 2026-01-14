import type { Request, Response } from "express";
import { Cart, CartItem } from "../models/cart.model";
import { randomUUID } from "node:crypto";

// In-memory storage for carts
const carts: Cart[] = [];

// GET /api/cart/:userId - Get user's cart
function getCart(req: Request, res: Response) {
  const { userId } = req.params;

  const cart = carts.find(c => c.userId === Number(userId));

  if (!cart) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  return res.status(200).json({ cart });
}

// POST /api/cart/:userId/items - Add item to cart
function addItemToCart(req: Request, res: Response) {
  const { userId } = req.params;
  const { productId, quantity, price } = req.body;

  if (!productId || !quantity || !price) {
    return res.status(400).json({
      error: "productId, quantity, and price are required",
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0" });
  }

  let cart = carts.find(c => c.userId === Number(userId));

  // Create cart if it doesn't exist
  if (!cart) {
    cart = {
      id: randomUUID(),
      userId: Number(userId),
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
  } else {
    const newItem: CartItem = {
      id: randomUUID(),
      productId,
      quantity,
      price,
    };
    cart.items.push(newItem);
  }

  cart.updatedAt = new Date();

  return res.status(201).json({
    message: "Item added to cart successfully",
    cart,
  });
}

// PUT /api/cart/:userId/items/:id - Update cart item
function updateCartItem(req: Request, res: Response) {
  const { userId, id } = req.params;
  const { quantity, price } = req.body;

  if (!quantity && price === undefined) {
    return res.status(400).json({
      error: "At least one of quantity or price must be provided",
    });
  }

  if (quantity !== undefined && quantity <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0" });
  }

  const cart = carts.find(c => c.userId === Number(userId));

  if (!cart) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  const cartItem = cart.items.find(item => item.id === id);

  if (!cartItem) {
    return res.status(404).json({ error: "Item not found in cart" });
  }

  if (quantity !== undefined) {
    cartItem.quantity = quantity;
  }

  if (price !== undefined) {
    cartItem.price = price;
  }

  cart.updatedAt = new Date();

  return res.status(200).json({
    message: "Cart item updated successfully",
    cart,
  });
}

// DELETE /api/cart/:userId/items/:id - Delete specific item from cart
function deleteCartItem(req: Request, res: Response) {
  const { userId, id } = req.params;

  const cart = carts.find(c => c.userId === Number(userId));

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

// DELETE /api/cart/:userId - Delete entire cart
function deleteCart(req: Request, res: Response) {
  const { userId } = req.params;

  const cartIndex = carts.findIndex(c => c.userId === Number(userId));

  if (cartIndex === -1) {
    return res.status(404).json({ error: "Cart not found for this user" });
  }

  const deletedCart = carts.splice(cartIndex, 1);

  return res.status(200).json({
    message: "Cart deleted successfully",
    cart: deletedCart[0],
  });
}

export {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
};
