// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AccountScopeProvider } from './contexts/AccountScopeContext'; // Import Provider
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import TransactionsPage from './pages/TransactionsPage';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS for toast notifications 


// ... import Pages ...
import SettingsPage from './pages/SettingsPage';

function App() {
    return (
        <AuthProvider>
            <AccountScopeProvider>
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                             {/* Public Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                             {/* Protected Routes */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/accounts" element={<AccountsPage />} />
                                <Route path="/transactions" element={<TransactionsPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                 {/* Add other protected routes here */}
                            </Route>

                             {/* 404 */}
                            <Route path="*" element={<NotFoundPage />} />
                        </Route>
                    </Routes>
                </Router>

                {/*  ToastContainer */}
                <ToastContainer
                position="top-right" // Or bottom-right, etc.
                autoClose={4000} // Milliseconds to auto-close
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored" // Or "light", "dark"
            />
            </AccountScopeProvider>
        </AuthProvider>
    );
}

export default App;