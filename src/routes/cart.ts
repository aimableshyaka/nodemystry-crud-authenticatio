import Express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
} from "../controllers/cart.controller";

const cartRoute = Express.Router();

/**
 * @swagger
 * tags:
 *   - name: cart
 *     description: Shopping cart management endpoints
 */

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     tags:
 *       - cart
 *     summary: Get user cart
 *     description: Retrieve shopping cart for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart items retrieved
 *       404:
 *         description: Cart not found
 */
cartRoute.get("/cart/:userId", getCart);

/**
 * @swagger
 * /api/cart/{userId}/items:
 *   post:
 *     tags:
 *       - cart
 *     summary: Add item to cart
 *     description: Add a product to user's shopping cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Bad request
 */
cartRoute.post("/cart/:userId/items", addItemToCart);

/**
 * @swagger
 * /api/cart/{userId}/items/{id}:
 *   put:
 *     tags:
 *       - cart
 *     summary: Update cart item
 *     description: Update quantity of an item in the cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cart item updated
 *       404:
 *         description: Item not found
 */
cartRoute.put("/cart/:userId/items/:id", updateCartItem);

/**
 * @swagger
 * /api/cart/{userId}/items/{id}:
 *   delete:
 *     tags:
 *       - cart
 *     summary: Delete cart item
 *     description: Remove an item from the shopping cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Item not found
 */
cartRoute.delete("/cart/:userId/items/:id", deleteCartItem);

/**
 * @swagger
 * /api/cart/{userId}:
 *   delete:
 *     tags:
 *       - cart
 *     summary: Delete entire cart
 *     description: Clear all items from the shopping cart
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       404:
 *         description: Cart not found
 */
cartRoute.delete("/cart/:userId", deleteCart);

export default cartRoute;
