// src/controllers/exportController.js
const { Parser } = require('json2csv'); // Use json2csv library
const Transaction = require('../models/Transaction'); // Need to fetch transactions
const Account = require('../models/Account'); // Need to fetch accounts

// GET /api/export/transactions/csv
const exportTransactionsCSV = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch all transactions with joined data for the user
        // You might need a specific function in Transaction model if getTransactionsByUserId has pagination/filters you don't want here
        // Assuming getTransactionsByUserId can fetch all if no limit/offset provided (modify if needed)
        const transactions = await Transaction.getTransactionsByUserId({ user_id: userId /* No filters/pagination */ });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found to export.' });
        }

        // Define CSV fields and header names
        const fields = [
            { label: 'Transaction ID', value: 'id' },
            { label: 'Date', value: 'transaction_date' }, // Consider formatting date here if needed
            { label: 'Type', value: 'type' },
            { label: 'Amount', value: 'amount' },
            { label: 'Currency', value: 'currency' }, // Assuming tx object has currency
            { label: 'Category', value: 'category_name' },
            { label: 'Account', value: 'account_name' },
            { label: 'Description', value: 'description' },
            { label: 'Created At', value: 'created_at' },
            { label: 'Updated At', value: 'updated_at' },
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(transactions);

        // Set headers for CSV download
        res.header('Content-Type', 'text/csv');
        res.attachment('transactions-export.csv'); // Sets Content-Disposition
        res.send(csv);

    } catch (error) {
        console.error('Export Transactions CSV error:', error);
        // Avoid sending CSV headers if an error occurs before sending data
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error exporting transactions', error: error.message });
        }
    }
};

// GET /api/export/accounts/csv
const exportAccountsCSV = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch all accounts for the user
        const accounts = await Account.getAccountsByUserId(userId);

        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ message: 'No accounts found to export.' });
        }

        // Define CSV fields
         // Exclude sensitive data if any; include calculated current_balance
         const fields = [
             { label: 'Account ID', value: 'id' },
             { label: 'Name', value: 'name' },
             { label: 'Type', value: 'type' },
             { label: 'Currency', value: 'currency' },
             { label: 'Initial Balance', value: 'initial_balance' },
             { label: 'Current Balance', value: 'current_balance' }, // Calculated field from model
             { label: 'Created At', value: 'created_at' },
             { label: 'Updated At', value: 'updated_at' },
         ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(accounts);

        // Set headers
        res.header('Content-Type', 'text/csv');
        res.attachment('accounts-export.csv');
        res.send(csv);

    } catch (error) {
        console.error('Export Accounts CSV error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error exporting accounts', error: error.message });
        }
    }
};


module.exports = {
    exportTransactionsCSV,
    exportAccountsCSV,
};