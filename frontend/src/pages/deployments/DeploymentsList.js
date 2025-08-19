import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Zap,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import useDeployments from '../../hooks/useDeployments';

/* --- IntersectionObserver hook for reveal animations --- */
function useReveal(options = { root: null, rootMargin: "0px", threshold: 0.15 }) {
  const refs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.reveal = "true";
        }
      });
    }, options);

    refs.current.forEach((r) => r && observer.observe(r));
    return () => {
      refs.current.forEach((r) => r && observer.unobserve(r));
      observer.disconnect();
    };
  }, [options]);

  const setRef = (el, idx) => {
    refs.current[idx] = el;
  };

  return { setRef };
}

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
  const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-bold border-2";

  switch (status?.toLowerCase()) {
    case 'pending':
    case 'deploying':
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700`}>
          <Clock className="w-3 h-3 mr-1" /> {status}
        </span>
      );
    case 'running':
    case 'active':
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700`}>
          <Zap className="w-3 h-3 mr-1" /> {status}
        </span>
      );
    case 'success':
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Success
        </span>
      );
    case 'failed':
    case 'error':
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700`}>
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </span>
      );
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/50 dark:text-gray-200 dark:border-gray-700`}>
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

  const { setRef } = useReveal();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-black">
        <div className="animate-spin border-2 border-black dark:border-white border-t-transparent h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[-6px_6px_0_rgba(239,68,68,0.8)] dark:shadow-[-6px_6px_0_rgba(239,68,68,0.3)] flex items-center space-x-4">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <span className="text-red-700 dark:text-red-300 font-medium">Error loading deployments</span>
      </div>
    );
  }

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
        <div ref={(el) => setRef(el, 0)} data-reveal className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-extrabold mb-2">Deployments</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300">Manage and monitor your deployments</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center px-6 py-3 font-medium 
            bg-white-100 dark:bg-black-800 
           text-white dark:text-black hover:text-black dark:hover:text-white border-2 border-black dark:border-white 
             transition-colors duration-300 cursor-pointer rounded-none shadow-sm mt-6 sm:mt-0"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/app/projects/new"
              className="inline-flex items-center justify-center px-6 py-3 font-medium 
            bg-white-100 dark:bg-black-800 
           text-white dark:text-black hover:text-black dark:hover:text-white border-2 border-black dark:border-white 
             transition-colors duration-300 cursor-pointer rounded-none shadow-sm mt-6 sm:mt-0"
            >
              New Project
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div ref={(el) => setRef(el, 1)} data-reveal className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 z-10" />
            <input
              type="text"
              ref={(el) => setRef(el, 2)}
              placeholder="Search deployments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
        block w-full pl-10 pr-4 py-3
        border-2 border-black-500 dark:border-white-700
        bg-white-100 dark:bg-black-800
        text-black-900 dark:text-white-100
        placeholder-black-400 dark:placeholder-white-600
        rounded-lg focus:outline-none focus:ring-0
        transition-colors duration-200
      "
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              ref={(el) => setRef(el, 3)}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
      block appearance-none
      px-4 py-3    pr-10       /* space for custom arrow */
      border-2 border-black-500 dark:border-white-700
      bg-white-100 dark:bg-black-800
      text-black-900 dark:text-white-100
      placeholder-black-400 dark:placeholder-white-600
      rounded-lg focus:outline-none focus:ring-0
      transition-colors duration-200
    "
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="deploying">Deploying</option>
            </select>
            {/* Lucide arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronDown className="h-4 w-4 text-black-400 dark:text-white-600" />
            </div>
          </div>
        </div>

        {/* Deployments Grid */}
        {
          filteredDeployments.length === 0 ? (
            <div ref={(el) => setRef(el, 2)} data-reveal className="text-center py-16">
              <div className="bg-black dark:bg-white p-8 mb-6 inline-block border-2 border-black dark:border-white">
                <Server className="h-16 w-16 text-white dark:text-black" />
              </div>
              <h3 className=" text-xl font-bold mb-4">No deployments found</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">Get started by creating a new deployment.</p>
              <Link
                to="/app/projects/new"
                className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white font-bold hover:bg-transparent hover:text-black dark:hover:bg-transparent dark:hover:text-white transition-colors duration-300"
              >
                New Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeployments.map((deployment, idx) => {
                const project = deployment.projectId || {};
                return (
                  <div
                    key={deployment._id}
                    ref={(el) => setRef(el, 3 + idx)}
                    data-reveal
                    className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] cursor-pointer hover:-translate-y-1 transition-transform duration-200"
                    onClick={() => navigate(`/app/deployments/${deployment._id}`)}
                  >
                    {/* Title + Status */}
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-black dark:text-white">{project.name || 'Unknown Project'}</h2>
                      {getStatusBadge(deployment.status)}
                    </div>

                    {/* URL */}
                    {project.subdomain && (
                      <div className="mb-4">
                        <a
                          href={project.subdomain ? `http://${project.subdomain}.localhost:${project.framework === 'mern' ? '12000' : project.framework === 'django' ? '13000' : '14000'}` : `http://localhost:3000`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          {project.subdomain ? `${project.subdomain}.localhost` : 'localhost:3000'}
                        </a>
                      </div>
                    )}

                    {/* Commit Info */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-bold">Commit:</span> {deployment.commitMessage || 'No message'}
                      </p>
                      {deployment.metadata?.author && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-bold">Author:</span> {deployment.metadata.author}
                        </p>
                      )}
                    </div>

                    {/* AI Review */}
                    {deployment.aiReviewResults && (
                      <div className="mb-4 p-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
                        <p className="text-xs font-bold text-black dark:text-white mb-2">AI Review</p>
                        <p className="text-xs">
                          <span className="font-bold">Verdict:</span>
                          <span className="ml-1 font-bold text-green-600 dark:text-green-400">
                            {deployment.aiReviewResults.verdict}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{formatDate(deployment.createdAt)}</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </main >
    </div >
  );
};

export default DeploymentsList;
