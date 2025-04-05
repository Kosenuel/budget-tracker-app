import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Show a loading spinner while checking auth status
        return <div>Loading...</div>
    }

    if (!isAuthenticated) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them 
        // along to that page after they login, which is a nicer user experience than
        // dropping them off on the home page.
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child components (or Outlet for nested routes)
    return children ? children: <Outlet />;
};

export default ProtectedRoute;