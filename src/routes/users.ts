import express from "express";
import {
  getAlluser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: users
 *     description: User management endpoints
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - users
 *     summary: Get all users
 *     description: Retrieve all users from the database
 *     responses:
 *       200:
 *         description: List of all users
 *       500:
 *         description: Server error
 */
userRouter.get("/", getAlluser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - users
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
userRouter.get("/:id", getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags:
 *       - users
 *     summary: Create new user
 *     description: Add a new user to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, vendor, admin]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
userRouter.post("/", createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - users
 *     summary: Update user
 *     description: Update user information
 *     parameters:
 *       - in: path
 *         name: id
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
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, vendor, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
userRouter.put("/:id", updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - users
 *     summary: Delete user
 *     description: Remove a user from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
userRouter.delete("/:id", deleteUser);

export default userRouter;