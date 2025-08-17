import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, Server, Clock, CheckCircle, XCircle, AlertTriangle, Key, Trash2, Settings, Activity, Globe } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Fetch project details using the correct /api/ prefixed endpoint
        const projectResponse = await api.get(`/api/projects/${id}`);

        // Fetch project deployments using the correct endpoint
        const deploymentsResponse = await api.get('/api/deploy');

        // Fetch project environment variables using the correct endpoint
        const envVarsResponse = await api.get(`/api/env/${id}`);

        // Handle standardized response format
        if (projectResponse.data.success) {
          setProject(projectResponse.data.data);
        } else {
          throw new Error(projectResponse.data.message || 'Failed to load project');
        }

        if (deploymentsResponse.data.success) {
          // Filter deployments for this project and sort by creation date (newest first)
          const projectDeployments = deploymentsResponse.data.data
            .filter(deployment => deployment.projectId === id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setDeployments(projectDeployments);
        } else {
          throw new Error(deploymentsResponse.data.message || 'Failed to load deployments');
        }

        if (envVarsResponse.data.success) {
          setEnvVars(envVarsResponse.data.data || []);
        } else {
          throw new Error(envVarsResponse.data.message || 'Failed to load environment variables');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project data');
        setLoading(false);
      }
    };

    fetchProjectData();
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

  // Handle project deletion
  // Handle project deletion
  const handleDeleteProject = async () => {
    try {
      setDeleteLoading(true);

      // Use the correct API endpoint with DELETE method
      const response = await api.delete(`/api/projects/${id}`);

      // Handle standardized response
      if (response.data && response.data.success) {
        // Redirect to projects list after successful deletion
        navigate('/app/projects');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      setDeleteLoading(false);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Trigger new deployment (Vercel-style)
  const triggerDeployment = async () => {
    try {
      setLoading(true);

      // Create new deployment
      const response = await api.post('/api/deploy', {
        projectId: id,
        repoUrl: project.repoUrl,
        stack: project.stack,
        subdomain: project.subdomain,
        userEmail: 'user@example.com', // Replace with actual user email
        branch: 'main' // Default branch, could be configurable
      });

      if (response.data.success) {
        // Redirect to deployment progress page to show Vercel-style progress
        navigate(`/app/projects/${id}/deployments/${response.data.data._id}/progress`);
      } else {
        setError('Failed to trigger deployment');
      }
    } catch (err) {
      console.error('Error triggering deployment:', err);
      setError('Failed to trigger deployment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-none border-2 border-red-600 dark:border-red-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-none border-2 border-yellow-600 dark:border-yellow-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="font-medium">Project not found</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Vercel-style header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/projects')}
            className="group relative mr-4 p-2 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 rounded-none border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:scale-110 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <ArrowLeft className="h-4 w-4 relative z-10" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">{project.name}</h1>
            <p className="text-black-600 dark:text-white-400 text-sm mt-1 font-medium">
              {project.repoUrl}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={triggerDeployment}
            className="group relative inline-flex items-center px-4 py-2 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <span className="relative z-10 transition-colors duration-200">Deploy</span>
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="group relative inline-flex items-center px-4 py-2 text-sm font-bold border-2 border-red-600 text-red-600 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 overflow-hidden hover:scale-105"
          >
            <span className="absolute inset-0 w-full h-full bg-red-600 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <span className="relative z-10 flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </span>
          </button>
        </div>
      </div>

      {/* Consistent tabs design */}
      <div className="border-b-2 border-black-900 dark:border-white-100 mb-6">
        <nav className="-mb-px flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'overview'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'overview' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'deployments'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'deployments' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10 flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Deployments
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'settings'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'settings' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10 flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Production</h3>
              </div>
              <div className="mt-2">
                <a
                  href={`https://${project.subdomain}.shard.dev`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-medium"
                >
                  {project.subdomain}.shard.dev
                </a>
              </div>
            </div>

            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Server className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Framework</h3>
              </div>
              <div className="mt-2">
                <span className="text-sm text-black-600 dark:text-white-400 font-medium capitalize">{project.stack}</span>
              </div>
            </div>

            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Last Deploy</h3>
              </div>
              <div className="mt-2">
                <span className="text-sm text-black-600 dark:text-white-400 font-medium">
                  {deployments.length > 0 ? new Date(deployments[0].createdAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deployments' && (
        <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">All Deployments</h2>
            <button
              onClick={triggerDeployment}
              className="group relative inline-flex items-center px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">Deploy</span>
            </button>
          </div>
          {deployments.length === 0 ? (
            <div className="px-6 py-8 text-center text-black-600 dark:text-white-400">
              <div className="bg-black-900 dark:bg-white-100 p-4 rounded-none mb-4 inline-block">
                <Server className="h-12 w-12 text-white-100 dark:text-black-900" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-2">No deployments yet</h3>
              <p className="text-sm mb-4 font-medium">Deploy your project to see it live on the web.</p>
              <button
                onClick={triggerDeployment}
                className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10">Deploy Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black-900 dark:divide-white-100">
                <thead className="bg-white-200 dark:bg-black-600">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Commit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Finished
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white-100 dark:bg-black-700 divide-y divide-black-900 dark:divide-white-100">
                  {deployments.map((deployment) => (
                    <tr key={deployment._id} className="hover:bg-white-200 dark:hover:bg-black-600 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-bold text-black-900 dark:text-white-100">
                            {deployment.commitMessage ?
                              deployment.commitMessage.length > 50 ?
                                `${deployment.commitMessage.substring(0, 50)}...` :
                                deployment.commitMessage
                              : 'No commit message'
                            }
                          </div>
                          <div className="text-xs text-black-600 dark:text-white-400 font-medium">
                            {deployment.commitHash ? deployment.commitHash.substring(0, 8) : 'No commit hash'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deployment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600 dark:text-white-400 font-medium">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600 dark:text-white-400 font-medium">
                        {deployment.finishedAt ? new Date(deployment.finishedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/app/projects/${id}/deployments/${deployment._id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all mr-4 font-bold"
                        >
                          View
                        </Link>
                        <Link
                          to={`/app/projects/${id}/deployments/${deployment._id}/logs`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-bold"
                        >
                          Logs
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Environment Variables */}
          <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
            <div className="px-6 py-4 border-b-2 border-black-200 dark:border-white-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-black-900 dark:text-white-100">Environment Variables</h2>
              <Link
                to={`/app/environment/${id}/new`}
                className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none"
              >
                Add Variable
              </Link>
            </div>
            {envVars.length === 0 ? (
              <div className="px-6 py-4 text-center text-black-500 dark:text-white-400">
                <Key className="mx-auto h-12 w-12 text-black-400 dark:text-white-500 mb-2" />
                <p>No environment variables found</p>
                <p className="text-sm mt-1">Add environment variables to configure your application</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-black-200 dark:divide-white-700">
                  <thead className="bg-white-200 dark:bg-black-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                        Key
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white-100 dark:bg-black-900 divide-y divide-black-200 dark:divide-white-700">
                    {envVars.map((envVar) => (
                      <tr key={envVar._id} className="hover:bg-white-200 dark:hover:bg-black-800 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">
                          {envVar.key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                          ••••••••••••
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                          {new Date(envVar.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/app/environment/${id}/edit/${envVar._id}`}
                            className="text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              // Handle delete env var
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Delete project
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this project? All of the project data including deployments, environment variables, and logs will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteProject}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail;