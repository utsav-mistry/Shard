import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Server,
  AlertTriangle,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  Zap,
  ExternalLink
} from 'lucide-react';
import useDeployments from '../../hooks/useDeployments';
import useProjects from '../../hooks/useProjects';
import PageTemplate from '../../components/layout/PageTemplate';

// Helper function to get deployment URL
const getDeploymentUrl = (subdomain) => {
  if (!subdomain) return '';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';

  // Check if we're in development
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    // For local development, use the current host with the subdomain as a path
    return `${protocol}//${hostname}${port}/${subdomain}`;
  }

  // For production, use subdomain as a subdomain
  return `${protocol}//${subdomain}.${hostname}${port}`;
};

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid date';
  }
};

const DeploymentsList = () => {
  const navigate = useNavigate();
  const { deployments, loading, error, refresh } = useDeployments();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
      // Using native alert for simplicity
      alert('Deployments refreshed successfully');
    } catch (err) {
      console.error('Error refreshing deployments:', err);
      alert(`Failed to refresh deployments: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show error alert when there's an error
  useEffect(() => {
    if (error) {
      console.error('Error loading deployments:', error);
    }
    if (projectsError) {
      console.error('Error loading projects:', projectsError);
    }
  }, [error, projectsError]);

  // Helper function to get project name by ID with error handling
  const getProjectName = (projectId) => {
    if (!projectId) return 'Unknown Project';
    const project = projects.find(p => p && p._id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Format date consistently
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";

    switch (status?.toLowerCase()) {
      case 'pending':
      case 'deploying':
        return (
          <span className={`${baseClasses} bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`}>
            <Clock className="w-3 h-3 mr-1.5" />
            {status}
          </span>
        );
      case 'running':
      case 'active':
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`}>
            <Zap className="w-3 h-3 mr-1.5" />
            {status}
          </span>
        );
      case 'success':
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400`}>
            <CheckCircle className="w-3 h-3 mr-1.5" />
            {status}
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className={`${baseClasses} bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400`}>
            <XCircle className="w-3 h-3 mr-1.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-800 dark:text-white-100 border-black-900 dark:border-white-100`}>
            {status}
          </span>
        );
    }
  };

  // Filter deployments based on search term and status filter
  const filteredDeployments = deployments.filter(deployment => {
    const projectName = getProjectName(deployment.projectId).toLowerCase();
    const matchesSearch = projectName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || projectsLoading) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center h-64">
        </div>
      </PageTemplate>
    );
  }

  if (error || projectsError) {
    return (
      <PageTemplate>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading deployments
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error || projectsError || 'An unknown error occurred'}
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2">
          <div>
            <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">Deployments</h1>
            <p className="mt-2 text-base text-black-600 dark:text-white-400">
              Manage your deployments
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
            <Link
              to="/deploy/new"
              className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100 hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Deployment
              </span>
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border-2 border-black-900 dark:border-white-100 bg-transparent text-black-900 dark:text-white-100 placeholder-black-600 dark:placeholder-white-400 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 sm:text-sm"
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="status-filter" className="text-sm font-medium text-black-900 dark:text-white-100 mr-2">
              Status:
            </label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-2 border-black-900 dark:border-white-100 bg-white dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 sm:text-sm appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="bg-white dark:bg-black-900 text-black-900 dark:text-white-100">All</option>
              <option value="success" className="bg-white dark:bg-black-900 text-black-900 dark:text-white-100">Success</option>
              <option value="failed" className="bg-white dark:bg-black-900 text-black-900 dark:text-white-100">Failed</option>
              <option value="pending" className="bg-white dark:bg-black-900 text-black-900 dark:text-white-100">Pending</option>
              <option value="deploying" className="bg-white dark:bg-black-900 text-black-900 dark:text-white-100">Deploying</option>
            </select>
          </div>
        </div>

        {/* Deployments Table */}
        {filteredDeployments.length === 0 ? (
          <div className="text-center py-12">
            <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-black-900 dark:text-white-100 mb-1">No deployments found</h3>
            <p className="text-black-600 dark:text-white-400 max-w-md mx-auto mb-6">
              Get started by creating a new deployment.
            </p>
            <Link
              to="/deploy/new"
              className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 font-medium hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-colors duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                New Deployment
              </span>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden border-2 border-black-900 dark:border-white-100">
            <table className="min-w-full divide-y divide-black-900/10 dark:divide-white-100/10">
              <thead className="bg-black-900/5 dark:bg-white-100/5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-black-900 divide-y divide-black-900/10 dark:divide-white-100/10">
                {filteredDeployments.map((deployment) => {
                  const project = projects.find(p => p._id === deployment.projectId) || {};
                  return (
                    <tr
                      key={deployment._id}
                      className="group hover:bg-black-900/5 dark:hover:bg-white-100/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/deployments/${deployment._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                            <Server className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-black-900 dark:text-white-100">
                              {project.name || 'Unknown Project'}
                            </div>
                            {project.subdomain && (
                              <a
                                href={getDeploymentUrl(project.subdomain)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getDeploymentUrl(project.subdomain)}
                                <ExternalLink className="ml-1 h-3 w-3 inline-block" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deployment.status === 'success'
                            ? 'bg-black-900/10 text-black-900 dark:bg-white-100/10 dark:text-white-100'
                            : deployment.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                        >
                          {deployment.status === 'success' ? (
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          ) : deployment.status === 'failed' ? (
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          ) : (
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                        {formatDate(deployment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                        {deployment.duration ? `${Math.round(deployment.duration / 1000)}s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deployments/${deployment._id}`);
                          }}
                          className="group relative inline-flex items-center text-black-900 dark:text-white-100 hover:opacity-80 transition-opacity"
                        >
                          View details
                          <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </PageTemplate>
  );
};

export default DeploymentsList;