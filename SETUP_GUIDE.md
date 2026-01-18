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

---

# 📚 Swagger UI Testing Guide
## Complete Documentation for Testing All API Endpoints via Swagger UI

---

## 📋 Overview

This guide walks you through testing all API endpoints using Swagger UI - an interactive API documentation interface that allows you to test endpoints directly from your browser.

**What you'll learn:**
- ✅ How to access Swagger UI
- ✅ Why authorization is required
- ✅ How to authorize in Swagger UI
- ✅ How to test all endpoints step-by-step
- ✅ Understanding request/response formats
- ✅ Troubleshooting common issues

---

## 🌐 Step 1: Access Swagger UI

### **1.1 Start Your Server**

```bash
npm run dev
# or
npm start
```

**Expected Output:**
```
server is up and running 3000
MongoDB connected successfully
```

---

### **1.2 Open Swagger UI in Browser**

Navigate to:
```
http://localhost:3000/api-docs
```

You should see the Swagger UI interface with:
- API title: "Ecommerce Shop API"
- Version: 1.0.0
- List of all endpoints grouped by tags (auth, users, category, product, cart)

---

## 🔐 Step 2: Understanding Authorization

### **2.1 Why Do We Need Authorization?**

**Protected Routes** require authentication because they:
- Access sensitive user data (profile, other users)
- Modify resources (create/update/delete products, categories)
- Perform operations that need to know WHO is making the request
- Enforce role-based permissions (admin, vendor, customer)

**Public Routes** (no auth required):
- `POST /api/auth/register` - Anyone can register
- `POST /api/auth/login` - Anyone can login
- `GET /api/product` - Anyone can view products
- `GET /api/category` - Anyone can view categories

**Protected Routes** (require auth token):
- `GET /api/auth/profile` - Need to know whose profile
- `POST /api/product` - Need to know who's creating it
- `DELETE /api/users/:id` - Need admin privileges
- `PUT /api/product/:id` - Need to verify ownership

---

### **2.2 How JWT Authorization Works**

```
┌─────────────────────────────────────────────────────────┐
│                   1. User Logs In                        │
│   POST /api/auth/login                                  │
│   { email, password }                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                2. Server Returns JWT Token               │
│   { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│        3. Client Stores Token (Swagger stores it)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      4. Client Sends Token in Every Request              │
│   Authorization: Bearer TOKEN                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│      5. Server Validates Token & Processes Request       │
│   - Verifies signature                                  │
│   - Checks expiration                                   │
│   - Extracts user ID from token                         │
│   - Allows or denies access                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Step 3: Complete Testing Workflow

### **Phase 1: Authentication (No Authorization Needed)**

---

#### **Test 1: Register a New User**

**Why:** Create a test account to get an authentication token

**Steps:**

1. **Locate Endpoint:** Find `POST /api/auth/register` under the "auth" tag
2. **Click "Try it out"** button (top right of the endpoint)
3. **Fill in Request Body:**
   ```json
   {
     "firstname": "John",
     "lastname": "Doe",
     "email": "john.doe@example.com",
     "password": "Password123"
   }
   ```
4. **Click "Execute"** button
5. **Check Response:**
   - Status Code: `201 Created`
   - Response Body contains:
     - `message`: "User registered successfully"
     - `user`: User object with `_id`, `firstname`, `lastname`, `email`, `role`
     - `token`: JWT token string (SAVE THIS!)

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "679a1234567890abcdef1234",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "createdAt": "2026-01-18T21:30:00.000Z",
    "updatedAt": "2026-01-18T21:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzlhMTIzNDU2Nzg5MGFiY2RlZjEyMzQiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM3MjMzNDAwLCJleHAiOjE3Mzc4MzgyMDB9.abc123def456..."
}
```

**Copy the token value** - you'll need it for authorization!

---

#### **Test 2: Login (Alternative to Register)**

**Why:** If you already have an account, use login instead of register

**Steps:**

1. **Locate Endpoint:** Find `POST /api/auth/login` under "auth" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "email": "john.doe@example.com",
     "password": "Password123"
   }
   ```
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Response contains user info and `token`

**Copy the token** for the next steps!

---

### **Phase 2: Authorize in Swagger UI**

**This is the CRITICAL step!**

---

#### **How to Authorize:**

1. **Find the "Authorize" Button:**
   - Located at the top-right of the Swagger UI page
   - Has a lock icon 🔒 next to it

2. **Click "Authorize"**
   - A modal window will pop up
   - Shows "BearerAuth (http, Bearer)"

3. **Paste Your Token:**
   - In the "Value" field, enter: **ONLY YOUR TOKEN** (no "Bearer" prefix)
   - **CRITICAL:** Swagger UI automatically adds "Bearer " for you!
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   **✅ CORRECT Format (Paste this in Swagger UI):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzlhMTIzNDU2Nzg5MGFiY2RlZjEyMzQiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM3MjMzNDAwLCJleHAiOjE3Mzc4MzgyMDB9.abc123def456...
   ```

   **❌ INCORRECT Formats (Don't use these in Swagger UI):**
   ```
   ❌ Bearer eyJhbGci...     (Swagger adds "Bearer" automatically - will result in "Bearer Bearer")
   ❌ "eyJhbGci..."          (Don't include quotes)
   ❌ bearer eyJhbGci...     (Don't add any prefix)
   ```

   **📝 Note for curl/Postman:** When using curl or Postman directly, you DO need to include "Bearer " prefix. But in Swagger UI, it's added automatically.

4. **Click "Authorize"** button in the modal
5. **Click "Close"**
6. **Confirmation:** The lock icon 🔒 should now appear as closed/locked

**Now all protected endpoints will automatically include your token!**

---

### **Phase 3: Test Protected Auth Endpoints**

---

#### **Test 3: Get User Profile**

**Why:** Verify authentication works and retrieve your user info

**Steps:**

1. **Locate:** `GET /api/auth/profile` under "auth" tag
2. **Notice:** A lock icon 🔒 appears on the right (indicating protected route)
3. **Click "Try it out"**
4. **Click "Execute"** (no parameters needed)
5. **Check Response:**
   - Status Code: `200 OK`
   - Response contains your user profile (without password)

**Expected Response:**
```json
{
  "user": {
    "_id": "679a1234567890abcdef1234",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "createdAt": "2026-01-18T21:30:00.000Z",
    "updatedAt": "2026-01-18T21:30:00.000Z"
  }
}
```

**If you get 401 Unauthorized:**
- Your token expired (default: 7 days)
- You didn't authorize correctly
- Go back to Phase 2 and re-authorize

---

#### **Test 4: Update Profile**

**Why:** Test updating user information

**Steps:**

1. **Locate:** `PUT /api/auth/profile` under "auth" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "firstname": "Jane",
     "lastname": "Smith"
   }
   ```
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - User info updated

---

#### **Test 5: Change Password**

**Why:** Test password change functionality

**Steps:**

1. **Locate:** `POST /api/auth/change-password` under "auth" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "oldPassword": "Password123",
     "newPassword": "NewPassword456"
   }
   ```
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Message: "Password changed successfully"

**IMPORTANT:** After changing password, you'll need to:
- Login again with new password
- Get new token
- Re-authorize with new token

---

### **Phase 4: Test Public Product/Category Endpoints**

---

#### **Test 6: View All Categories**

**Why:** Test public access to categories (no auth needed)

**Steps:**

1. **Locate:** `GET /api/category` under "category" tag
2. **Notice:** No lock icon (public route)
3. **Click "Try it out"**
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - List of all categories

---

#### **Test 7: View All Products**

**Why:** Test public product listing

**Steps:**

1. **Locate:** `GET /api/product` under "product" tag
2. **Click "Try it out"**
3. **Click "Execute"**
4. **Check Response:**
   - Status Code: `200 OK`
   - List of all products

---

#### **Test 8: Get Product by ID**

**Why:** Test retrieving a specific product

**Steps:**

1. **Locate:** `GET /api/products/{id}` under "product" tag
2. **Click "Try it out"**
3. **Fill in Parameter:**
   - `id`: Copy a product ID from Test 7 response (e.g., "679a1234567890abcdef1234")
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Single product details

---

### **Phase 5: Test Role-Based Operations**

---

#### **Test 9: Create Category (Admin Only)**

**Why:** Test admin-only category creation

**Prerequisites:** 
- You must be logged in as an admin user
- Default registered users are "customer" role
- You'll need to manually update your role in MongoDB to "admin"

**Update Role in MongoDB:**
```javascript
// In MongoDB shell or Compass:
db.users.updateOne(
  { email: "john.doe@example.com" },
  { $set: { role: "admin" } }
)
```

**After updating role, login again to get new token with admin role**

**Steps:**

1. **Locate:** `POST /api/category` under "category" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "name": "Electronics",
     "description": "Electronic devices and gadgets"
   }
   ```
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `201 Created` (if admin)
   - Status Code: `403 Forbidden` (if not admin)

---

#### **Test 10: Create Product (Vendor/Admin)**

**Why:** Test vendor product creation

**Prerequisites:**
- Update your role to "vendor" or "admin" in MongoDB
- Login again to get new token

**Steps:**

1. **Locate:** `POST /api/product` under "product" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "name": "iPhone 15 Pro",
     "description": "Latest Apple smartphone",
     "price": 999.99,
     "quantity": 50,
     "category": "679a1234567890abcdef1234"
   }
   ```
   **Note:** Use a valid category ID from Test 6

4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `201 Created` (if vendor/admin)
   - Status Code: `403 Forbidden` (if customer)
   - Response contains created product with `_id`

**Save the product `_id`** for update/delete tests!

---

#### **Test 11: Update Product**

**Why:** Test product modification (owner or admin only)

**Steps:**

1. **Locate:** `PUT /api/product/{id}` under "product" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `id`: Product ID from Test 10
4. **Fill in Request Body:**
   ```json
   {
     "name": "iPhone 15 Pro Max",
     "price": 1099.99,
     "quantity": 45
   }
   ```
5. **Click "Execute"**
6. **Check Response:**
   - Status Code: `200 OK` (if owner or admin)
   - Status Code: `403 Forbidden` (if not owner and not admin)

---

#### **Test 12: Delete Product**

**Why:** Test product deletion (owner or admin only)

**Steps:**

1. **Locate:** `DELETE /api/product/{id}` under "product" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `id`: Product ID to delete
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK` (if owner or admin)
   - Status Code: `403 Forbidden` (if not owner and not admin)
   - Status Code: `404 Not Found` (if product doesn't exist)

---

### **Phase 6: Test User Management (Admin Only)**

---

#### **Test 13: Get All Users (Admin Only)**

**Why:** Test admin user management

**Prerequisites:** Must be admin role

**Steps:**

1. **Locate:** `GET /api/users` under "users" tag
2. **Click "Try it out"**
3. **Click "Execute"**
4. **Check Response:**
   - Status Code: `200 OK` (if admin)
   - Status Code: `403 Forbidden` (if not admin)
   - List of all users

---

#### **Test 14: Get User by ID**

**Steps:**

1. **Locate:** `GET /api/users/{id}` under "users" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `id`: User ID from Test 13 response
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Single user details

---

#### **Test 15: Create User (Admin Only)**

**Why:** Admin creating new user with specific role

**Steps:**

1. **Locate:** `POST /api/users` under "users" tag
2. **Click "Try it out"**
3. **Fill in Request Body:**
   ```json
   {
     "firstname": "Vendor",
     "lastname": "User",
     "email": "vendor@example.com",
     "password": "Password123",
     "role": "vendor"
   }
   ```
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `201 Created` (if admin)
   - New user created with specified role

---

#### **Test 16: Update User**

**Steps:**

1. **Locate:** `PUT /api/users/{id}` under "users" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `id`: User ID to update
4. **Fill in Request Body:**
   ```json
   {
     "firstname": "Updated Name",
     "role": "admin"
   }
   ```
5. **Click "Execute"**
6. **Check Response:**
   - Status Code: `200 OK`
   - Updated user info

---

#### **Test 17: Delete User**

**Steps:**

1. **Locate:** `DELETE /api/users/{id}` under "users" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `id`: User ID to delete
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Message: "User deleted successfully"

---

### **Phase 7: Test Cart Operations**

---

#### **Test 18: Get User Cart**

**Steps:**

1. **Locate:** `GET /api/cart/{userId}` under "cart" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `userId`: Your user ID from profile
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Cart contents

---

#### **Test 19: Add Item to Cart**

**Steps:**

1. **Locate:** `POST /api/cart/{userId}/items` under "cart" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `userId`: Your user ID
4. **Fill in Request Body:**
   ```json
   {
     "productId": "679a1234567890abcdef1234",
     "quantity": 2
   }
   ```
5. **Click "Execute"**
6. **Check Response:**
   - Status Code: `201 Created`
   - Item added to cart

---

#### **Test 20: Update Cart Item**

**Steps:**

1. **Locate:** `PUT /api/cart/{userId}/items/{id}` under "cart" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `userId`: Your user ID
   - `id`: Cart item ID
4. **Fill in Request Body:**
   ```json
   {
     "quantity": 5
   }
   ```
5. **Click "Execute"**

---

#### **Test 21: Delete Cart Item**

**Steps:**

1. **Locate:** `DELETE /api/cart/{userId}/items/{id}` under "cart" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `userId`: Your user ID
   - `id`: Cart item ID
4. **Click "Execute"**

---

#### **Test 22: Clear Entire Cart**

**Steps:**

1. **Locate:** `DELETE /api/cart/{userId}` under "cart" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `userId`: Your user ID
4. **Click "Execute"**
5. **Check Response:**
   - Status Code: `200 OK`
   - Cart cleared

---

### **Phase 8: Test Password Recovery**

---

#### **Test 23: Forgot Password**

**Why:** Test password reset token generation

**Steps:**

1. **Logout/Unauthorize** (click Authorize button, then "Logout")
2. **Locate:** `POST /api/auth/forgot-password` under "auth" tag
3. **Click "Try it out"**
4. **Fill in Request Body:**
   ```json
   {
     "email": "john.doe@example.com"
   }
   ```
5. **Click "Execute"**
6. **Check Response:**
   - Status Code: `200 OK`
   - Response contains `resetToken`
   - **Copy the resetToken**

---

#### **Test 24: Reset Password**

**Why:** Complete password reset with token

**Steps:**

1. **Locate:** `POST /api/auth/reset-password/{token}` under "auth" tag
2. **Click "Try it out"**
3. **Fill in Parameters:**
   - `token`: Paste the resetToken from Test 23
4. **Fill in Request Body:**
   ```json
   {
     "newPassword": "BrandNewPassword789"
   }
   ```
5. **Click "Execute"**
6. **Check Response:**
   - Status Code: `200 OK`
   - Message: "Password reset successfully"

**Now login with new password to continue testing!**

---

## ⚠️ Common Testing Issues & Solutions

### **Issue 1: "Authentication required" or "Access denied"**

**Symptoms:**
- 401 Unauthorized
- Response: "Access denied. No token provided" or "Authentication required"

**Most Common Cause:** Double "Bearer" in Authorization header

**Check your curl command in Swagger:**
- ❌ Wrong: `Authorization: Bearer Bearer eyJhbGci...`
- ✅ Correct: `Authorization: Bearer eyJhbGci...`

**Solutions:**
1. Click the "Authorize" button at top-right
2. Click "Logout" to clear current token
3. **Paste ONLY the token** (DO NOT include "Bearer" - Swagger adds it automatically)
4. Click "Authorize" then "Close" in the modal
5. The lock icon should appear closed 🔒
6. Try your request again and check the curl command - should have only ONE "Bearer"

---

### **Issue 2: "Invalid or expired token"**

**Symptoms:**
- 401 Unauthorized
- Response: "Invalid or expired token"

**Solutions:**
1. Token expired (default: 7 days)
2. Login again to get fresh token
3. Copy new token
4. Click "Authorize" button
5. Click "Logout" first if needed
6. Paste new token with "Bearer " prefix
7. Authorize again

---

### **Issue 3: "Cannot POST /api/auth/register" - 404 Error**

**Symptoms:**
- 404 Not Found
- Response: "Cannot POST /api/auth/register"

**Solutions:**
1. Check server is running: `npm run dev`
2. Verify MongoDB is connected
3. Check terminal for errors
4. Verify routes are mounted correctly in app.ts
5. Try refreshing Swagger UI page

---

### **Issue 4: "Access denied" despite being authorized**

**Symptoms:**
- 403 Forbidden
- Response: "Access denied" or "Insufficient permissions"

**Solutions:**
1. Check your user role in MongoDB
2. Some endpoints require specific roles:
   - Admin: user management, category management, all products
   - Vendor: create products, edit own products
   - Customer: view only, cart operations
3. Update role in database if needed
4. Login again with updated role
5. Get new token and re-authorize

---

### **Issue 5: "Product not found" or "Category not found"**

**Symptoms:**
- 404 Not Found
- Response: "Product not found"

**Solutions:**
1. Use valid ObjectId format (24 hex characters)
2. Copy exact `_id` from previous responses
3. Check if resource was deleted
4. Try GET all products/categories first to see available IDs

---

### **Issue 6: Swagger UI not loading**

**Symptoms:**
- Blank page or "Cannot GET /api-docs"

**Solutions:**
1. Check server is running
2. Navigate to exact URL: `http://localhost:3000/api-docs`
3. Check app.ts has: `app.use("/api-docs", swagger)`
4. Check swagger.ts exports correctly
5. Clear browser cache
6. Try incognito/private window

---

## 📊 Testing Checklist

Use this checklist to verify all endpoints work:

### **Authentication Endpoints**
- [ ] Register new user
- [ ] Login with credentials
- [ ] Get user profile (authorized)
- [ ] Update profile (authorized)
- [ ] Change password (authorized)
- [ ] Logout (authorized)
- [ ] Forgot password (public)
- [ ] Reset password with token (public)

### **Category Endpoints**
- [ ] Get all categories (public)
- [ ] Create category (admin only)
- [ ] Update category (admin only)
- [ ] Delete category (admin only)

### **Product Endpoints**
- [ ] Get all products (public)
- [ ] Get product by ID (public)
- [ ] Create product (vendor/admin)
- [ ] Update own product (vendor/admin)
- [ ] Delete own product (vendor/admin)
- [ ] Try to update other's product as vendor (should fail)

### **User Management Endpoints (Admin Only)**
- [ ] Get all users
- [ ] Get user by ID
- [ ] Create user with specific role
- [ ] Update user
- [ ] Delete user

### **Cart Endpoints**
- [ ] Get user cart
- [ ] Add item to cart
- [ ] Update cart item quantity
- [ ] Delete cart item
- [ ] Clear entire cart

### **Authorization Tests**
- [ ] Test protected endpoint without token (should fail with 401)
- [ ] Test with invalid token (should fail with 401)
- [ ] Test with expired token (should fail with 401)
- [ ] Test customer accessing admin endpoint (should fail with 403)
- [ ] Test vendor modifying other vendor's product (should fail with 403)

---

## 💡 Pro Tips for Swagger Testing

### **1. Use Swagger's Built-in Features**
- **Try it out:** Enables input fields
- **Execute:** Sends the actual request
- **Clear:** Resets all fields
- **Curl:** Shows equivalent curl command
- **Request URL:** Shows the actual URL being called

### **2. Copy IDs from Responses**
- After creating a resource, copy its `_id`
- Use it immediately in update/delete tests
- Keep a notepad with test IDs

### **3. Test Edge Cases**
- Invalid IDs (wrong format, non-existent)
- Missing required fields
- Invalid data types
- Empty strings
- Negative numbers for prices/quantities
- Very long strings

### **4. Test Role Transitions**
- Start as customer
- Test what you CAN'T access
- Update to vendor
- Test vendor capabilities
- Update to admin
- Test full access

### **5. Monitor Server Terminal**
- Watch for errors while testing
- Check MongoDB queries being executed
- See authentication attempts
- Spot issues early

### **6. Use Browser DevTools**
- Network tab shows actual HTTP requests
- See exact headers being sent
- Check response times
- Debug authorization issues

---

## 🎯 Quick Reference: Roles & Access

| Endpoint | Customer | Vendor | Admin |
|----------|----------|--------|-------|
| POST /api/auth/register | ✅ | ✅ | ✅ |
| POST /api/auth/login | ✅ | ✅ | ✅ |
| GET /api/auth/profile | ✅ | ✅ | ✅ |
| PUT /api/auth/profile | ✅ | ✅ | ✅ |
| GET /api/product | ✅ | ✅ | ✅ |
| GET /api/category | ✅ | ✅ | ✅ |
| POST /api/product | ❌ | ✅ | ✅ |
| PUT /api/product/:id (own) | ❌ | ✅ | ✅ |
| PUT /api/product/:id (others) | ❌ | ❌ | ✅ |
| DELETE /api/product/:id (own) | ❌ | ✅ | ✅ |
| DELETE /api/product/:id (others) | ❌ | ❌ | ✅ |
| POST /api/category | ❌ | ❌ | ✅ |
| PUT /api/category/:id | ❌ | ❌ | ✅ |
| DELETE /api/category/:id | ❌ | ❌ | ✅ |
| GET /api/users | ❌ | ❌ | ✅ |
| POST /api/users | ❌ | ❌ | ✅ |
| PUT /api/users/:id | ❌ | ❌ | ✅ |
| DELETE /api/users/:id | ❌ | ❌ | ✅ |
| Cart Operations | ✅ | ✅ | ✅ |

---

## 📚 Additional Resources

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [HTTP Status Codes Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [JWT.io - Debug Tokens](https://jwt.io/)
- [Postman Alternative](https://www.postman.com/)

---

## 🎓 What You've Learned

After completing this guide, you now know:
- ✅ How to access and navigate Swagger UI
- ✅ Why authorization is required for protected routes
- ✅ How to obtain a JWT token via registration/login
- ✅ How to authorize in Swagger UI with Bearer token
- ✅ How to test all API endpoints systematically
- ✅ How to interpret response codes and error messages
- ✅ How role-based access control works in practice
- ✅ How to troubleshoot common testing issues

---

**Last Updated:** January 18, 2026
**Feature:** Swagger UI Testing Guide
**Status:** Complete & Production Ready

---

# 🚀 Render Deployment Guide
## Complete Documentation for Deploying to Render.com

---

## 📋 Overview

This guide walks you through deploying your Node.js Express API to Render.com, a modern hosting platform with free tier support.

**What you'll learn:**
- ✅ How to prepare your project for production
- ✅ How to set up Render.com
- ✅ How to configure environment variables
- ✅ How to deploy from GitHub
- ✅ How to monitor your deployment

---

## 🔧 Step 1: Prepare Your Project for Production

### **1.1 Update package.json Scripts**

Your `package.json` should have these scripts:

```json
"scripts": {
  "dev": "nodemon --exec ts-node ./src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

**What each does:**
- `dev`: Local development with auto-reload
- `build`: Compiles TypeScript to JavaScript in `dist/` folder
- `start`: Runs compiled JavaScript on production
- `test`: Placeholder for testing

---

### **1.2 Update tsconfig.json**

Make sure these settings are enabled:

```jsonc
"compilerOptions": {
  "rootDir": "./src",      // Input directory
  "outDir": "./dist",      // Output directory for compiled files
  "target": "esnext",      // JavaScript version
  "module": "nodenext",    // Module system
  ...
}
```

---

### **1.3 Create .gitignore**

Ensure you have a `.gitignore` file to exclude unnecessary files:

```
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
```

**Important:** Never commit `.env` file to GitHub!

---

### **1.4 Update .env for Production**

Your `.env` file should have:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-very-long-random-secret-key-min-32-characters
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

**Security Notes:**
- Change `JWT_SECRET` to a long random string
- Use MongoDB Atlas (cloud database)
- Never commit `.env` to GitHub
- Set variables in Render dashboard instead

---

## 📦 Step 2: Push to GitHub

### **2.1 Commit and Push Your Code**

```bash
# Stage all changes
git add .

# Commit
git commit -m "Prepare for production deployment"

# Push to your development branch
git push origin development
```

**Make sure these files are committed:**
- ✅ package.json (with build script)
- ✅ tsconfig.json (with outDir configured)
- ✅ .gitignore (to exclude node_modules and .env)
- ✅ src/ folder (your source code)
- ✅ render.yaml (deployment configuration - optional but recommended)

**Make sure these are NOT committed:**
- ❌ node_modules/ (too large)
- ❌ .env (secrets)
- ❌ dist/ (generated during build)

---

## 🌐 Step 3: Set Up Render.com Account

### **3.1 Create Account**

1. Go to [render.com](https://render.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended for easier deployment)
4. Authorize Render to access your GitHub account

---

### **3.2 Create New Web Service**

1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Click "Connect GitHub account"
   - Select `nodemystry-crud-authenticatio` repository
   - Select branch: `development`
4. Fill in service details:
   - **Name:** `nodemystry-crud-api`
   - **Region:** Choose closest to your users (e.g., Ohio, Frankfurt)
   - **Branch:** `development`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/server.js`
   - **Plan:** Free (for development/testing)

---

### **3.3 Set Environment Variables**

In Render dashboard:

1. Scroll to **"Environment"** section
2. Click **"Add Environment Variable"** for each:

```
KEY: PORT
VALUE: 3000

KEY: NODE_ENV
VALUE: production

KEY: MONGODB_URI
VALUE: mongodb+srv://username:password@cluster.mongodb.net/dbname

KEY: JWT_SECRET
VALUE: your-very-long-random-secret-key-min-32-characters

KEY: JWT_EXPIRES_IN
VALUE: 7d
```

**Get MONGODB_URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster if you haven't already
3. Go to "Database" → "Connect"
4. Choose "Drivers"
5. Copy the connection string
6. Replace `<username>` and `<password>` with your credentials

---

### **3.4 Deploy**

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your GitHub repository
   - Install dependencies (`npm install`)
   - Run build command (`npm run build`)
   - Start your server (`node dist/server.js`)
3. Watch the deployment logs
4. Once deployed, you'll get a URL like: `https://nodemystry-crud-api.onrender.com`

---

## ✅ Step 4: Verify Deployment

### **4.1 Check if Server is Running**

```bash
curl https://nodemystry-crud-api.onrender.com
# Should return: "Welcome to my app"
```

---

### **4.2 Test Swagger UI**

Navigate to:
```
https://nodemystry-crud-api.onrender.com/api-docs
```

Should show Swagger UI with all endpoints

---

### **4.3 Test an Endpoint**

```bash
curl https://nodemystry-crud-api.onrender.com/api/category
# Should return list of categories
```

---

## 🔄 Step 5: Update Your Code & Redeploy

### **5.1 Make Changes Locally**

```bash
# Make changes to your code
npm run dev  # Test locally
```

---

### **5.2 Commit and Push**

```bash
git add .
git commit -m "Add new feature"
git push origin development
```

---

### **5.3 Automatic Deployment**

Render will automatically:
- Detect the push to `development` branch
- Pull latest code
- Run build and start commands
- Redeploy your service

**No manual steps needed!** (if auto-deploy is enabled)

---

## ⚠️ Troubleshooting Deployment Issues

### **Issue 1: "Missing script: build"**

**Cause:** `package.json` doesn't have a build script

**Solution:**
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js"
}
```

---

### **Issue 2: Build fails - "Cannot find module 'typescript'"**

**Cause:** TypeScript not installed

**Solution:**
```bash
npm install --save-dev typescript ts-node @types/node
git add package.json package-lock.json
git commit -m "Add TypeScript dependencies"
git push origin development
```

---

### **Issue 3: Service crashes with "Cannot find module 'express'"**

**Cause:** Dependencies not installed

**Solution:**
```json
"buildCommand": "npm install && npm run build"
```

Make sure this is in your Render settings

---

### **Issue 4: "MongoDB connection error"**

**Cause:** Invalid MONGODB_URI or IP not whitelisted

**Solution:**
1. Check MONGODB_URI in Render environment variables
2. Add Render's IP to MongoDB Atlas whitelist:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Enter: `0.0.0.0/0` (allows all - use restrictive IPs in production)
   - Or add Render's specific IP (found in deployment logs)

---

### **Issue 5: "Service is running but not responding"**

**Cause:** Server not binding to correct PORT

**Solution:**
Make sure your `server.ts` uses `process.env.PORT`:

```typescript
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

### **Issue 6: Deployed URL returns 404**

**Cause:** Routes not matching or swagger path wrong

**Solutions:**
1. Test root endpoint: `https://yourapp.onrender.com/`
2. Test API: `https://yourapp.onrender.com/api/category`
3. Check logs for routing errors

---

## 📊 Monitoring Your Deployment

### **1. Check Logs**

In Render dashboard:
1. Click your service name
2. Go to **"Logs"** tab
3. Watch real-time logs

**Look for:**
- ✅ "server is up and running 3000"
- ✅ "MongoDB connected successfully"
- ❌ Error messages or crashes

---

### **2. Check Health**

In Render dashboard:
1. Go to **"Overview"** tab
2. Check **"Status"**: Should be "Live" (green)
3. Check **"Last Updated"**: Should be recent

---

### **3. Monitor Performance**

In Render dashboard:
1. Go to **"Metrics"** tab
2. View CPU, Memory, and Network usage
3. Watch for spikes or errors

---

### **4. Set Up Alerts (Pro Feature)**

Enable email notifications for crashes or errors in settings

---

## 🔐 Security Best Practices for Production

### **1. Environment Variables**
- ✅ Store all secrets in Render environment variables
- ✅ Never commit `.env` file
- ✅ Use strong, random `JWT_SECRET` (32+ characters)
- ❌ Don't use placeholder values

### **2. MongoDB Atlas Security**
- ✅ Create strong database username/password
- ✅ Use VPC Peering or private endpoints for production
- ✅ Restrict IP whitelist to Render's IP
- ❌ Don't allow `0.0.0.0/0` in production

### **3. HTTPS**
- ✅ Render provides free SSL/TLS certificates
- ✅ All connections use HTTPS by default
- ✅ Update your Swagger UI to use `https://` URLs

### **4. CORS Configuration**
Consider adding CORS to prevent unauthorized cross-origin requests:

```typescript
import cors from "cors";

app.use(cors({
  origin: ["https://yourdomain.com"],
  credentials: true
}));
```

---

## 📚 Free vs Paid Plans

| Feature | Free | Paid |
|---------|------|------|
| Uptime | ~99% (with 15 min inactivity shut-down) | 99.99% |
| Build minutes | 500/month | Unlimited |
| Memory | 512 MB | 2GB+ |
| Auto-scaling | No | Yes |
| Custom domain | Yes | Yes |
| SSL | Free | Free |
| Support | Community | Priority |

**Free Plan Notes:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Good for development/testing
- Upgrade to paid for production

---

## 🎯 Production Deployment Checklist

Before deploying to production:

- [ ] All code committed to GitHub
- [ ] `.env` file in `.gitignore`
- [ ] `package.json` has build and start scripts
- [ ] `tsconfig.json` has rootDir and outDir configured
- [ ] Local testing passes (`npm run dev`)
- [ ] MongoDB Atlas cluster created
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] Environment variables set in Render
- [ ] Render service created with correct branch
- [ ] Deployment successful (check logs)
- [ ] API endpoints responding
- [ ] Swagger UI accessible
- [ ] MongoDB connection verified
- [ ] Test with real token

---

## 🚀 Next Steps After Deployment

1. **Test all endpoints** against deployed URL
2. **Set up monitoring** for errors and downtime
3. **Configure custom domain** (if needed)
4. **Enable Auto-deploy** from GitHub pushes
5. **Monitor logs** regularly
6. **Plan for scale** as traffic grows

---

**Last Updated:** January 18, 2026
**Feature:** Render.com Deployment Guide
**Status:** Production Ready
