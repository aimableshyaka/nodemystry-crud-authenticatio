import express, { Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const router = express.Router();

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce Shop API",
      version: "1.0.0",
      description: "Ecommerce-Shop API documentation",
    },

    servers: [
      {
        // url: `http://localhost:${process.env.PORT || 3000}`,

        url:"https://nodemystry-crud-authenticatio.onrender.com/",
        description: "Development Server",
      },
    ],

    tags: [
      {
        name: "auth",
        description: "Authentication API - Register and login",
      },
      {
        name: "category",
        description: "Category API - Manage product categories",
      },
      {
        name: "product",
        description: "Product API - Manage products (Vendor/Admin)",
      },
      {
        name: "cart",
        description: "Shopping Cart API - Manage shopping cart items",
      },
      {
        name: "orders",
        description: "Orders API - Create and manage orders",
      },
      {
        name: "users",
        description: "User API - User management",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "API key authorization",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * GET raw swagger JSON
 */
router.get("/json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

/**
 * Swagger UI
 */
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
