// src/components/settings/DataSettings.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { ArrowDownTrayIcon, CreditCardIcon, ExclamationTriangleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

function DataSettings({ refreshAccounts }) {
    const { logout } = useAuth();

    // --- State for Exporting ---
    const [exporting, setExporting] = useState({ transactions: false, accounts: false });
    const [resetting, setResetting] = useState(false); // For optional reset feature
    const [confirmReset, setConfirmReset] = useState(''); // Input confirmation for reset

    // --- State for Import ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importStatus, setImportStatus] = useState({ message: '', type: '', errors: [] }); // type: 'success' or 'error'
    const fileInputRef = useRef(null); // Ref to clear file input

    // --- NEW State for Account Import ---
    const [selectedAccountFile, setSelectedAccountFile] = useState(null);
    const [accountImporting, setAccountImporting] = useState(false);
    const [accountImportStatus, setAccountImportStatus] = useState({ message: '', type: '', errors: [] });
    const accountFileInputRef = useRef(null);

    const handleExport = async (type) => {
        const endpoint = type === 'transactions' ? '/export/transactions/csv' : '/export/accounts/csv';
        const filename = type === 'transactions' ? 'budget-transactions.csv' : 'budget-accounts.csv';
        setExporting(prev => ({ ...prev, [type]: true }));
        try {
            const response = await axiosInstance.get(endpoint, {
                responseType: 'blob', // Important for file download
            });

            // Create a link to trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);

        } catch (error) {
            console.error(`Error exporting ${type}:`, error);
             // Try to read error message from blob if backend sends JSON error
             if (error.response?.data instanceof Blob && error.response?.data.type === 'application/json') {
                const errJson = await error.response.data.text();
                try {
                    const parsed = JSON.parse(errJson);
                    toast.error(parsed.message || `Failed to export ${type}.`);
                 } catch {
                    toast.error(`Failed to export ${type}.`);
                 }
             } else {
                toast.error(error.response?.data?.message || `Failed to export ${type}.`);
             }
         } finally {
             setExporting(prev => ({ ...prev, [type]: false }));
         }
    };

    // --- Placeholder for Reset Data ---
    const handleResetData = async () => {
         if (confirmReset.toLowerCase() !== 'reset my data') {
             toast.error("Confirmation text does not match. Reset cancelled.");
            return;
         }
        setResetting(true);
        // toast.info("Data reset functionality not implemented yet."); // Replace with API call
         try { // --- Assumes backend endpoint: DELETE /api/users/data ---
            await axiosInstance.delete('/users/data');
            toast.success("All your data has been reset.");
             // !!! Need to logout user and clear all local data !!!
             logout(); // Call logout from auth context
             window.location.href = '/login';
        } catch (error) { toast.error("Failed to reset data."); }
        finally { setResetting(false); setConfirmReset('');}
         setTimeout(() => setResetting(false), 1000); // Simulate action for now
     };

     // --- Import Handlers ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setSelectedFile(file);
            setImportStatus({ message: '', type: '', errors: [] }); // Clear previous status
        } else {
            setSelectedFile(null);
            toast.error("Please select a valid CSV file.");
        }
    };

    const handleImportSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please select a CSV file to import.");
            return;
        }

        setImporting(true);
        setImportStatus({ message: 'Importing...', type: 'info', errors: [] });

        const formData = new FormData();
        formData.append('transactionCsv', selectedFile); // 'transactionCsv' must match multer field name

        try {
            const response = await axiosInstance.post('/import/transactions/csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Axios usually sets this with FormData, but good practice
                },
            });

            const { message, imported, failed, errors } = response.data;
            setImportStatus({ message: message || 'Import finished.', type: 'success', errors: errors || [] });
            toast.success(`Imported ${imported} transactions.`);
            if (failed > 0) {
                 toast.warn(`Failed to import ${failed} transactions. See details below.`);
             }
             // Optionally trigger a refresh of transactions on the TransactionsPage if user navigates there
             // <<< 2. Call refreshAccounts prop on success >>>
            if (imported > 0 && typeof refreshAccounts === 'function') {
                console.log("Refreshing account list after import...");
                refreshAccounts();
            } else if (typeof refreshAccounts !== 'function') {
                console.warn("refreshAccounts function was not passed correctly to DataSettings.");
                // Fallback or alternative method might be needed if prop drilling fails
            }

        } catch (error) {
            console.error("Error importing transactions:", error);
            const errorMsg = error.response?.data?.message || "An error occurred during import.";
            setImportStatus({ message: errorMsg, type: 'error', errors: error.response?.data?.errors || [] });
            toast.error(errorMsg);
        } finally {
            setImporting(false);
            setSelectedFile(null); // Clear selection after attempt
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input visually
            }
        }
    };

    // --- Account Import Handlers ---
    const handleAccountFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setSelectedAccountFile(file);
            setAccountImportStatus({ message: '', type: '', errors: [] }); // Clear previous status
        } else {
            setSelectedAccountFile(null);
            toast.error("Please select a valid CSV file for accounts.");
        }
    };

    const handleAccountImportSubmit = async () => {
        if (!selectedAccountFile) {
            toast.error("Please select an accounts CSV file to import.");
            return;
        }

        setAccountImporting(true);
        setAccountImportStatus({ message: 'Importing accounts...', type: 'info', errors: [] });

        const formData = new FormData();
        formData.append('accountCsv', selectedAccountFile); // <<< Must match multer field name 'accountCsv'

        try {
            const response = await axiosInstance.post('/import/accounts/csv', formData, { // <<< Correct endpoint
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { message, imported, failed, errors } = response.data;
            setAccountImportStatus({ message: message || 'Account import finished.', type: 'success', errors: errors || [] });
            toast.success(`Imported ${imported} accounts.`);
            if (failed > 0) {
                toast.warn(`Failed to import ${failed} accounts. See details below.`);
            }
             // !!! IMPORTANT: Refresh accounts in the global scope after successful import !!!
            // Needs access to refreshAccounts from useAccountScope if available here
            // <<< 2. Call refreshAccounts prop on success >>>
            if (imported > 0 && typeof refreshAccounts === 'function') {
                console.log("Refreshing account list after import...");
                refreshAccounts();
            } else if (typeof refreshAccounts !== 'function') {
                console.warn("refreshAccounts function was not passed correctly to DataSettings.");
                // Fallback or alternative method might be needed if prop drilling fails
            }

        } catch (error) {
            console.error("Error importing accounts:", error);
            const errorMsg = error.response?.data?.message || "An error occurred during account import.";
            setAccountImportStatus({ message: errorMsg, type: 'error', errors: error.response?.data?.errors || [] });
            toast.error(errorMsg);
        } finally {
            setAccountImporting(false);
            setSelectedAccountFile(null);
            if (accountFileInputRef.current) {
                accountFileInputRef.current.value = ''; // Reset file input
            }
        }
    };

    return (
        <div className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
            {/* Section 1: Manage Data */}
             <section className="pt-2">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Manage Data</h3>
                 <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Export your data or manage accounts.</p>
                 <div className="mt-6 space-y-3">
                    {/* Manage Accounts Link */}
                    <div>
                        <Link to="/accounts" className="btn btn-secondary inline-flex items-center">
                            <CreditCardIcon className="h-5 w-5 mr-2" /> Manage Accounts
                         </Link>
                    </div>
                     {/* Export Buttons */}
                     <div className="flex flex-wrap gap-3">
                        <button onClick={() => handleExport('transactions')} disabled={exporting.transactions} className="btn btn-secondary inline-flex items-center">
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> {exporting.transactions ? 'Exporting...' : 'Export Transactions (CSV)'}
                        </button>
                         <button onClick={() => handleExport('accounts')} disabled={exporting.accounts} className="btn btn-secondary inline-flex items-center">
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> {exporting.accounts ? 'Exporting...' : 'Export Accounts (CSV)'}
                        </button>
                     </div>

                    {/* --- Transaction Import Section --- */}
                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-2">Import Transactions</h4>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Upload a CSV file with columns: Date (YYYY-MM-DD), Amount (positive number), Type (income/expense), Category, Account, Description (optional).
                            <a href="/path/to/template.csv" download="transactions-template.csv" className="ml-2 text-primary hover:underline">Download Template</a> {/* Make sure template is available */}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <input
                                ref={fileInputRef} // Add ref
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={importing}
                                // className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-light/50 dark:file:bg-primary-dark/50 file:text-primary dark:file:text-primary-light hover:file:bg-primary-light/80 dark:hover:file:bg-primary-dark/80 disabled:opacity-50 cursor-pointer"
                                className="block w-full text-sm text-gray-500 ... cursor-pointer"
                            />
                            <button
                                onClick={handleImportSubmit}
                                disabled={!selectedFile || importing}
                                className="btn btn-primary inline-flex items-center flex-shrink-0 w-full sm:w-auto justify-center"
                            >
                                <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> {importing ? 'Importing...' : 'Import File'}
                            </button>
                        </div>
                        {/* Transaction Import UI and Status Display */}
                        {importStatus.message && (
                            <div className={`mt-4 p-3 rounded-md text-sm ${importStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-1 ring-green-400/30' : importStatus.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-1 ring-red-400/30' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400/30'}`}>
                                <p className="font-medium">{importStatus.message}</p>
                                {importStatus.errors && importStatus.errors.length > 0 && (
                                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                                        {importStatus.errors.slice(0, 10).map((err, index) => ( // Limit displayed errors
                                            <li key={index}>Row {err.row}: {err.errors.join(', ')}</li>
                                        ))}
                                        {importStatus.errors.length > 10 && <li>... and {importStatus.errors.length - 10} more errors.</li>}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    {/* --- Account Import Section --- */}
                    <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-2">Import Accounts</h4>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Upload a CSV file with columns: Name, Type, Currency, InitialBalance (optional).
                            <a href="/path/to/accounts-template.csv" download="accounts-template.csv" className="ml-2 text-primary hover:underline">Download Template</a>
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <input
                                ref={accountFileInputRef} // Use separate ref
                                type="file"
                                accept=".csv"
                                onChange={handleAccountFileChange} // Use specific handler
                                disabled={accountImporting}
                                className="block w-full text-sm text-gray-500 ..." // File input styling
                            />
                            <button
                                onClick={handleAccountImportSubmit} // Use specific handler
                                disabled={!selectedAccountFile || accountImporting}
                                className="btn btn-primary inline-flex items-center flex-shrink-0 w-full sm:w-auto justify-center"
                            >
                                <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> {accountImporting ? 'Importing...' : 'Import Accounts File'}
                            </button>
                        </div>
                        {/* Account Import Status Display */}
                        {accountImportStatus.message && (
                            <div className={`mt-4 p-3 rounded-md text-sm ${accountImportStatus.type === 'success' ? '...' : accountImportStatus.type === 'error' ? '...' : '...'}`}> {/* Status styles */}
                                <p className="font-medium">{accountImportStatus.message}</p>
                                {accountImportStatus.errors && accountImportStatus.errors.length > 0 && (
                                    <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                                        {accountImportStatus.errors.slice(0, 10).map((err, index) => ( <li key={index}>Row {err.row}: {err.errors.join(', ')}</li> ))}
                                        {accountImportStatus.errors.length > 10 && <li>... and {accountImportStatus.errors.length - 10} more errors.</li>}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                 </div>
            </section>

             {/* Section 2: Danger Zone (Optional) */}
            <section className="pt-8">
                <h3 className="text-lg font-medium leading-6 text-red-600 dark:text-red-400">Danger Zone</h3>
                 <div className="mt-6 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                        <div>
                             <h4 className="font-medium text-red-700 dark:text-red-300">Reset All Data</h4>
                             <p className="mt-1 text-sm text-red-600 dark:text-red-400">This will permanently delete all your accounts, transactions, budgets, and categories. This action cannot be undone.</p>
                             <div className="mt-4 space-y-2">
                                <label htmlFor="confirm-reset" className="block text-sm font-medium text-red-700 dark:text-red-300">Type "reset my data" to confirm:</label>
                                <input
                                     type="text"
                                    id="confirm-reset"
                                    value={confirmReset}
                                    onChange={(e) => setConfirmReset(e.target.value)}
                                     className="input-field border-red-300 focus:border-red-500 focus:ring-red-500"
                                     placeholder="reset my data"
                                />
                                <button
                                     onClick={handleResetData}
                                    disabled={resetting || confirmReset.toLowerCase() !== 'reset my data'}
                                     className="btn btn-danger w-full sm:w-auto" // Ensure .btn-danger styles are defined
                                >
                                     {resetting ? 'Resetting...' : 'Reset All My Data'}
                                 </button>
                             </div>
                         </div>
                    </div>
                 </div>
             </section>
        </div>
    );
}
export default DataSettings;