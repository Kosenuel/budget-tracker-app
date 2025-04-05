// src/controllers/categoryController.js
const Category = require('../models/Category');

// GET /api/categories
const getCategories = async (req, res) => {
    try {
        // req.user.id is attached by the protect middleware
        const categories = await Category.getDefaultAndUserCategories(req.user.id);
        res.status(200).json(categories);
    } catch (error) {
        console.error('Get Categories error:', error);
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// POST /api/categories
const addCategory = async (req, res) => {
    const { name, type, icon } = req.body;

    // Basic Validation
    if (!name || !type) {
        return res.status(400).json({ message: 'Category name and type (income/expense) are required.' });
    }
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Invalid category type. Must be "income" or "expense".' });
    }

    try {
        const newCategory = await Category.createCategory({
            user_id: req.user.id,
            name: name.trim(), // Trim whitespace
            type,
            icon: icon || null // Allow optional icon
        });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Add Category error:', error);
         // Handle specific errors like unique constraint from the model
        if (error.message.includes('already exists')) {
             return res.status(409).json({ message: error.message }); // 409 Conflict
         }
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, type, icon } = req.body;

    // Basic Validation (optional: user might only update one field)
    // if (!name && !type && !icon) {
    //    return res.status(400).json({ message: 'At least one field (name, type, icon) must be provided for update.' });
    // }
    if (type && type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Invalid category type. Must be "income" or "expense".' });
    }

    try {
        const updatedCategory = await Category.updateCategory(parseInt(id), req.user.id, {
            name: name ? name.trim() : undefined, // Pass undefined if not provided
            type: type || undefined,
            icon: icon !== undefined ? icon : undefined // Allow setting icon to null/empty
        });

         if (!updatedCategory) {
             // This case is mostly handled by the error thrown in the model now
             return res.status(404).json({ message: 'Category not found, not owned by user, or is a default category.' });
         }

        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error('Update Category error:', error);
         if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message }); // 409 Conflict
         }
         if (error.message.includes('not found') || error.message.includes('default category')) {
            return res.status(403).json({ message: error.message }); // 403 Forbidden or 404 Not Found depending on context
         }
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Category.deleteCategory(parseInt(id), req.user.id);

        if (!result.success) {
            return res.status(result.status).json({ message: result.message });
        }

        res.status(result.status).json({ message: result.message }); // Or res.status(204).send();
    } catch (error) {
        console.error('Delete Category error:', error);
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};


module.exports = {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
};