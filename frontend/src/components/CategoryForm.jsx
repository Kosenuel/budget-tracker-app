// src/components/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

const CATEGORY_TYPES = ['expense', 'income']; // Define types

function CategoryForm({ initialData, onSubmit, onCancel, isLoading, apiError }) {
    const [formData, setFormData] = useState({
        name: '',
        type: CATEGORY_TYPES[0], // Default to expense
        icon: '', // Optional icon field
    });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                type: initialData.type || CATEGORY_TYPES[0],
                icon: initialData.icon || '',
            });
        } else {
            // Reset form for adding new category
            setFormData({
                name: '',
                type: CATEGORY_TYPES[0],
                icon: '',
            });
        }
        setLocalError(''); // Clear local errors when data changes
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
        setLocalError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalError('');
        if (!formData.name.trim()) {
            setLocalError('Category name is required.');
            return;
        }
        // API handles type validation, but could add check here too
        onSubmit(formData); // Pass data to parent
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {apiError && ( <div className="form-error-display"><ExclamationCircleIcon className="form-error-icon" />{apiError}</div>)}
             {localError && ( <div className="form-error-display bg-yellow-50 ring-yellow-400/30 dark:bg-yellow-900/10"><ExclamationCircleIcon className="form-error-icon text-yellow-500" />{localError}</div> )}

            <div>
                <label htmlFor="cat-name" className="form-label">Category Name</label>
                <input type="text" name="name" id="cat-name" required value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g., Groceries, Salary" />
            </div>

            <fieldset>
                <legend className="form-label">Type</legend>
                <div className="mt-2 flex space-x-4">
                    {CATEGORY_TYPES.map(type => (
                        <div key={type} className="flex items-center">
                            <input id={`cat-type-${type}`} name="type" type="radio" value={type} checked={formData.type === type} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600" />
                            <label htmlFor={`cat-type-${type}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-100 capitalize">{type}</label>
                        </div>
                    ))}
                </div>
            </fieldset>

            <div>
                 <label htmlFor="cat-icon" className="form-label">Icon (Optional)</label>
                <input type="text" name="icon" id="cat-icon" value={formData.icon} onChange={handleChange} className="input-field" placeholder="e.g., fa-shopping-cart (FontAwesome)" />
                 {/* Consider adding an icon picker later */}
             </div>

             {/* Action Buttons */}
             <div className="flex justify-end space-x-3 pt-4"> {/* Apply flex, justify-end, space-x directly */}
                <button
                    type="button" // Important: Prevents form submission
                    onClick={onCancel}
                    disabled={isLoading}
                    // Using direct Tailwind classes for consistency 
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    // Using direct Tailwind classes for consistency
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : (initialData ? 'Update Category' : 'Add Category')}
                </button>
            </div>
         </form>
    );
}

 // Add some utility classes to src/index.css for the form elements if not already defined
 /*
 @layer components {
     .form-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300; }
     .form-actions { @apply flex justify-end space-x-3 pt-4; }
     .form-error-display { @apply rounded-md bg-red-50 dark:bg-red-900/10 p-3 ring-1 ring-inset ring-red-400/30 flex items-center text-sm text-red-700 dark:text-red-300; }
     .form-error-icon { @apply h-5 w-5 text-red-500 mr-2; }
     .btn { @apply px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50; }
     .btn-primary { @apply text-white bg-primary border border-transparent hover:bg-primary-dark focus:ring-primary-dark dark:focus:ring-offset-gray-800; }
     .btn-secondary { @apply text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-primary-dark dark:focus:ring-offset-gray-800; }
     // .input-field should already be defined
 }
 */

 export default CategoryForm;