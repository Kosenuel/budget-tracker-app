const express = require('express');
const { addTransaction, getTransactions, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
require ('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all transaction routes

router.route('/')
    .post(addTransaction)
    .get(getTransactions);
    // --- Routes for a specific transaction (/api/transactions/:id) ---
    router.route('/:id')
    // .get(getTransactionById) // Optional: if you need to get a single transaction
    .put(updateTransaction) // 
    .delete(deleteTransaction); 

// Add routes for specific transaction ID (/:id) for update/delete later

module.exports = router;