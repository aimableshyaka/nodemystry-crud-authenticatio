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
 *     summary: Forgot password - Send reset link to email
 *     description: Request password reset. A reset link will be sent to your email (valid for 1 hour)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *                 description: The email address associated with your account
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       400:
 *         description: Email is required
 *       500:
 *         description: Server error
 */
authRouter.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - auth
 *     summary: Reset password with token
 *     description: Reset your password using the token from the email link. Token is valid for 1 hour.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset token received in the password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword@123!"
 *                 description: Your new password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successfully. Please login with new password.
 *       400:
 *         description: Invalid or expired reset token, or password too short
 *       500:
 *         description: Server error
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
 *       - bearerAuth: []
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
 *       - bearerAuth: []
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
 *       - bearerAuth: []
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
 *     summary: Change password (Authenticated users only)
 *     description: Change your password. Requires authentication with valid JWT token and current password verification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldPassword@123!"
 *                 description: Your current password for verification
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword@456!"
 *                 description: Your new password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password changed successfully. A confirmation email has been sent.
 *       400:
 *         description: Missing required fields or password too short
 *       401:
 *         description: Unauthorized - Invalid token or incorrect current password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.post("/change-password", authenticateToken, changePassword);

 

export default authRouter;
