// src/components/Layout.jsx
import React, { Fragment } from 'react'; // Add Fragment
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAccountScope } from '../contexts/AccountScopeContext'; // Import account scope hook
import { Menu, Transition } from '@headlessui/react'; // Import Menu components
import {
    ArrowLeftOnRectangleIcon, UserPlusIcon, ChartBarIcon, CreditCardIcon,
    ArrowsRightLeftIcon, Cog6ToothIcon, BuildingLibraryIcon, // Added BuildingLibraryIcon
    ChevronDownIcon // Added ChevronDownIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/20/solid'; // For selected checkmark


function Layout() {
    const { isAuthenticated, logout, user } = useAuth();
    const {
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        selectedAccount, // Get the full selected account object
        loadingAccounts
    } = useAccountScope(); // Use the hook
    const currentYear = new Date().getFullYear();

    // --- NavLink Classes (no change) ---
     const navItemClass = ({ isActive }) => `...`;
     const authLinkClass = ({ isActive }) => `...`;


    const handleScopeChange = (accountId) => {
        setSelectedAccountId(accountId);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                         {/* Logo/Brand */}
                        <Link to="/" className="text-xl font-bold flex items-center space-x-2 text-white hover:opacity-80 transition-opacity duration-150"><span>BudgetApp</span></Link>

                        {/* --- Center Section: Account Scope Switcher (if authenticated) --- */}
                        <div className="flex-1 flex justify-center px-4">
                             {isAuthenticated && (
                                 <Menu as="div" className="relative inline-block text-left">
                                    <div>
                                        <Menu.Button className="inline-flex w-full justify-center items-center rounded-md bg-primary-dark/50 dark:bg-primary-dark/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 disabled:opacity-50" disabled={loadingAccounts}>
                                             {loadingAccounts ? (
                                                <span>Loading Accounts...</span>
                                             ) : selectedAccount ? (
                                                 <>
                                                     <BuildingLibraryIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                                                     {selectedAccount.name} ({selectedAccount.currency})
                                                     <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5 text-primary-light" aria-hidden="true" />
                                                 </>
                                             ) : (
                                                 <span>No Account Selected</span>
                                             )}
                                        </Menu.Button>
                                     </div>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
                                     >
                                        <Menu.Items className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 origin-top rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                             <div className="px-1 py-1 max-h-60 overflow-y-auto">
                                                 {accounts.length === 0 && !loadingAccounts && (
                                                    <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">No accounts found.</div>
                                                 )}
                                                 {accounts.map((account) => (
                                                    <Menu.Item key={account.id}>
                                                         {({ active }) => (
                                                            <button
                                                                onClick={() => handleScopeChange(account.id)}
                                                                className={`${
                                                                     active ? 'bg-primary text-white dark:bg-primary-dark' : 'text-gray-900 dark:text-gray-200'
                                                                } group flex w-full items-center rounded-md px-2 py-2 text-sm ${
                                                                    account.id === selectedAccountId ? 'font-semibold' : ''
                                                                 }`}
                                                            >
                                                                 {account.id === selectedAccountId ? (
                                                                     <CheckCircleIcon className="mr-2 h-5 w-5 text-current" aria-hidden="true" />
                                                                ) : (
                                                                     <span className="w-5 mr-2"></span> // Placeholder for alignment
                                                                 )}
                                                                {account.name} ({account.currency})
                                                            </button>
                                                         )}
                                                    </Menu.Item>
                                                 ))}
                                            </div>
                                             {/* Optional: Link to manage accounts */}
                                             <div className="px-1 py-1 border-t border-gray-100 dark:border-gray-700">
                                                 <Menu.Item>
                                                     {({ active }) => (
                                                        <Link to="/accounts" className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 dark:text-gray-300`}>
                                                            <CreditCardIcon className="mr-2 h-5 w-5 text-gray-400" /> Manage Accounts
                                                         </Link>
                                                    )}
                                                 </Menu.Item>
                                             </div>
                                        </Menu.Items>
                                     </Transition>
                                 </Menu>
                            )}
                         </div>

                        {/* Right Side Links (Login/Register or User Nav) */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                             {isAuthenticated ? (
                                // --- START: Logged-in User Section ---
                                <>
                                    {/* Primary Navigation Links (can also be placed on left) */}
                                     <NavLink to="/" className={navItemClass} end title="Dashboard">
                                         <ChartBarIcon className="h-5 w-5 sm:mr-1.5" /><span className="hidden sm:inline">Dashboard</span>
                                    </NavLink>
                                     <NavLink to="/accounts" className={navItemClass} title="Accounts">
                                        <CreditCardIcon className="h-5 w-5 sm:mr-1.5" /><span className="hidden sm:inline">Accounts</span>
                                     </NavLink>
                                    <NavLink to="/transactions" className={navItemClass} title="Transactions">
                                         <ArrowsRightLeftIcon className="h-5 w-5 sm:mr-1.5" /><span className="hidden sm:inline">Transactions</span>
                                     </NavLink>
                                     <NavLink to="/settings" className={navItemClass} title="Settings">
                                        <Cog6ToothIcon className="h-5 w-5 sm:mr-1.5" /><span className="hidden sm:inline">Settings</span>
                                    </NavLink>

                                    {/* Separator (Optional) */}
                                     <div className="h-6 w-px bg-primary-dark/50 mx-1 hidden sm:block"></div>

                                     {/* User Info Span */}
                                     <span className="hidden sm:flex items-center text-sm text-primary-light px-2" title={user?.email}>
                                         Hi, {user?.name?.split(' ')[0]} {/* Show first name */}
                                     </span>

                                     {/* Logout Button */}
                                     <button
                                        onClick={logout}
                                        title="Logout"
                                         // Consistent styling using navItemClass base but distinct colors
                                        className="flex items-center px-2 sm:px-3 py-2 rounded-md text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-colors duration-150"
                                     >
                                         <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:mr-1.5" />
                                         <span className="hidden sm:inline">Logout</span>
                                    </button>
                                </>
                                // --- END: Logged-in User Section ---

                             ) : (
                                // --- START: Logged-out User Section ---
                                <>
                                     <NavLink to="/login" className={authLinkClass}>
                                        <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-1.5 transform rotate-180" /> Login
                                     </NavLink>
                                     <NavLink to="/register" className={authLinkClass}>
                                         <UserPlusIcon className="h-5 w-5 mr-1.5" /> Register
                                     </NavLink>
                                </>
                                 // --- END: Logged-out User Section ---
                            )}
                         </div>
                     </div>
                </div>
            </nav>

            <main className="flex-grow w-full"><Outlet /></main>

            <footer className="w-full text-center py-4 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm mt-auto"> © {currentYear} Budget Tracker App </footer>
         </div>
    );
}

export default Layout;