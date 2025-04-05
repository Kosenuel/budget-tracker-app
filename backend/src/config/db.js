const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optional: Add SSL configuration if required by your database provider
    // ssl: {
    //   rejectUnauthorized: false // Example for Heroku/Render, adjust as needed
    // }
});

pool.on('connect', () => {
    console.log('Connected to the Database!');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool, // Export pool if needed for transactions elsewhere
};