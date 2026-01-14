import Express from "express";
import { getProduct, addProduct, getProductById, updateProduct, deleteProduct } from "../controllers/product.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const productRoute = Express.Router();

// Public routes
productRoute.get("/product", getProduct);
productRoute.get("/products/:id", getProductById);

// Protected routes (authentication required)
// Vendors can create, update, delete their own products
// Admins can do all operations
productRoute.post("/product", authenticateToken, addProduct);
productRoute.put("/product/:id", authenticateToken, updateProduct);
productRoute.delete("/product/:id", authenticateToken, deleteProduct);

export default productRoute;