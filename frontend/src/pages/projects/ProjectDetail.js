import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, Server, Clock, CheckCircle, XCircle, AlertTriangle, Key, Trash2 } from 'lucide-react';

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
          // Filter deployments for this project on the client side if needed
          const projectDeployments = deploymentsResponse.data.data.filter(
            deployment => deployment.projectId === id
          );
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
        navigate('/projects', { 
          state: { 
            message: 'Project deleted successfully',
            type: 'success'
          } 
        });
      } else {
        throw new Error(response.data?.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      setDeleteLoading(false);
      setDeleteModalOpen(false);
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

  if (!project) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Project not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/projects')}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {project.repoUrl}
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            to={`/projects/${id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            Edit
          </Link>
          <Link
            to={`/projects/${id}/deploy`}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            Deploy
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400"
          >
            <Trash2 className="-ml-0.5 mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Project Information</h2>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Repository URL</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <a 
                  href={project.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {project.repoUrl}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Technology Stack</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{project.stack}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subdomain</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <a 
                  href={`https://${project.subdomain}.shard.dev`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {project.subdomain}.shard.dev
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(project.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {new Date(project.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
        <div className="px-6 py-4 border-b-2 border-black-200 dark:border-white-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-black-900 dark:text-white-100">Environment Variables</h2>
          <Link
            to={`/dashboard/environment/${id}/new`}
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
                        to={`/dashboard/environment/${id}/${envVar._id}/edit`}
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

      {/* Recent Deployments */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Deployments</h2>
          <Link
            to={`/projects/${id}/deployments`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View all
          </Link>
        </div>
        {deployments.length === 0 ? (
          <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            <Server className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>No deployments found</p>
            <Link
              to={`/projects/${id}/deploy`}
              className="mt-2 inline-block text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Deploy this project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Finished
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deployments.slice(0, 5).map((deployment) => (
                  <tr key={deployment._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deployment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deployment.finishedAt ? new Date(deployment.finishedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/deployments/${deployment._id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        to={`/deployments/${deployment._id}/logs`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
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
  );
};

export default ProjectDetail;