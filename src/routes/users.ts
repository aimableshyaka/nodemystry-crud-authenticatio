import express from "express";
import {
  getAlluser,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/users.controller";

const userRouter = express.Router();

// GET all users
userRouter.get("/", getAlluser);

// GET user by ID
userRouter.get("/:id", getUserById);

// POST - Create new user
userRouter.post("/", createUser);

// PUT - Update user by ID
userRouter.put("/:id", updateUser);

// DELETE user by ID
userRouter.delete("/:id", deleteUser);

export default userRouter;