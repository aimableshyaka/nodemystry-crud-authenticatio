import { Request, Response, NextFunction } from "express";
import User, { UserRole } from "../models/user.model";

/**
 * Middleware to check if user has one of the required roles
 * @param allowedRoles - Array of roles that are allowed
 * @returns Middleware function
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
        });
      }

      // Get user with role
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(401).json({
          error: "User not found",
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${user.role}`,
        });
      }

      // Attach user role to request
      (req.user as any).role = user.role;

      next();
    } catch (error) {
      return res.status(500).json({
        error: "Authorization check failed",
      });
    }
  };
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = authorize(["admin"]);

/**
 * Middleware to check if user is admin or vendor
 */
export const requireAdminOrVendor = authorize(["admin", "vendor"]);

/**
 * Middleware to check if user is a customer or higher (all authenticated users)
 */
export const requireCustomerOrHigher = authorize(["customer", "vendor", "admin"]);

/**
 * Helper function to check if user owns a resource
 * Useful for vendors to verify they own products, etc.
 * @param ownerId - The ID of the resource owner (MongoDB ObjectId)
 * @param userId - The ID of the current user (MongoDB ObjectId)
 * @returns boolean
 */
export const isOwner = (ownerId: string, userId: string): boolean => {
  return ownerId === userId;
};
