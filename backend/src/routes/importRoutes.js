const express = require('express');
const { importTransactionsCSV, importAccountsCSV } = require('../controllers/importController');
require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');
const { uploadTransactionCsv, uploadAccountCsv }= require('../middleware/uploadMiddleware'); // Import multer middleware

const router = express.Router();

router.use(protect); // Protect import routes

// Use multer middleware *only* on this route
router.post('/transactions/csv', uploadTransactionCsv, importTransactionsCSV);
router.post('/accounts/csv', uploadAccountCsv, importAccountsCSV);

module.exports = router;