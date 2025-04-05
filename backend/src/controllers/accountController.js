const Account = require('../models/Account');
const Transaction = require('../models/Transaction'); // Assuming Transaction model exists

// Get all accounts for the logged-in user
const getAccounts = async (req, res) => {
    try {
        const accounts = await Account.getAccountsByUserId(req.user.id);
        res.status(200).json(accounts);
    } catch (error) {
        console.error('Get Accounts error:', error);
        res.status(500).json({ message: 'Error fetching accounts', error: error.message });
    }
};

// Get a single account by ID
const getAccount = async (req, res) => {
     const { id } = req.params;
     try {
         const account = await Account.getAccountById(id, req.user.id);
         if (!account) {
             return res.status(404).json({ message: 'Account not found' });
         }
         res.status(200).json(account);
     } catch (error) {
         console.error('Get Account error:', error);
         res.status(500).json({ message: 'Error fetching account', error: error.message });
     }
 };


// Create a new account
const addAccount = async (req, res) => {
    const { name, type, currency, initial_balance } = req.body;
    if (!name || !type || !currency ) {
        return res.status(400).json({ message: 'Name, type, and currency are required' });
    }

    try {
        const newAccount = await Account.createAccount({
            user_id: req.user.id,
            name,
            type,
            currency,
            initial_balance: initial_balance || 0
        });
        res.status(201).json(newAccount);
    } catch (error) {
        console.error('Add Account error:', error);
         // Check for specific DB errors if needed (e.g., unique constraint)
        res.status(500).json({ message: 'Error creating account', error: error.message });
    }
};

 // Update an existing account
 const updateAccount = async (req, res) => {
     const { id } = req.params;
     const { name, type, currency, initial_balance } = req.body;

     if (!name || !type || !currency ) {
        return res.status(400).json({ message: 'Name, type, and currency are required' });
    }

     try {
         const updatedAccount = await Account.updateAccount(id, req.user.id, { name, type, currency, initial_balance });
         if (!updatedAccount) {
             return res.status(404).json({ message: 'Account not found or not authorized to update' });
         }
         res.status(200).json(updatedAccount);
     } catch (error) {
         console.error('Update Account error:', error);
         res.status(500).json({ message: 'Error updating account', error: error.message });
     }
 };

 // Delete an account
 const deleteAccount = async (req, res) => {
     const { id } = req.params;
     try {
        // **Important Check:** Prevent deletion if transactions exist?
        const transactions = await Transaction.getTransactionsByAccountId(id, req.user.id); // Need this method in Transaction model
        if (transactions && transactions.length > 0) {
             return res.status(400).json({ message: 'Cannot delete account with existing transactions. Please delete transactions first or reassign them.' });
         }

         const deleted = await Account.deleteAccount(id, req.user.id);
         if (!deleted) {
             return res.status(404).json({ message: 'Account not found or not authorized to delete' });
         }
         res.status(200).json({ message: 'Account deleted successfully' });
         // Or res.status(204).send(); // No content response
     } catch (error) {
         console.error('Delete Account error:', error);
         res.status(500).json({ message: 'Error deleting account', error: error.message });
     }
 };


module.exports = {
    getAccounts,
    getAccount,
    addAccount,
    updateAccount,
    deleteAccount
};