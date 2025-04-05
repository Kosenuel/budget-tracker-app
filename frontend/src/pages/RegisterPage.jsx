import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { UserIcon, EnvelopeIcon, LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [preferredCurrency, setPreferredCurrency] = useState('NGN'); // Default NGN or other
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const success = await register({ name, email, password, preferred_currency: preferredCurrency });
            if (success) {
                navigate('/'); // Redirect after successful registration
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Supported Currencies (Adjust as needed)
    const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'BGN'];

    return (
        // Full screen container, centers the content vertically and horizontally
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-12"> {/* Added py-12 for spacing if content overflows */}
            {/* Form container */}
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {/* Input fields container */}
                    <div className="rounded-md shadow-sm">
                         {/* Name Input */}
                        <div className="relative mb-4">
                             <label htmlFor="name" className="sr-only">Name</label>
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </div>
                            <input
                                id="name" name="name" type="text" autoComplete="name" required
                                className="input-field pl-10" // Use a common class
                                placeholder="Full Name"
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        {/* Email Input */}
                        <div className="relative mb-4">
                             <label htmlFor="email" className="sr-only">Email address</label>
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </div>
                            <input
                                id="email" name="email" type="email" autoComplete="email" required
                                className="input-field pl-10"
                                placeholder="Email address"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                             />
                        </div>
                         {/* Preferred Currency */}
                         <div className="relative mb-4">
                            <label htmlFor="preferred-currency" className="sr-only">Preferred Currency</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </div>
                            <select
                                id="preferred-currency" name="preferred-currency" required
                                className="input-field pl-10 appearance-none" // remove default arrow, add custom later if needed
                                value={preferredCurrency} onChange={(e) => setPreferredCurrency(e.target.value)}
                             >
                                {currencies.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </select>
                            {/* Custom arrow indicator if desired */}
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20"><path d="M5.516 7.548c.436-.446 1.143-.446 1.579 0L10 10.405l2.905-2.857c.436-.446 1.143-.446 1.579 0l.71.71c.436.446.436 1.167 0 1.613l-3.77 3.771a1.11 1.11 0 01-1.579 0l-3.77-3.771a1.13 1.13 0 010-1.613l.71-.71z"/></svg>
                             </div>
                        </div>

                        {/* Password Input */}
                        <div className="relative mb-4">
                             <label htmlFor="password" className="sr-only">Password</label>
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                             </div>
                            <input
                                id="password" name="password" type="password" autoComplete="new-password" required
                                className="input-field pl-10"
                                placeholder="Password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                             />
                        </div>
                         {/* Confirm Password Input */}
                        <div className="relative">
                            <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required
                                className="input-field pl-10"
                                placeholder="Confirm Password"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                         <div className="rounded-md bg-red-50 dark:bg-red-900 p-3">
                            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                             className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 dark:focus:ring-offset-gray-800"
                        >
                             {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </div>
                    <div className="text-sm text-center">
                         <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
                         <Link to="/login" className="font-medium text-primary hover:text-primary-dark hover:underline">
                             Login here
                         </Link>
                     </div>
                </form>
            </div>
             {/* Add CSS in index.css or here for the .input-field class if needed */}
             <style jsx global>{`
                .input-field {
                    appearance: none;
                    position: relative;
                    display: block;
                    width: 100%;
                    border-radius: 0.375rem; /* rounded-md */
                    padding-top: 0.625rem; /* py-2.5 */
                    padding-bottom: 0.625rem; /* py-2.5 */
                    padding-right: 0.75rem; /* px-3 */
                    border-width: 1px;
                    /* Tailwind colors */
                    border-color: #D1D5DB; /* gray-300 */
                    color: #111827; /* gray-900 */
                    background-color: #ffffff; /* white */
                 }
                 .dark .input-field {
                    border-color: #4B5563; /* dark:border-gray-600 */
                    color: #ffffff; /* dark:text-white */
                    background-color: #374151; /* dark:bg-gray-700 */
                 }
                 .input-field::placeholder {
                     color: #6B7280; /* placeholder-gray-500 */
                 }
                  .dark .input-field::placeholder {
                     color: #9CA3AF; /* dark:placeholder-gray-400 */
                 }
                .input-field:focus {
                    outline: none;
                    /* Tailwind primary color focus ring */
                    --tw-ring-color: var(--color-primary, #06b6d4); /* Use CSS variable from theme or fallback */
                    box-shadow: 0 0 0 2px var(--tw-ring-color);
                     border-color: var(--tw-ring-color); /* focus:border-primary */
                    z-index: 10;
                }
             `}</style>
        </div>
    );
}

export default RegisterPage;