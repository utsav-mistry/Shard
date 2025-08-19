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
  Zap,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDeployments from '../../hooks/useDeployments';
import PageTemplate from '../../components/layout/PageTemplate';

// Helper function to get deployment URL
const getDeploymentUrl = (subdomain) => {
  if (!subdomain) return '';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalhost) {
    return `${protocol}//${hostname}${port}/${subdomain}`;
  }
  return `${protocol}//${subdomain}.${hostname}${port}`;
};

// Format date helper function
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

// Status badge renderer
const getStatusBadge = (status) => {
  const baseClasses = "inline-flex items-center px-2 py-0.5 text-xs font-bold rounded";

  switch (status?.toLowerCase()) {
    case 'pending':
    case 'deploying':
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`}>
          <Clock className="w-3 h-3 mr-1" /> {status}
        </span>
      );
    case 'running':
    case 'active':
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`}>
          <Zap className="w-3 h-3 mr-1" /> {status}
        </span>
      );
    case 'success':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Success
        </span>
      );
    case 'failed':
    case 'error':
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`}>
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200`}>
          {status}
        </span>
      );
  }
};

const DeploymentsList = () => {
  const navigate = useNavigate();
  const { deployments, loading, error, refresh } = useDeployments();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
      toast.success('Deployments refreshed');
    } catch (err) {
      console.error('Error refreshing deployments:', err);
      toast.error(`Failed to refresh: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (error) console.error('Error loading deployments:', error);
  }, [error]);

  // Sort + filter
  const sortedDeployments = [...deployments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filteredDeployments = sortedDeployments.filter(deployment => {
    const projectName = deployment.projectId?.name?.toLowerCase() || '';
    const matchesSearch = projectName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <PageTemplate>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded border-2 border-red-600 dark:border-red-400">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span>Error loading deployments</span>
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
          <p className="mt-2 text-base text-black-600 dark:text-white-400">Manage your deployments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            to="/app/projects/new"
            className="px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 border-2 border-black-900 dark:border-white-100 font-bold hover:opacity-80 transition"
          >
            New Project
          </Link>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-black-600 dark:text-white-400" />
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white dark:bg-black-900 text-black-900 dark:text-white-100"
            placeholder="Search deployments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white dark:bg-black-900 text-black-900 dark:text-white-100"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="deploying">Deploying</option>
        </select>
      </div>

      {/* Masonry Layout */}
      {filteredDeployments.length === 0 ? (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-black-900 dark:text-white-100 mb-4" />
          <h3 className="text-lg font-bold">No deployments found</h3>
          <p className="text-black-600 dark:text-white-400 mb-6">Get started by creating a new deployment.</p>
          <Link to="/app/projects/new" className="px-4 py-2 bg-black-900 text-white dark:bg-white dark:text-black border-2 border-black-900 dark:border-white-100 font-bold">New Project</Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {filteredDeployments.map((deployment) => {
            const project = deployment.projectId || {};
            return (
              <div
                key={deployment._id}
                className="break-inside-avoid border-2 border-black-900 dark:border-white-100 p-4 rounded-lg bg-white dark:bg-black-900 shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/app/deployments/${deployment._id}`)}
              >
                {/* Title + Status */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-black-900 dark:text-white-100">{project.name || 'Unknown Project'}</h2>
                  {getStatusBadge(deployment.status)}
                </div>

                {/* URL */}
                {project.subdomain && (
                    <a
                      href={project.subdomain ? `http://${project.subdomain}.localhost:${project.framework === 'mern' ? '12000' : project.framework === 'django' ? '13000' : '14000'}` : `http://localhost:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-medium"
                    >
                      {project.subdomain ? `${project.subdomain}.localhost` : 'localhost:3000'}
                    </a>
                )}

                {/* Commit Info */}
                <p className="text-sm text-black-600 dark:text-white-400 mb-1">
                  <span className="font-medium">Commit:</span> {deployment.commitMessage}
                </p>
                <p className="text-sm text-black-600 dark:text-white-400 mb-2">
                  <span className="font-medium">Author:</span> {deployment.metadata?.author}
                </p>

                {/* AI Review */}
                {deployment.aiReviewResults && (
                  <div className="mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs font-bold text-black-700 dark:text-white-300 mb-1">AI Review</p>
                    <p className="text-xs mb-1">Verdict:
                      <span className="ml-1 font-bold text-green-600 dark:text-green-400">
                        {deployment.aiReviewResults.verdict}
                      </span>
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex justify-between text-xs text-black-500 dark:text-white-400">
                  <span>{formatDate(deployment.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageTemplate>
  );
};

export default DeploymentsList;
