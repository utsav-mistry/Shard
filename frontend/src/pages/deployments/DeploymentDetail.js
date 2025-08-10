import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Server, AlertTriangle, Clock, CheckCircle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';

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

        // Fetch deployment details
        const deploymentResponse = await axios.get(`${process.env.REACT_APP_API_URL}/deploy/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const deploymentData = deploymentResponse.data;
        setDeployment(deploymentData);

        // Fetch project details
        const projectResponse = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${deploymentData.projectId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        setProject(projectResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching deployment details:', err);
        setError('Failed to load deployment details');
        setLoading(false);
      }
    };

    fetchDeploymentDetails();
  }, [id]);

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Server className="w-3 h-3 mr-1" />
            Running
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
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

  if (!deployment || !project) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Deployment or project not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to deployments
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deployment for {project.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Deployment ID: {deployment._id}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {getStatusBadge(deployment.status)}
          <Link
            to={`/deployments/${deployment._id}/logs`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-offset-gray-800"
          >
            View Logs
          </Link>
        </div>
      </div>

      {/* Deployment details */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Deployment Details
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Project
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <Link
                  to={`/projects/${project._id}`}
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {project.name}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Repository
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {project.repoUrl.replace(/^https?:\/\/github\.com\//, '')}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Commit
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {deployment.commitHash ? (
                  <a
                    href={`${project.repoUrl}/commit/${deployment.commitHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {deployment.commitHash.substring(0, 7)}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  'N/A'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Started At
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(deployment.createdAt).toLocaleString()}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Finished At
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {deployment.finishedAt ? new Date(deployment.finishedAt).toLocaleString() : 'In progress'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Duration
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {deployment.finishedAt
                  ? formatDuration(deployment.createdAt, deployment.finishedAt)
                  : 'In progress'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Deployment URL
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {deployment.status === 'success' && project.subdomain ? (
                  <a
                    href={`https://${project.subdomain}.shard-platform.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {`https://${project.subdomain}.shard-platform.com`}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  'Not available'
                )}
              </dd>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Deployment Message
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {deployment.message || 'No message provided'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Environment variables used */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Environment Configuration
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
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
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
        >
          View Logs
        </Link>

        {deployment.status === 'failed' && (
          <button
            onClick={async () => {
              try {
                await axios.post(
                  `${process.env.REACT_APP_API_URL}/deploy/retry/${deployment._id}`,
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
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            Retry Deployment
          </button>
        )}
      </div>
    </div>
  );
};

export default DeploymentDetail;