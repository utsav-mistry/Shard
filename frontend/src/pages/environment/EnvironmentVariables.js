import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, Plus, Search, Eye, EyeOff, Edit, Trash2, ArrowLeft } from 'lucide-react';

const EnvironmentVariables = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSecrets, setShowSecrets] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [envToDelete, setEnvToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch project details and environment variables in parallel
        const [projectResponse, envResponse] = await Promise.all([
          navigate(`/app/projects/${projectId}`),
          api.get(`/api/env/${projectId}`)
        ]);

        // Handle standardized responses
        if (projectResponse.data.success && envResponse.data.success) {
          setProject(projectResponse.data.data);
          setEnvVars(envResponse.data.data || []);
          setLoading(false);
        } else {
          const errorMessage = projectResponse.data?.message ||
            envResponse.data?.message ||
            'Failed to load environment data';
          throw new Error(errorMessage);
        }
      } catch (err) {
        console.error('Error fetching environment variables:', err);
        setError('Failed to load environment variables');
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const toggleShowSecret = (id) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeleteClick = (env) => {
    setEnvToDelete(env);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!envToDelete) return;

    try {
      const response = await api.delete(`/api/env/${envToDelete._id}`);

      // Handle standardized response
      if (response.data && response.data.success) {
        // Remove deleted env var from state
        setEnvVars(envVars.filter(env => env._id !== envToDelete._id));
        setDeleteModalOpen(false);
        setEnvToDelete(null);
      } else {
        throw new Error(response.data?.message || 'Failed to delete environment variable');
      }
    } catch (err) {
      console.error('Error deleting environment variable:', err);
      setError('Failed to delete environment variable');
    }
  };

  // Filter environment variables based on search term
  const filteredEnvVars = envVars.filter(env =>
    env.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 border-2 border-red-600 dark:border-red-400 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-200">{error}</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
        <div className="text-center border-2 border-black-900 dark:border-white-100 p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          <h3 className="mt-4 text-lg font-bold text-black-900 dark:text-white-100">Project not found</h3>
          <p className="mt-2 text-sm text-black-600 dark:text-white-400">
            The project you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to={`/app/projects/${projectId}`}
            className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
            <span className="relative z-10 flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to project
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b-2 border-black-900 dark:border-white-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">
              Environment Variables: {project.name}
            </h1>
            <p className="mt-2 text-base text-black-600 dark:text-white-400">
              Manage environment variables for your project
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to={`/app/environment/${projectId}/new`}
              className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100 hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Add Variable
              </span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-black-900 border-2 border-black-900 dark:border-white-100 p-6 mb-6">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-black-400 dark:text-white-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-500 dark:placeholder-white-400 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 sm:text-sm transition-all duration-200"
              placeholder="Search by variable name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Environment variables list */}
        {filteredEnvVars.length === 0 ? (
          <div className="bg-white dark:bg-black-900 border-2 border-black-900 dark:border-white-100 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-black-600 dark:text-white-400 mb-4" />
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-2">
              No environment variables found
            </h3>
            <p className="text-sm text-black-600 dark:text-white-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Get started by adding a new environment variable'}
            </p>
            {!searchTerm && (
              <Link
                to={`/app/environment/${projectId}/new`}
                className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100 hover:scale-[1.02] active:scale-95"
              >
                <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0"></span>
                <span className="relative z-10 flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Variable
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-black-900 border-2 border-black-900 dark:border-white-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black-900 dark:divide-white-100">
                <thead className="bg-white-100 dark:bg-black-800 border-b-2 border-black-900 dark:border-white-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Key
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-black-900 divide-y divide-black-900 dark:divide-white-100">
                  {filteredEnvVars.map((env) => (
                    <tr key={env._id} className="hover:bg-black-50 dark:hover:bg-white-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black-900 dark:text-white-100">
                        {env.key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                        <div className="flex items-center">
                          <span className="font-mono">
                            {env.secret ? (
                              showSecrets[env._id] ? env.value : '••••••••'
                            ) : (
                              env.value
                            )}
                          </span>
                          {env.secret && (
                            <button
                              onClick={() => navigate(`/app/projects/${projectId}`)}
                              className="ml-2 text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 transition-colors duration-200"
                            >
                              {showSecrets[env._id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                        {env.secret ? (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-2 border-red-800 dark:border-red-200">
                            Secret
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-2 border-green-800 dark:border-green-200">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/app/environment/${projectId}/edit/${env._id}`}
                            className="text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 px-2 py-1"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(env)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border-b-2 border-transparent hover:border-red-900 dark:hover:border-red-300 transition-all duration-200 px-2 py-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteModalOpen && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black-500 dark:bg-black-900 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white-100 dark:bg-black-900 rounded-none border-2 border-black-900 dark:border-white-100 px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-none bg-red-100 dark:bg-red-900 border-2 border-red-600 dark:border-red-400">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-200" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-black-900 dark:text-white-100">
                      Delete Environment Variable
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-black-500 dark:text-white-400">
                        Are you sure you want to delete the environment variable <span className="font-semibold">{envToDelete?.key}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="w-full inline-flex justify-center rounded-none border-2 border-red-600 shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-transparent hover:text-red-600 transition-all duration-200 focus:outline-none sm:col-start-2 sm:text-sm"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setEnvToDelete(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-none border-2 border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white-100 dark:bg-black-900 text-base font-medium text-black-900 dark:text-white-100 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentVariables;