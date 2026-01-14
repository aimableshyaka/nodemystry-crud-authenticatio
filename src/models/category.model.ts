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