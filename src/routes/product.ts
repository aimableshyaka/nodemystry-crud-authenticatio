import Express from "express";
import { getProduct, addProduct, getProductById, updateProduct, deleteProduct } from "../controllers/product.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const productRoute = Express.Router();

/**
 * @swagger
 * tags:
 *   - name: product
 *     description: Product management endpoints
 */

/**
 * @swagger
 * /api/product:
 *   get:
 *     tags:
 *       - product
 *     summary: Get all products
 *     description: Retrieve all products from the database
 *     responses:
 *       200:
 *         description: List of products
 *       500:
 *         description: Server error
 */
productRoute.get("/product", getProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - product
 *     summary: Get product by ID
 *     description: Retrieve a specific product by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
productRoute.get("/products/:id", getProductById);

/**
 * @swagger
 * /api/product:
 *   post:
 *     tags:
 *       - product
 *     summary: Create new product
 *     description: Add a new product (Vendor or Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 */
productRoute.post("/product", authenticateToken, addProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     tags:
 *       - product
 *     summary: Update product
 *     description: Update product details (Vendor or Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
productRoute.put("/product/:id", authenticateToken, updateProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   delete:
 *     tags:
 *       - product
 *     summary: Delete product
 *     description: Delete a product (Vendor or Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
productRoute.delete("/product/:id", authenticateToken, deleteProduct);

export default productRoute;