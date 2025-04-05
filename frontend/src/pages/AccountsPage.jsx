import React, { useState, useEffect, Fragment } from 'react'; // Added Fragment
import axiosInstance from '../api/axiosInstance';
import AccountForm from '../components/AccountForm'; // Import the new form
import { Dialog, Transition } from '@headlessui/react'; // For Modal
import { useAccountScope } from '../contexts/AccountScopeContext'; // <<< Import scope hook
import { useAuth } from '../hooks/useAuth'; // To help with currency formatting potentially
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Icons
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'; // For errors in modal
import { CheckCircleIcon } from '@heroicons/react/24/solid'; // Checkmark for selected account

function AccountsPage() {
    // const [accounts, setAccounts] = useState([]); // Moved to context
    const [setAccounts] = useState([]);
    // const [loading, setLoading] = useState(true); // Page loading // Rely on context loading
    // const [error, setError] = useState(''); // Page error

    // <<< Use the account scope hook - NO RENAMING >>>
    const {
        accounts, // Use directly from context
        selectedAccountId, // Use directly from context
        setSelectedAccountId, // Function to set the scope
        refreshAccounts, // Function to refresh context accounts
        loadingAccounts // Loading state from context
    } = useAccountScope();

    // Page-specific state (modals, delete confirmation) - No Changes Here
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAccountToEdit, setCurrentAccountToEdit] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false); // Page loading state (if needed)

    // Delete Confirmation Modal State
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const { user } = useAuth(); // Get user context if needed later

    // --- Data Fetching ---
    // const fetchAccounts = async () => {
    //     try {
    //         setLoading(true);
    //         setError('');
    //         const response = await axiosInstance.get('/accounts');
    //         setAccounts(response.data || []); // Ensure accounts is always an array
    //     } catch (err) {
    //         console.error("Error fetching accounts:", err);
    //         setError(err.response?.data?.message || 'Failed to load accounts. Please try again later.');
    //         setAccounts([]); // Reset accounts on error
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchAccounts();
    // }, []); // Fetch accounts on component mount

    // --- Modal Controls ---
    // const openAddModal = () => {
    //     setCurrentAccountToEdit(null); // Ensure it's null for adding
    //     setFormError(''); // Clear previous form errors
    //     setIsModalOpen(true);
    // };

    // const openEditModal = (account) => {
    //     setCurrentAccountToEdit(account);
    //     setFormError('');
    //     setIsModalOpen(true);
    // };

    // const closeModal = () => {
    //     setIsModalOpen(false);
    //     // Optionally reset currentAccountToEdit after transition ends if causing issues
    //     // setTimeout(() => setCurrentAccountToEdit(null), 300); // Adjust timing if needed
    // };

    // const openDeleteConfirm = (account) => {
    //     setAccountToDelete(account);
    //     setDeleteError(''); // Clear previous delete errors
    //     setIsDeleteConfirmOpen(true);
    // };

    // const closeDeleteConfirm = () => {
    //     setIsDeleteConfirmOpen(false);
    //     // setTimeout(() => setAccountToDelete(null), 300);
    // };

    // --- Modal Controls (Ensure stopPropagation is added) ---
    const openAddModal = () => { setCurrentAccountToEdit(null); setFormError(''); setIsModalOpen(true); };
    const openEditModal = (account, e) => { e?.stopPropagation(); setCurrentAccountToEdit(account); setFormError(''); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setTimeout(() => setCurrentAccountToEdit(null), 300); };
    const openDeleteConfirm = (account, e) => { e?.stopPropagation(); setAccountToDelete(account); setDeleteError(''); setIsDeleteConfirmOpen(true); };
    const closeDeleteConfirm = () => { setIsDeleteConfirmOpen(false); setTimeout(() => setAccountToDelete(null), 300);}

    // --- CRUD Handlers ---
    const handleFormSubmit = async (formData) => {
        setFormLoading(true);
        setFormError('');
        const apiUrl = currentAccountToEdit
            ? `/accounts/${currentAccountToEdit.id}`
            : '/accounts';
        const apiMethod = currentAccountToEdit ? 'put' : 'post';

    //     try {
    //         const response = await axiosInstance[apiMethod](apiUrl, formData);
    //         await refreshAccounts(); // <<< Refresh context accounts
    //         // If adding the *first* account, make it the active scope
    //         if (currentAccountToEdit) {
    //             // Update existing account in state
    //             setAccounts(prevAccounts =>
    //                 prevAccounts.map(acc =>
    //                     acc.id === currentAccountToEdit.id ? response.data : acc
    //                 )
    //             );
    //         } else {
    //             // Add new account to state
    //             setAccounts(prevAccounts => [...prevAccounts, response.data]);
    //         }
    //         closeModal(); // Close modal on success
    //     } catch (err) {
    //         console.error(`Error ${currentAccountToEdit ? 'updating' : 'adding'} account:`, err);
    //         setFormError(err.response?.data?.message || `Failed to ${currentAccountToEdit ? 'update' : 'add'} account.`);
    //     } finally {
    //         setFormLoading(false);
    //     }
    // };

        try {
            const response = await axiosInstance[apiMethod](apiUrl, formData);
            await refreshAccounts(); // <<< Refresh context accounts
            // If adding the *first* account, make it the active scope
            if (!currentAccountToEdit && accounts.length === 0) { // Check context accounts length before refresh completed? Maybe refresh first. Let's refresh first.
                await refreshAccounts(); // Ensure list is updated in context
                // Now check updated length (if refresh is quick enough) or use response.data.id directly
                const updatedAccountsList = (await axiosInstance.get('/accounts')).data; // Re-fetch might be safer here
                if(updatedAccountsList.length === 1){
                    setSelectedAccountId(response.data.id);
                }

            }
            closeModal();
        } catch (err) {
            console.error(`Error ${currentAccountToEdit ? 'updating' : 'adding'} account:`, err);
            setFormError(err.response?.data?.message || 'Failed to save account.');
        }
        finally { setFormLoading(false); }
    };

    // const handleDeleteAccount = async () => {
    //     if (!accountToDelete) return;

    //     setDeleteLoading(true);
    //     setDeleteError('');

    //     try {
    //         await axiosInstance.delete(`/accounts/${accountToDelete.id}`);
    //         // Remove account from state
    //         setAccounts(prevAccounts =>
    //             prevAccounts.filter(acc => acc.id !== accountToDelete.id)
    //         );
    //         closeDeleteConfirm(); // Close confirmation modal on success
    //     } catch (err) {
    //          console.error("Error deleting account:", err);
    //         // Handle specific backend error if account has transactions
    //          if (err.response?.status === 400 && err.response?.data?.message) {
    //              setDeleteError(err.response.data.message);
    //          } else {
    //             setDeleteError(err.response?.data?.message || 'Failed to delete account.');
    //          }
    //     } finally {
    //         setDeleteLoading(false);
    //     }
    // };

    const handleDeleteAccount = async () => {
        if (!accountToDelete) return;
        setDeleteLoading(true); setDeleteError('');
        try {
            await axiosInstance.delete(`/accounts/${accountToDelete.id}`);
             // If deleting the currently selected account, reset scope
            if (accountToDelete.id === selectedAccountId) {
                 setSelectedAccountId(null); // Context logic will pick new default
             }
            await refreshAccounts(); // <<< Refresh context accounts
            closeDeleteConfirm();
        } catch (err) {
            console.error("Error deleting account:", err);
            setDeleteError(err.response?.data?.message || 'Failed to delete account.');
         }
         finally { setDeleteLoading(false); }
    };

    // --- Scope Setting Handler ---
    const handleSetScope = (accountId) => {
        console.log("Setting scope to account ID:", accountId);
        setSelectedAccountId(accountId);
    };


    // --- Helper Functions ---
    const formatCurrency = (amount, currencyCode) => {
        if (amount == null || isNaN(amount)) return 'N/A'; // Handle null or NaN amounts gracefully
        // Fallback currency if code is missing, though it should exist on accounts
        const code = currencyCode || user?.preferred_currency || 'USD';
        return new Intl.NumberFormat(undefined, { // Use user's locale settings
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // --- Render Logic ---
    // return (
    //     // Added container and padding consistent with other pages
    //     <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    //         {/* Page Header */}
    //         <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
    //             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounts</h1>
    //             <button
    //                 onClick={openAddModal}
    //                 className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800"
    //             >
    //                 <PlusIcon className="h-5 w-5 mr-1.5" />
    //                 Add Account
    //             </button>
    //         </div>

    //         {/* Loading State */}
    //         {loading && (
    //             <div className="text-center py-10">
    //                  {/* Replace with a spinner component if desired */}
    //                  <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
    //              </div>
    //         )}

    //         {/* Error State */}
    //         {error && !loading && (
    //              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 ring-1 ring-inset ring-red-400/30 text-center">
    //                 <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
    //              </div>
    //         )}

    //         {/* Account List */}
    //         {!loading && !error && (
    //             <div className="space-y-4">
    //                 {accounts.length === 0 ? (
    //                     <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">
    //                         <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    //                             <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.002 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.002 0M18 7l3 9m-3-9l-6-2m0-2v4l3 1m-3-1L6 7m6-2v4l3 1m7-5l-3 1m-1 5l-3-9" />
    //                         </svg>
    //                         <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No accounts</h3>
    //                         <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first checking or savings account.</p>
    //                         <div className="mt-6">
    //                             <button
    //                                 type="button"
    //                                 onClick={openAddModal}
    //                                 className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800"
    //                             >
    //                                 <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
    //                                 Add Account
    //                             </button>
    //                         </div>
    //                     </div>
    //                 ) : (
    //                     accounts.map(account => (
    //                         <div key={account.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
    //                             <div className="flex-grow">
    //                                 <p className="text-lg font-semibold text-primary dark:text-primary-light">{account.name}</p>
    //                                 <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type?.replace('_', ' ')} - {account.currency}</p>
    //                             </div>
    //                             <div className="flex-shrink-0 flex flex-row sm:flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
    //                                 <p className="text-xl font-bold text-gray-900 dark:text-white w-full text-left sm:text-right">
    //                                     {formatCurrency(account.current_balance, account.currency)}
    //                                 </p>
    //                                 {/* Action Buttons */}
    //                                 <div className="flex space-x-2 flex-shrink-0">
    //                                     <button
    //                                         onClick={() => openEditModal(account)}
    //                                         title="Edit Account"
    //                                         className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800"
    //                                     >
    //                                         <PencilIcon className="h-5 w-5" />
    //                                     </button>
    //                                     <button
    //                                         onClick={() => openDeleteConfirm(account)}
    //                                         title="Delete Account"
    //                                         className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
    //                                     >
    //                                         <TrashIcon className="h-5 w-5" />
    //                                     </button>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     ))
    //                 )}
    //             </div>
    //         )}

    return (
        // Added container and padding consistent with other pages
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounts</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800"
                >
                    <PlusIcon className="h-5 w-5 mr-1.5" />
                    Add Account
                </button>
            </div>

            {/* Loading State (Use context loading) */}
            {loadingAccounts && <div className="text-center py-10">Loading accounts...</div>}

            {/* Error State */}
            {error && !loadingAccounts && <div className="form-error-display justify-center">{error}</div>}

            {/* Account List (Use 'accounts' from context) */}
            {!loadingAccounts && !error && (
                <div className="space-y-4">
                    {accounts.length === 0 ? ( // <<< Use context 'accounts'
                        <div className="text-center py-10 bg-white dark:bg-gray-800 shadow rounded-lg">...</div> // Empty State
                    ) : (
                        accounts.map(account => ( // <<< Use context 'accounts'
                            <div
                                key={account.id}
                                onClick={() => handleSetScope(account.id)} // Set scope on click
                                className={`bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-150 ease-in-out cursor-pointer hover:shadow-md ${
                                    // <<< Highlight based on context 'selectedAccountId'
                                    account.id === selectedAccountId
                                    ? 'ring-2 ring-primary dark:ring-primary-light shadow-lg'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                                title="Click to set as active account scope"
                            >
                                {/* Account Details */}
                                <div className="flex-grow flex items-center space-x-3">
                                    {/* <<< Checkmark based on context 'selectedAccountId' >>> */}
                                     {account.id === selectedAccountId && (
                                        <CheckCircleIcon className="h-6 w-6 text-primary dark:text-primary-light flex-shrink-0" />
                                     )}
                                     {!(account.id === selectedAccountId) && (
                                         <span className="w-6 h-6 flex-shrink-0"></span>
                                     )}
                                     <div>
                                         <p className="text-lg font-semibold text-primary dark:text-primary-light">{account.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type?.replace('_', ' ')} - {account.currency}</p>
                                    </div>
                                </div>
                                {/* Balance and Action Buttons */}
                                <div className="flex-shrink-0 flex flex-row sm:flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pl-9 sm:pl-0">
                                    <p className="text-xl font-bold text-gray-900 dark:text-white w-full text-left sm:text-right">
                                         {formatCurrency(account.current_balance, account.currency)}
                                    </p>
                                     <div className="flex space-x-2 flex-shrink-0">
                                        {/* Ensure stopPropagation is called on button clicks */}
                                         <button onClick={(e) => openEditModal(account, e)} className="..." title="Edit Account"><PencilIcon className="h-5 w-5" /></button>
                                         <button onClick={(e) => openDeleteConfirm(account, e)} className="..." title="Delete Account"><TrashIcon className="h-5 w-5" /></button>
                                     </div>
                                 </div>
                            </div>
                         ))
                     )}
                 </div>
             )}

            {/* --- Modals --- */}

            {/* Add/Edit Account Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    {/* Backdrop */}
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-50" />
                    </Transition.Child>

                    {/* Modal Content */}
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                                    >
                                        {currentAccountToEdit ? 'Edit Account' : 'Add New Account'}
                                    </Dialog.Title>

                                    {/* Render the form component */}
                                    <AccountForm
                                        initialData={currentAccountToEdit}
                                        onSubmit={handleFormSubmit}
                                        onCancel={closeModal}
                                        isLoading={formLoading}
                                        apiError={formError}
                                    />

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

             {/* Delete Confirmation Modal */}
            <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
                 <Dialog as="div" className="relative z-20" onClose={closeDeleteConfirm}> {/* Higher z-index */}
                    <Transition.Child as={Fragment} /* ... Backdrop ... */ >
                         <div className="fixed inset-0 bg-black bg-opacity-60" />
                     </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                             <Transition.Child as={Fragment} /* ... Modal fly-in ... */ >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                        Confirm Deletion
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                             Are you sure you want to delete the account "{accountToDelete?.name}"?
                                             This action cannot be undone.
                                        </p>
                                         {/* Display Delete Error */}
                                         {deleteError && (
                                            <div className="mt-3 rounded-md bg-red-50 dark:bg-red-900/10 p-3 ring-1 ring-inset ring-red-400/30">
                                                <div className="flex items-center">
                                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" aria-hidden="true" />
                                                     <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
                                                </div>
                                            </div>
                                         )}
                                    </div>

                                    <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                         <button
                                            type="button"
                                             disabled={deleteLoading}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto sm:text-sm disabled:opacity-50"
                                            onClick={handleDeleteAccount}
                                        >
                                             {deleteLoading ? 'Deleting...' : 'Delete Account'}
                                         </button>
                                         <button
                                            type="button"
                                            disabled={deleteLoading}
                                             className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                                            onClick={closeDeleteConfirm}
                                        >
                                             Cancel
                                         </button>
                                    </div>
                                </Dialog.Panel>
                             </Transition.Child>
                        </div>
                    </div>
                 </Dialog>
             </Transition>


        </div>
    );
}

export default AccountsPage;