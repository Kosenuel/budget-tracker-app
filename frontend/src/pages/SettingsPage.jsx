// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useMemo, Fragment, useCallback  } from 'react';
import axiosInstance from '../api/axiosInstance';
import CategoryForm from '../components/CategoryForm';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

function SettingsPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDefault, setShowDefault] = useState(false); // Toggle visibility of defaults

    // Modal State (Add/Edit)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategoryToEdit, setCurrentCategoryToEdit] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Modal State (Delete)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // --- Fetching ---
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axiosInstance.get('/categories'); // Corrected endpoint path
            setCategories(response.data || []);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setError(err.response?.data?.message || 'Failed to load categories.');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- Derived State (Filtering Categories) ---
    const { userCategories, defaultCategories } = useMemo(() => {
         return categories.reduce(
            (acc, category) => {
                 // is_user_owned flag added in backend model helps here
                 if (category.is_user_owned) {
                    acc.userCategories.push(category);
                 } else if (category.is_default) {
                    acc.defaultCategories.push(category);
                 }
                return acc;
            },
            { userCategories: [], defaultCategories: [] }
         );
     }, [categories]);


    // --- Modal Controls ---
     const openAddModal = () => { setCurrentCategoryToEdit(null); setFormError(''); setIsModalOpen(true); };
     const openEditModal = (cat) => { setCurrentCategoryToEdit(cat); setFormError(''); setIsModalOpen(true); };
     const closeModal = () => setIsModalOpen(false);
     const openDeleteConfirm = (cat) => { setCategoryToDelete(cat); setDeleteError(''); setIsDeleteConfirmOpen(true); };
     const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);

    // --- CRUD Handlers ---
     const handleFormSubmit = async (formData) => {
        setFormLoading(true); setFormError('');
         const apiUrl = currentCategoryToEdit ? `/categories/${currentCategoryToEdit.id}` : '/categories';
         const apiMethod = currentCategoryToEdit ? 'put' : 'post';
         try {
             const response = await axiosInstance[apiMethod](apiUrl, formData);
             // Update local state instead of full refetch
             if (currentCategoryToEdit) {
                setCategories(prev => prev.map(c => c.id === response.data.id ? response.data : c));
            } else {
                 setCategories(prev => [...prev, response.data]);
             }
             closeModal();
         } catch (err) {
            console.error(`Error ${currentCategoryToEdit ? 'updating' : 'adding'} category:`, err);
             setFormError(err.response?.data?.message || 'Failed to save category.');
         } finally {
            setFormLoading(false);
         }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
         setDeleteLoading(true); setDeleteError('');
        try {
             await axiosInstance.delete(`/categories/${categoryToDelete.id}`);
             setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id)); // Remove locally
             closeDeleteConfirm();
        } catch (err) {
             console.error("Error deleting category:", err);
             setDeleteError(err.response?.data?.message || 'Failed to delete category.');
             // Note: The error might come from the backend check if category is in use
         } finally {
             setDeleteLoading(false);
         }
    };

     // Helper to render category list items
    const renderCategoryItem = (cat, isEditable = false) => (
         <li key={cat.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded">
             <div className="flex items-center space-x-3">
                 {/* Basic icon display */}
                 {/* <span className="text-gray-400">{cat.icon ? `<i class="${cat.icon}"></i>` : '-'}</span> */}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cat.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                    {cat.type}
                </span>
                <span className="text-gray-900 dark:text-white">{cat.name}</span>
            </div>
            {isEditable && (
                 <div className="flex space-x-1">
                     <button onClick={() => openEditModal(cat)} title="Edit" className="p-1 text-gray-400 hover:text-primary dark:hover:text-primary-light rounded">
                         <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => openDeleteConfirm(cat)} title="Delete" className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-500 rounded">
                         <TrashIcon className="h-4 w-4" />
                     </button>
                 </div>
             )}
        </li>
     );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

            {/* Loading/Error State */}
             {loading && <p className="text-center text-gray-500 dark:text-gray-400">Loading categories...</p>}
             {error && !loading && <div className="form-error-display justify-center">{error}</div>}

            {!loading && !error && (
                <div className="space-y-8">
                    {/* Custom Categories Section */}
                     <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Custom Categories</h2>
                            <button onClick={openAddModal} className="btn btn-primary flex items-center">
                                 <PlusIcon className="h-4 w-4 mr-1.5" /> Add Category
                            </button>
                        </div>
                         {userCategories.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">You haven't added any custom categories yet.</p>
                         ) : (
                             <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                 {userCategories.map(cat => renderCategoryItem(cat, true))}
                             </ul>
                        )}
                     </section>

                    {/* Default Categories Section (Collapsible) */}
                    <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                         <button onClick={() => setShowDefault(!showDefault)} className="flex justify-between items-center w-full text-left mb-2">
                             <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Default Categories</h2>
                             {showDefault ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}
                         </button>
                         <Transition show={showDefault} /* Transition classes */ >
                             {defaultCategories.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm pt-2">No default categories loaded.</p>
                             ) : (
                                 <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-t dark:border-gray-700 pt-4">
                                    {defaultCategories.map(cat => renderCategoryItem(cat, false))}
                                </ul>
                            )}
                         </Transition>
                     </section>
                </div>
            )}

            {/* --- Modals --- */}
             {/* Add/Edit Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                     {/* Backdrop */}
                     <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-50" /></Transition.Child>
                     <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
                         <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                 <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">{currentCategoryToEdit ? 'Edit Category' : 'Add New Category'}</Dialog.Title>
                                 <CategoryForm initialData={currentCategoryToEdit} onSubmit={handleFormSubmit} onCancel={closeModal} isLoading={formLoading} apiError={formError} />
                             </Dialog.Panel>
                        </Transition.Child>
                    </div></div>
                </Dialog>
            </Transition>

             {/* Delete Confirmation Modal */}
             {/* Structure is identical to previous delete modals */}
            <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
                <Dialog as="div" className="relative z-20" onClose={closeDeleteConfirm}>
                    <Transition.Child as={Fragment}><div className="fixed inset-0 bg-black bg-opacity-60" /></Transition.Child>
                     <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} /* Transition props */ >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Confirm Deletion</Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                         Are you sure you want to delete the category "{categoryToDelete?.name}"? This cannot be undone.
                                     </p>
                                     {deleteError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
                                </div>
                                 <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3">
                                     <button type="button" disabled={deleteLoading} onClick={handleDeleteCategory} className="btn btn-danger w-full sm:w-auto justify-center"> {deleteLoading ? 'Deleting...' : 'Delete Category'} </button> {/* Add .btn-danger style */}
                                     <button type="button" disabled={deleteLoading} onClick={closeDeleteConfirm} className="btn btn-secondary w-full sm:w-auto justify-center mt-3 sm:mt-0"> Cancel </button>
                                 </div>
                             </Dialog.Panel>
                        </Transition.Child>
                    </div></div>
                </Dialog>
            </Transition>
        </div>
    );
}

 // Add btn-danger style to src/index.css
/*
 @layer components {
    .btn-danger { @apply text-white bg-red-600 border border-transparent hover:bg-red-700 focus:ring-red-500; }
 }
 */

export default SettingsPage;