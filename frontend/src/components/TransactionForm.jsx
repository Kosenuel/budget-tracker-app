import React, { useState, useEffect, useMemo } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { useAccountScope } from '../contexts/AccountScopeContext'; // <<< Import scope
// --- Date Picker Imports ---
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Default styles
import { parseISO, format as formatDateFns, isValid as isValidDate } from 'date-fns'; // date-fns utilities
import { createPortal } from 'react-dom';

// --- End Date Picker Imports ---

function TransactionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    apiError,
    // accounts = [], Pass accounts for dropdown
    categories = [], // Pass categories for dropdown
}) {
    // Initialize state with defaults or initialData
    const { selectedAccountId, selectedAccount, accounts } = useAccountScope(); // <<< Use scope

    const [formData, setFormData] = useState({
        type: initialData?.type || 'expense', // Default to 'expense'
        amount: initialData?.amount != null ? parseFloat(initialData.amount).toFixed(2) : '',
        transaction_date: initialData?.transaction_date
            ? new Date(initialData.transaction_date).toISOString().split('T')[0] // Format YYYY-MM-DD for input type="date"
            : new Date().toISOString().split('T')[0], // Default to today
        
        account_id: selectedAccountId || '', // <<< Default account_id to scope
        category_id: initialData?.category_id || '',
        description: initialData?.description || '',
    });
    const [localError, setLocalError] = useState('');

    // Effect to update form when initialData changes (for editing)
    useEffect(() => {
        const accountIdToUse = initialData?.account_id ?? selectedAccountId; // Use initial if editing, else scope

        if (initialData) {
            setFormData({
                type: initialData.type || 'expense',
                amount: initialData.amount != null ? parseFloat(initialData.amount).toFixed(2) : '',
                transaction_date: initialData.transaction_date
                    ? new Date(initialData.transaction_date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                account_id: accountIdToUse || '', // We will pass this outside the form now // Use initial if editing, else scope,
                category_id: initialData.category_id || '',
                description: initialData.description || '',
            });
        } else {
            // Reset for adding new
             setFormData({
                type: 'expense',
                amount: '',
                transaction_date: new Date().toISOString().split('T')[0],
                account_id: accountIdToUse || '', // We will pass this outside the form now
                category_id: '', // Needs to be set based on filtered categories
                description: '',
            });
        }
         setLocalError(''); // Clear local errors when data/mode changes
    }, [initialData, selectedAccountId]); // <<< Add selectedAccountId dependency

    // Filter categories based on selected transaction type (income/expense)
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => cat.type === formData.type);
    }, [categories, formData.type]);

    // Effect to set default category when type changes or filteredCategories update
    useEffect(() => {
         // Only set category if it's invalid or doesn't match the current type
         const currentCategoryIsValid = filteredCategories.some(cat => cat.id === formData.category_id);

         if (!formData.category_id || !currentCategoryIsValid) {
            const defaultCategory = filteredCategories.length > 0 ? filteredCategories[0].id : '';
            setFormData(prev => ({ ...prev, category_id: defaultCategory }));
        }
         // We only want this effect to run when the relevant dependencies change,
         // not when other parts of formData change.
    }, [formData.type, filteredCategories]); // Removed formData.category_id to prevent potential loop


    //   // --- Update useEffect for Initial Data ---
    //   useEffect(() => {
    //     let initialDate = new Date(); // Default to today
    //     if (initialData?.transaction_date) {
    //         // Try parsing the incoming date string (YYYY-MM-DD or ISO)
    //         const parsedDate = parseISO(initialData.transaction_date); // Handles YYYY-MM-DD and ISO fine
    //         if (isValidDate(parsedDate)) {
    //             initialDate = parsedDate;
    //         } else {
    //             console.warn(`Could not parse initial date: ${initialData.transaction_date}`);
    //             // Keep default 'today' if parsing fails
    //         }
    //     }

    //     setFormData({
    //         type: initialData?.type || 'expense',
    //         amount: initialData?.amount != null ? parseFloat(initialData.amount).toFixed(2) : '',
    //         transaction_date: initialDate, // <<< Store as Date object
    //         category_id: initialData?.category_id || '',
    //         description: initialData?.description || '',
    //     });

    //     setLocalError('');
    // }, [initialData, selectedAccountId]); // Rerun if initialData or scope changes
    // --- End Update useEffect ---

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'radio' ? value : value,
        }));
         setLocalError(''); // Clear local error on change
    };

    // --- Specific Handler for DatePicker ---
    const handleDateChange = (date) => { // Receives a Date object or null
        setFormData(prevData => ({
                ...prevData,
                transaction_date: date // Store the Date object directly
        }));
            setLocalError('');
    };
        // --- End Specific Handler ---

     const handleTypeChange = (e) => {
         const newType = e.target.value;
        setFormData(prevData => ({
             ...prevData,
             type: newType,
             category_id: '' // Reset category when type changes, useEffect will set default
         }));
         setLocalError('');
     };

    // Handle form submission
    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     setLocalError('');

    // --- Update Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError('');

        // Client-side validation
        const amountValue = parseFloat(formData.amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            setLocalError('Amount must be a positive number.');
            return;
        }
        if (!formData.account_id) {
            setLocalError('Please select an account.');
            return;
        }
        if (!formData.category_id) {
            setLocalError('Please select a category.');
            return;
        }
        // if (!formData.transaction_date) {
        //     setLocalError('Please select a date.');
        //     return;
        if (!formData.transaction_date || !isValidDate(formData.transaction_date)) { // Check if date object is valid
            setLocalError('Please select a valid date.');
            return;
        }

    //     // Prepare data for API
    //     const dataToSubmit = {
    //         ...formData,
    //         amount: amountValue, // Send as number
    //         account_id: parseInt(formData.account_id, 10), // Ensure IDs are numbers if needed by backend
    //         category_id: parseInt(formData.category_id, 10),
    //     };

    //     onSubmit(dataToSubmit); // Pass validated data to parent

            // Prepare data for API
        const dataToSubmit = {
            type: formData.type,
            amount: amountValue,
            category_id: parseInt(formData.category_id, 10),
            description: formData.description || null,
            account_id: selectedAccountId, // Set from scope
            // --- Convert Date object back to YYYY-MM-DD string for API ---
            transaction_date: formatDateFns(formData.transaction_date, 'yyyy-MM-dd'),
        };

        onSubmit(dataToSubmit); // Pass validated data to parent
    };
    // --- End Update Submit Handler ---

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error Display */}
             {apiError && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 ring-1 ring-inset ring-red-400/30">
                    <div className="flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" aria-hidden="true" />
                        <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
                    </div>
                 </div>
             )}
             {/* Local Validation Error Display */}
            {localError && (
                 <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/10 p-3 ring-1 ring-inset ring-yellow-400/30">
                    <div className="flex items-center">
                         <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 mr-2" aria-hidden="true" />
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{localError}</p>
                    </div>
                 </div>
             )}

            {/* Transaction Type */}
             <fieldset className="mt-4">
                 <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</legend>
                <div className="mt-2 flex space-x-4">
                     <div className="flex items-center">
                         <input id="type-expense" name="type" type="radio" value="expense" checked={formData.type === 'expense'} onChange={handleTypeChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600" />
                         <label htmlFor="type-expense" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Expense</label>
                    </div>
                    <div className="flex items-center">
                         <input id="type-income" name="type" type="radio" value="income" checked={formData.type === 'income'} onChange={handleTypeChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600" />
                         <label htmlFor="type-income" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Income</label>
                     </div>
                </div>
            </fieldset>

            {/* Amount */}
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input type="number" name="amount" id="amount" required value={formData.amount} onChange={handleChange} className="mt-1 input-field" placeholder="0.00" step="0.01" min="0.01"/>
            </div>

            {/* Date
            <div>
                <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input type="date" name="transaction_date" id="transaction_date" required value={formData.transaction_date} onChange={handleChange} className="mt-1 input-field"/>
            </div> */}

            {/* --- Date Input with Popper Props --- */}
            <div>
                <label htmlFor="transaction_date" className="form-label">Date</label>
                <DatePicker
                    id="transaction_date"
                    selected={formData.transaction_date}
                    onChange={handleDateChange}
                    dateFormat="dd-MMM-yyyy"
                    className="input-field w-full"
                    required
                    wrapperClassName="w-full"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    // --- REMOVE fixed strategy ---
                    // popperProps={{
                    //     strategy: 'fixed',
                    // }}
                    // --- KEEP z-index ---
                    popperClassName="z-50" // <<< Use a high z-index (e.g., 50) for portal
                    // --- ADD Portal Container ---
                    popperContainer={({ children }) => createPortal(children, document.body)}
                />
            </div>
            {/* --- End Date Input --- */}

            {/* Account Display */}
            <div>
                <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
                <select name="account_id" id="account_id" required value={formData.account_id} onChange={handleChange} className="mt-1 input-field appearance-none" disabled={accounts.length === 0}>
                    {accounts.length === 0 ? (
                         <option value="" disabled>No accounts available</option>
                     ) : (
                         accounts.map(acc => (
                             <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                         ))
                     )}
                </select>
            </div>

            {/* Category Dropdown */}
             <div>
                 <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select name="category_id" id="category_id" required value={formData.category_id} onChange={handleChange} className="mt-1 input-field appearance-none" disabled={filteredCategories.length === 0}>
                    {filteredCategories.length === 0 ? (
                         <option value="" disabled>No {formData.type} categories</option>
                     ) : (
                        filteredCategories.map(cat => (
                             <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                     )}
                 </select>
             </div>

             {/* Description Text area */}
            <div>
                 <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                 <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} className="mt-1 input-field" placeholder="e.g., Weekly grocery shopping"/>
             </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50">
                    Cancel
                 </button>
                 <button type="submit" disabled={isLoading || accounts.length === 0 || filteredCategories.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50">
                     {isLoading ? 'Saving...' : (initialData ? 'Update Transaction' : 'Add Transaction')}
                </button>
             </div>
         </form>
     );
 }

 export default TransactionForm;







