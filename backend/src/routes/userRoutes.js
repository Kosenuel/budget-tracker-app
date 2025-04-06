// src/routes/userRoutes.js
const express = require('express');
const { updateUserProfile, changeUserPassword, resetCurrentUserData } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes are protected
router.use(protect);

router.put('/profile', updateUserProfile);     // PUT /api/users/profile
router.put('/password', changeUserPassword);   // PUT /api/users/password
router.delete('/data', resetCurrentUserData); // DELETE /api/users/data

module.exports = router;