import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Prepare for API calls

function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // useEffect(() => {
    //     const fetchTransactions = async () => {
    //         try {
    //             setLoading(true);
    //             setError('');
    //             // Add filtering parameters later: /transactions?page=1&limit=20 etc.
    //             const response = await axiosInstance.get('/transactions');
    //             setTransactions(response.data);
    //         } catch (err) {
    //             console.error("Error fetching transactions:", err);
    //             setError('Failed to load transactions. Please try again later.');
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchTransactions();
    // }, []); // Fetch transactions on mount

     useEffect(() => {
        // Placeholder data
         setTransactions([
             { id: 1, transaction_date: '2023-10-26', description: 'Groceries (Placeholder)', category_name: 'Groceries', account_name: 'Checking', type: 'expense', amount: 75.50 },
             { id: 2, transaction_date: '2023-10-25', description: 'Salary (Placeholder)', category_name: 'Salary', account_name: 'Checking', type: 'income', amount: 2500.00 },
             { id: 3, transaction_date: '2023-10-24', description: 'Dinner Out (Placeholder)', category_name: 'Dining Out', account_name: 'Checking', type: 'expense', amount: 45.00 },
         ]);
         setLoading(false);
    },[])


    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Transactions</h1>
                 {/* Add button to open 'Add Transaction' modal/form later */}
                 <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark">
                     Add Transaction
                 </button>
             </div>

             {/* Add Filtering/Search Controls Here Later */}
             <div className="mb-4 p-4 bg-gray-100 rounded">
                Filters (Placeholder)
             </div>


             {loading && <p>Loading transactions...</p>}
             {error && <p className="text-red-500">{error}</p>}

             {!loading && !error && (
                <div className="bg-white shadow rounded-lg overflow-x-auto">
                    {transactions.length === 0 ? (
                        <p className="p-4 text-gray-500">No transactions found.</p>
                    ) : (
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                     <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map(tx => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.transaction_date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.description || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.category_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.account_name}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                             {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                             {/* Add Edit/Delete buttons/icons later */}
                                             <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</a>
                                             <a href="#" className="text-red-600 hover:text-red-900">Delete</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                 </div>
             )}

             {/* Add Pagination Controls Here Later */}

        </div>
    );
}

export default TransactionsPage;