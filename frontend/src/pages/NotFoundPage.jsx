import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-extrabold text-gray-800">404</h1>
      <p className="mt-4 text-2xl text-gray-600">
        Whoops! Looks like you've ventured into uncharted territory.
      </p>
      <p className="mt-2 text-gray-500">
        The page you’re looking for doesn’t exist. It might have been moved or deleted.
      </p>
      <Link 
        to="/" 
        className="mt-6 px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition-colors duration-200"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
