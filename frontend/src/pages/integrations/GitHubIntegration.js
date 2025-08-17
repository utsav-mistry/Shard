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
            const response = await api.get('/auth/profile');
            const user = response.data?.data?.user || response.data?.user;
            if (user?.githubUsername) {
                setIsConnected(true);
                setGithubUser({
                    username: user.githubUsername,
                    avatar: user.avatar
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
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }
            
            // Generate a unique state
            const state = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
            
            // Store the token in cache with the state
            try {
                // Save state with token for verification
                await api.post('/api/cache/set', {
                    key: `github:state:${state}`,
                    value: JSON.stringify({ 
                        token,
                        timestamp: Date.now()
                    }),
                    ttl: 600 // 10 minutes
                });
                
                // Get the base URL from environment variables or use the current origin
                const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                
                // Redirect to GitHub OAuth with the correct backend URL and state
                window.location.href = `${backendUrl}/api/github/auth?state=${encodeURIComponent(state)}`;
                
            } catch (cacheError) {
                console.error('Failed to cache state:', cacheError);
                // Fallback to simple state parameter with token
                const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const state = btoa(JSON.stringify({ 
                    token,
                    timestamp: Date.now()
                }));
                window.location.href = `${backendUrl}/api/github/auth?state=${encodeURIComponent(state)}`;
            }
        } catch (error) {
            console.error('GitHub connection error:', error);
            setError('Failed to initiate GitHub connection: ' + (error.message || 'Unknown error'));
            setLoading(false);
        }
    };

    const disconnectGitHub = async () => {
        try {
            await api.post('/auth/disconnect-github', {});
            setIsConnected(false);
            setGithubUser(null);
            setSuccess('GitHub disconnected successfully');
        } catch (error) {
            setError('Failed to disconnect GitHub');
        }
    };

    const fetchRepos = async () => {
        try {
            const res = await api.get('/github/repos');
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
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-2">GitHub Integration</h1>
                    <p className="text-lg text-black-600 dark:text-white-400">
                        Connect your GitHub account to import and deploy repositories
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 rounded-none flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 rounded-none flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-800 dark:text-green-200 font-medium">{success}</span>
                    </div>
                )}

                {/* Integration Status */}
                {isConnected ? (
                    <div className="space-y-6">
                        {/* Connected Account Card */}
                        <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                                        <Github className="w-6 h-6 text-white-100 dark:text-black-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-black-900 dark:text-white-100">GitHub</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {githubUser?.avatar && (
                                                <img 
                                                    src={githubUser.avatar} 
                                                    alt="GitHub Avatar"
                                                    className="w-5 h-5 rounded-full"
                                                />
                                            )}
                                            <span className="text-green-600 dark:text-green-400 font-bold">
                                                Connected as @{githubUser?.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={disconnectGitHub}
                                    className="group relative px-4 py-2 border-2 border-red-600 text-red-600 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900 rounded-none font-bold transition-all duration-200 overflow-hidden"
                                >
                                    <span className="absolute inset-0 w-full h-full bg-red-600 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                    <span className="relative z-10">
                                        Disconnect
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/app/projects/import')}
                                className="group relative p-6 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-700 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 text-left overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ExternalLink className="w-5 h-5" />
                                        <h3 className="text-lg font-bold">Import Repository</h3>
                                    </div>
                                    <p className="text-sm font-medium opacity-80">
                                        Browse and import your GitHub repositories
                                    </p>
                                </div>
                            </button>
                            
                            <button
                                onClick={() => navigate('/app/projects/new')}
                                className="group relative p-6 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-700 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 text-left overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Github className="w-5 h-5" />
                                        <h3 className="text-lg font-bold">New Project</h3>
                                    </div>
                                    <p className="text-sm font-medium opacity-80">
                                        Create a new project from GitHub
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6 mb-8 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                                    <Github className="w-6 h-6 text-white-100 dark:text-black-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-black-900 dark:text-white-100">GitHub</h3>
                                    <p className="text-black-600 dark:text-white-400 font-medium">
                                        Not connected
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={connectGitHub}
                                disabled={loading}
                                className="group relative px-6 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Github className="w-4 h-4" />
                                )}
                                Connect GitHub
                            </button>
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-700 shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-3">Repository Import</h3>
                        <p className="text-black-600 dark:text-white-400 mb-4 font-medium">
                            Browse and import your GitHub repositories with one click
                        </p>
                        <ul className="space-y-2 text-sm font-medium">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Access public and private repositories
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Automatic framework detection
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Branch and commit selection
                            </li>
                        </ul>
                    </div>

                    <div className="p-6 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-700 shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-3">Automated Deployment</h3>
                        <p className="text-black-600 dark:text-white-400 mb-4 font-medium">
                            Deploy your projects with AI-powered code review
                        </p>
                        <ul className="space-y-2 text-sm font-medium">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                AI code quality analysis
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Custom domain assignment
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Real-time deployment logs
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GitHubIntegration;
