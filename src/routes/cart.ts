import Express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
} from "../controllers/cart.controller";

const cartRoute = Express.Router();

// GET    /api/cart/:userId
cartRoute.get("/cart/:userId", getCart);

// POST   /api/cart/:userId/items
cartRoute.post("/cart/:userId/items", addItemToCart);

// PUT    /api/cart/:userId/items/:id
cartRoute.put("/cart/:userId/items/:id", updateCartItem);

// DELETE /api/cart/:userId/items/:id
cartRoute.delete("/cart/:userId/items/:id", deleteCartItem);

// DELETE /api/cart/:userId
cartRoute.delete("/cart/:userId", deleteCart);

export default cartRoute;
