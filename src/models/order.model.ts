import mongoose, { Schema, Document, model } from "mongoose";

// TypeScript interfaces
export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number; // Snapshot price at order time
  productName: string;
  image?: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface IOrder {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose document interface
export interface IOrderDocument extends IOrder, Document {
  _id: mongoose.Types.ObjectId;
}

// Define Mongoose Schemas

// Order Item Schema (subdocument)
const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: String,
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// Order Schema
const orderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true, // For quick user order lookups
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order must contain at least one item"],
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        message: "Invalid order status",
      },
      default: "pending",
      required: true,
    },
    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
      minlength: [10, "Shipping address must be at least 10 characters"],
      maxlength: [500, "Shipping address cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// Create and export the model
const OrderModel = model<IOrderDocument>("Order", orderSchema);
export default OrderModel;
