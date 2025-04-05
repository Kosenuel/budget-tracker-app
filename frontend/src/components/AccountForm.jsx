import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // To get default currency
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'; // For error indication

// Define Account Types and common Currencies (adjust as needed)
const ACCOUNT_TYPES = ['checking', 'savings', 'credit_card', 'cash', 'investment', 'other'];
const COMMON_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'BGN', 'CAD']; // Add more as needed

function AccountForm({ initialData, onSubmit, onCancel, isLoading, apiError }) {
    const { user } = useAuth(); // Get user info, including preferred_currency

    const [formData, setFormData] = useState({
        name: '',
        type: ACCOUNT_TYPES[0], // Default to the first type
        currency: user?.preferred_currency || COMMON_CURRENCIES[0], // Default to user preference or first common
        initial_balance: '', // Keep as string for input, convert on submit
    });
    const [localError, setLocalError] = useState('');

    // Populate form when initialData changes (for editing)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || ACCOUNT_TYPES[0],
                currency: initialData.currency || user?.preferred_currency || COMMON_CURRENCIES[0],
                 // Format balance back to string for input, handle null/undefined
                initial_balance: initialData.initial_balance != null ? parseFloat(initialData.initial_balance).toFixed(2) : '',
            });
        } else {
            // Reset form for adding new account
            setFormData({
                name: '',
                type: ACCOUNT_TYPES[0],
                currency: user?.preferred_currency || COMMON_CURRENCIES[0],
                initial_balance: '',
            });
        }
        setLocalError(''); // Clear local errors when data changes
    }, [initialData, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
        setLocalError(''); // Clear local error on change
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError('');

        // Basic client-side validation (can be expanded)
        if (!formData.name.trim()) {
            setLocalError('Account name is required.');
            return;
        }

        // Convert initial_balance to number before submitting
        const balance = formData.initial_balance.trim() === '' ? 0 : parseFloat(formData.initial_balance);
        if (isNaN(balance)) {
            setLocalError('Initial balance must be a valid number.');
            return;
        }

        // Prepare data for API (ensure correct types)
        const dataToSubmit = {
            ...formData,
            initial_balance: balance,
        };

        // Call the onSubmit prop passed from AccountsPage
        onSubmit(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display API Error */}
            {apiError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 ring-1 ring-inset ring-red-400/30">
                     <div className="flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" aria-hidden="true" />
                         <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
                    </div>
                </div>
            )}
             {/* Display Local Validation Error */}
             {localError && (
                 <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/10 p-3 ring-1 ring-inset ring-yellow-400/30">
                     <div className="flex items-center">
                         <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" aria-hidden="true" />
                         <p className="text-sm text-yellow-700 dark:text-yellow-300">{localError}</p>
                     </div>
                 </div>
             )}


            {/* Account Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Name
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 input-field" // Use global style from index.css
                    placeholder="e.g., Everyday Checking"
                />
            </div>

            {/* Account Type */}
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Type
                </label>
                <select
                    name="type"
                    id="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 input-field appearance-none" // Use global style, remove default arrow
                >
                    {ACCOUNT_TYPES.map(type => (
                        <option key={type} value={type} className="capitalize">
                            {type.replace('_', ' ')} {/* Replace underscores for display */}
                        </option>
                    ))}
                </select>
                {/* Consider adding a custom dropdown arrow if needed */}
            </div>

            {/* Currency */}
            <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Currency
                </label>
                <select
                    name="currency"
                    id="currency"
                    required
                    value={formData.currency}
                    onChange={handleChange}
                    className="mt-1 input-field appearance-none"
                >
                    {COMMON_CURRENCIES.map(curr => (
                        <option key={curr} value={curr}>
                            {curr}
                        </option>
                    ))}
                </select>
            </div>

            {/* Initial Balance */}
            <div>
                <label htmlFor="initial_balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Initial Balance
                </label>
                <input
                    type="number"
                    name="initial_balance"
                    id="initial_balance"
                    value={formData.initial_balance}
                    onChange={handleChange}
                    className="mt-1 input-field"
                    placeholder="0.00"
                    step="0.01" // Allows decimal input
                />
                 <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter the balance when you start tracking. Can be 0.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
                <button
                    type="button" // Important: Prevents form submission
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : (initialData ? 'Update Account' : 'Add Account')}
                </button>
            </div>
        </form>
    );
}

export default AccountForm;