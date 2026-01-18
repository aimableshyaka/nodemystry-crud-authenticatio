import express from "express";
import { getCategory, addCategory, updateCategory, deleteCategory } from "../controllers/category.controller";

const categoryRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: category
 *     description: Category management endpoints
 */

/**
 * @swagger
 * /api/category:
 *   get:
 *     tags:
 *       - category
 *     summary: Get all categories
 *     description: Retrieve all product categories
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Server error
 */
categoryRouter.get("/category", getCategory);

/**
 * @swagger
 * /api/category:
 *   post:
 *     tags:
 *       - category
 *     summary: Create new category
 *     description: Add a new product category (Admin only)
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
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 */
categoryRouter.post("/category", addCategory);

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     tags:
 *       - category
 *     summary: Update category
 *     description: Update category information (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.put("/category/:id", updateCategory);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     tags:
 *       - category
 *     summary: Delete category
 *     description: Remove a category (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
categoryRouter.delete("/category/:id", deleteCategory);

export default categoryRouter;

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Category ID
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Electronics"
 */

