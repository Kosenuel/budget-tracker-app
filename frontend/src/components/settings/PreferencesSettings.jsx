// src/components/settings/PreferencesSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'; // For theme toggle

// Theme Hook (Example - place in src/hooks/useTheme.js or similar)
const useTheme = () => {
    const getInitialTheme = () => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
                return storedTheme;
            }
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'light'; // Default theme
    };

    const [theme, setThemeInternal] = useState(getInitialTheme);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark';
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = (newTheme) => {
         // Handle 'system' logic if implemented later
         setThemeInternal(newTheme);
     };


    return [theme, setTheme];
};
// ---- End Theme Hook Example ----


const COMMON_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'BGN', 'CAD']; // Match your list

function PreferencesSettings() {
    const { user, setUser } = useAuth();
    const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || COMMON_CURRENCIES[0]);
    const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
    const [theme, setTheme] = useTheme(); // Use the theme hook

    // Sync local state if user context updates (e.g., after initial load)
     useEffect(() => {
         if(user?.preferred_currency && user.preferred_currency !== preferredCurrency) {
             setPreferredCurrency(user.preferred_currency);
         }
     }, [user?.preferred_currency]);


    const handleCurrencyChange = async (e) => {
        const newCurrency = e.target.value;
        setPreferredCurrency(newCurrency); // Update UI immediately

        setIsCurrencyLoading(true);
        try {
            // --- Assumes backend endpoint: PUT /api/users/profile OR /api/users/preferences ---
             // Let's assume it's part of the profile update endpoint
             await axiosInstance.put('/users/profile', { preferred_currency: newCurrency });
            setUser({ ...user, preferred_currency: newCurrency }); // Update context
            toast.success("Preferred currency updated!");
        } catch (error) {
            console.error("Error updating currency:", error);
            toast.error(error.response?.data?.message || "Failed to update currency.");
             // Revert UI on error
             setPreferredCurrency(user?.preferred_currency || COMMON_CURRENCIES[0]);
         } finally {
             setIsCurrencyLoading(false);
         }
    };

    // Theme Toggle Buttons data
    const themes = [
        { name: 'Light', value: 'light', icon: SunIcon },
        { name: 'Dark', value: 'dark', icon: MoonIcon },
        // { name: 'System', value: 'system', icon: ComputerDesktopIcon }, // TODO: Implement system theme logic
    ];

    return (
        <div className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
             {/* Section 1: General */}
            <section className="pt-2">
                 <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">General Preferences</h3>

                {/* Preferred Currency */}
                <div className="mt-6">
                     <label htmlFor="preferred-currency" className="form-label">Preferred Currency</label>
                     <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Default currency for new accounts and reports.</p>
                     <select
                        id="preferred-currency"
                         name="preferred_currency"
                         value={preferredCurrency}
                         onChange={handleCurrencyChange}
                         disabled={isCurrencyLoading}
                         className="mt-1 input-field appearance-none max-w-xs" // Limit width
                    >
                         {COMMON_CURRENCIES.map(curr => (
                             <option key={curr} value={curr}>{curr}</option>
                         ))}
                    </select>
                    {isCurrencyLoading && <span className="ml-2 text-sm text-gray-500">Saving...</span>}
                </div>

                {/* Theme Selection */}
                <div className="mt-8">
                    <label className="form-label">Theme</label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose your interface theme.</p>
                    <div className="mt-2 flex space-x-2 rounded-md bg-gray-100 dark:bg-gray-700 p-1 max-w-xs">
                         {themes.map((item) => (
                             <button
                                key={item.value}
                                onClick={() => setTheme(item.value)}
                                 className={classNames(
                                    'w-full rounded-md py-1.5 px-3 text-sm font-medium leading-5 flex items-center justify-center space-x-1',
                                     'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-700 focus:ring-primary focus:z-10',
                                    theme === item.value
                                        ? 'bg-white dark:bg-gray-900 text-primary dark:text-primary-light shadow'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-900/60 hover:text-gray-900 dark:hover:text-white'
                                )}
                            >
                                 <item.icon className="w-4 h-4" />
                                <span>{item.name}</span>
                            </button>
                         ))}
                    </div>
                 </div>
             </section>

             {/* Section 2: Other Preferences (Placeholder) */}
             {/* <section className="pt-8">...</section> */}
        </div>
    );
}
// Utility function if not defined globally
 function classNames(...classes) { return classes.filter(Boolean).join(' '); }

 export default PreferencesSettings;