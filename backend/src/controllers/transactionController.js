const Transaction = require('../models/Transaction');
const Account = require('../models/Account'); // Needed to verify account ownership

const addTransaction = async (req, res) => {
     const { account_id, category_id, amount, type, transaction_date, description } = req.body;
     if (!account_id || !category_id || !amount || !type || !transaction_date) {
         return res.status(400).json({ message: 'Account, category, amount, type, and date are required' });
     }
     if (type !== 'income' && type !== 'expense') {
         return res.status(400).json({ message: 'Invalid transaction type' });
     }
      // Ensure amount is positive
     if (parseFloat(amount) <= 0) {
         return res.status(400).json({ message: 'Amount must be positive' });
     }

     try {
         // Verify the account belongs to the user
         const account = await Account.getAccountById(account_id, req.user.id);
         if (!account) {
             return res.status(404).json({ message: 'Account not found or not owned by user' });
         }

         // TODO: Verify category belongs to user or is a default category

         const newTransaction = await Transaction.createTransaction({
             user_id: req.user.id,
             account_id,
             category_id,
             amount: parseFloat(amount), // Ensure amount is stored as number
             type,
             transaction_date,
             description: description || null,
         });

         // Note: Account balance is calculated dynamically, no need to update here
         // unless you choose a different strategy.

         res.status(201).json(newTransaction);
     } catch (error) {
         console.error('Add Transaction error:', error);
         res.status(500).json({ message: 'Error adding transaction', error: error.message });
     }
 };

 const getTransactions = async (req, res) => {
    const { accountId, categoryId, startDate, endDate, type, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        const transactions = await Transaction.getTransactionsByUserId({
            user_id: req.user.id,
            accountId,
            categoryId,
            startDate,
            endDate,
            type,
            searchTerm: search,
            limit: parseInt(limit),
            offset
        });

         // Optionally, get total count for pagination
         // const totalCount = await Transaction.countTransactionsByUserId({ ...filters });
         // res.status(200).json({ transactions, totalCount, page, limit });

        res.status(200).json(transactions); // Simple response for now
    } catch (error) {
        console.error('Get Transactions error:', error);
        res.status(500).json({ message: 'Error fetching transactions', error: error.message });
    }
};

// PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { account_id, category_id, amount, type, transaction_date, description } = req.body;

    // Basic Validation
    if (!account_id || !category_id || !amount || !type || !transaction_date) {
        return res.status(400).json({ message: 'Account, category, amount, type, and date are required for update.' });
    }
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Invalid transaction type' });
    }
     const numericAmount = parseFloat(amount);
     if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    // Convert IDs if needed
    const transactionId = parseInt(id);
    const accountIdNum = parseInt(account_id);


    try {
        // 1. Verify the transaction exists and belongs to the user
        // (Need a findTransactionByIdAndUserId function in the model)
        const existingTransaction = await Transaction.findTransactionByIdAndUserId(transactionId, req.user.id);
         if (!existingTransaction) {
             return res.status(404).json({ message: 'Transaction not found or user not authorized.' });
         }

         // 2. Verify the target account belongs to the user
         const account = await Account.getAccountById(accountIdNum, req.user.id);
         if (!account) {
             return res.status(400).json({ message: 'Target account not found or not owned by user.' });
         }

        // 3. TODO: Verify category belongs to user or is default

        // 4. Call the model function to perform the update
        // (Need an updateTransaction function in the model)
        const updatedTransaction = await Transaction.updateTransaction(transactionId, req.user.id, {
            account_id: accountIdNum,
            category_id: parseInt(category_id),
             amount: numericAmount,
             type,
             transaction_date,
             description: description || null,
         });

         if (!updatedTransaction) {
            // Should be caught by the existence check, but as a fallback
             return res.status(404).json({ message: 'Transaction update failed.' });
         }

        res.status(200).json(updatedTransaction);
    } catch (error) {
        console.error('Update Transaction error:', error);
        res.status(500).json({ message: 'Error updating transaction', error: error.message });
    }
};


// DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
         return res.status(400).json({ message: 'Invalid transaction ID.' });
     }

    try {
        // Optional pre-check: Verify transaction exists *before* calling delete
        const existingTransaction = await Transaction.findTransactionByIdAndUserId(transactionId, req.user.id);
        if (!existingTransaction) {
            return res.status(404).json({ message: 'Transaction not found or user not authorized.' });
        }

        // Attempt to delete (model function handles ownership check within the query)
        const deleted = await Transaction.deleteTransaction(transactionId, req.user.id);

        if (!deleted) {
            // This means the transaction wasn't found OR didn't belong to the user
            return res.status(404).json({ message: 'Transaction not found or user not authorized.' });
        }

        // Transaction successfully deleted
        res.status(200).json({ message: 'Transaction deleted successfully.' });
        // Alternatively, use 204 No Content:
        // res.status(204).send();

    } catch (error) {
        console.error('Delete Transaction error:', error);
        res.status(500).json({ message: 'Error deleting transaction', error: error.message });
    }
};



module.exports = {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction, 
};