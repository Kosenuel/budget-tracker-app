require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Ensure DB connection pool is initialized

// Import routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes'); 
const exportRoutes = require('./routes/exportRoutes'); 
// Import other routes (categories, budgets, etc.) later

const app = express();

// Middleware
app.use(cors()); // Allow requests from your frontend origin
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
const categoryRoutes = require('./routes/categoryRoutes');

// Basic Route
app.get('/', (req, res) => {
    res.send('Budget Tracker API Running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);      
app.use('/api/export', exportRoutes);

// Global Error Handler (Basic Example - Expand Later)
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(err.status || 500).json({
         message: err.message || 'Something went wrong!',
         // provide stack in development only
         stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
     });
});

const PORT = process.env.PORT || 5000;

// Start Server
// Check DB connection before starting (optional but good practice)
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit if DB connection fails
    } else {
        console.log('Database connected successfully.');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
});