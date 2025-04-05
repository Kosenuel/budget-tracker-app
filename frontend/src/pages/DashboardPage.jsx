import React from 'react';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
    const { user, logout } = useAuth();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            {user && <p className="mb-4">Welcome, {user.name}!</p>}
            <p> Your buget overview will appear here soon.</p>

            <button
                onClick={logout}
                className="mt-6 px-4 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Logout
            </button>
        </div>
    );
}

export default DashboardPage;