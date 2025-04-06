// src/controllers/userController.js
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/authUtils');

// PUT /api/users/profile
const updateUserProfile = async (req, res) => {
    const { name, preferred_currency } = req.body;
    const userId = req.user.id; // From protect middleware

    // Basic validation
    if (name === undefined && preferred_currency === undefined) {
        return res.status(400).json({ message: 'No update information provided (name or preferred_currency).' });
    }
    if (name !== undefined && typeof name !== 'string') {
         return res.status(400).json({ message: 'Invalid name provided.' });
     }
    // Add currency validation if necessary

    try {
        const updatedUser = await User.updateProfile(userId, { name, preferred_currency });

        // Exclude password hash if it's somehow returned (though RETURNING clause prevents it)
        const { password_hash, ...userWithoutPassword } = updatedUser;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Update User Profile error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};

// PUT /api/users/password
const changeUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) { // Match frontend validation
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
    }


    try {
        // 1. Get current hash from DB
        const currentHash = await User.findPasswordHashById(userId);
        if (!currentHash) {
            return res.status(404).json({ message: 'User not found.' }); // Should not happen if protect middleware works
        }

        // 2. Compare provided current password with stored hash
        const isMatch = await comparePassword(currentPassword, currentHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' }); // Use 401 Unauthorized
        }

        // 3. Hash the new password
        const newPasswordHash = await hashPassword(newPassword);

        // 4. Update the hash in the DB
        const success = await User.updatePasswordHash(userId, newPasswordHash);
        if (!success) {
             // Should generally not happen if user exists and query is correct
             throw new Error("Failed to update password hash in database.");
        }


        // Optionally: Invalidate other sessions/tokens here if needed

        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Change User Password error:', error);
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// DELETE /api/users/reset-data
// This endpoint resets user data (transactions, accounts, etc.) but keeps the user account intact
// const User = require('../models/User');

const resetCurrentUserData = async (req, res) => {
    const userId = req.user.id;
    try {
        await User.resetUserData(userId);
        res.status(200).json({ message: 'User data reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Failed to reset user data.' });
    }
};


module.exports = {
    updateUserProfile,
    changeUserPassword,
    resetCurrentUserData,
     
};