import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, Search, Filter, Clock, Download } from 'lucide-react';

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
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        View and search logs across all projects and deployments
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                        <Filter className="-ml-0.5 mr-2 h-4 w-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <button
                        onClick={downloadLogs}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                        disabled={filteredLogs.length === 0}
                    >
                        <Download className="-ml-0.5 mr-2 h-4 w-4" />
                        Download
                    </button>
                </div>
            </div>

            {/* Search and filters */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
                <div className="flex flex-col space-y-4">
                    {/* Search */}
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
                            placeholder="Search logs by content"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Advanced filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Project filter */}
                            <div>
                                <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Project
                                </label>
                                <select
                                    id="project-filter"
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Projects</option>
                                    {projects.map(project => (
                                        <option key={project._id} value={project._id}>{project.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Deployment filter */}
                            <div>
                                <label htmlFor="deployment-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Deployment
                                </label>
                                <select
                                    id="deployment-filter"
                                    value={deploymentFilter}
                                    onChange={(e) => setDeploymentFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Deployments</option>
                                    {deployments.map(deployment => (
                                        <option key={deployment._id} value={deployment._id}>
                                            {getProjectName(deployment.projectId)} - {new Date(deployment.createdAt).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Log type filter */}
                            <div>
                                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Log Type
                                </label>
                                <select
                                    id="type-filter"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Types</option>
                                    <option value="setup">Setup</option>
                                    <option value="config">Config</option>
                                    <option value="deploy">Deploy</option>
                                    <option value="runtime">Runtime</option>
                                    <option value="error">Error</option>
                                    <option value="complete">Complete</option>
                                </select>
                            </div>

                            {/* Date filter */}
                            <div>
                                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date Range
                                </label>
                                <select
                                    id="date-filter"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">Last 30 Days</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Logs list */}
            {filteredLogs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
                        <Clock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No logs found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Try adjusting your filters or search term
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                            Logs
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {filteredLogs.length} entries
                        </span>
                    </div>

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
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
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
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                                                {log.content}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/deployments/${log.deploymentId}/logs`}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                View All
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsList;