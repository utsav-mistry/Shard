import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import {
  Server,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import PageTemplate from '../../components/layout/PageTemplate';
import CodeIssuesList from '../../components/CodeIssuesList';

// Helper function to get deployment URL
const getDeploymentUrl = (subdomain) => {
  if (!subdomain) return '';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    // Correctly format for local development with subdomain
    return `${protocol}//${subdomain}.${hostname}${port}`;
  }

  // For production, format with subdomain
  const parts = hostname.split('.');
  if (parts.length > 2) {
    parts.shift(); // remove current subdomain if any
  }
  const baseHostname = parts.join('.');
  return `${protocol}//${subdomain}.${baseHostname}${port}`;
};

const DeploymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeploymentDetails = async () => {
      try {
        setLoading(true);

        // Fetch deployment details first with standardized API path
        const deploymentResponse = await api.get(`/api/deployments/${id}`);

        // Handle standardized response
        if (deploymentResponse.data && deploymentResponse.data.success) {
          const deploymentData = deploymentResponse.data.data;
          setDeployment(deploymentData);

          // Then fetch project details using the deployment's projectId
          const projectId = deploymentData.projectId?._id || deploymentData.projectId;
          const projectResponse = await api.get(`/api/projects/${projectId}`);

          // Handle standardized project response
          if (projectResponse.data && projectResponse.data.success) {
            setProject(projectResponse.data.data);
          } else {
            throw new Error(projectResponse.data?.message || 'Failed to load project details');
          }

          setLoading(false);
        } else {
          throw new Error(deploymentResponse.data?.message || 'Failed to load deployment details');
        }
      } catch (err) {
        console.error('Error fetching deployment details:', err);
        setError('Failed to load deployment details');
        setLoading(false);
      }
    };

    fetchDeploymentDetails();
  }, [id]);

  // Helper function to get status badge with black/white theme
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: 'Pending'
      },
      running: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Server className="w-3 h-3 mr-1" />,
        label: 'Running'
      },
      success: {
        bg: 'bg-black-900 dark:bg-white-100',
        text: 'text-white-100 dark:text-black-900',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        label: 'Success'
      },
      failed: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        label: 'Failed'
      },
      default: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: null,
        label: status
      }
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border} whitespace-nowrap`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Helper function to format duration
  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;

    // Format duration
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <PageTemplate title="Loading Deployment...">
        <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="bg-white-100 dark:bg-black-900 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-none p-6 shadow-lg shadow-black/5 dark:shadow-white/5 parent rounded-full animate-spin"></div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate title="Error">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 border-2 border-red-600 dark:border-red-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
                Error loading deployment
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
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

  if (!deployment || !project) {
    return (
      <PageTemplate title="Deployment Not Found">
        <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
          <div className="text-center border-2 border-black-900 dark:border-white-100 p-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
            <h3 className="mt-4 text-lg font-bold text-black-900 dark:text-white-100">Deployment not found</h3>
            <p className="mt-2 text-sm text-black-600 dark:text-white-400">
              The deployment you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b-2 border-black-900 dark:border-white-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">{deployment.name || 'Deployment Details'}</h1>
            <p className="mt-2 text-base text-black-600 dark:text-white-400">
              Deployment for {project?.name || 'Unknown Project'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/app/deployments"
              className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Deployments
              </span>
            </Link>
            {getStatusBadge(deployment.status)}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deployment Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-black-900 dark:border-white-100 shadow-lg shadow-black/10 dark:shadow-white/10">
              <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-bold text-black-900 dark:text-white-100">Deployment Information</h3>
              </div>
              <div className="p-6 bg-white-100 dark:bg-black-900">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Project</dt>
                    <dd className="mt-1 text-sm font-bold text-black-900 dark:text-white-100">{project?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Environment</dt>
                    <dd className="mt-1 text-sm font-bold text-black-900 dark:text-white-100">{deployment.environment || 'Production'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Branch</dt>
                    <dd className="mt-1 text-sm font-bold text-black-900 dark:text-white-100">{deployment.branch || 'main'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Commit</dt>
                    <dd className="mt-1 text-sm">
                      {deployment.commitHash ? (
                        <a
                          href={`${project?.repoUrl}/commit/${deployment.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center border-b-2 border-black-900 dark:border-white-100 hover:border-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 px-1 transition-colors duration-200 font-bold"
                        >
                          {deployment.commitHash.substring(0, 7)}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Started</dt>
                    <dd className="mt-1 text-sm font-bold text-black-900 dark:text-white-100">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black-500 dark:text-white-400">Duration</dt>
                    <dd className="mt-1 text-sm font-bold text-black-900 dark:text-white-100">
                      {formatDuration(deployment.createdAt, deployment.finishedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                to={`/app/deployments/${deployment._id}/progress`}
                className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
              >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
                <span className="relative z-10">View Progress</span>
              </Link>
              <button
                onClick={async () => {
                  try {
                    const response = await api.post(`/api/deployments/${deployment._id}/redeploy`, {});
                    if (response.data && response.data.success) {
                      const newDeploymentId = response.data.data._id;
                      // Navigate to deployment progress page instead of detail page
                      navigate(`/app/deployments/${newDeploymentId}/progress`);
                    } else {
                      throw new Error(response.data?.message || 'Failed to start redeployment');
                    }
                  } catch (err) {
                    console.error('Error redeploying:', err);
                    // If a deployment is already in progress, redirect to its progress page
                    const status = err?.response?.status;
                    const existingId = err?.response?.data?.data?.existingDeploymentId;
                    if (status === 409 && existingId) {
                      navigate(`/app/deployments/${existingId}/progress`);
                      return;
                    }
                    setError(`Failed to redeploy: ${err.message}`);
                  }
                }}
                className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
              >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
                <span className="relative z-10 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Redeploy
                </span>
              </button>
              {deployment.status === 'failed' && (
                <button
                  onClick={async () => {
                    try {
                      const response = await api.post(`/api/deployments/retry/${deployment._id}`, {});
                      if (response.data && response.data.success) {
                        const newDeploymentId = response.data.data._id;
                        navigate(`/app/deployments/${newDeploymentId}/progress`);
                      } else {
                        throw new Error(response.data?.message || 'Failed to get new deployment details');
                      }
                    } catch (err) {
                      console.error('Error retrying deployment:', err);
                      // If a deployment is already in progress, redirect to its progress page
                      const status = err?.response?.status;
                      const existingId = err?.response?.data?.data?.existingDeploymentId;
                      if (status === 409 && existingId) {
                        navigate(`/app/deployments/${existingId}/progress`);
                        return;
                      }
                      setError('Failed to retry deployment');
                    }
                  }}
                  className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100 hover:scale-[1.02] active:scale-95"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0"></span>
                  <span className="relative z-10 flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Deployment
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* AI Code Review Results */}
            {deployment.aiReviewResults && (
              <div className="border-2 border-black-900 dark:border-white-100">
                <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900">
                  <h3 className="text-lg font-bold text-black-900 dark:text-white-100">Code Review Results</h3>
                </div>
                <div className="p-6">
                  <CodeIssuesList
                    issues={deployment.aiReviewResults.issues || []}
                    title="AI Analysis & Linter Results"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetail;