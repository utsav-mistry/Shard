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
        const deploymentResponse = await api.get(`/api/deploy/${id}`);

        // Handle standardized response
        if (deploymentResponse.data && deploymentResponse.data.success) {
          const deploymentData = deploymentResponse.data.data;
          setDeployment(deploymentData);

          // Then fetch project details using the deployment's projectId
          const projectResponse = await api.get(`/api/projects/${deploymentData.projectId}`);

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
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="animate-pulse">
            <div className="h-12 w-12 border-4 border-black-900 dark:border-white-100 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate title="Error">
        <div className="bg-white-100 dark:bg-black-900 p-6 border-2 border-black-900 dark:border-white-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-black-900 dark:text-white-100" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-black-900 dark:text-white-100">
                Error loading deployment
              </h3>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {error}
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-none shadow-sm text-white bg-black-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:bg-gray-200 dark:focus:ring-white-100"
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
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Deployment or project not found
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title={`Deployment for ${project?.name || 'Unknown Project'}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="border-2 border-black-900 dark:border-white-100 mb-6">
            <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900">
              <h3 className="text-lg font-medium text-black-900 dark:text-white-100">
                Deployment Information
              </h3>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project
                  </dt>
                  <dd className="mt-1 text-sm text-black-900 dark:text-white-100">
                    {project?.name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Environment
                  </dt>
                  <dd className="mt-1 text-sm text-black-900 dark:text-white-100">
                    {deployment.environment || 'Production'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch
                  </dt>
                  <dd className="mt-1 text-sm text-black-900 dark:text-white-100">
                    {deployment.branch || 'main'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Commit
                  </dt>
                  <dd className="mt-1 text-sm">
                    {deployment.commitHash ? (
                      <a
                        href={`https://github.com/${project?.repo}/commit/${deployment.commitHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center border-b border-black-900 dark:border-white-100 hover:border-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 px-1 transition-colors duration-200"
                      >
                        {deployment.commitHash.substring(0, 7)}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Started
                  </dt>
                  <dd className="mt-1 text-sm text-black-900 dark:text-white-100">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration
                  </dt>
                  <dd className="mt-1 text-sm text-black-900 dark:text-white-100">
                    {formatDuration(deployment.createdAt, deployment.finishedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Environment variables used */}
          <div className="border-2 border-black-900 dark:border-white-100 mb-6">
            <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900">
              <h3 className="text-lg font-medium text-black-900 dark:text-white-100">
                Environment Configuration
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Environment variables are not shown for security reasons.
              </p>
            </div>
            <div className="p-6">
              {deployment.environmentVariables && deployment.environmentVariables.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-750">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deployment.environmentVariables.map((env, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white-100">
                            {env.key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {env.secret ? '••••••••' : env.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No environment variables used for this deployment
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Link
              to={`/deployments/${deployment._id}/logs`}
              className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-medium rounded-none text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100 transition-all duration-200"
            >
              View Logs
            </Link>

            {deployment.status === 'failed' && (
              <button
                onClick={async () => {
                  try {
                    await api.post(
                      `/api/deploy/retry/${deployment._id}`,
                      {},
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                      }
                    );
                    navigate('/deployments');
                  } catch (err) {
                    console.error('Error retrying deployment:', err);
                    setError('Failed to retry deployment');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Deployment
              </button>
            )}
          </div>
        </div>
      </div>

      {deployment.status === 'success' && project.subdomain && (
        <div className="mt-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Deployment URL
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              <a
                href={getDeploymentUrl(project.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {getDeploymentUrl(project.subdomain)}
                <ExternalLink className="ml-1 h-3 w-3 inline-block" />
              </a>
            </dd>
          </dl>
        </div>
      )}

      <div className="mt-6">
        <div className="flex justify-between items-center">
          <Link
            to={`/deployments/${deployment._id}/logs`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-offset-gray-800"
          >
            View Logs
          </Link>

          {deployment.status === 'failed' && (
            <button
              onClick={async () => {
                try {
                  await api.post(
                    `/api/deploy/retry/${deployment._id}`,
                    {},
                    {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                      },
                    }
                  );
                  navigate('/deployments');
                } catch (err) {
                  console.error('Error retrying deployment:', err);
                  setError('Failed to retry deployment');
                }
              }}
              className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-medium text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Deployment
            </button>
          )}
        </div>
      </div>
    </PageTemplate>
  );
};

export default DeploymentDetail;