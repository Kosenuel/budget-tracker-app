// src/models/Category.js
const db = require('../config/db');

// Helper function to check if a category is in use
const isCategoryInUse = async (categoryId) => {
    const { rows } = await db.query(
        'SELECT 1 FROM transactions WHERE category_id = $1 LIMIT 1',
        [categoryId]
    );
    return rows.length > 0;
};

// Get default categories AND categories specific to the user
const getDefaultAndUserCategories = async (userId) => {
    const { rows } = await db.query(
        `SELECT id, name, type, icon, is_default,
                CASE WHEN user_id = $1 THEN true ELSE false END AS is_user_owned
         FROM categories
         WHERE is_default = TRUE OR user_id = $1
         ORDER BY type ASC, name ASC`,
        [userId]
    );
    return rows;
};

 // Find a specific category by ID (used for checking ownership/default status)
const findCategoryById = async (id) => {
    const { rows } = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0];
}

// Create a new category for a specific user
const createCategory = async ({ user_id, name, type, icon }) => {
    // Ensure type is valid ('income' or 'expense') - controller should also validate
    if (type !== 'income' && type !== 'expense') {
        throw new Error("Invalid category type specified.");
    }
     try {
        const { rows } = await db.query(
             // is_default is explicitly FALSE here
            'INSERT INTO categories (user_id, name, type, icon, is_default) VALUES ($1, $2, $3, $4, FALSE) RETURNING *',
            [user_id, name, type, icon]
        );
        // Manually add is_user_owned for consistency with get endpoint
        if(rows[0]) rows[0].is_user_owned = true;
        return rows[0];
     } catch (error) {
         // Handle potential unique constraint violation (user_id, name, type)
        if (error.code === '23505') { // PostgreSQL unique violation code
            throw new Error(`Category "${name}" (${type}) already exists for this user.`);
        }
         throw error; // Re-throw other errors
     }
};

// Update a user-owned category
const updateCategory = async (id, user_id, { name, type, icon }) => {
    // Double check it belongs to user and is not default
    const category = await findCategoryById(id);
    if (!category || category.user_id !== user_id || category.is_default) {
        throw new Error("Category not found, not owned by user, or is a default category.");
    }
     if (type && type !== 'income' && type !== 'expense') {
        throw new Error("Invalid category type specified.");
    }

    try {
        const { rows } = await db.query(
            `UPDATE categories SET
                name = COALESCE($1, name),
                type = COALESCE($2, type),
                icon = COALESCE($3, icon),
                updated_at = NOW()
             WHERE id = $4 AND user_id = $5 AND is_default = FALSE
             RETURNING *`,
            [name, type, icon, id, user_id]
        );
         if(rows[0]) rows[0].is_user_owned = true; // Add flag
        return rows[0];
    } catch (error) {
        if (error.code === '23505') {
            throw new Error(`Category "${name}" (${type}) already exists for this user.`);
         }
        throw error;
    }
};

// Delete a user-owned category
const deleteCategory = async (id, user_id) => {
     // 1. Check ownership and ensure it's not a default category
     const category = await findCategoryById(id);
     if (!category) return { success: false, status: 404, message: 'Category not found.' };
     if (category.is_default) return { success: false, status: 403, message: 'Cannot delete default categories.'};
     if (category.user_id !== user_id) return { success: false, status: 403, message: 'Not authorized to delete this category.' };


     // 2. Check if the category is in use by any transactions
    const inUse = await isCategoryInUse(id);
    if (inUse) {
         return { success: false, status: 400, message: 'Cannot delete category because it is currently used in transactions.' };
    }

    // 3. Proceed with deletion
     const { rowCount } = await db.query(
         'DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = FALSE',
         [id, user_id]
    );

    if (rowCount === 0) {
         // Should not happen if checks above passed, but as a safeguard
         return { success: false, status: 404, message: 'Category not found or deletion failed unexpectedly.' };
     }

     return { success: true, status: 200, message: 'Category deleted successfully.' }; // Or use 204 No Content status
};

// src/models/Category.js
const findCategoryByNameAndUserOrDefaults = async (name, userId, type) => {
    // Look for user's category first, then default, matching type
    const { rows } = await db.query(
        `SELECT id FROM categories
         WHERE name ILIKE $1 AND type = $3 AND (user_id = $2 OR is_default = TRUE)
         ORDER BY is_default ASC -- Prioritize user's category if names clash
         LIMIT 1`, // Case-insensitive search
        [name, userId, type] // Ensure type ('income'/'expense') matches
    );
   return rows[0];
};


module.exports = {
    getDefaultAndUserCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    findCategoryByNameAndUserOrDefaults, 
     // Export if needed by controller
    // isCategoryInUse // Not typically needed outside the delete function
};