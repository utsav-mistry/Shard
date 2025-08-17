import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthRedirect = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (currentUser) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/app" replace />;
    }
  }

  // Render children if not authenticated
  return children;
};

export default AuthRedirect;
