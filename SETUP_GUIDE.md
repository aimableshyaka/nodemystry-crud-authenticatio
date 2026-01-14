# MongoDB Integration Setup Guide
## Complete Documentation for Array-to-Database Migration

---

## 📋 Overview

This guide documents all changes made to migrate the Category API from in-memory array storage to MongoDB persistent database. Use this as a reference for implementing the same pattern on other projects.

**What was changed:**
- ✅ Replaced array-based storage with MongoDB
- ✅ Added Mongoose ODM for schema management
- ✅ Converted synchronous functions to async/await
- ✅ Added proper error handling
- ✅ Implemented database connection initialization
- ✅ Updated environment configuration

---

## 🔧 Step 1: Install Dependencies

Run these commands in your project root:

```bash
npm install mongoose
npm install --save-dev @types/mongoose
```

**What these do:**
- `mongoose` - ODM (Object Data Modeling) library for MongoDB
- `@types/mongoose` - TypeScript type definitions for Mongoose

---

## 📁 Step 2: Create Configuration Files

### **2.1 Create `src/config/database.ts`**

```typescript
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/product-api";
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
```

**Purpose:** Handles all MongoDB connection logic. Call this in your server startup.

---

### **2.2 Update `.env` File**

Add or update these variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/product-api
```

**What each does:**
- `PORT` - Server port (use 5000 or any available port)
- `MONGODB_URI` - MongoDB connection string
  - `localhost:27017` - Default MongoDB server
  - `product-api` - Database name (auto-creates if doesn't exist)

---

## 🗄️ Step 3: Update Data Model

### **3.1 Replace `src/models/category.model.ts`**

**BEFORE (Array-based):**
```typescript
import { UUID } from "node:crypto";

interface Category {
  id: UUID, 
  name: string
  description: string
}
export type {Category};
```

**AFTER (MongoDB with Mongoose):**
```typescript
import mongoose, { Document, Schema } from "mongoose";

export interface ICategory {
  name: string;
  description: string;
}

export interface ICategoryDocument extends Document {
  name: string;
  description: string;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;

// Legacy interface for backward compatibility
export interface Category {
  id: string;
  name: string;
  description: string;
}
```

**Key Changes:**
- `ICategory` - Interface for input data (name, description)
- `categorySchema` - Mongoose schema with validation
- `timestamps: true` - Auto-adds createdAt, updatedAt fields
- `CategoryModel` - Mongoose model for database operations
- MongoDB uses `_id` instead of custom `id`

---

## 🔄 Step 4: Update Controller Functions

### **4.1 Update `src/controllers/category.controller.ts`**

Replace all functions with async versions using MongoDB queries.

**BEFORE (Synchronous Array Operations):**
```typescript
import { Category } from "../models/category.model";
import { randomUUID } from "node:crypto";

export const categories: Category[] = [
    { id:randomUUID(), name: "Fashions", description: "Fashions collections" },
];

function getCategory(req: Request, res: Response) {
    return res.status(200).json({ categories });
}
```

**AFTER (Asynchronous MongoDB Operations):**
```typescript
import { Request, Response } from "express";
import CategoryModel from "../models/category.model";

// GET all categories
async function getCategory(req: Request, res: Response) {
    try {
        const categories = await CategoryModel.find();
        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
}

// GET category by ID
async function CategoryById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch category" });
    }
}

// POST - add a new category
async function addCategory(req: Request, res: Response) {
    try {
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

        const newCategory = new CategoryModel({ name, description });
        await newCategory.save();

        return res.status(201).json({ message: "Category added successfully", category: newCategory });
    } catch (error) {
        return res.status(500).json({ error: "Failed to add category" });
    }
}

// PUT - update category
async function updateCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await CategoryModel.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update category" });
    }
}

// DELETE category
async function deleteCategory(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ message: "Category deleted", category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete category" });
    }
}

export { getCategory, addCategory, CategoryById, updateCategory, deleteCategory };
```

**Key Changes Explained:**

| Operation | Array Method | Mongoose Method |
|-----------|--------------|-----------------|
| Get All | `.find()` loop | `await CategoryModel.find()` |
| Get One | `.find(c => c.id === id)` | `await CategoryModel.findById(id)` |
| Create | `array.push()` | `new Model(); await save()` |
| Update | `array[index] = updated` | `await CategoryModel.findByIdAndUpdate()` |
| Delete | `array.splice()` | `await CategoryModel.findByIdAndDelete()` |

**Important:**
- All functions must be `async`
- Use `try/catch` for error handling
- `await` waits for database operation to complete
- MongoDB returns `_id` (not `id`)

---

## 🚀 Step 5: Initialize Database Connection

### **5.1 Update `src/server.ts`**

**BEFORE:**
```typescript
import dotenv from "dotenv";
import app from "./app";

dotenv.config({});
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT,()=>{
    console.log("server is up and running ", PORT)
});
```

**AFTER:**
```typescript
import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/database";

dotenv.config({});
const PORT = Number(process.env.PORT) || 3000;

// Connect to MongoDB BEFORE starting server
connectDB();

app.listen(PORT, () => {
    console.log("server is up and running ", PORT);
});
```

**Why this matters:**
- `connectDB()` must run before `app.listen()`
- If DB connection fails, the process exits (line `process.exit(1)`)
- Without this, your routes will fail when trying to access the database

---

## 🔗 Step 6: Update Related Controllers (Optional)

If other controllers reference the categories array (like products), update them too:

**BEFORE:**
```typescript
import { categories } from "./category.controller";
const category = categories.find(c => c.id === product.categoryId);
```

**AFTER:**
```typescript
import CategoryModel from "../models/category.model";
import mongoose from "mongoose";

// Validate ObjectId format first
if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ error: "Invalid categoryId format" });
}

// Then check if it exists in database
const categoryExists = await CategoryModel.findById(categoryId);
if (!categoryExists) {
    return res.status(400).json({ error: "Invalid categoryId: category does not exist" });
}
```

---

## 📊 MongoDB Query Cheat Sheet

Common Mongoose operations:

```typescript
// Find all documents
const all = await CategoryModel.find();

// Find by ID
const one = await CategoryModel.findById(id);

// Find by field
const byName = await CategoryModel.findOne({ name: "Electronics" });

// Create and save
const newCat = new CategoryModel({ name: "Books", description: "..." });
await newCat.save();

// Update
const updated = await CategoryModel.findByIdAndUpdate(
  id, 
  { name: "NewName" }, 
  { new: true }  // Returns updated document
);

// Delete
const deleted = await CategoryModel.findByIdAndDelete(id);

// Count
const count = await CategoryModel.countDocuments();

// Find and filter
const filtered = await CategoryModel.find({ name: { $regex: "Electronics" } });
```

---

## 🧪 Testing Your Setup

### **Prerequisites**
1. **MongoDB must be running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. **Start your server:**
   ```bash
   npm run dev
   ```

3. **Test with curl:**
   ```bash
   # GET all categories
   curl http://localhost:5000/api/categories

   # POST create category
   curl -X POST http://localhost:5000/api/categories \
     -H "Content-Type: application/json" \
     -d '{"name":"Electronics","description":"Devices"}'

   # GET by ID (replace with actual MongoDB _id)
   curl http://localhost:5000/api/categories/507f1f77bcf86cd799439011
   ```

---

## 📋 Complete File Structure

After all changes, your structure should be:

```
src/
├── config/
│   └── database.ts          # NEW: Database connection
├── controllers/
│   └── category.controller.ts   # UPDATED: Async functions
├── models/
│   └── category.model.ts    # UPDATED: Mongoose schema
├── routes/
│   └── category.ts          # No change (still works)
├── app.ts
└── server.ts                # UPDATED: Added connectDB()

.env                         # UPDATED: Added MONGODB_URI
package.json                 # UPDATED: Added mongoose dependency
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "MongoDB connection error"**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service first:
```bash
net start MongoDB  # Windows
mongod             # or run manually
```

### **Issue 2: "Cannot find module 'mongoose'"**
```
Error: Cannot find module 'mongoose'
```
**Solution:** Install dependencies:
```bash
npm install mongoose @types/mongoose
```

### **Issue 3: "Category not found" for valid IDs**
- MongoDB IDs must be valid ObjectId format
- They look like: `507f1f77bcf86cd799439011`
- If you see error, copy exact `_id` from POST response

### **Issue 4: "async function without async keyword"**
```
error TS7006: Parameter implicitly has an 'any' type
```
**Solution:** Make sure all controller functions are marked `async`:
```typescript
async function getCategory(req: Request, res: Response) {
    //...
}
```

---

## 🔄 Migration Checklist

Use this checklist when implementing on a new project:

- [ ] Install mongoose and types: `npm install mongoose @types/mongoose`
- [ ] Create `src/config/database.ts`
- [ ] Update `.env` with `MONGODB_URI`
- [ ] Replace model file with Mongoose schema
- [ ] Update all controller functions to `async`
- [ ] Replace all array operations with MongoDB queries
- [ ] Add `try/catch` blocks for error handling
- [ ] Update `server.ts` to call `connectDB()`
- [ ] Remove all `randomUUID()` and array imports
- [ ] Update related controllers that reference the old model
- [ ] Start MongoDB service
- [ ] Test endpoints with curl or Postman
- [ ] Check `.env` variables are correct

---

## 📚 Useful MongoDB/Mongoose Resources

- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Query Language](https://docs.mongodb.com/manual/crud/)
- [Mongoose Schema Validation](https://mongoosejs.com/docs/validation.html)
- [MongoDB Operators](https://docs.mongodb.com/manual/reference/operator/query/)

---

## 💡 Pro Tips

1. **Always use async/await** for database operations
2. **Always wrap in try/catch** for error handling
3. **Validate ObjectIds** before querying: `mongoose.Types.ObjectId.isValid(id)`
4. **Use environment variables** for sensitive config (passwords, URIs)
5. **Test with Postman** - Import the provided collection
6. **Check MongoDB is running** before starting your server

---

## 🎯 Next Steps

After implementing this pattern:

1. **Apply the same pattern to other models** (products, users, etc.)
2. **Add indexes** for frequently queried fields
3. **Implement pagination** for large datasets
4. **Add authentication** for API security
5. **Set up unit tests** with Jest or Mocha

---

**Last Updated:** January 14, 2026
**Pattern:** Array-based Storage → MongoDB with Mongoose
**Status:** Ready for production use

---

# JWT Authentication & User Management Guide
## Complete Documentation for Secure User Authentication System

---

## 📋 Overview

This guide documents the complete JWT authentication system including user registration, login, password management, and secure user management features.

**Features implemented:**
- ✅ User registration with password hashing
- ✅ User login with JWT token generation
- ✅ Profile access and updates (protected routes)
- ✅ Password management (forgot, reset, change)
- ✅ User management for authenticated users (CRUD operations)
- ✅ Secure authentication middleware
- ✅ JWT token validation

---

## 🔧 Step 1: Dependencies Installed

The following packages were added to support authentication:

```bash
npm install bcryptjs jsonwebtoken nodemailer
npm install --save-dev @types/bcryptjs @types/jsonwebtoken @types/nodemailer
```

**What these do:**
- `bcryptjs` - Password hashing and comparison
- `jsonwebtoken` - JWT token generation and verification
- `nodemailer` - Email sending for password reset (configured for future use)
- Type definitions for TypeScript support

---

## 📁 Step 2: Files Created

### **2.1 User Model - `src/models/user.model.ts`**

Updated to use MongoDB with Mongoose, includes password hashing:

```typescript
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: { 
      type: String, 
      required: true, 
      minlength: 6,
      select: false  // Don't return password by default
    },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>("User", userSchema);
```

**Key Features:**
- Automatic password hashing before save
- Email validation with regex
- Password not returned by default (select: false)
- comparePassword method for login verification
- Reset token fields for password recovery

---

### **2.2 JWT Helper - `src/utils/jwt.helper.ts`**

Utility functions for JWT token operations:

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

// Generate reset password token (1 hour expiry)
export const generateResetToken = (email: string): string => {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
};

// Verify reset password token
export const verifyResetToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded.email;
  } catch (error) {
    return null;
  }
};
```

---

### **2.3 Authentication Middleware - `src/middlewares/auth.middleware.ts`**

Protects routes requiring authentication:

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.helper";
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

// Middleware to verify JWT token
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Authentication failed." });
  }
};
```

---

### **2.4 Auth Controller - `src/controllers/auth.controller.ts`**

Handles all authentication operations:

**Key Functions:**
- `register` - Create new user account
- `login` - Authenticate user and return JWT
- `getProfile` - Get authenticated user's profile
- `updateProfile` - Update user profile
- `logout` - Logout endpoint (token removed client-side)
- `forgotPassword` - Generate password reset token
- `resetPassword` - Reset password with token
- `changePassword` - Change password for authenticated user

---

### **2.5 Auth Routes - `src/routes/auth.ts`**

```typescript
import express from "express";
import {
  register, login, getProfile, updateProfile,
  logout, forgotPassword, resetPassword, changePassword
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

// Protected routes
authRouter.get("/profile", authenticateToken, getProfile);
authRouter.put("/profile", authenticateToken, updateProfile);
authRouter.post("/logout", authenticateToken, logout);
authRouter.post("/change-password", authenticateToken, changePassword);

export default authRouter;
```

---

### **2.6 Updated User Controller - `src/controllers/users.controller.ts`**

Converted to use MongoDB with full CRUD operations for admin management.

---

### **2.7 Updated App - `src/app.ts`**

Added auth routes and protected user management routes:

```typescript
import { authenticateToken } from "./middlewares/auth.middleware";
import authRouter from "./routes/auth";

// Authentication routes (public)
app.use("/auth", authRouter);

// User management routes (protected - requires authentication)
app.use("/users", authenticateToken, userRouter);
```

---

## 🔐 Step 3: Environment Variables

Update your `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/product-api
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

**Security Notes:**
- **CRITICAL:** Change `JWT_SECRET` to a long random string in production
- Never commit `.env` file to version control
- Use strong secrets (32+ characters, random)

---

## 📡 API Endpoints

### **Authentication Endpoints**

#### **1. Register User**
```http
POST /auth/register
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### **2. Login User**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### **3. Get Profile (Protected)**
```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

---

#### **4. Update Profile (Protected)**
```http
PUT /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "jane@example.com"
}
```

---

#### **5. Logout (Protected)**
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Logout successful. Please remove the token from client."
}
```

---

#### **6. Forgot Password**
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset instructions sent to email",
  "resetToken": "a1b2c3d4e5f6...",
  "resetUrl": "http://localhost:5000/auth/reset-password/a1b2c3d4e5f6..."
}
```

**Note:** In production, the token should only be sent via email, not in the response.

---

#### **7. Reset Password**
```http
POST /auth/reset-password/:token
Content-Type: application/json

{
  "password": "newPassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully. Please login with new password."
}
```

---

#### **8. Change Password (Protected)**
```http
POST /auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### **User Management Endpoints (Admin - All Protected)**

All endpoints require authentication token in Authorization header.

#### **9. Get All Users**
```http
GET /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "count": 2,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    }
  ]
}
```

---

#### **10. Get User By ID**
```http
GET /users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

#### **11. Create User (Admin)**
```http
POST /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstname": "Alice",
  "lastname": "Johnson",
  "email": "alice@example.com",
  "password": "password123"
}
```

---

#### **12. Update User (Admin)**
```http
PUT /users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstname": "Alice",
  "lastname": "Smith"
}
```

---

#### **13. Delete User (Admin)**
```http
DELETE /users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "User deleted successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstname": "Alice",
    "lastname": "Johnson",
    "email": "alice@example.com"
  }
}
```

---

## 🧪 Testing Your Authentication System

### **Test Flow with curl:**

#### **1. Register a new user:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the returned token from the response.

---

#### **2. Login:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

#### **3. Get Profile (use token from login):**
```bash
curl -X GET http://localhost:5000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### **4. Update Profile:**
```bash
curl -X PUT http://localhost:5000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jane"
  }'
```

---

#### **5. Change Password:**
```bash
curl -X POST http://localhost:5000/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newPassword456"
  }'
```

---

#### **6. Forgot Password:**
```bash
curl -X POST http://localhost:5000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

Copy the `resetToken` from response.

---

#### **7. Reset Password:**
```bash
curl -X POST http://localhost:5000/auth/reset-password/RESET_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "brandNewPassword789"
  }'
```

---

#### **8. Get All Users (Protected):**
```bash
curl -X GET http://localhost:5000/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### **9. Delete User (Protected):**
```bash
curl -X DELETE http://localhost:5000/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔒 Security Best Practices

### **1. JWT Token Security**
- Store tokens securely on client-side (HttpOnly cookies or secure storage)
- Never store tokens in localStorage if XSS is a concern
- Set appropriate expiration times (7 days default)
- Implement token refresh mechanism for long-lived sessions

### **2. Password Security**
- Minimum 6 characters (increase to 8-12 in production)
- Passwords are hashed with bcrypt (10 salt rounds)
- Never return passwords in API responses
- Never log passwords

### **3. API Security**
- Always use HTTPS in production
- Implement rate limiting to prevent brute force attacks
- Add CORS configuration for production
- Validate all input data
- Use helmet.js for security headers

### **4. Environment Variables**
```env
# Production Settings
JWT_SECRET=use-a-very-long-random-string-here-at-least-32-characters
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

---

## 🎯 How Authentication Works

### **Registration Flow:**
```
1. User sends registration data (firstname, lastname, email, password)
2. Check if email already exists
3. Hash password using bcrypt
4. Save user to database
5. Generate JWT token with userId and email
6. Return user data and token
```

### **Login Flow:**
```
1. User sends email and password
2. Find user by email (include password field)
3. Compare provided password with hashed password
4. If valid, generate JWT token
5. Return user data and token
```

### **Protected Route Access:**
```
1. Client sends request with Authorization header: "Bearer TOKEN"
2. Middleware extracts token
3. Verify token signature and expiration
4. Decode userId from token
5. Check if user still exists in database
6. Attach user info to request object
7. Allow access to route
```

### **Password Reset Flow:**
```
1. User requests password reset with email
2. Generate random reset token
3. Hash token and save to user record with expiry (1 hour)
4. Send reset link via email (or return in dev mode)
5. User clicks link with token
6. Verify token is valid and not expired
7. Allow user to set new password
8. Clear reset token from database
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Invalid or expired token"**
**Causes:**
- Token expired (default 7 days)
- Token was generated with different JWT_SECRET
- Token format incorrect (must be "Bearer TOKEN")

**Solution:**
```bash
# Login again to get new token
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

---

### **Issue 2: "Access denied. No token provided"**
**Cause:** Missing Authorization header

**Solution:**
```bash
# Always include Authorization header with Bearer prefix
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### **Issue 3: "Email already registered"**
**Cause:** User with that email already exists

**Solution:**
- Use a different email
- Or login with existing account
- Or implement "forgot password" flow

---

### **Issue 4: "Invalid email or password"**
**Causes:**
- Wrong password
- Email doesn't exist
- Email case mismatch (emails are converted to lowercase)

**Solution:**
- Verify credentials
- Try "forgot password" if you forgot it
- Register new account if email doesn't exist

---

### **Issue 5: Password not hashing**
**Cause:** User password modified without triggering pre-save hook

**Solution:** Always use `user.save()` when updating password:
```typescript
user.password = newPassword;
await user.save();  // This triggers the pre-save hook
```

---

## 📊 Authentication Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser/App)                 │
│  - Stores JWT token                                     │
│  - Sends token in Authorization header                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  Auth Routes (/auth/*)                         │    │
│  │  - register, login, profile, logout            │    │
│  │  - forgot-password, reset-password             │    │
│  │  - change-password                             │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  Authentication Middleware                     │    │
│  │  - Extract JWT from Authorization header       │    │
│  │  - Verify token signature                      │    │
│  │  - Check user exists in database               │    │
│  │  - Attach user to request object               │    │
│  └────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  Protected Routes (/users/*)                   │    │
│  │  - Only accessible with valid token            │    │
│  │  - User management operations                  │    │
│  └────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   MongoDB Database                       │
│  - Users collection with hashed passwords               │
│  - Reset tokens for password recovery                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Advanced Features to Implement

After mastering the basics, consider adding:

1. **Role-Based Access Control (RBAC)**
   - Add `role` field to user model (admin, user, moderator)
   - Create role-checking middleware
   - Restrict certain operations to admins only

2. **Email Verification**
   - Send verification email on registration
   - Add `emailVerified` boolean to user model
   - Require verification before full access

3. **Refresh Tokens**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (30 days)
   - Implement token rotation

4. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

5. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app verification
   - Add to sensitive operations

6. **Account Lockout**
   - Lock account after X failed login attempts
   - Automatic unlock after time period

7. **Login History**
   - Track login attempts and locations
   - Notify users of suspicious activity

---

## 📚 Resources for Learning

- [JWT.io](https://jwt.io/) - JWT decoder and documentation
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 💡 Tips for Development

1. **Use Postman or Thunder Client** for testing
   - Create collections for different flows
   - Save environment variables for tokens
   - Test all error scenarios

2. **Monitor Token Expiration**
   - Set shorter expiry during development (e.g., 1h)
   - Test token refresh logic

3. **Test Error Scenarios**
   - Invalid credentials
   - Expired tokens
   - Missing required fields
   - Duplicate emails

4. **Keep Security in Mind**
   - Never log sensitive data (passwords, tokens)
   - Always validate and sanitize input
   - Use HTTPS in production
   - Keep dependencies updated

---

**Last Updated:** January 14, 2026
**Feature:** JWT Authentication & User Management
**Status:** Production Ready

---

# Role-Based Access Control (RBAC) Guide
## Complete Documentation for Implementing Role-Based Authorization

---

##  Overview

This guide documents the implementation of Role-Based Access Control (RBAC) in the API. Three distinct roles control access to resources: Admin (full system access), Vendor (product management), and Customer (shopping & profile).

**Features implemented:**
-  Three user roles with distinct permissions
-  Role-based authorization middleware
-  Resource ownership validation
-  Admin management console
-  Vendor-only product operations
-  Customer shopping capabilities

---

##  User Roles & Permissions

### **1. ADMIN**
**System Administrator with Full Access**

**Permissions:**
-  Manage all users (create, read, update, delete)
-  Create, update, delete categories
-  Create, update, delete any product
-  View all products and categories
-  Access all protected resources

**API Access:**
``
POST   /users                  (create user)
GET    /users                  (list all users)
GET    /users/:id              (get user details)
PUT    /users/:id              (update user)
DELETE /users/:id              (delete user)

POST   /api/categories         (create category)
PUT    /api/categories/:id     (update category)
DELETE /api/categories/:id     (delete category)

POST   /api/product            (create product)
PUT    /api/product/:id        (update any product)
DELETE /api/product/:id        (delete any product)
``

---

### **2. VENDOR**
**Seller Who Manages Products**

**Permissions:**
-  Create products
-  Update and delete only their own products
-  View all categories and products
-  Manage own profile
-  Cannot manage users
-  Cannot manage categories
-  Cannot modify other vendors' products

**API Access:**
``
GET    /auth/profile           (view own profile)
PUT    /auth/profile           (update own profile)
POST   /auth/change-password   (change own password)

POST   /api/product            (create product)
GET    /api/product            (view all products)
GET    /api/products/:id       (view product details)
PUT    /api/product/:id        (update own products only)
DELETE /api/product/:id        (delete own products only)

GET    /api/categories         (view categories)
GET    /api/categories/:id     (view category details)
``

---

### **3. CUSTOMER**
**End User / Buyer**

**Permissions:**
-  View categories and products
-  Manage own cart
-  Manage own profile
-  Cannot create or manage products
-  Cannot manage categories
-  Cannot access other users' data

**API Access:**
``
GET    /auth/profile           (view own profile)
PUT    /auth/profile           (update own profile)
POST   /auth/change-password   (change own password)

GET    /api/product            (view all products)
GET    /api/products/:id       (view product details)
GET    /api/categories         (view categories)
GET    /api/categories/:id     (view category details)

POST   /cart/add               (add to cart)
GET    /cart                   (view cart)
PUT    /cart/:id               (update cart item)
DELETE /cart/:id               (remove from cart)
``

---

##  Implementation Details

### **1. User Model with Roles**

The User model includes a role field that defaults to "customer":

``	ypescript
export type UserRole = "admin" | "vendor" | "customer";

export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: UserRole;  // NEW: Role field
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUserDocument>({
  // ... other fields ...
  role: {
    type: String,
    enum: ["admin", "vendor", "customer"],
    default: "customer",
    required: true,
  },
});
``

---

### **2. Authorization Middleware**

**File:** src/middlewares/authorization.middleware.ts

This middleware factory creates role-checking functions:

``	ypescript
/**
 * Check if user has required roles
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await User.findById(req.user.userId);
      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: Access denied. Required roles: ,
        });
      }

      (req.user as any).role = user.role;
      next();
    } catch (error) {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

// Pre-configured middlewares
export const requireAdmin = authorize(["admin"]);
export const requireAdminOrVendor = authorize(["admin", "vendor"]);
export const requireCustomerOrHigher = authorize(["customer", "vendor", "admin"]);
``

---

### **3. Resource Ownership Validation**

For vendors, ownership checks are built into controllers:

``	ypescript
// In Product Controller
async function updateProduct(req: Request, res: Response) {
  // ... get product ...

  // If vendor, check ownership
  if (user.role === "vendor" && product.vendorId.toString() !== req.user.userId) {
    return res.status(403).json({
      error: "You can only update your own products",
    });
  }

  // ... proceed with update ...
}
``

---

##  API Examples by Role

### **ADMIN Operations**

**1. Create a Vendor User**
``ash
curl -X POST http://localhost:5000/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Seller",
    "email": "vendor@example.com",
    "password": "password123",
    "role": "vendor"
  }'
``

**2. Update User Role**
``ash
curl -X PUT http://localhost:5000/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
``

**3. Create Category**
``ash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and gadgets"
  }'
``

---

### **VENDOR Operations**

**1. Register as Vendor**
``ash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Jane",
    "lastname": "Vendor",
    "email": "jane@vendor.com",
    "password": "password123",
    "role": "vendor"
  }'
``

**2. Create Own Product**
``ash
curl -X POST http://localhost:5000/api/product \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphone",
    "price": 599.99,
    "categoryId": "CATEGORY_ID",
    "description": "Latest smartphone model"
  }'
``

**3. Update Own Product**
``ash
curl -X PUT http://localhost:5000/api/product/PRODUCT_ID \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 549.99,
    "quantity": 50
  }'
``

---

### **CUSTOMER Operations**

**1. Register as Customer**
``ash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "Bob",
    "lastname": "Buyer",
    "email": "bob@example.com",
    "password": "password123"
  }'
``
**Note:** Role defaults to "customer" if not specified

**2. View All Products**
``ash
curl -X GET http://localhost:5000/api/product
``

**3. View Own Profile**
``ash
curl -X GET http://localhost:5000/auth/profile \
  -H "Authorization: Bearer CUSTOMER_TOKEN"
``

---

##  Security Best Practices for RBAC

### **1. Role Assignment**
- Only admins can assign/change user roles
- Default role is "customer" for new registrations
- Use explicit role parameter during admin user creation

### **2. Permission Enforcement**
- Check role at middleware level for public resources
- Validate resource ownership in controllers
- Never trust client-side role information
- Always verify user role from database

### **3. Token Management**
- Include role in JWT payload for quick validation
- For sensitive operations, fetch user from DB to verify role hasn't changed

### **4. Resource Isolation**
- Vendors can only modify their own products
- Customers cannot access admin endpoints
- Use MongoDB queries to filter by ownership

### **5. Error Handling**
- Return 401 Unauthorized for missing/invalid tokens
- Return 403 Forbidden for insufficient permissions
- Never reveal whether resource exists to unauthorized users

---

##  Extending RBAC

### **Adding New Roles**

1. **Update User Model:**
``	ypescript
export type UserRole = "admin" | "vendor" | "customer" | "moderator";

role: {
  type: String,
  enum: ["admin", "vendor", "customer", "moderator"],
  default: "customer",
  required: true,
}
``

2. **Create Role Middleware:**
``	ypescript
export const requireModerator = authorize(["moderator", "admin"]);
``

3. **Apply to Routes:**
``	ypescript
route.delete("/report/:id", authenticateToken, requireModerator, deleteReport);
``

---

### **Adding Granular Permissions**

For more complex permission systems, add a permissions field:

``	ypescript
interface IUser {
  role: UserRole;
  permissions: string[];  // e.g., ["view_reports", "edit_products"]
}

// In middleware:
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.userId);
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }
    next();
  };
};
``

---

##  Common RBAC Issues & Solutions

### **Issue 1: "Access denied" on valid credentials**
**Cause:** User doesn't have required role

**Solution:**
- Check user's role in database: db.users.findOne({email:"user@example.com"})
- Use admin endpoint to update role: PUT /users/ID with {"role":"vendor"}

---

### **Issue 2: Vendor can delete other vendor's products**
**Cause:** Missing ownership check in delete operation

**Solution:**
- Verify product.vendorId === req.user.userId before allowing delete
- Return 403 if user is vendor and not the owner

---

### **Issue 3: Customer can create products**
**Cause:** Missing authorization check in product create

**Solution:**
- Add authentication middleware to POST /api/product
- Check user role is "vendor" or "admin" in controller
- Return 403 Forbidden for customers

---

##  RBAC Permission Matrix

| Operation | Admin | Vendor | Customer |
|-----------|-------|--------|----------|
| **User Management** | | | |
| Create User |  |  |  |
| Read Users |  |  |  |
| Update User |  |  |  |
| Delete User |  |  |  |
| **Category Management** | | | |
| Create Category |  |  |  |
| Read Categories |  |  |  |
| Update Category |  |  |  |
| Delete Category |  |  |  |
| **Product Management** | | | |
| Create Product |  |  |  |
| Read Products |  |  |  |
| Update Own Product |  |  |  |
| Update Others' Product |  |  |  |
| Delete Own Product |  |  |  |
| Delete Others' Product |  |  |  |
| **Profile Management** | | | |
| View Own Profile |  |  |  |
| Update Own Profile |  |  |  |
| Change Own Password |  |  |  |

---

##  RBAC Implementation Checklist

- [x] Add role field to User model
- [x] Create authorization middleware
- [x] Update auth controller to support role selection
- [x] Update category controller with admin checks
- [x] Update product controller with vendor ownership checks
- [x] Update user controller with admin-only access
- [x] Add authentication to category routes
- [x] Add authentication to product routes
- [x] Verify ownership checks work correctly
- [x] Document all role permissions
- [x] Review security best practices

---

##  Resources for Learning RBAC

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Express Middleware Documentation](https://expressjs.com/en/guide/using-middleware.html)
- [MongoDB Query Operators](https://docs.mongodb.com/manual/reference/operator/query/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated:** January 14, 2026
**Feature:** Role-Based Access Control (RBAC)
**Status:** Production Ready
