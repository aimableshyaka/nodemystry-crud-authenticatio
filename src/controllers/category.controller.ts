import { Request, Response } from "express";
import CategoryModel from "../models/category.model";
import User from "../models/user.model";

// GET all categories (public access)
async function getCategory(req: Request, res: Response) {
    try {
        const categories = await CategoryModel.find();
        return res.status(200).json({ categories });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
}

// GET category by ID (public access)
async function CategoryById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch category" });
    }
}

// POST - add a new category (admin only)
async function addCategory(req: Request, res: Response) {
    try {
        // Authorization check - verify user is admin
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const user = await User.findById(req.user.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                error: "Only administrators can create categories",
            });
        }

        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

        const newCategory = new CategoryModel({ name, description });
        await newCategory.save();

        return res.status(201).json({ message: "Category added successfully", category: newCategory });
    } catch (error) {
        return res.status(500).json({ error: "Failed to add category" });
    }
}

// PUT - update category (admin only)
async function updateCategory(req: Request, res: Response) {
    try {
        // Authorization check - verify user is admin
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const user = await User.findById(req.user.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                error: "Only administrators can update categories",
            });
        }

        const { id } = req.params;
        const { name, description } = req.body;

        const category = await CategoryModel.findByIdAndUpdate(
            id,
            { name, description },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update category" });
    }
}

// DELETE category (admin only)
async function deleteCategory(req: Request, res: Response) {
    try {
        // Authorization check - verify user is admin
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const user = await User.findById(req.user.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                error: "Only administrators can delete categories",
            });
        }

        const { id } = req.params;
        const category = await CategoryModel.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.status(200).json({ message: "Category deleted", category });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete category" });
    }
}

export { getCategory, addCategory, CategoryById, updateCategory, deleteCategory };

