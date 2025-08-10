import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="w-12 h-12 border-4 border-blue-550 dark:border-blue-450 rounded-full border-t-transparent dark:border-t-transparent animate-spin shadow-lg"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/auth/login" replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;