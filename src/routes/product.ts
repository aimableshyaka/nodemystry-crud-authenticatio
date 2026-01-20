import Express from "express";
import { getProduct, addProduct, getProductById, updateProduct, deleteProduct } from "../controllers/product.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import upload from "../middlewares/uploads.middleware"

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
 *     description: Add a new product (Vendor or Admin only). User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Google Pixel 8 Pro"
 *               description:
 *                 type: string
 *                 example: "Android smartphone with advanced camera"
 *               price:
 *                 type: number
 *                 example: 999
 *               quantity:
 *                 type: number
 *                 example: 50
 *               inStock:
 *                 type: boolean
 *                 example: true
 *               categoryId:
 *                 type: string
 *                 example: "696d53972fe1f2dcabee19bd"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only vendors and admins can create products
 */
productRoute.post("/product", authenticateToken,upload.single("image"), addProduct);

/**
 * @swagger
 * /api/product/{id}:
 *   put:
 *     tags:
 *       - product
 *     summary: Update product
 *     description: Update product details (Vendor or Admin only). Vendors can only update their own products. User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "696d53972fe1f2dcabee19bd"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Google Pixel 8 Pro (Updated)"
 *               description:
 *                 type: string
 *                 example: "Android smartphone with AI features"
 *               price:
 *                 type: number
 *                 example: 899
 *               quantity:
 *                 type: number
 *                 example: 75
 *               inStock:
 *                 type: boolean
 *                 example: true
 *               categoryId:
 *                 type: string
 *                 example: "696d53972fe1f2dcabee19bd"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to update this product
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
 *     description: Delete a product (Vendor or Admin only). Vendors can only delete their own products. User ID is automatically extracted from JWT token.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "696d53972fe1f2dcabee19bd"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not authorized to delete this product
 *       404:
 *         description: Product not found
 */
productRoute.delete("/product/:id", authenticateToken, deleteProduct);

export default productRoute;
