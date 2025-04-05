import React, { createContext, useState, useEffect, useCallback }
from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext(null); // create a context for authentication

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // state to hold user data
    const [token, setToken] = useState(localStorage.getItem('authToken') || null); // state to hold token (check initial auth status)
    const [loading, setLoading] = useState(true); // loading state
    
    const storeAuthData = (userData, authToken) => {
        localStorage.setItem('user', JSON.stringify(userData)); // store user data in local storage
        localStorage.setItem('authToken', authToken); // store token in local storage
        setUser(userData); // update user state
        setToken(authToken); // update token state
        // Set token in axios default headers (if not using interceptor like above)
        // axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    };

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('user'); // remove user data from local storage
        localStorage.removeItem('authToken'); // remove token from local storage
        setUser(null); // clear user state
        setToken(null); // clear token state
        // Remove token from axios default headers (if not using interceptor like above)
        // delete axiosInstance.defaults.headers.common['Authorization'];
    }, []);

    // Function to check auth status on initial load
    const checkAuthStatus = useCallback(async () => {
        const storedToken = localStorage.getItem('authToken'); // get token from local storage
        const storedUser = localStorage.getItem('user'); // get user data from local storage
        if (storedToken && storedUser) {
            // Optional: Verify token with the backend '/profile' endpoint
            try {
                // Set token for the verification request
                // The interceptor will handle this automatically
                // axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                const response = await axiosInstance.get('/auth/profile'); // Verify token validity
                setUser(response.data.user); // Use fresh user data from the backend
                setToken(storedToken); 
            }
            catch (error) {
                console.error("Token validation/verification failed or expired:", error);
                clearAuthData(); // Clear the invalid/expired token
            }
        }
        setLoading(false); // Set loading to false after checking auth status
    }, [clearAuthData]);

    useEffect(() => {
        checkAuthStatus(); // Check auth status on component mount
    }, [checkAuthStatus]); // Dependency array to avoid infinite loop

    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', { email, password }); // Send Login Request
            if (response.data.user && response.data.token) {
                storeAuthData(response.data.user, response.data.token); // Store auth data
                return true; // Login successful - Indicate success
            }
            return false; // Login failed - Indicate failure
        } catch (error) {
            console.error("Login failed: ", error.response?.data?.message || error.message); // Log error message
            // Handle error (show notification)
            throw error; // Rethrow error for further handling
        }
    };

    const register = async (userData) => {
        try {
            const response = await axiosInstance.post('/auth/register', userData); // Send Registration Request
            if (response.data.user && response.data.token) {
                storeAuthData(response.data.user, response.data.token); // Store auth data
                return true; // Registration successful - Indicate success
            }
            return false; // Registration failed - Indicate failure
        } catch (error) {
            console.error("Registration failed: ", error.response?.data?.message || error.message);
            throw error; // Rethrow error for further handling
        }
    };

    const logout = () => {
        clearAuthData(); // Clear auth data
        // Optional: Redirect to login page or show notification
        window.location.href = '/login'; // Redirect to login page
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token, // Check if user is authenticated
        login,
        logout,
        register,
        setUser // Allow updating user info if profile is edited
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


