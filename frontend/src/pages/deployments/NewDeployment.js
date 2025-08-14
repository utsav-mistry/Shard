import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, ArrowLeft, GitBranch, GitCommit, Server } from 'lucide-react';

const NewDeployment = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  const [envVars, setEnvVars] = useState([]);
  
  // Form state
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCommit, setSelectedCommit] = useState('');
  const [deployMessage, setDeployMessage] = useState('');
  const [selectedEnvVars, setSelectedEnvVars] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch project details and environment variables in parallel
        const [projectResponse, envResponse] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/env/${projectId}`)
        ]);
        
        setProject(projectResponse.data);
        
        setEnvVars(envResponse.data);
        
        // Set default selected env vars (all non-secret vars)
        setSelectedEnvVars(envResponse.data
          .filter(env => !env.secret)
          .map(env => env._id));
        
        setLoading(false);
        
        // Fetch branches after project is loaded
        fetchBranches(projectResponse.data.repoUrl);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId, fetchBranches]);

  const fetchBranches = async (repoUrl) => {
    try {
      setLoadingBranches(true);
      
      // Fetch branches from GitHub API via backend
      try {
        const branchesResponse = await api.get(`/github/branches?repo=${encodeURIComponent(repoUrl)}`);
        setBranches(branchesResponse.data);
        setSelectedBranch(branchesResponse.data[0] || 'main'); // Default to first branch or main
        
        // Fetch commits for the default branch
        if (branchesResponse.data.length > 0) {
          fetchCommits(branchesResponse.data[0] || 'main');
        }
      } catch (apiError) {
        console.warn('GitHub branches API not available, using fallback:', apiError);
        // Fallback to default branch if GitHub API is not implemented
        setBranches(['main']);
        setSelectedBranch('main');
        fetchCommits('main');
      }
      
      setLoadingBranches(false);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setLoadingBranches(false);
    }
  };

  const fetchCommits = async (branch) => {
    try {
      setLoadingCommits(true);
      
      // Fetch commits from GitHub API via backend
      try {
        const commitsResponse = await api.get(`/github/commits?repo=${encodeURIComponent(project.repoUrl)}&branch=${branch}`);
        setCommits(commitsResponse.data);
        setSelectedCommit(commitsResponse.data[0]?.hash || 'latest'); // Default to latest commit
      } catch (apiError) {
        console.warn('GitHub commits API not available, using fallback:', apiError);
        // Fallback to generic commit if GitHub API is not implemented
        const fallbackCommit = {
          hash: 'latest',
          message: `Latest commit from ${branch} branch`,
          author: 'Repository Owner',
          date: new Date().toISOString()
        };
        setCommits([fallbackCommit]);
        setSelectedCommit('latest');
      }
      
      setLoadingCommits(false);
    } catch (err) {
      console.error('Error fetching commits:', err);
      setLoadingCommits(false);
    }
  };

  const handleBranchChange = (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);
    fetchCommits(branch);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Prepare environment variables
      const deploymentEnvVars = envVars
        .filter(env => selectedEnvVars.includes(env._id))
        .map(env => ({
          key: env.key,
          value: env.value,
          secret: env.secret
        }));
      
      // Create deployment
      const response = await api.post(`/deploy`, {
        projectId,
        branch: selectedBranch,
        commitHash: selectedCommit,
        message: deployMessage,
        environmentVariables: deploymentEnvVars
      });
      
      // Navigate to deployment details page
      navigate(`/deployments/${response.data._id}`);
    } catch (err) {
      console.error('Error creating deployment:', err);
      setError('Failed to create deployment');
      setSubmitting(false);
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
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to project
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New Deployment for {project.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure and create a new deployment for your project
        </p>
      </div>

      {/* Deployment form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Deployment Configuration
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Branch selection */}
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GitBranch className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="branch"
                  name="branch"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                  disabled={loadingBranches}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  {loadingBranches ? (
                    <option value="">Loading branches...</option>
                  ) : (
                    branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Commit selection */}
            <div>
              <label htmlFor="commit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Commit
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GitCommit className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="commit"
                  name="commit"
                  value={selectedCommit}
                  onChange={(e) => setSelectedCommit(e.target.value)}
                  disabled={loadingCommits}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  {loadingCommits ? (
                    <option value="">Loading commits...</option>
                  ) : (
                    commits.map(commit => (
                      <option key={commit.hash} value={commit.hash}>
                        {commit.hash.substring(0, 7)} - {commit.message.substring(0, 50)}{commit.message.length > 50 ? '...' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {selectedCommit && !loadingCommits && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {commits.find(c => c.hash === selectedCommit)?.message} - 
                  <span className="text-gray-400 dark:text-gray-500">
                    {commits.find(c => c.hash === selectedCommit)?.author} on {new Date(commits.find(c => c.hash === selectedCommit)?.date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Deployment message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deployment Message (optional)
              </label>
              <div className="mt-1">
                <textarea
                  id="message"
                  name="message"
                  rows="3"
                  value={deployMessage}
                  onChange={(e) => setDeployMessage(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Describe the purpose of this deployment"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Environment variables */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Environment Variables
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select which environment variables to include in this deployment
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {envVars.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No environment variables defined for this project. 
                <button 
                  type="button"
                  onClick={() => navigate(`/dashboard/environment/${projectId}/new`)}
                  className="ml-1 text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200"
                >
                  Add environment variables
                </button>
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Variables
                  </span>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedEnvVars(envVars.map(env => env._id))}
                      className="text-sm text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEnvVars([])}
                      className="text-sm text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-black-200 dark:divide-white-700">
                    <thead className="bg-white-200 dark:bg-black-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                          Include
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                          Value
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white-100 dark:bg-black-900 divide-y divide-black-200 dark:divide-white-700">
                      {envVars.map((env) => (
                        <tr key={env._id} className="hover:bg-white-200 dark:hover:bg-black-800 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedEnvVars.includes(env._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEnvVars([...selectedEnvVars, env._id]);
                                } else {
                                  setSelectedEnvVars(selectedEnvVars.filter(id => id !== env._id));
                                }
                              }}
                              className="h-4 w-4 text-black-600 focus:ring-black-500 border-2 border-black-300 dark:border-white-700 rounded-none"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">
                            {env.key}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                            {env.secret ? '••••••••' : env.value}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="mr-4 inline-flex items-center px-4 py-2 border-2 border-black-300 dark:border-white-700 shadow-sm text-sm font-medium rounded-none text-black-700 dark:text-white-200 bg-white-100 dark:bg-black-900 hover:bg-black-200 dark:hover:bg-black-800 transition-all duration-200 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loadingBranches || loadingCommits}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Creating Deployment...
              </>
            ) : (
              <>
                <Server className="-ml-1 mr-2 h-5 w-5" />
                Create Deployment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDeployment;