const Papa = require('papaparse');
const db = require('../config/db'); // For transaction control
const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction'); // For createTransaction

const REQUIRED_HEADERS = ['Date', 'Amount', 'Type', 'Category', 'Account'];
const REQUIRED_TRANSACTION_HEADERS = ['Date', 'Amount', 'Type', 'Category', 'Account'];
const REQUIRED_ACCOUNT_HEADERS = ['Name', 'Type', 'Currency']; // <<< Account headers
const ALLOWED_ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'investment', 'other']; // <<< Allowed types
// Define allowed currencies if desired for validation
// const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', ...];

const parseDate = (dateString) => {
    // Try parsing multiple formats robustly
    const formatsToTry = [
        "yyyy-MM-dd", // Preferred
         "dd/MM/yyyy",
         "MM/dd/yyyy",
         "yyyy/MM/dd",
         // Add more if needed
     ];

     // Simple parsing - assumes browser/Node Date constructor can handle common ISO-like formats
     let date = new Date(dateString);
     if (!isNaN(date.getTime())) return date;

     // If direct parsing fails, try specific formats (more complex, consider date-fns if needed)
     // For now, stick to requiring YYYY-MM-DD or relying on new Date() flexibility
     console.warn(`Could not parse date directly: ${dateString}. Attempting common formats failed or not implemented.`);
     return null; // Indicate failure
};


// POST /api/import/transactions/csv
const importTransactionsCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const userId = req.user.id;
    const fileBuffer = req.file.buffer;
    const results = { imported: 0, failed: 0, errors: [] };

    let transactionsToInsert = [];

    try {
        const csvString = fileBuffer.toString('utf8');

        Papa.parse(csvString, {
            header: true, // Use first row as headers
            skipEmptyLines: true,
            transformHeader: header => header.trim(), // Trim header whitespace
            complete: async (parseResult) => {
                const rows = parseResult.data;
                const headers = parseResult.meta.fields;

                // --- Header Validation ---
                 const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
                 if (missingHeaders.length > 0) {
                     return res.status(400).json({
                         message: `Missing required columns in CSV: ${missingHeaders.join(', ')}. Required: ${REQUIRED_HEADERS.join(', ')}`,
                         imported: 0, failed: rows.length, errors: []
                     });
                 }


                 // --- Row Processing & Validation ---
                 for (let i = 0; i < rows.length; i++) {
                     const row = rows[i];
                     const rowNum = i + 2; // Account for header row + 0-based index

                     // Trim whitespace from all values
                     Object.keys(row).forEach(key => {
                         if(typeof row[key] === 'string') row[key] = row[key].trim();
                     });

                     const { Date: dateStr, Amount: amountStr, Type: typeStr, Category: categoryName, Account: accountName, Description: description } = row;
                     const errorsForRow = [];

                     // Validate Required Fields per Row
                     if (!dateStr) errorsForRow.push("Missing 'Date'");
                     if (!amountStr) errorsForRow.push("Missing 'Amount'");
                     if (!typeStr) errorsForRow.push("Missing 'Type'");
                     if (!categoryName) errorsForRow.push("Missing 'Category'");
                     if (!accountName) errorsForRow.push("Missing 'Account'");

                     if (errorsForRow.length > 0) {
                         results.failed++;
                         results.errors.push({ row: rowNum, errors: errorsForRow });
                         continue; // Skip to next row
                     }

                     // Validate Data Types & Values
                     const date = parseDate(dateStr);
                     const amount = parseFloat(amountStr);
                     const type = typeStr.toLowerCase();

                     if (!date || isNaN(date.getTime())) errorsForRow.push(`Invalid Date format: "${dateStr}"`);
                     if (isNaN(amount) || amount <= 0) errorsForRow.push(`Invalid Amount: "${amountStr}" (must be positive number)`);
                     if (type !== 'income' && type !== 'expense') errorsForRow.push(`Invalid Type: "${typeStr}" (must be 'income' or 'expense')`);

                     // --- Map Names to IDs (Database Lookups) ---
                     const account = await Account.findAccountByNameAndUser(accountName, userId);
                     if (!account) errorsForRow.push(`Account not found or not owned: "${accountName}"`);

                     const category = account ? await Category.findCategoryByNameAndUserOrDefaults(categoryName, userId, type) : null; // Only search if account valid
                     if (account && !category) errorsForRow.push(`Category not found for type '${type}': "${categoryName}"`);


                     if (errorsForRow.length > 0) {
                        results.failed++;
                        results.errors.push({ row: rowNum, errors: errorsForRow });
                        continue; // Skip row
                     }

                     // --- If Row is Valid, Prepare for Insertion ---
                     transactionsToInsert.push({
                         user_id: userId,
                         account_id: account.id,
                         category_id: category.id,
                         amount: amount,
                         type: type,
                         transaction_date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
                         description: description || null
                     });
                 } // End of row loop


                 // --- Database Insertion (Transaction) ---
                 if (transactionsToInsert.length > 0) {
                     const client = await db.pool.connect();
                     try {
                         await client.query('BEGIN');
                         console.log(`Import: Attempting to insert ${transactionsToInsert.length} transactions for user ${userId}`);
                         // Potential optimization: Use a single multi-row INSERT statement
                         for (const txData of transactionsToInsert) {
                             // Use the existing createTransaction logic (or adapt for bulk)
                             await client.query(
                                 'INSERT INTO transactions (user_id, account_id, category_id, amount, type, transaction_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                                 [txData.user_id, txData.account_id, txData.category_id, txData.amount, txData.type, txData.transaction_date, txData.description]
                             );
                         }
                         await client.query('COMMIT');
                         results.imported = transactionsToInsert.length;
                         console.log(`Import: Successfully inserted ${results.imported} transactions for user ${userId}`);
                     } catch (dbError) {
                         await client.query('ROLLBACK');
                         console.error(`Import DB Error for user ${userId}:`, dbError);
                         // Add a general DB error, discard previously collected row errors
                         results.imported = 0;
                         results.failed = rows.length; // Mark all as failed due to DB error
                         results.errors = [{ row: 'Database', errors: ["Transaction failed during database insert. No rows were imported."] }];
                     } finally {
                         client.release();
                     }
                 }

                 // --- Send Response ---
                 console.log(`Import Results for user ${userId}:`, results);
                 res.status(200).json({
                     message: `Import complete. Imported: ${results.imported}, Failed: ${results.failed}.`,
                     imported: results.imported,
                     failed: results.failed,
                     errors: results.errors // Send detailed errors back
                 });
             }, // End 'complete' callback
             error: (parseError) => {
                console.error("CSV Parsing Error:", parseError);
                res.status(400).json({ message: 'Error parsing CSV file.', error: parseError.message });
             }
        }); // End Papa.parse

    } catch (error) {
        // Catch unexpected errors during processing
        console.error("Unexpected Import Error:", error);
        res.status(500).json({ message: 'An unexpected error occurred during import.', error: error.message });
    }
};

// --- POST /api/import/accounts/csv ---
const importAccountsCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const userId = req.user.id;
    const fileBuffer = req.file.buffer;
    const results = { imported: 0, failed: 0, errors: [] };
    let accountsToInsert = [];
    const accountNamesInFile = new Set(); // To check for duplicates within the file

    try {
        const csvString = fileBuffer.toString('utf8');

        Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            complete: async (parseResult) => {
                const rows = parseResult.data;
                const headers = parseResult.meta.fields;

                // --- Header Validation ---
                const missingHeaders = REQUIRED_ACCOUNT_HEADERS.filter(h => !headers.includes(h));
                if (missingHeaders.length > 0) {
                    return res.status(400).json({
                        message: `Missing required columns in CSV: ${missingHeaders.join(', ')}. Required: ${REQUIRED_ACCOUNT_HEADERS.join(', ')}`,
                        imported: 0, failed: rows.length, errors: []
                    });
                }

                // --- Row Processing & Validation ---
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowNum = i + 2;
                    Object.keys(row).forEach(key => { if(typeof row[key] === 'string') row[key] = row[key].trim(); });

                    const { Name: name, Type: typeStr, Currency: currency, InitialBalance: balanceStr } = row;
                    const errorsForRow = [];

                    // Validate Required Fields
                    if (!name) errorsForRow.push("Missing 'Name'");
                    if (!typeStr) errorsForRow.push("Missing 'Type'");
                    if (!currency) errorsForRow.push("Missing 'Currency'");

                    if (errorsForRow.length > 0) {
                        results.failed++;
                        results.errors.push({ row: rowNum, errors: errorsForRow });
                        continue;
                    }

                    // Validate Data Types & Values
                    const type = typeStr.toLowerCase();
                    const initialBalance = (balanceStr === '' || balanceStr === undefined || balanceStr === null) ? 0 : parseFloat(balanceStr); // Default to 0 if blank

                    if (!ALLOWED_ACCOUNT_TYPES.includes(type)) errorsForRow.push(`Invalid Type: "${typeStr}" (Allowed: ${ALLOWED_ACCOUNT_TYPES.join(', ')})`);
                    if (isNaN(initialBalance)) errorsForRow.push(`Invalid InitialBalance: "${balanceStr}" (must be a number or blank)`);
                    // Optional: Add currency code validation against ALLOWED_CURRENCIES list

                    // Check for Duplicate Names within the File
                     if (accountNamesInFile.has(name.toLowerCase())) { // Case-insensitive check within file
                         errorsForRow.push(`Duplicate Account Name in CSV: "${name}"`);
                     } else {
                         accountNamesInFile.add(name.toLowerCase());
                     }

                     // Check for Duplicate Name in DB for this user
                    const existingAccount = await Account.findAccountByNameAndUser(name, userId);
                    if (existingAccount) {
                        errorsForRow.push(`Account Name already exists in database: "${name}"`);
                    }


                    if (errorsForRow.length > 0) {
                        results.failed++;
                        results.errors.push({ row: rowNum, errors: errorsForRow });
                        continue;
                    }

                    // --- Prepare for Insertion ---
                    accountsToInsert.push({
                        user_id: userId,
                        name: name,
                        type: type,
                        currency: currency.toUpperCase(), // Store uppercase
                        initial_balance: initialBalance
                    });
                } // End row loop

                // --- Database Insertion (Transaction) ---
                if (accountsToInsert.length > 0) {
                    const client = await db.pool.connect();
                    try {
                        await client.query('BEGIN');
                        console.log(`Import Accounts: Attempting to insert ${accountsToInsert.length} accounts for user ${userId}`);
                        for (const accData of accountsToInsert) {
                            // Use Account model's create function (ensure it takes these args)
                            await client.query(
                                'INSERT INTO accounts (user_id, name, type, currency, initial_balance) VALUES ($1, $2, $3, $4, $5)',
                                [accData.user_id, accData.name, accData.type, accData.currency, accData.initial_balance]
                            );
                        }
                        await client.query('COMMIT');
                        results.imported = accountsToInsert.length;
                        console.log(`Import Accounts: Successfully inserted ${results.imported} accounts for user ${userId}`);
                    } catch (dbError) {
                        await client.query('ROLLBACK');
                        console.error(`Import Accounts DB Error for user ${userId}:`, dbError);
                        results.imported = 0;
                        results.failed += accountsToInsert.length; // Add these to failed count
                         // Add a general DB error if specific error isn't clear
                         results.errors.push({ row: 'Database', errors: ["Transaction failed during database insert. No accounts were imported."] });
                    } finally {
                        client.release();
                    }
                }

                // --- Send Response ---
                console.log(`Import Account Results for user ${userId}:`, results);
                 // Make sure not to send sensitive error details unless needed for debugging
                 res.status(200).json({
                     message: `Account import complete. Imported: ${results.imported}, Failed: ${results.failed}.`,
                    imported: results.imported,
                     failed: results.failed,
                    errors: results.errors
                });

             }, // End 'complete' callback
             error: (parseError) => { /* ... existing error handling ... */ }
        }); // End Papa.parse
    } catch (error) { /* ... existing error handling ... */ }
};


module.exports = {
    importTransactionsCSV,
    importAccountsCSV,
};