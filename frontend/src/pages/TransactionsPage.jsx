import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import TransactionForm from '../components/TransactionForm'; // Import the form
import { Dialog, Transition } from '@headlessui/react';
import {
    PlusIcon, PencilIcon, TrashIcon, FunnelIcon, XMarkIcon, ExclamationTriangleIcon,
    // Add icons for the detail view
    CalendarDaysIcon, BanknotesIcon, TagIcon, Bars3BottomLeftIcon, CreditCardIcon, ArrowUpCircleIcon, ArrowDownCircleIcon
 } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { formatDateToDDMMYYYY, formatDateToDDMonYYYY } from '../utils/dateFormatter';
import { useAccountScope } from '../contexts/AccountScopeContext'; // <<< Import scope hook
import ErrorBoundary from '../utils/errorBoundary';

// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

function TransactionsPage() {
    const { selectedAccountId, selectedAccount, loadingAccounts, accounts } = useAccountScope(); // <<< Use scope hook

    // Data State
    const [transactions, setTransactions] = useState([]);
    // const [accounts, setAccounts] = useState([]); // Can get selectedAccount from context
    const [categories, setCategories] = useState([]); 

    // Loading & Error State (Page Level)
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [error, setError] = useState('');

    // Filter State
    const initialFilters = {
        // accountId: '',  // <<< REMOVED - Use selectedAccountId from context
        categoryId: '',
        type: '', // 'income' or 'expense' or '' for all
        startDate: '',
        endDate: '',
        searchTerm: '',
        // Add pagination state later if needed: page: 1, limit: 20
    };
    const [filters, setFilters] = useState(initialFilters);
    const [showFilters, setShowFilters] = useState(false); // Toggle filter visibility

    // Modal State (Add/Edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTransactionToEdit, setCurrentTransactionToEdit] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Modal State (Delete)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // --- NEW STATE for Detail Modal ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);
    // --- Data Fetching ---
    // const fetchSupportingData = useCallback(async () => {
    //     // Fetch accounts and categories concurrently
    //     try {
    //         const [accRes, catRes] = await Promise.all([
    //             axiosInstance.get('/accounts'),
    //             axiosInstance.get('/categories') 
    //         ]);
    //         setAccounts(accRes.data || []);
    //         setCategories(catRes.data || []); // Make sure backend sends default + user categories
    //     } catch (err) {
    //         console.error("Error fetching accounts/categories:", err);
    //         setError('Failed to load accounts or categories. Filtering/Adding may not work correctly.');
    //          // Don't reset them to empty if they were fetched previously
    //          // setAccounts([]);
    //          // setCategories([]);
    //     }
    // }, []); // Empty dependency array means this runs once on mount


    // Fetch Categories separately (if not provided by context)
    const fetchCategoriesForFilter = useCallback(async () => {
        try {
           const catRes = await axiosInstance.get('/categories');
           setCategories(catRes.data || []);
       } catch (err) {
           console.error("Error fetching categories:", err);
           setError('Failed to load categories for filtering.');
            setCategories([]);
       }
   }, []);

    // const fetchTransactions = useCallback(async () => {
    //     setLoading(true); // Use page loading state
    //      // setError(''); // Don't clear potentially persistent errors from support data fetch

    //      // Clean up filters: remove empty strings/nulls before sending
    //     const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    //         if (value !== '' && value !== null) {
    //             acc[key] = value;
    //         }
    //         return acc;
    //     }, {});


    //     try {
    //          // Pass cleaned filters as query params
    //          const response = await axiosInstance.get('/transactions', { params: activeFilters });
    //         setTransactions(response.data || []);
    //     } catch (err) {
    //         console.error("Error fetching transactions:", err);
    //          setError(err.response?.data?.message || 'Failed to load transactions.');
    //          setTransactions([]); // Reset transactions on error
    //     } finally {
    //         setLoading(false);
    //     }
    // }, [filters]); // Refetch whenever filters change


    const fetchTransactions = useCallback(async () => {
        // --- IMPORTANT: Check if an account is selected ---
        if (!selectedAccountId) {
            console.log("TransactionsPage: No account selected, skipping fetch.");
            setTransactions([]);
            setLoadingTransactions(false);
            setError(''); // Clear previous errors if no account selected
            return;
        }
         // --- End Check ---

        setLoadingTransactions(true);
        setError(''); // Clear previous transaction-specific errors

        const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                    if (value !== '' && value !== null) {
                        acc[key] = value;
                    }
                    return acc;
                }, {}); // Clean up filters: remove empty strings/nulls before sending

        try {
            console.log("TransactionsPage: Fetching for account ID:", selectedAccountId, "with filters:", activeFilters);
            const response = await axiosInstance.get('/transactions', {
                 params: {
                    ...activeFilters,
                     accountId: selectedAccountId // <<< ALWAYS pass selected account ID
                }
            });
            setTransactions(response.data || []);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(err.response?.data?.message || 'Failed to load transactions.');
            setTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
         // Make it dependent on selectedAccountId and other filters
    }, [filters, selectedAccountId]); // Refetch whenever filters or selected account change

    useEffect(() => {
        fetchCategoriesForFilter();
        // Transaction fetch happens in the next effect due to selectedAccountId dependency
    }, [fetchCategoriesForFilter]);


     // This effect now triggers fetchTransactions when scope changes OR filters change
     useEffect(() => {
        // Only fetch if accounts are not loading and an ID is selected (or changed)
         if (!loadingAccounts) {
            fetchTransactions();
         }
     }, [fetchTransactions, loadingAccounts]); // Runs when fetchTransactions updates (due to filters or selectedAccountId) or loadingAccounts finishes



    // --- Filter Handling ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
         // setShowFilters(false); // Optional: hide filters on reset
    };

    // --- Modal Controls ---
     const openAddModal = () => {
        setCurrentTransactionToEdit(null);
        setFormError('');
         setIsModalOpen(true);
    };

     const openEditModal = (transaction, e) => {
        e?.stopPropagation(); // Stops row click -> detail modal opening
        setSelectedTransactionDetail(null); // Close detail modal if open
        setCurrentTransactionToEdit(transaction);
         setFormError('');
         setIsModalOpen(true);
     };

    const closeModal = () => setIsModalOpen(false);

    const openDeleteConfirm = (transaction, e) => {
        e?.stopPropagation(); // Stops row click -> detail modal opening
        setSelectedTransactionDetail(null); // Close detail modal if open
        setTransactionToDelete(transaction);
        setDeleteError('');
        setIsDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);


    // --- CRUD Handlers ---
    const handleFormSubmit = async (formData) => {
        formData.account_id = selectedAccountId; // Ensure account ID is set from context
        setFormLoading(true);
        setFormError('');
        const apiUrl = currentTransactionToEdit
             ? `/transactions/${currentTransactionToEdit.id}`
            : '/transactions';
        const apiMethod = currentTransactionToEdit ? 'put' : 'post';

         try {
            const response = await axiosInstance[apiMethod](apiUrl, formData);
            // Optionally: Instead of refetching all, update state locally for faster UI
            // await fetchTransactions(); // Refetch transactions to see changes
            if (currentTransactionToEdit) {
                setTransactions(prev => prev.map(tx => tx.id === response.data.id ? response.data : tx));
            } else {
                 setTransactions(prev => [response.data, ...prev]); // Add to beginning of list
            }

             // IMPORTANT: Need to potentially refetch accounts if balances are affected
             // Or update account balances client-side (more complex)
             // Simple approach: refetch accounts, but could be slow
             // 
             await fetchTransactions(); 
             closeModal();
        } catch (err) {
            console.error(`Error ${currentTransactionToEdit ? 'updating' : 'adding'} transaction:`, err);
             setFormError(err.response?.data?.message || `Failed to ${currentTransactionToEdit ? 'save' : 'add'} transaction.`);
        } finally {
             setFormLoading(false);
        }
    };


     const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return;
        setDeleteLoading(true);
        setDeleteError('');
         try {
            await axiosInstance.delete(`/transactions/${transactionToDelete.id}`);
            // await fetchTransactions(); // Refetch after delete
            setTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id)); // Update locally

            await fetchTransactions(); // Refetch accounts if needed
             closeDeleteConfirm();
         } catch (err) {
            console.error("Error deleting transaction:", err);
             setDeleteError(err.response?.data?.message || 'Failed to delete transaction.');
             // Keep modal open on error to show message
         } finally {
            setDeleteLoading(false);
        }
    };


    // --- NEW Detail Modal Controls ---
    const openDetailModal = (transaction) => {
        // Don't open if clicking directly on edit/delete buttons (stopPropagation handles this)
        setSelectedTransactionDetail(transaction); // Store the whole transaction object
        setIsDetailModalOpen(true);
    };
    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        // Optionally nullify selection after transition ends
        // setTimeout(() => setSelectedTransactionDetail(null), 300);
    };

    // --- Helper Function to Render Detail Item ---
    const DetailItem = ({ icon: Icon, label, value, valueClass = '' }) => (
        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                 <Icon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                 {label}
            </dt>
            <dd className={`mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-2 ${valueClass}`}>{value || '-'}</dd>
         </div>
    );


     // --- Formatting Helpers ---
    const formatCurrency = (amount, currency = 'NGN') => { // Basic fallback
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency }).format(amount);
    };
     const formatDate = (dateString) => {
         return new Date(dateString).toLocaleDateString(undefined, { // User's locale default format
             year: 'numeric', month: 'short', day: 'numeric'
        });
     };


    // --- Render Logic ---
     return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    {/* Display Account Scope in Header */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Transactions
                        {selectedAccount && <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">({selectedAccount.name})</span>}
                </h1>
                 <div className="flex gap-2">
                     <button
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle Filters"
                        className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md shadow hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                     >
                         <FunnelIcon className="h-5 w-5 mr-1.5" /> Filters
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800"
                    >
                         <PlusIcon className="h-5 w-5 mr-1.5" /> Add Transaction
                     </button>
                 </div>
            </div>

             {/* Filters Section (Collapsible) */}
             <Transition
                show={showFilters}
                 enter="transition ease-out duration-100 transform"
                 enterFrom="opacity-0 scale-95"
                 enterTo="opacity-100 scale-100"
                 leave="transition ease-in duration-75 transform"
                 leaveFrom="opacity-100 scale-100"
                 leaveTo="opacity-0 scale-95"
             >
                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                         {/* Account Filter */}
                         {/* <div>  We are now using the context account id, so it auto applies to filters as well...
                            <label htmlFor="filter-accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
                             <select name="accountId" id="filter-accountId" value={filters.accountId} onChange={handleFilterChange} className="mt-1 input-field appearance-none">
                                <option value="">All Accounts</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div> */}
                        {/* Category Filter */}
                        <div>
                             <label htmlFor="filter-categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <select name="categoryId" id="filter-categoryId" value={filters.categoryId} onChange={handleFilterChange} className="mt-1 input-field appearance-none">
                                <option value="">All Categories</option>
                                 {/* Ideally, group categories by type or fetch filtered list */}
                                 {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>)}
                            </select>
                         </div>
                        {/* Type Filter */}
                        <div>
                            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                            <select name="type" id="filter-type" value={filters.type} onChange={handleFilterChange} className="mt-1 input-field appearance-none">
                                <option value="">All Types</option>
                                 <option value="income">Income</option>
                                 <option value="expense">Expense</option>
                             </select>
                        </div>
                         {/* Date Range (Basic Example - Use DatePicker for better UX) */}
                        <div>
                             <label htmlFor="filter-startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                             <input type="date" name="startDate" id="filter-startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 input-field"/>
                         </div>
                         <div>
                            <label htmlFor="filter-endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                             <input type="date" name="endDate" id="filter-endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 input-field"/>
                         </div>
                        {/* Search Term */}
                         <div className="sm:col-span-2 md:col-span-1 lg:col-span-3">
                            <label htmlFor="filter-searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Description</label>
                             <input type="text" name="searchTerm" id="filter-searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Keyword..." className="mt-1 input-field"/>
                        </div>
                        {/* Reset Button */}
                        <div className="flex items-end justify-start lg:col-start-5">
                            <button
                                onClick={resetFilters}
                                className="flex items-center px-3 py-2 h-[38px] mt-[22px] bg-gray-500 text-white text-sm rounded-md shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                             >
                                 <XMarkIcon className="h-4 w-4 mr-1" /> Reset
                             </button>
                         </div>
                     </div>
                 </div>
            </Transition>


            {/* Inform user if no account is selected */}
            {!selectedAccountId && !loadingAccounts && (
                <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Account Selected</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please select an account from the dropdown in the header to view transactions.</p>
                     {/* Optionally link to /accounts if they have none */}
                     {!accounts || accounts.length === 0 && (
                         <Link to="/accounts" className="mt-4 inline-block text-primary hover:underline">Manage Accounts</Link>
                     )}
                 </div>
             )}

             {/* Loading/Error/Empty State for Table
             {loading && <div className="text-center py-10"><p className="text-gray-500 dark:text-gray-400">Loading transactions...</p></div>}
            {error && !loading && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 ring-1 ring-inset ring-red-400/30 text-center">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                </div>
            )}
             {!loading && !error && transactions.length === 0 && (
                 <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or add your first transaction.</p>
                </div>
             )} */}

             {/* Loading/Error/Empty State (Adjust condition to check selectedAccountId) */}
            {loadingTransactions && selectedAccountId && <div className="text-center py-10">Loading transactions...</div>}
            {error && <div className="form-error-display justify-center">{error}</div>}
            {!loadingTransactions && !error && selectedAccountId && transactions.length === 0 && (
                 <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">
                     {
                        <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or add your first transaction.</p>
                        </div>
                    }
                 </div>
            )}

             {/* Transactions Table (Only render if account selected and not loading/error) */}
             {!loadingTransactions && !error && selectedAccountId && transactions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {/* Simplified Headers - Adjust as needed */}
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map(tx => (
                                <tr key={tx.id}
                                onClick={() => openDetailModal(tx)} // <<< Call detail modal opener
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" // <<< Add cursor style
                                >
                                    {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDate(tx.transaction_date)}</td> */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{formatDateToDDMonYYYY(tx.transaction_date)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{tx.account_name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{tx.category_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs" title={tx.description}>{tx.description || '-'}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency || accounts.find(a=>a.id === tx.account_id)?.currency )} {/* Get currency from linked account if possible */}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-1">
                                            <button onClick={(e) => openEditModal(tx, e)} title="Edit" className="p-1 text-gray-400 hover:text-primary dark:hover:text-primary-light rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark">
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={(e) => openDeleteConfirm(tx, e)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                 </table>
             </div>
             )}

             {/* Pagination Controls would go here */}


            {/* --- Modals --- */}
             {/* Add/Edit Transaction Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                     {/* Backdrop */}
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                         <div className="fixed inset-0 bg-black bg-opacity-50" />
                    </Transition.Child>
                     {/* Modal Content */}
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                             <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                             <Dialog.Panel className="w-full max-w-lg transform rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all overflow-hidden flex flex-col max-h-[70vh]"> {/* Max height & flex column */}
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                                         {currentTransactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}
                                     </Dialog.Title>
                                     <div className="flex-grow overflow-y-auto pr-2"> Input your Tx details
                                        <ErrorBoundary>
                                        <TransactionForm
                                                initialData={currentTransactionToEdit}
                                                onSubmit={handleFormSubmit}
                                                onCancel={closeModal}
                                                isLoading={formLoading}
                                                apiError={formError}
                                                accounts={[]} // Pass empty if form shouldn't allow changing account
                                                categories={categories}
                                            />
                                        </ErrorBoundary>
                                     </div>
                                 </Dialog.Panel>
                             </Transition.Child>
                         </div>
                     </div>
                 </Dialog>
             </Transition>

             {/* Delete Confirmation Modal */}
            {/* Identical structure to the one in AccountsPage, copy or create reusable component */}
             <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
                <Dialog as="div" className="relative z-20" onClose={closeDeleteConfirm}>
                     <Transition.Child as={Fragment}><div className="fixed inset-0 bg-black bg-opacity-60" /></Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                         <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} /* Transition props */>
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                     <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Confirm Deletion</Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Are you sure you want to delete this transaction? (Description: {transactionToDelete?.description || 'N/A'}) This action cannot be undone.
                                         </p>
                                        {deleteError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p> }
                                     </div>
                                    <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                        <button type="button" disabled={deleteLoading} onClick={handleDeleteTransaction} className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto sm:text-sm disabled:opacity-50">
                                             {deleteLoading ? 'Deleting...' : 'Delete Transaction'}
                                        </button>
                                         <button type="button" disabled={deleteLoading} onClick={closeDeleteConfirm} className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50">
                                             Cancel
                                         </button>
                                     </div>
                                 </Dialog.Panel>
                            </Transition.Child>
                        </div>
                     </div>
                 </Dialog>
            </Transition>

             {/* --- Transaction Detail Modal --- */}
            <Transition appear show={isDetailModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-30" onClose={closeDetailModal}> {/* Higher z-index */}
                    {/* Backdrop */}
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-60" />
                    </Transition.Child>

                    {/* Modal Content */}
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                                     <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white border-b dark:border-gray-700 pb-3 mb-4 flex justify-between items-center">
                                        Transaction Details
                                        <button onClick={closeDetailModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                             <XMarkIcon className="h-5 w-5" />
                                         </button>
                                     </Dialog.Title>

                                     {/* Content Area */}
                                    <div className="flex-grow overflow-y-auto pr-2 -mr-2"> {/* Basic scrolling if needed */}
                                        {selectedTransactionDetail ? (
                                             <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                                                <DetailItem icon={selectedTransactionDetail.type === 'income' ? ArrowUpCircleIcon : ArrowDownCircleIcon} label="Type" value={selectedTransactionDetail.type} valueClass={`capitalize font-medium ${selectedTransactionDetail.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                                 <DetailItem icon={BanknotesIcon} label="Amount" value={formatCurrency(selectedTransactionDetail.amount, selectedTransactionDetail.currency || accounts.find(a=>a.id === selectedTransactionDetail.account_id)?.currency)} valueClass={`font-semibold ${selectedTransactionDetail.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                                 <DetailItem icon={CalendarDaysIcon} label="Date" value={formatDateToDDMonYYYY(selectedTransactionDetail.transaction_date)} />
                                                <DetailItem icon={CreditCardIcon} label="Account" value={selectedTransactionDetail.account_name} />
                                                <DetailItem icon={TagIcon} label="Category" value={selectedTransactionDetail.category_name} />
                                                <DetailItem icon={Bars3BottomLeftIcon} label="Description" value={selectedTransactionDetail.description} valueClass="whitespace-pre-wrap break-words" />
                                                {/* Add Created At / Updated At if available in tx object */}
                                                 {/* <DetailItem icon={ClockIcon} label="Recorded" value={formatDateTime(tx.created_at)} /> */}
                                             </dl>
                                         ) : (
                                             <p className="text-gray-500 dark:text-gray-400">No transaction selected.</p>
                                        )}
                                    </div>

                                     {/* Action Buttons Footer */}
                                    {selectedTransactionDetail && (
                                         <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3 border-t dark:border-gray-700 pt-4">
                                            <button
                                                type="button"
                                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto sm:text-sm disabled:opacity-50 " // Use your button styles
                                                 onClick={() => {
                                                     const txToEdit = selectedTransactionDetail; // Capture before state change
                                                     closeDetailModal();
                                                    // Need a slight delay to allow detail modal to close before opening edit
                                                     setTimeout(() => openEditModal(txToEdit), 50);
                                                 }}
                                            >
                                                <PencilIcon className="h-4 w-4 mr-1.5" /> Edit
                                             </button>
                                             <button
                                                type="button"
                                                 className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto sm:text-sm disabled:opacity-50" // Use your button styles
                                                 onClick={() => {
                                                    const txToDelete = selectedTransactionDetail; // Capture before state change
                                                    closeDetailModal();
                                                     setTimeout(() => openDeleteConfirm(txToDelete), 50);
                                                 }}
                                             >
                                                 <TrashIcon className="h-4 w-4 mr-1.5" /> Delete
                                            </button>
                                            <button
                                                 type="button"
                                                 className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 sm:w-auto justify-center mt-3 sm:mt-0 sm:mr-auto" // Push close to the left
                                                 onClick={closeDetailModal}
                                            >
                                                Close
                                             </button>
                                         </div>
                                     )}

                                </Dialog.Panel>
                             </Transition.Child>
                         </div>
                    </div>
                </Dialog>
             </Transition>

        </div>
     );
 }

 export default TransactionsPage;