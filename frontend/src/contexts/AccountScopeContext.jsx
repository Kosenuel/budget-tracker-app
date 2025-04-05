import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth'; // Depend on auth status

export const AccountScopeContext = createContext(null);

export const AccountScopeProvider = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get auth status

    // State for user's accounts and the selected one
    const [accounts, setAccounts] = useState([]);
    // Try loading initial ID from localStorage, fallback to null
    const [selectedAccountId, setSelectedAccountId] = useState(() => {
        const storedId = localStorage.getItem('selectedAccountId');
        return storedId ? parseInt(storedId, 10) : null;
    });
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [scopeError, setScopeError] = useState('');

    // Store selected ID in localStorage whenever it changes
    useEffect(() => {
        if (selectedAccountId !== null) {
            localStorage.setItem('selectedAccountId', selectedAccountId);
        } else {
             // If no account is selected (e.g., user has no accounts), remove it
            localStorage.removeItem('selectedAccountId');
        }
    }, [selectedAccountId]);

    // Fetch accounts when user is authenticated
    const fetchUserAccounts = useCallback(async () => {
        console.log("[AccountScopeContext] Fetching user accounts...");
        setLoadingAccounts(true);
        setScopeError('');
        try {
            const response = await axiosInstance.get('/accounts');
            const fetchedAccounts = response.data || [];
            setAccounts(fetchedAccounts);

            // --- Logic for initial account selection ---
            if (fetchedAccounts.length > 0) {
                const storedId = localStorage.getItem('selectedAccountId');
                const storedIdNum = storedId ? parseInt(storedId, 10) : null;

                // Check if stored ID is valid among fetched accounts
                const isValidStoredId = fetchedAccounts.some(acc => acc.id === storedIdNum);

                if (isValidStoredId && storedIdNum !== null) {
                    // Use valid stored ID if available and different from current
                    if(selectedAccountId !== storedIdNum) {
                       setSelectedAccountId(storedIdNum);
                    }
                    console.log("[AccountScopeContext] Using stored valid account ID:", storedIdNum);
                } else if (selectedAccountId === null || !fetchedAccounts.some(acc => acc.id === selectedAccountId)) {
                     // Otherwise, if no account selected or current selection is invalid, default to the first account
                    setSelectedAccountId(fetchedAccounts[0].id);
                    console.log("[AccountScopeContext] Setting default account ID:", fetchedAccounts[0].id);
                }
                 // If there's already a valid selection, keep it
                 else {
                     console.log("[AccountScopeContext] Keeping existing valid selection:", selectedAccountId);
                 }

            } else {
                // No accounts found for the user
                setSelectedAccountId(null); // Ensure no account is selected
                 console.log("[AccountScopeContext] No accounts found for user.");
            }

        } catch (error) {
            console.error("Error fetching accounts in AccountScopeContext:", error);
            setScopeError(error.response?.data?.message || "Failed to load accounts for scope selection.");
            setAccounts([]);
             setSelectedAccountId(null); // Clear selection on error
        } finally {
            setLoadingAccounts(false);
        }
    }, []); // Depends on nothing, fetched once after auth usually

    // Effect to fetch accounts only when authenticated and not loading auth
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchUserAccounts();
        } else if (!isAuthenticated) {
             // Clear accounts and selection if user logs out
             setAccounts([]);
             setSelectedAccountId(null);
             setLoadingAccounts(false); // Not loading if not authenticated
             localStorage.removeItem('selectedAccountId'); // Clear stored preference on logout
         }
    }, [isAuthenticated, authLoading, fetchUserAccounts]);


    // Find the full account object for the selected ID
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId) || null;

    const value = {
        accounts,             // List of all user accounts
        selectedAccountId,    // The ID of the currently selected account
        setSelectedAccountId, // Function to change the selected account ID
        selectedAccount,      // The full object of the selected account
        loadingAccounts,      // Loading state specific to fetching accounts for the scope
        scopeError,           // Error related to fetching accounts for scope
        refreshAccounts: fetchUserAccounts // Expose function to manually refresh accounts if needed
    };

    return (
        <AccountScopeContext.Provider value={value}>
            {children}
        </AccountScopeContext.Provider>
    );
};

// Custom hook for easy access
export const useAccountScope = () => {
    const context = useContext(AccountScopeContext);
    if (!context) {
        throw new Error('useAccountScope must be used within an AccountScopeProvider');
    }
    return context;
};