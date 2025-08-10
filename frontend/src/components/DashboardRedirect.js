import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardRedirect = () => {
  const { currentUser, loading } = useAuth();

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="w-12 h-12 border-4 border-blue-550 dark:border-blue-450 rounded-full border-t-transparent dark:border-t-transparent animate-spin shadow-lg"></div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard, otherwise to landing page
  return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />;
};

export default DashboardRedirect;