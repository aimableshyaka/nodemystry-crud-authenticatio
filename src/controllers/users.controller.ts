import type { Request, Response } from "express";
import User from "../models/user.model";

/**
 * GET all users
 * GET /users
 * Requires authentication - Admin only
 */
async function getAlluser(req: Request, res: Response) {
  try {
    // Authorization check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        error: "Only administrators can view all users",
      });
    }

    const users = await User.find().select("-password -resetToken -resetTokenExpiry");

    return res.status(200).json({
      count: users.length,
      users: users,
    });
  } catch (error: any) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      error: "Failed to fetch users",
      details: error.message,
    });
  }
}

/**
 * GET user by ID
 * GET /users/:id
 * Requires authentication - Admin only
 */
async function getUserById(req: Request, res: Response) {
  try {
    // Authorization check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        error: "Only administrators can view user details",
      });
    }

    const { id } = req.params;

    const user = await User.findById(id).select("-password -resetToken -resetTokenExpiry");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      error: "Failed to fetch user",
      details: error.message,
    });
  }
}

/**
 * POST - Create new user (Admin function)
 * POST /users
 * Requires authentication - Admin only
 */
async function createUser(req: Request, res: Response) {
  try {
    // Authorization check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        error: "Only administrators can create users",
      });
    }

    const { firstname, lastname, email, password, role } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        error: "firstname, lastname, email, and password are required",
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Validate role
    const validRoles = ["admin", "vendor", "customer"];
    const userRole = (role && validRoles.includes(role)) ? role : "customer";

    const newUser = new User({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      id: newUser._id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return res.status(500).json({
      error: "Failed to create user",
      details: error.message,
    });
  }
}

/**
 * PUT - Update user by ID (Admin function)
 * PUT /users/:id
 * Requires authentication - Admin only
 */
async function updateUser(req: Request, res: Response) {
  try {
    // Authorization check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        error: "Only administrators can update users",
      });
    }

    const { id } = req.params;
    const { firstname, lastname, email, password, role } = req.body;

    if (!firstname && !lastname && !email && !password && !role) {
      return res.status(400).json({
        error: "At least one field must be provided",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if new email already exists for other users
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (emailExists) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Update fields
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email.toLowerCase();
    if (password) user.password = password;
    
    // Validate role if provided
    if (role) {
      const validRoles = ["admin", "vendor", "customer"];
      if (validRoles.includes(role)) {
        user.role = role;
      }
    }

    await user.save();

    const userResponse = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return res.status(500).json({
      error: "Failed to update user",
      details: error.message,
    });
  }
}

/**
 * DELETE user by ID (Admin function)
 * DELETE /users/:id
 * Requires authentication - Admin only
 */
async function deleteUser(req: Request, res: Response) {
  try {
    // Authorization check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || currentUser.role !== "admin") {
      return res.status(403).json({
        error: "Only administrators can delete users",
      });
    }

    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to delete user",
      details: error.message,
    });
  }
}

export { getAlluser, getUserById, createUser, updateUser, deleteUser };
