import axios from 'axios';

const axiosInstance = axios.create({
    // Use environment variable for the base URL
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', //Development URL
    timeout: 80000, // Set 80 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor to include the token in the headers if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // Get the token from local storage or any other storage you use
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Set the token in the headers
        }
        return config; // Return the modified config
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally 
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., logout the user, redirect to login)
            console.error('Unauthorized access -logging out');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Redirect to login page
        }
        return Promise.reject(error); // Reject the promise with the error
    }
);

export default axiosInstance;
// This axios instance can be imported and used in other files 