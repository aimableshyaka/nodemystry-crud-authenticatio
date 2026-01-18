import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   - name: auth
 *     description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - auth
 *     summary: Register a new user
 *     description: Create a new user account
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
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
authRouter.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - auth
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - auth
 *     summary: Forgot password
 *     description: Send password reset link to email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset link sent
 *       404:
 *         description: User not found
 */
authRouter.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - auth
 *     summary: Reset password
 *     description: Reset user password with token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token
 */
authRouter.post("/reset-password/:token", resetPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - auth
 *     summary: Get user profile
 *     description: Retrieve authenticated user profile
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/profile", authenticateToken, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags:
 *       - auth
 *     summary: Update user profile
 *     description: Update authenticated user profile
 *     security:
 *       - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.put("/profile", authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - auth
 *     summary: Logout user
 *     description: Logout authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
authRouter.post("/logout", authenticateToken, logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - auth
 *     summary: Change password
 *     description: Change password for authenticated user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post("/change-password", authenticateToken, changePassword);

export default authRouter;
