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

// Public routes (no authentication required)
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

// Protected routes (authentication required)
authRouter.get("/profile", authenticateToken, getProfile);
authRouter.put("/profile", authenticateToken, updateProfile);
authRouter.post("/logout", authenticateToken, logout);
authRouter.post("/change-password", authenticateToken, changePassword);

export default authRouter;
