const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/authUtils');

const findUserByEmail = async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

const findUserById = async (id) => {
     const { rows } = await db.query('SELECT id, name, email, preferred_currency, created_at FROM users WHERE id = $1', [id]);
     return rows[0];
};

const createUser = async ({ name, email, password, preferred_currency = 'USD' }) => {
    const hashedPassword = await hashPassword(password);
    const { rows } = await db.query(
        'INSERT INTO users (name, email, password_hash, preferred_currency) VALUES ($1, $2, $3, $4) RETURNING id, name, email, preferred_currency, created_at',
        [name, email, hashedPassword, preferred_currency]
    );
    return rows[0];
};

const updateProfile = async (id, { name, preferred_currency }) => {
    // Build the update query dynamically based on provided fields
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(name.trim());
    }
    if (preferred_currency !== undefined) {
        fields.push(`preferred_currency = $${paramIndex++}`);
        // Add validation if needed to ensure currency code is valid
        values.push(preferred_currency.toUpperCase());
    }

    // Only update if there are fields to update
    if (fields.length === 0) {
        // If nothing to update, just return current user data
        return findUserById(id);
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    values.push(id); // Add user ID for the WHERE clause

    const updateQuery = `
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, preferred_currency, created_at, updated_at
    `;

    try {
        const { rows } = await db.query(updateQuery, values);
        if (rows.length === 0) {
            throw new Error("User not found or update failed.");
        }
        return rows[0];
    } catch (error) {
        console.error("Error updating profile in DB:", error);
        throw error; // Re-throw for controller to handle
    }
};

// --- NEW: Get current password hash ---
const findPasswordHashById = async (id) => {
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    if (rows.length === 0) {
        return null; // User not found
    }
    return rows[0].password_hash;
};

// --- NEW: Update password hash ---
const updatePasswordHash = async (id, newPasswordHash) => {
    const { rowCount } = await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, id]
    );
    return rowCount > 0; // Return true if update was successful
};

const resetUserData = async (userId) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        // DELETE FROM budgets WHERE user_id = $1; // If exists
        // DELETE FROM recurring_transactions WHERE user_id = $1; // If exists
        await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM categories WHERE user_id = $1 AND is_default = FALSE', [userId]);
        await client.query('DELETE FROM accounts WHERE user_id = $1', [userId]);
        // Optionally: UPDATE users SET status = 'inactive' WHERE id = $1;
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Data Reset DB Error for user ${userId}:`, error);
        throw new Error('Database error during data reset.');
    } finally {
        client.release();
    }
};

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
    updateProfile,          
    findPasswordHashById,   
    updatePasswordHash,
    resetUserData,      
};
