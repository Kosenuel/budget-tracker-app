// src/routes/categoryRoutes.js
const express = require('express');
const { getCategories, addCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// Apply protect middleware to ALL category routes
router.use(protect);

router.route('/')
    .get(getCategories)     // GET /api/categories
    .post(addCategory);     // POST /api/categories

router.route('/:id')
    .put(updateCategory)    // PUT /api/categories/:id
    .delete(deleteCategory);// DELETE /api/categories/:id

module.exports = router;