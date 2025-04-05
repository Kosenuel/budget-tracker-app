const express = require('express');
const { getAccounts, getAccount, addAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all account routes
router.use(protect);

router.route('/')
    .get(getAccounts)
    .post(addAccount);

router.route('/:id')
    .get(getAccount)
    .put(updateAccount)
    .delete(deleteAccount);

module.exports = router;