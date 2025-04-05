const db = require('../config/db');

// Basic function to get transactions for checking account deletion
// Expand this significantly for Phase 2 requirements
const getTransactionsByAccountId = async (account_id, user_id) => {
     const { rows } = await db.query(
         `SELECT t.* FROM transactions t
          JOIN accounts a ON t.account_id = a.id
          WHERE t.account_id = $1 AND a.user_id = $2`,
         [account_id, user_id]
     );
    return rows;
}

const createTransaction = async ({ user_id, account_id, category_id, amount, type, transaction_date, description }) => {
     const { rows } = await db.query(
         'INSERT INTO transactions (user_id, account_id, category_id, amount, type, transaction_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
         [user_id, account_id, category_id, amount, type, transaction_date, description]
     );
     return rows[0];
 };

 const getTransactionsByUserId = async ({ user_id, accountId, categoryId, startDate, endDate, type, searchTerm, limit, offset }) => {
    let query = `
        SELECT t.*, c.name as category_name, a.name as account_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = $1
    `;
    const queryParams = [user_id];
    let paramIndex = 2;

    if (accountId) {
        query += ` AND t.account_id = $${paramIndex++}`;
        queryParams.push(accountId);
    }
    if (categoryId) {
        query += ` AND t.category_id = $${paramIndex++}`;
        queryParams.push(categoryId);
    }
    if (startDate) {
        query += ` AND t.transaction_date >= $${paramIndex++}`;
        queryParams.push(startDate);
    }
     if (endDate) {
        query += ` AND t.transaction_date <= $${paramIndex++}`;
        queryParams.push(endDate);
    }
    if (type) {
        query += ` AND t.type = $${paramIndex++}`;
        queryParams.push(type);
    }
    if (searchTerm) {
         query += ` AND t.description ILIKE $${paramIndex++}`; // Case-insensitive search
         queryParams.push(`%${searchTerm}%`);
    }

    query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`; // Default ordering

    if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        queryParams.push(limit);
    }
    if (offset) {
        query += ` OFFSET $${paramIndex++}`;
        queryParams.push(offset);
    }

    const { rows } = await db.query(query, queryParams);
    return rows;
};

const findTransactionByIdAndUserId = async (id, user_id) => {
    const { rows } = await db.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, user_id]);
    return rows[0];
};

const updateTransaction = async (id, user_id, { account_id, category_id, amount, type, transaction_date, description }) => {
    // We already verified ownership in the controller using findTransactionByIdAndUserId
    const { rows } = await db.query(
        `UPDATE transactions SET
            account_id = $1,
            category_id = $2,
            amount = $3,
            type = $4,
            transaction_date = $5,
            description = $6,
            updated_at = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
         [account_id, category_id, amount, type, transaction_date, description, id, user_id]
    );
    return rows[0];
};


const deleteTransaction = async (id, user_id) => {
    // The existence and ownership check can happen here or in the controller.
    // Doing it here ensures the DB operation only runs if checks pass.
    const { rowCount } = await db.query(
        'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id', // RETURNING confirms deletion happened
        [id, user_id]
    );
    // rowCount will be 1 if deleted, 0 if not found or not owned by the user.
    return rowCount > 0;
};



module.exports = {
    createTransaction,
    getTransactionsByUserId,
    getTransactionsByAccountId,
    findTransactionByIdAndUserId,
    updateTransaction,
    deleteTransaction,
};