import mongoose, { Schema, Document, model } from "mongoose";

// TypeScript interface
export interface IProduct {
  name: string;
  price: number;
  description?: string;  // optional
  categoryId: string;    // store UUID or MongoDB _id of category
  vendorId: string;      // store MongoDB _id of vendor
  inStock: boolean;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose document interface
export interface IProductDocument extends Document {
  name: string;
  price: number;
  description?: string;
  categoryId: string;
  vendorId: string;
  inStock: boolean;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define Mongoose Schema
const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true, 
    },
    price: {
      type: Number,
      required: true,
      min: 0, 
    },
    description: {
      type: String,
      default: "", 
    },
    categoryId: {
      type: String,
      required: true, 
    },
    vendorId: {
      type: String,
      required: true,
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true, 
    },
    quantity: {
      type: Number,
      required: true,
      min: 0, 
    },
  },
  { timestamps: true } 
);

// Create the model
const ProductModel = model<IProductDocument>("Product", productSchema);
export default ProductModel;
