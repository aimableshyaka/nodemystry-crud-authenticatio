import Express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  deleteCart,
} from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const cartRoute = Express.Router();

/**
 * @swagger
 * tags:
 *   - name: cart
 *     description: Shopping cart management endpoints
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     tags:
 *       - cart
 *     summary: Get user cart
 *     description: Retrieve shopping cart for authenticated user. User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart items retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cart:
 *                   type: object
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Cart not found
 */
cartRoute.get("/cart", authenticateToken, getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     tags:
 *       - cart
 *     summary: Add item to cart
 *     description: Add a product to authenticated user's shopping cart. User ID is automatically extracted from JWT token. Product price is fetched automatically from the database.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "696d53972fe1f2dcabee19bd"
 *                 description: The product ID to add to cart
 *               quantity:
 *                 type: number
 *                 example: 2
 *                 description: Number of items to add
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       400:
 *         description: Bad request - Missing required fields or invalid quantity
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Product not found
 */
cartRoute.post("/cart/items", authenticateToken, addItemToCart);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   put:
 *     tags:
 *       - cart
 *     summary: Update cart item
 *     description: Update quantity of an item in the cart. User ID is automatically extracted from JWT token. Product price is automatically updated to the current price.
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 example: 3
 *                 description: New quantity for the cart item
 *     responses:
 *       200:
 *         description: Cart item updated
 *       400:
 *         description: Bad request - Invalid quantity
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Item or product not found
 */
cartRoute.put("/cart/items/:id", authenticateToken, updateCartItem);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     tags:
 *       - cart
 *     summary: Delete cart item
 *     description: Remove an item from the authenticated user's shopping cart. User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Item not found
 */
cartRoute.delete("/cart/items/:id", authenticateToken, deleteCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     tags:
 *       - cart
 *     summary: Delete entire cart
 *     description: Clear all items from the authenticated user's shopping cart. User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Cart not found
 */
cartRoute.delete("/cart", authenticateToken, deleteCart);

export default cartRoute;
