import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'; // Using Heroicons for inputs

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/'); // Redirect to dashboard or home on successful login
            }
            // No need for 'else' block here as login() should throw on failure
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials or try again.');
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Full screen container, centers the content vertically and horizontally
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
             {/* Form container with max width, padding, background, shadow, rounded corners */}
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Login to your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Input fields container */}
                    <div className="rounded-md shadow-sm -space-y-px">
                        {/* Email Input with Icon */}
                        <div className="relative mb-4">
                             <label htmlFor="email" className="sr-only">Email address</label>
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {/* Password Input with Icon */}
                         <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2.5 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900 p-3">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                     )}

                     {/* Remember me / Forgot Password (Optional) - Placeholder */}
                     {/* <div className="flex items-center justify-between text-sm">
                         <div className="flex items-center">
                             <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                             <label htmlFor="remember-me" className="ml-2 block text-gray-900 dark:text-gray-300"> Remember me </label>
                         </div>
                         <div className="font-medium text-primary hover:text-primary-dark">
                             <a href="#"> Forgot your password? </a>
                         </div>
                     </div> */}


                    {/* Submit Button & Link to Register */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 dark:focus:ring-offset-gray-800"
                        >
                             {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                     <div className="text-sm text-center">
                        <span className="text-gray-600 dark:text-gray-400">Need an account? </span>
                         <Link to="/register" className="font-medium text-primary hover:text-primary-dark hover:underline">
                             Register here
                         </Link>
                     </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;