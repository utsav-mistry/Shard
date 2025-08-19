import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const TokenCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');

    const handle = async () => {
      try {
        if (!token) throw new Error('Missing token');
        // Log in with token; user will be fetched/normalized by app flows after login
        loginWithToken(token, {});
        // Quick redirect; role-based redirect will occur once user profile is loaded, default to /app
        setTimeout(() => {
          window.location.href = '/app';
        }, 100);
      } catch (err) {
        console.error('Token callback error:', err);
        setError(err.message || 'Authentication failed.');
        setTimeout(() => navigate('/auth/login'), 2000);
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, [searchParams, navigate, loginWithToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white-100 dark:bg-black-900 p-4">
        <div className="text-center">
          <h2 className=" text-xl font-bold text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
          <p className="text-black-700 dark:text-white-300 mb-6">{error}</p>
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

export default TokenCallback;
