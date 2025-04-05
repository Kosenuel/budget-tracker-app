const db = require('../config/db');

// Function to calculate current balance dynamically (more robust than storing it)
const calculateBalance = async (accountId) => {
    // Get initial balance
    const accountRes = await db.query('SELECT initial_balance FROM accounts WHERE id = $1', [accountId]);
    if (accountRes.rows.length === 0) return 0; // Or throw error
    const initialBalance = parseFloat(accountRes.rows[0].initial_balance);

    // Sum income transactions
    const incomeRes = await db.query(
        'SELECT COALESCE(SUM(amount), 0) as total_income FROM transactions WHERE account_id = $1 AND type = $2',
        [accountId, 'income']
    );
    const totalIncome = parseFloat(incomeRes.rows[0].total_income);

     // Sum expense transactions
     const expenseRes = await db.query(
         'SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE account_id = $1 AND type = $2',
         [accountId, 'expense']
     );
    const totalExpense = parseFloat(expenseRes.rows[0].total_expense);

    return initialBalance + totalIncome - totalExpense;
}

const createAccount = async ({ user_id, name, type, currency, initial_balance = 0 }) => {
    const { rows } = await db.query(
        'INSERT INTO accounts (user_id, name, type, currency, initial_balance) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user_id, name, type, currency, initial_balance]
    );
     // Add current balance after creation
     rows[0].current_balance = await calculateBalance(rows[0].id);
    return rows[0];
};

const getAccountsByUserId = async (user_id) => {
    const { rows } = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY name ASC', [user_id]);
    // Calculate current balance for each account
    for (const account of rows) {
        account.current_balance = await calculateBalance(account.id);
    }
    return rows;
};

const getAccountById = async (id, user_id) => {
    const { rows } = await db.query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (rows.length > 0) {
        rows[0].current_balance = await calculateBalance(rows[0].id);
    }
    return rows[0];
}

const updateAccount = async (id, user_id, { name, type, currency, initial_balance }) => {
     const { rows } = await db.query(
         'UPDATE accounts SET name = $1, type = $2, currency = $3, initial_balance = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *',
         [name, type, currency, initial_balance, id, user_id]
     );
     if (rows.length > 0) {
         rows[0].current_balance = await calculateBalance(rows[0].id);
     }
     return rows[0];
 };

const deleteAccount = async (id, user_id) => {
    // IMPORTANT: Decide deletion strategy. Delete transactions too? Or prevent deletion if transactions exist?
    // Simple deletion for now:
     const { rowCount } = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, user_id]);
     return rowCount > 0; // Return true if deletion happened
 };


module.exports = {
    createAccount,
    getAccountsByUserId,
    getAccountById,
    updateAccount,
    deleteAccount,
    // calculateBalance // Export if needed elsewhere
};