import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/axiosConfig';
import { AlertTriangle, Search, Filter, Clock, Download, ChevronDown, RefreshCw } from 'lucide-react';
import PageTemplate from '../../components/layout/PageTemplate';

const LogsList = () => {
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [projectFilter, setProjectFilter] = useState('all');
    const [deploymentFilter, setDeploymentFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all data in parallel using unified API utility
                const [logsResponse, projectsResponse, deploymentsResponse] = await Promise.all([
                    api.get('/logs'),
                    api.get('/projects'),
                    api.get('/deploy')
                ]);

                setLogs(logsResponse.data);
                setProjects(projectsResponse.data);
                setDeployments(deploymentsResponse.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching logs:', err);
                setError('Failed to load logs');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper function to get project name by ID
    const getProjectName = (projectId) => {
        const project = projects.find(p => p._id === projectId);
        return project ? project.name : 'Unknown Project';
    };


    // Helper function to get log type badge
    const getLogTypeBadge = (type) => {
        switch (type) {
            case 'setup':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Setup
                    </span>
                );
            case 'config':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Config
                    </span>
                );
            case 'deploy':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        Deploy
                    </span>
                );
            case 'runtime':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Runtime
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Error
                    </span>
                );
            case 'complete':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Complete
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {type}
                    </span>
                );
        }
    };

    // Filter logs based on search term and filters
    const filteredLogs = logs.filter(log => {
        // Search term filter
        const matchesSearch = log.content.toLowerCase().includes(searchTerm.toLowerCase());

        // Project filter
        const matchesProject = projectFilter === 'all' || log.projectId === projectFilter;

        // Deployment filter
        const matchesDeployment = deploymentFilter === 'all' || log.deploymentId === deploymentFilter;

        // Type filter
        const matchesType = typeFilter === 'all' || log.type === typeFilter;

        // Date filter
        let matchesDate = true;
        const logDate = new Date(log.createdAt);
        const now = new Date();

        if (dateFilter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            matchesDate = logDate >= today;
        } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            matchesDate = logDate >= yesterday && logDate < today;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            matchesDate = logDate >= weekAgo;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            matchesDate = logDate >= monthAgo;
        }

        return matchesSearch && matchesProject && matchesDeployment && matchesType && matchesDate;
    });

    // Download logs as text file
    const downloadLogs = () => {
        if (!filteredLogs.length) return;

        const logText = filteredLogs.map(log => {
            const timestamp = new Date(log.createdAt).toISOString();
            const projectName = getProjectName(log.projectId);
            return `[${timestamp}] [${log.type.toUpperCase()}] [${projectName}] ${log.content}`;
        }).join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shard-logs-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <PageTemplate title="Loading Logs...">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </PageTemplate>
        );
    }

    if (error) {
        return (
            <PageTemplate title="Error">
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading logs</h3>
                        <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <RefreshCw className="mr-1.5 h-3 w-3" />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate title="Logs">
            <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black-900 dark:text-white-100">
                {/* Subtle grid background */}
                <div className="absolute inset-0 -z-10 overflow-hidden opacity-10 dark:opacity-5">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoIGQ9Ik0zMCAxMGMxMS4wNDYgMCAyMCA4Ljk1NCAyMCAyMHMtOC45NTQgMjAtMjAgMjBzLTIwLTguOTU0LTIwLTIwIDguOTU0LTIwIDIwLTIweiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIC8+Cjwvc3ZnPg==')] dark:invert"></div>
                </div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            View and manage your application logs
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex space-x-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <button
                            onClick={downloadLogs}
                            disabled={filteredLogs.length === 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download Logs
                        </button>
                    </div>
                </motion.div>

                {/* Search and filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white dark:bg-black-800/50 shadow-sm rounded-xl p-6 mb-8 border-2 border-black-900/10 dark:border-white/10 backdrop-blur-sm"
                >
                    <div className="flex flex-col space-y-6">
                        {/* Search */}
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Advanced filters */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                            >
                                {/* Project filter */}
                                <div>
                                    <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Project
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="project-filter"
                                            value={projectFilter}
                                            onChange={(e) => setProjectFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-transparent rounded-xl text-sm transition-all duration-200 cursor-pointer appearance-none"
                                            style={{
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                textIndent: '1px',
                                                textOverflow: ''
                                            }}
                                        >
                                            <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Projects</option>
                                            {projects.map(project => (
                                                <option key={project._id} value={project._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Deployment filter */}
                                <div>
                                    <label htmlFor="deployment-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Deployment
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="deployment-filter"
                                            value={deploymentFilter}
                                            onChange={(e) => setDeploymentFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-transparent rounded-xl text-sm transition-all duration-200 cursor-pointer appearance-none"
                                            style={{
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                textIndent: '1px',
                                                textOverflow: ''
                                            }}
                                        >
                                            <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Deployments</option>
                                            {deployments.map(deployment => (
                                                <option key={deployment._id} value={deployment._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                                    {deployment.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Log type filter */}
                                <div>
                                    <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Log Type
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="type-filter"
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-transparent rounded-xl text-sm transition-all duration-200 cursor-pointer appearance-none"
                                            style={{
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                textIndent: '1px',
                                                textOverflow: ''
                                            }}
                                        >
                                            <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Types</option>
                                            <option value="setup" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Setup</option>
                                            <option value="config" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Config</option>
                                            <option value="deploy" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Deploy</option>
                                            <option value="runtime" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Runtime</option>
                                            <option value="error" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Error</option>
                                            <option value="complete" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Complete</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Date filter */}
                                <div>
                                    <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date Range
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="date-filter"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="block w-full pl-3 pr-10 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-transparent rounded-xl text-sm transition-all duration-200 cursor-pointer appearance-none"
                                            style={{
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none',
                                                textIndent: '1px',
                                                textOverflow: ''
                                            }}
                                        >
                                            <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">All Time</option>
                                            <option value="today" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Today</option>
                                            <option value="yesterday" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Yesterday</option>
                                            <option value="week" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Last 7 Days</option>
                                            <option value="month" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Last 30 Days</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Logs list */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 shadow-sm rounded-xl overflow-hidden"
                >
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                                <AlertTriangle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No logs found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm || projectFilter !== 'all' || deploymentFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'No logs have been recorded yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[600px]">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-750">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Message
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    <Link
                                                        to={`/projects/${log.projectId}`}
                                                        className="hover:text-indigo-600 dark:hover:text-indigo-400"
                                                    >
                                                        {getProjectName(log.projectId)}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getLogTypeBadge(log.type)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                {log.content}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                                {/* Actions */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </PageTemplate>
    );
};

export default LogsList;