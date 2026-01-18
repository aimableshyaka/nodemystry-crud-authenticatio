import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import logger from "./middlewares/loggers";
import { authenticateToken } from "./middlewares/auth.middleware";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import productRoute from "./routes/product";
import categoryRoute from "./routes/category";
import cartRoute from "./routes/cart";
import  swagger from "./swagger";
const app = express();

// Built-in & third-party middleware
app.use(morgan("dev"));
app.use(express.json());

// use swaggger 
app.use("/api-docs",swagger);
// app.use(logger);

// // Custom middleware
// app.use((req:  Request, res: Response, next: NextFunction) => {
//   console.log("My First Middleware function");
//   next(); // VERY IMPORTANT
// });

// Routes
app.get("/", (req: Request, res: Response) => {
  return res.send("Welcome to my app");
});

// Authentication routes (public)
app.use("/api/auth", authRouter);

// User management routes (protected - requires authentication)
app.use("/api/users", authenticateToken, userRouter);

// Mount product routes under /api to match requested structure
app.use("/api", productRoute);
app.use("/api", authenticateToken, categoryRoute);
app.use("/api", cartRoute);

export default app;
