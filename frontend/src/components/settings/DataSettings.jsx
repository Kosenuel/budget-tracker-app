// src/components/settings/DataSettings.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { ArrowDownTrayIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function DataSettings() {
    const [exporting, setExporting] = useState({ transactions: false, accounts: false });
    const [resetting, setResetting] = useState(false); // For optional reset feature
    const [confirmReset, setConfirmReset] = useState(''); // Input confirmation for reset

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