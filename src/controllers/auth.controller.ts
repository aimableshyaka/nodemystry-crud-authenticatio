import type { Request, Response } from "express";
import User, { IUserDocument, UserRole } from "../models/user.model";
import { generateToken, generateResetToken, verifyResetToken } from "../utils/jwt.helper";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {sendWelcomeEmail} from "../services/email.service";

/**
 * Register a new user
 * POST /auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, password, role } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        error: "All fields are required (firstname, lastname, email, password)",
      });
    }

    // Validate role if provided
    const validRoles: UserRole[] = ["admin", "vendor", "customer"];
    const userRole: UserRole = (role && validRoles.includes(role)) ? role : "customer";

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    // Create new user
    const user = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });
       // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, firstname).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail registration if email fails
    });
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({
      error: "Registration failed",
      details: error.message,
    });
  }
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
};

/**
 * Get user profile
 * GET /auth/profile
 * Requires authentication
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({
      error: "Failed to fetch profile",
      details: error.message,
    });
  }
};

/**
 * Update user profile
 * PUT /auth/profile
 * Requires authentication
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { firstname, lastname, email } = req.body;

    // Check if at least one field is provided
    if (!firstname && !lastname && !email) {
      return res.status(400).json({
        error: "At least one field must be provided",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check if new email is already taken by another user
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          error: "Email already in use",
        });
      }
    }

    // Update fields
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email.toLowerCase();

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      error: "Failed to update profile",
      details: error.message,
    });
  }
};

/**
 * Logout (client-side token removal)
 * POST /auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // This endpoint is just for consistency and can be used for logging purposes
  return res.status(200).json({
    message: "Logout successful. Please remove the token from client.",
  });
};

/**
 * Forgot password - Send reset token
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save hashed token and expiry to database
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    // In production, send email with reset link
    // For now, we'll return the token (REMOVE THIS IN PRODUCTION)
    const resetUrl = `${req.protocol}://${req.get("host")}/auth/reset-password/${resetToken}`;

    console.log("Password reset URL:", resetUrl);

    // TODO: Implement email sending with nodemailer
    // await sendResetEmail(user.email, resetUrl);

    return res.status(200).json({
      message: "Password reset instructions sent to email",
      // DEVELOPMENT ONLY - Remove in production!
      resetToken: resetToken,
      resetUrl: resetUrl,
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
};

/**
 * Reset password with token
 * POST /auth/reset-password/:token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        error: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    // Hash the token from URL to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    }).select("+resetToken +resetTokenExpiry");

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetToken = "" as any;
    user.resetTokenExpiry = null as any;
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully. Please login with new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: "Failed to reset password",
      details: error.message,
    });
  }
};

/**
 * Change password for authenticated user
 * POST /auth/change-password
 * Requires authentication
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters",
      });
    }

    // Find user with password
    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return res.status(500).json({
      error: "Failed to change password",
      details: error.message,
    });
  }
};
