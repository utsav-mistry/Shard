import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '../../utils/axiosConfig';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      setTimeout(() => navigate('/auth/login'), 3000);
      return;
    }

    const handleOAuthCallback = async () => {
      try {
        if (!code || !provider) {
          throw new Error('Missing authorization code or provider');
        }

        // Send code to backend for processing
        const response = await api.post(`/auth/${provider}/callback`, { code });
        
        if (response.data?.data?.token && response.data?.data?.user) {
          const { token, user } = response.data.data;
          
          // Normalize user data
          const userWithRole = {
            ...user,
            name: user.name || user.username || user.displayName || user.email?.split('@')[0] || 'User',
            role: user.role || 'user'
          };
          
          // Login with token
          loginWithToken(token, userWithRole);
          
          // Redirect based on role
          setTimeout(() => {
            if (userWithRole.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/app';
            }
          }, 100);
        } else {
          throw new Error('Invalid response from server');
        }
        
      } catch (err) {
        console.error(`${provider} OAuth error:`, err);
        setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-100 dark:bg-black-900 p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
          <p className="text-black-700 dark:text-white-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 rounded-none hover:bg-opacity-90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white-100 dark:bg-black-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-black-900 dark:text-white-100 animate-spin mx-auto mb-4" />
        <p className="text-black-900 dark:text-white-100">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
