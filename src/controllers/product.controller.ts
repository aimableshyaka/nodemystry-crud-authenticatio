import type { Request, Response } from "express";
import ProductModel  from "../models/product.model";
import { randomUUID } from "node:crypto";
import CategoryModel from "../models/category.model";
import User from "../models/user.model";
import mongoose from "mongoose";
import { error } from "node:console";
import { json } from "node:stream/consumers";
import cloudinary from "../config/cloudinary";

async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params; // Get ID from URL

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Fetch product and populate category info
    const product = await ProductModel.findById(id).populate("categoryId").populate("vendorId", "firstname lastname email");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
}

async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Authentication check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Find the product
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get user role
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Authorization check: Only admin or vendor owner can update
    if (user.role !== "admin" && user.role !== "vendor") {
      return res.status(403).json({
        error: "Only vendors or administrators can update products",
      });
    }

    // If vendor, check if they own the product
    if (user.role === "vendor" && product.vendorId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You can only update your own products",
      });
    }

    // req.body contains only the fields the user wants to update
    const updateData = req.body;

    // Vendors cannot change vendorId (only admin can reassign products)
    if (user.role === "vendor") {
      delete updateData.vendorId;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({ product: updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

// DELETE product
async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Authentication check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Find the product
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get user role
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Authorization check: Only admin or vendor owner can delete
    if (user.role !== "admin" && user.role !== "vendor") {
      return res.status(403).json({
        error: "Only vendors or administrators can delete products",
      });
    }

    // If vendor, check if they own the product
    if (user.role === "vendor" && product.vendorId.toString() !== req.user.userId) {
      return res.status(403).json({
        error: "You can only delete your own products",
      });
    }

    const deletedProduct = await ProductModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product deleted", product: deletedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

// async function addProduct(req: Request, res: Response) {
//   try {
//     // Authentication check
//     if (!req.user) {
//       return res.status(401).json({ error: "Authentication required" });
//     }

//     // Authorization check: Only admin and vendor can create products
//     const user = await User.findById(req.user.userId);
//     if (!user || (user.role !== "admin" && user.role !== "vendor")) {
//       return res.status(403).json({
//         error: "Only vendors and administrators can create products",
//       });
//     }

//     const { name, price, description,image, categoryId, inStock, quantity } = req.body;

//     if (!name || !price || !categoryId) {
//       return res.status(400).json({ error: "Name, price and categoryId are required" });
//     }

//     // Optional: Check if category exists
//     const categoryExists = await CategoryModel.findById(categoryId);
//     if (!categoryExists) {
//       return res.status(400).json({ error: "Category does not exist" });
//     }

//     const newProduct = new ProductModel({
//       name,
//       price,
//       description: description || "",
//       image,
//       categoryId,
//       vendorId: req.user.userId,  // Set the current user as vendor
//       inStock: inStock ?? true,
//       quantity: quantity ?? 0,
//     });

//     await newProduct.save();

//     return res.status(201).json({ message: "Product added successfully", product: newProduct });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Failed to add product" });
//   }
// }
async function addProduct(req: Request, res: Response) {
  try {
    // 1️⃣ Authentication check
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // 2️⃣ Authorization check
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== "admin" && user.role !== "vendor")) {
      return res.status(403).json({
        error: "Only vendors and administrators can create products",
      });
    }

    // 3️⃣ Extract normal fields (NOT image)
    const { name, price, description, categoryId, inStock, quantity } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        error: "Name, price and categoryId are required",
      });
    }

    // 4️⃣ Category validation
    const categoryExists = await CategoryModel.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ error: "Category does not exist" });
    }

    // 5️⃣ Image upload to Cloudinary
    let imageUrl = "";
    
    if (req.file) {
      try {
        // Upload buffer to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "products",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file!.buffer);
        });
        
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload image to Cloudinary" });
      }
    }

    // 6️⃣ Create product
    const newProduct = new ProductModel({
      name,
      price,
      description: description || "",
      image: imageUrl,
      categoryId,
      vendorId: req.user.userId,
      inStock: inStock ?? true,
      quantity: quantity ?? 0,
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to add product" });
  }
}
async function getProduct(req: Request, res: Response) {
  try {
    // Populate category and vendor info
    const products = await ProductModel.find()
      .populate("categoryId")
      .populate("vendorId", "firstname lastname email");

    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

export { getProduct, addProduct, getProductById, updateProduct, deleteProduct };
