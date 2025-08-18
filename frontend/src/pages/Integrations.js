import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, ExternalLink, Loader2, AlertCircle, CheckCircle, Plus, Settings } from 'lucide-react';
import api from '../utils/axiosConfig';

const Integrations = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [githubConnected, setGithubConnected] = useState(false);
    const [githubUser, setGithubUser] = useState(null);

    useEffect(() => {
        checkIntegrations();
        
        // Check for GitHub connection success from URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('github_connected') === 'true') {
            setGithubConnected(true);
            checkIntegrations(); // Refresh status
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const checkIntegrations = async () => {
        try {
            // Check GitHub integration status
            const response = await api.get('/api/integrations/github/status');
            const status = response.data?.data;
            if (status?.connected) {
                setGithubConnected(true);
                setGithubUser({
                    username: status.username,
                    avatar: status.avatar
                });
            }
        } catch (error) {
            console.error('Failed to check integrations:', error);
        }
    };

    const connectGitHub = async () => {
        setLoading(true);
        try {
            // Get GitHub integration URL from backend
            const response = await api.get('/api/integrations/github/connect');
            if (response.data?.data?.authUrl) {
                window.location.href = response.data.data.authUrl;
            } else {
                throw new Error('Failed to get GitHub integration URL');
            }
        } catch (error) {
            console.error('GitHub integration failed:', error);
            setLoading(false);
        }
    };

    const integrations = [
        {
            id: 'github',
            name: 'GitHub',
            description: 'Import repositories and deploy your code',
            icon: Github,
            connected: githubConnected,
            user: githubUser,
            connectAction: connectGitHub,
            manageAction: () => navigate('/app/integrations'),
            features: ['Repository import', 'Manual deployments', 'Branch protection']
        }
        // Future integrations can be added here
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-2">Integrations</h1>
                    <p className="text-lg text-black-600 dark:text-white-400">
                        Connect your favorite tools and services to streamline your workflow
                    </p>
                </div>

                {/* Integrations Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {integrations.map((integration) => {
                        const Icon = integration.icon;
                        return (
                            <div
                                key={integration.id}
                                className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                {/* Integration Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                                            <Icon className="w-5 h-5 text-white-100 dark:text-black-900" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-black-900 dark:text-white-100">
                                                {integration.name}
                                            </h3>
                                            {integration.connected && integration.user ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {integration.user.avatar && (
                                                        <img 
                                                            src={integration.user.avatar} 
                                                            alt="Avatar"
                                                            className="w-4 h-4 rounded-full"
                                                        />
                                                    )}
                                                    <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                                                        @{integration.user.username}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-black-500 dark:text-white-500 font-medium">
                                                    Not connected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge */}
                                    <div className={`px-2 py-1 rounded-none text-xs font-bold border-2 ${
                                        integration.connected 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-600 dark:border-green-400'
                                            : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-600 dark:border-gray-400'
                                    }`}>
                                        {integration.connected ? 'Connected' : 'Available'}
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-black-600 dark:text-white-400 mb-4 font-medium">
                                    {integration.description}
                                </p>

                                {/* Features */}
                                <ul className="space-y-1 mb-6">
                                    {integration.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-xs font-medium">
                                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            <span className="text-black-600 dark:text-white-400">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {integration.connected ? (
                                        <>
                                            <button
                                                onClick={integration.manageAction}
                                                className="group relative flex-1 px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none font-bold transition-all duration-200 text-sm overflow-hidden"
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    <Settings className="w-3 h-3" />
                                                    Manage
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => navigate('/app/projects/import')}
                                                className="group relative flex-1 px-3 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 bg-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 rounded-none font-bold transition-all duration-200 text-sm"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    <ExternalLink className="w-3 h-3" />
                                                    Use
                                                </span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={integration.connectAction}
                                            disabled={loading}
                                            className="group relative w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none font-bold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {loading ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Plus className="w-3 h-3" />
                                                )}
                                                Connect
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Coming Soon Card */}
                    <div className="bg-white-100 dark:bg-black-700 border-2 border-dashed border-black-400 dark:border-white-400 rounded-none p-6 opacity-60">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-black-400 dark:bg-white-400 rounded-none flex items-center justify-center border-2 border-black-400 dark:border-white-400 mx-auto mb-3">
                                <Plus className="w-5 h-5 text-white-100 dark:text-black-900" />
                            </div>
                            <h3 className="text-lg font-bold text-black-600 dark:text-white-400 mb-2">
                                More Coming Soon
                            </h3>
                            <p className="text-sm text-black-500 dark:text-white-500 font-medium">
                                GitLab, Bitbucket, and more integrations are on the way
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {githubConnected && (
                    <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-400 rounded-none">
                        <h3 className="text-xl font-bold mb-3 text-blue-800 dark:text-blue-200">
                            Quick Actions
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/app/projects/import')}
                                className="group relative p-4 border-2 border-blue-600 bg-blue-600 text-white-100 hover:text-blue-600 rounded-none font-bold transition-all duration-200 text-left overflow-hidden"
                            >
                                <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                <span className="relative z-10 flex items-center gap-3">
                                    <ExternalLink className="w-5 h-5" />
                                    <div>
                                        <div className="font-bold">Import Repository</div>
                                        <div className="text-sm opacity-80">Browse your GitHub repos</div>
                                    </div>
                                </span>
                            </button>
                            
                            <button
                                onClick={() => navigate('/app/projects/new')}
                                className="group relative p-4 border-2 border-blue-600 text-blue-600 bg-white-100 dark:bg-black-900 hover:bg-blue-600 hover:text-white-100 rounded-none font-bold transition-all duration-200 text-left"
                            >
                                <span className="flex items-center gap-3">
                                    <Github className="w-5 h-5" />
                                    <div>
                                        <div className="font-bold">New Project</div>
                                        <div className="text-sm opacity-80">Create from GitHub</div>
                                    </div>
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Integrations;
