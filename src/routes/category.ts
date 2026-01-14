import  express  from "express";
import {getCategory,addCategory,CategoryById,updateCategory,deleteCategory} from "../controllers/category.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const categoryRoute=express.Router();

// Public routes
categoryRoute.get("/categories", getCategory);
categoryRoute.get("/categories/:id", CategoryById);

// Protected routes (admin only)
categoryRoute.post("/categories", authenticateToken, addCategory);
categoryRoute.put("/categories/:id", authenticateToken, updateCategory);
categoryRoute.delete("/categories/:id", authenticateToken, deleteCategory);

export default categoryRoute;