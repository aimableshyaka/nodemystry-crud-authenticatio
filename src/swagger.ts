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
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development Server",
      },
    ],

    tags: [
      {
        name: "category",
        description: "Category API",
      },
      {
        name: "users",
        description: "User API",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
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
        BearerAuth: [],
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
