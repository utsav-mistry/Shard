import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const GitHubCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Processing GitHub authentication...');

    useEffect(() => {
        const handleCallback = async () => {
            const state = searchParams.get('state');
            const success = searchParams.get('success');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage(getErrorMessage(error));
                setTimeout(() => navigate('/app/integrations/github'), 3000);
                return;
            }

            if (success && state) {
                setStatus('success');
                setMessage('GitHub connected successfully! Redirecting...');
                setTimeout(() => navigate('/app/integrations/github'), 2000);
                return;
            }

            // If no clear success/error, assume error
            setStatus('error');
            setMessage('Invalid authentication response');
            setTimeout(() => navigate('/app/integrations/github'), 3000);
        };

        handleCallback();
    }, [searchParams, navigate]);

    const getErrorMessage = (error) => {
        switch (error) {
            case 'invalid_state':
                return 'Invalid authentication state. Please try again.';
            case 'auth_failed':
                return 'GitHub authentication failed. Please try again.';
            case 'access_denied':
                return 'Access denied. Please grant permissions to continue.';
            default:
                return 'Authentication failed. Please try again.';
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
                        <h2 className="text-xl font-bold mb-2">Connecting GitHub</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <h2 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">
                            Success!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                        <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                        <button
                            onClick={() => navigate('/app/integrations/github')}
                            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:scale-[1.02] active:scale-95 transition-all duration-200"
                        >
                            Try Again
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default GitHubCallback;
