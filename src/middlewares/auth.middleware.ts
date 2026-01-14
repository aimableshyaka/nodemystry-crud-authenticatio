import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt.helper";
import User from "../models/user.model";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: "Invalid or expired token.",
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: "User not found.",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Authentication failed.",
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};
