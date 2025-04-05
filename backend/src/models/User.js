const db = require('../config/db');
const { hashPassword } = require('../utils/authUtils');

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

module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
};