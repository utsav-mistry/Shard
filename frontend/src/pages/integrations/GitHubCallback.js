import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const GitHubCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Processing GitHub authentication...');

    useEffect(() => {
        const { code, state, error } = Object.fromEntries([...searchParams]);
        
        if (error) {
            setStatus('error');
            setMessage(getErrorMessage(error));
            setTimeout(() => navigate('/app/integrations/github'), 3000);
            return;
        }

        // The backend will handle the OAuth flow and redirect back to the integrations page
        // We just need to show a loading state and let the backend handle the rest
        const frontendUrl = window.location.origin;
        window.location.href = `/api/integrations/github/callback?${searchParams.toString()}`;
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
        <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
            {/* Grid background */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(to right, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px),
                        repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px)
                    `,
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px),
                        repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px)
                    `,
                }}
            />

            <div className="relative z-10 text-center max-w-lg mx-auto px-8">
                {status === 'processing' && (
                    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] p-12">
                        <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-blue-500" />
                        <h2 className="text-3xl font-extrabold mb-4 text-black dark:text-white">Connecting GitHub</h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 shadow-[-6px_6px_0_rgba(34,197,94,0.8)] dark:shadow-[-6px_6px_0_rgba(34,197,94,0.3)] p-12">
                        <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500" />
                        <h2 className="text-3xl font-extrabold mb-4 text-green-600 dark:text-green-400">
                            Success!
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 shadow-[-6px_6px_0_rgba(239,68,68,0.8)] dark:shadow-[-6px_6px_0_rgba(239,68,68,0.3)] p-12">
                        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
                        <h2 className="text-3xl font-extrabold mb-4 text-red-600 dark:text-red-400">
                            Authentication Failed
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 font-medium mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/app/integrations/github')}
                            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white font-bold hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-[-3px_3px_0_rgba(0,0,0,0.3)] dark:shadow-[-3px_3px_0_rgba(255,255,255,0.3)]"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GitHubCallback;
