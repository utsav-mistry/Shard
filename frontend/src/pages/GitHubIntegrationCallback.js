import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/axiosConfig';

const GitHubIntegrationCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting to GitHub...');
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('GitHub integration was cancelled or failed.');
      setTimeout(() => navigate('/app/integrations'), 3000);
      return;
    }

    const handleIntegrationCallback = async () => {
      try {
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Send code to backend for GitHub integration
        const response = await api.post('/integrations/github/callback', { 
          code, 
          state 
        });
        
        if (response.data?.data?.connected) {
          setStatus('success');
          setMessage('GitHub integration successful! Redirecting...');
          setTimeout(() => navigate('/app/integrations'), 2000);
        } else {
          throw new Error('Integration failed');
        }
        
      } catch (err) {
        console.error('GitHub integration error:', err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'GitHub integration failed. Please try again.');
        setTimeout(() => navigate('/app/integrations'), 3000);
      }
    };

    handleIntegrationCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-8 text-center">
          <div className="mb-6">
            {status === 'processing' && (
              <Loader2 className="w-12 h-12 mx-auto text-black dark:text-white animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 mx-auto text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
            GitHub Integration
          </h1>
          
          <p className="text-black dark:text-white mb-6">
            {message}
          </p>
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/app/integrations')}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 border-2 border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
            >
              Return to Integrations
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegrationCallback;
