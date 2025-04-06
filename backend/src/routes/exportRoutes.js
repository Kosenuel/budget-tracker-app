// src/routes/exportRoutes.js
const express = require('express');
const { exportTransactionsCSV, exportAccountsCSV } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All export routes are protected
router.use(protect);

router.get('/transactions/csv', exportTransactionsCSV); // GET /api/export/transactions/csv
router.get('/accounts/csv', exportAccountsCSV);       // GET /api/export/accounts/csv

module.exports = router;