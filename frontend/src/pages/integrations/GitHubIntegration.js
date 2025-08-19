import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, ExternalLink, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';

const GitHubIntegration = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [githubUser, setGithubUser] = useState(null);

    useEffect(() => {
        // Check if user already has GitHub connected
        checkGitHubConnection();

        // Handle OAuth callback
        const error = searchParams.get('error');
        const success = searchParams.get('success');

        if (error) {
            setError(getErrorMessage(error));
        } else if (success) {
            setSuccess('GitHub connected successfully!');
            checkGitHubConnection();
        }
    }, [searchParams]);

    const checkGitHubConnection = async () => {
        try {
            const response = await api.get('/api/integrations/github/status');
            const status = response.data?.data;
            if (status?.connected) {
                setIsConnected(true);
                setGithubUser({
                    username: status.username,
                    avatar: status.avatar
                });
            } else {
                setIsConnected(false);
                setGithubUser(null);
            }
        } catch (error) {
            console.error('Failed to check GitHub connection:', error);
            setIsConnected(false);
            setGithubUser(null);
        }
    };

    const connectGitHub = async () => {
        setLoading(true);
        setError('');

        try {
            // Get the GitHub integration URL from the backend
            const response = await api.get('/api/integrations/github/connect');
            if (response.data?.data?.authUrl) {
                window.location.href = response.data.data.authUrl;
            } else {
                throw new Error('Failed to get GitHub integration URL');
            }
        } catch (error) {
            console.error('GitHub connection error:', error);
            setError('Failed to initiate GitHub connection: ' + (error.message || 'Unknown error'));
            setLoading(false);
        }
    };

    const disconnectGitHub = async () => {
        try {
            setLoading(true);
            setError('');
            await api.post('/api/integrations/github/disconnect', {});
            setIsConnected(false);
            setGithubUser(null);
            setSuccess('GitHub disconnected successfully');
            toast.success('GitHub disconnected successfully');
        } catch (error) {
            console.error('GitHub disconnect error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to disconnect GitHub';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const fetchRepos = async () => {
        try {
            const res = await api.get('/api/integrations/github/repositories');
            return res.data?.data || res.data; // support either shape
        } catch (e) {
            console.error('Failed to fetch repos:', e);
            setError('Failed to fetch GitHub repositories');
            return [];
        }
    };

    const getErrorMessage = (error) => {
        switch (error) {
            case 'invalid_state':
                return 'Invalid authentication state. Please try again.';
            case 'auth_failed':
                return 'GitHub authentication failed. Please try again.';
            default:
                return 'An error occurred during GitHub authentication.';
        }
    };

    return (
        <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white">
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

            {/* Reveal animation styles */}
            <style>{`
                [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms ease; }
                [data-reveal="true"] { opacity: 1; transform: translateY(0); }
            `}</style>

            <main className="relative z-10 px-10 py-16">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-extrabold text-black dark:text-white mb-4">GitHub Integration</h1>
                    <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                        Connect your GitHub account to import and deploy repositories
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 shadow-[-6px_6px_0_rgba(239,68,68,0.8)] dark:shadow-[-6px_6px_0_rgba(239,68,68,0.3)] flex items-center gap-4">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <span className="text-red-800 dark:text-red-200 font-bold">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 shadow-[-6px_6px_0_rgba(34,197,94,0.8)] dark:shadow-[-6px_6px_0_rgba(34,197,94,0.3)] flex items-center gap-4">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <span className="text-green-800 dark:text-green-200 font-bold">{success}</span>
                    </div>
                )}

                {/* Integration Status */}
                {isConnected ? (
                    <div className="space-y-6">
                        {/* Connected Account Card */}
                        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] p-8 hover:-translate-y-1 transition-transform">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-black dark:bg-white flex items-center justify-center border-2 border-black dark:border-white">
                                        <Github className="w-8 h-8 text-white dark:text-black" />
                                    </div>
                                    <div>
                                        <h3 className=" text-xl font-extrabold text-black dark:text-white mb-2">GitHub</h3>
                                        <div className="flex items-center gap-3">
                                            {githubUser?.avatar && (
                                                <img
                                                    src={githubUser.avatar}
                                                    alt="GitHub Avatar"
                                                    className="w-6 h-6 border-2 border-black dark:border-white"
                                                />
                                            )}
                                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                                                Connected as @{githubUser?.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={disconnectGitHub}
                                    className="group relative px-6 py-3 border-2 border-red-600 text-red-600 bg-white dark:bg-black hover:text-white dark:hover:text-black font-bold transition-all duration-200 overflow-hidden"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-red-600 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                    <span className="relative z-10">
                                        Disconnect
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <button
                                onClick={() => navigate('/app/projects/import')}
                                className="group relative p-8 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 text-left overflow-hidden shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black dark:bg-white transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <ExternalLink className="w-6 h-6" />
                                        <h3 className="text-xl font-extrabold">Import Repository</h3>
                                    </div>
                                    <p className="text-base font-medium opacity-80">
                                        Browse and import your GitHub repositories
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/app/projects/new')}
                                className="group relative p-8 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 text-left overflow-hidden shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black dark:bg-white transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-3">
                                        <Github className="w-6 h-6" />
                                        <h3 className="text-xl font-extrabold">New Project</h3>
                                    </div>
                                    <p className="text-base font-medium opacity-80">
                                        Create a new project from GitHub
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] p-8 mb-8 hover:-translate-y-1 transition-transform">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-black dark:bg-white flex items-center justify-center border-2 border-black dark:border-white">
                                    <Github className="w-8 h-8 text-white dark:text-black" />
                                </div>
                                <div>
                                    <h3 className=" text-xl font-extrabold text-black dark:text-white mb-1">GitHub</h3>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">
                                        Not connected
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={connectGitHub}
                                disabled={loading}
                                className="group relative px-8 py-3 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-bold transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hover:scale-[1.02] active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Github className="w-5 h-5" />
                                )}
                                Connect GitHub
                            </button>
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-transform">
                        <h3 className=" text-xl font-extrabold text-black dark:text-white mb-4">Repository Import</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 font-medium text-base">
                            Browse and import your GitHub repositories with one click
                        </p>
                        <ul className="space-y-3 text-base font-medium">
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                Access public and private repositories
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                Automatic framework detection
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                Branch and commit selection
                            </li>
                        </ul>
                    </div>

                    <div className="p-8 border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-transform">
                        <h3 className=" text-xl font-extrabold text-black dark:text-white mb-4">Manual Deployment</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 font-medium text-base">
                            Deploy your projects manually with AI-powered code review
                        </p>
                        <ul className="space-y-3 text-base font-medium">
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                AI code quality analysis
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                Custom domain assignment
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                Real-time deployment logs
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GitHubIntegration;
