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
 *     description: Add a product to user's shopping cart. Note - In production, userId should come from authenticated session/token instead of path parameter.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *               - price
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "696d53972fe1f2dcabee19bd"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               price:
 *                 type: number
 *                 example: 999
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Bad request - Missing required fields
 */
cartRoute.post("/cart/:userId/items", addItemToCart);

/**
 * @swagger
 * /api/cart/{userId}/items/{id}:
 *   put:
 *     tags:
 *       - cart
 *     summary: Update cart item
 *     description: Update quantity or price of an item in the cart. Note - In production, userId should come from authenticated session/token instead of path parameter.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "123"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3
 *               price:
 *                 type: number
 *                 example: 899
 *     responses:
 *       200:
 *         description: Cart item updated
 *       400:
 *         description: Bad request - Invalid data
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
