import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GitHubCallback = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGitHubCallback = async () => {
      try {
        // Extract the code from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');

        if (!code) {
          setError('No authorization code received from GitHub');
          setLoading(false);
          return;
        }

        // Process the GitHub login with the code
        await loginWithGithub(code);
        // Redirect happens in the auth context after successful login
      } catch (err) {
        console.error('GitHub login error:', err);
        setError('Failed to authenticate with GitHub. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleGitHubCallback();
  }, [location, loginWithGithub, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-blue-550 border-r-blue-550 border-b-transparent border-l-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="text-gray-700 dark:text-gray-300">Authenticating with GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-900 p-4">
        <div className="bg-white dark:bg-dark-200 shadow-lg rounded-lg p-6 max-w-md w-full border-0">
          <div className="text-red-600 dark:text-red-400 text-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Authentication Error</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/auth/login')}
              className="px-4 py-2.5 bg-blue-550 hover:bg-blue-650 dark:bg-blue-550 dark:hover:bg-blue-650 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-450 dark:focus:ring-blue-550 border-0 shadow-sm transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // This should not be rendered as we redirect on success
};

export default GitHubCallback;