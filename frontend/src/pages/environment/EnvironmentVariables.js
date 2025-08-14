import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, Plus, Search, Eye, EyeOff, Edit, Trash2, ArrowLeft } from 'lucide-react';

const EnvironmentVariables = () => {
  const { projectId } = useParams();
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
          api.get(`/projects/${projectId}`),
          api.get(`/env/${projectId}`)
        ]);
        
        setProject(projectResponse.data);
        
        setEnvVars(envResponse.data);
        setLoading(false);
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
      await api.delete(`/env/${envToDelete._id}`);
      
      // Remove deleted env var from state
      setEnvVars(envVars.filter(env => env._id !== envToDelete._id));
      setDeleteModalOpen(false);
      setEnvToDelete(null);
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-none border-2 border-red-600 dark:border-red-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-none border-2 border-yellow-600 dark:border-yellow-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Project not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center text-sm font-medium text-black-500 hover:text-black-700 dark:text-white-400 dark:hover:text-white-300 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to project
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">
            Environment Variables: {project.name}
          </h1>
          <p className="mt-1 text-sm text-black-500 dark:text-white-400">
            Manage environment variables for your project
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to={`/dashboard/environment/${projectId}/new`}
            className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Variable
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none p-4 border-2 border-black-200 dark:border-white-700">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-black-400 dark:text-white-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-2 border-black-300 dark:border-white-700 rounded-none leading-5 bg-white-100 dark:bg-black-900 placeholder-black-500 dark:placeholder-white-400 focus:outline-none focus:placeholder-black-400 dark:focus:placeholder-white-500 focus:ring-1 focus:ring-black-900 dark:focus:ring-white-100 focus:border-black-900 dark:focus:border-white-100 sm:text-sm transition-all duration-200"
            placeholder="Search by variable name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Environment variables list */}
      {filteredEnvVars.length === 0 ? (
        <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none p-6 text-center border-2 border-black-200 dark:border-white-700">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-none bg-black-100 dark:bg-white-700 border-2 border-black-300 dark:border-white-600">
            <AlertTriangle className="h-6 w-6 text-black-600 dark:text-white-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-black-900 dark:text-white-100">
            No environment variables found
          </h3>
          <p className="mt-1 text-sm text-black-500 dark:text-white-400">
            {searchTerm 
              ? 'Try adjusting your search term'
              : 'Get started by adding a new environment variable'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to={`/dashboard/environment/${projectId}/new`}
                className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Variable
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
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
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white-100 dark:bg-black-900 divide-y divide-black-200 dark:divide-white-700">
                {filteredEnvVars.map((env) => (
                  <tr key={env._id} className="hover:bg-white-200 dark:hover:bg-black-800 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">
                      {env.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                      <div className="flex items-center">
                        {env.secret ? (
                          showSecrets[env._id] ? env.value : '••••••••'
                        ) : (
                          env.value
                        )}
                        {env.secret && (
                          <button
                            onClick={() => toggleShowSecret(env._id)}
                            className="ml-2 text-black-400 hover:text-black-500 dark:hover:text-white-300 transition-colors duration-200"
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-800 dark:border-red-200 shadow-sm transition-all duration-200 hover:shadow-md">
                          Secret
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-800 dark:border-green-200 shadow-sm transition-all duration-200 hover:shadow-md">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/dashboard/environment/${projectId}/edit/${env._id}`}
                        className="text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-300 mr-4 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 px-2 py-1"
                      >
                        <Edit className="h-4 w-4 inline" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(env)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border-b-2 border-transparent hover:border-red-900 dark:hover:border-red-300 transition-all duration-200 px-2 py-1"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                        <span className="sr-only">Delete</span>
                      </button>
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
  );
};

export default EnvironmentVariables;