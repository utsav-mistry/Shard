import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Github } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NewProject = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    repoUrl: '',
    stack: 'mern',
    subdomain: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState(true);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Generate subdomain from project name if subdomain field is empty
    if (name === 'name' && !formData.subdomain) {
      const generatedSubdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setFormData(prev => ({
        ...prev,
        subdomain: generatedSubdomain
      }));
    }

    // Reset subdomain availability when subdomain changes
    if (name === 'subdomain') {
      setSubdomainAvailable(true);
    }
  };

  // Check subdomain availability
  const checkSubdomain = async () => {
    if (!formData.subdomain) return;

    try {
      setSubdomainChecking(true);
      // This is a mock check - in a real app, you'd call an API endpoint
      // const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/check-subdomain/${formData.subdomain}`);
      // setSubdomainAvailable(response.data.available);
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubdomainAvailable(true); // Assume available for now
      setSubdomainChecking(false);
    } catch (err) {
      console.error('Error checking subdomain:', err);
      setSubdomainAvailable(false);
      setSubdomainChecking(false);
    }
  };

  // Fetch GitHub repositories
  const fetchGithubRepos = async () => {
    try {
      setLoadingRepos(true);
      setError(null);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/github/repos`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setGithubRepos(response.data);
      setShowRepoSelector(true);
    } catch (err) {
      console.error('Error fetching GitHub repositories:', err);
      setError('Failed to fetch your GitHub repositories. Please ensure your GitHub account is connected.');
    } finally {
      setLoadingRepos(false);
    }
  };
  
  // Select a GitHub repository
  const selectRepository = (repo) => {
    setFormData(prev => ({
      ...prev,
      name: repo.name,
      repoUrl: repo.html_url,
      subdomain: repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }));
    setShowRepoSelector(false);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.name || !formData.repoUrl || !formData.stack || !formData.subdomain) {
      return setError('All fields are required');
    }

    // Validate repository URL format
    const repoUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+(\.[\w-]+)*$/;
    if (!repoUrlPattern.test(formData.repoUrl)) {
      return setError('Invalid GitHub repository URL format. Example: https://github.com/username/repository');
    }

    // Validate subdomain format
    const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainPattern.test(formData.subdomain)) {
      return setError('Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen');
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/projects`,
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      // Redirect to the new project page
      navigate(`/projects/${response.data._id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/projects')}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Set up a new project for deployment
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="My Awesome Project"
              required
            />
          </div>

          {/* Repository URL */}
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              GitHub Repository URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                id="repoUrl"
                name="repoUrl"
                value={formData.repoUrl}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="https://github.com/username/repository"
                required
              />
              <button
                type="button"
                onClick={fetchGithubRepos}
                disabled={loadingRepos}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRepos ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    <span>Import</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be a public GitHub repository URL
            </p>
            
            {/* GitHub Repository Selector */}
            {showRepoSelector && (
              <div className="mt-3 p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm dark:bg-gray-800">
                <h4 className="text-sm font-medium mb-2">Select a repository:</h4>
                {githubRepos.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {githubRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => selectRepository(repo)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mb-1 flex items-center"
                      >
                        <Github className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-300" />
                        <span>{repo.full_name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No repositories found.</p>
                )}
              </div>
            )}
          </div>

          {/* Stack */}
          <div>
            <label htmlFor="stack" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Technology Stack
            </label>
            <select
              id="stack"
              name="stack"
              value={formData.stack}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
            >
              <option value="mern">MERN (MongoDB, Express, React, Node.js)</option>
              <option value="django">Django (Python)</option>
              <option value="flask">Flask (Python)</option>
            </select>
          </div>

          {/* Subdomain */}
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subdomain
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="subdomain"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                onBlur={checkSubdomain}
                className={`block w-full rounded-l-md border ${!subdomainAvailable ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                placeholder="my-project"
                required
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                .shard.dev
              </span>
            </div>
            {subdomainChecking ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Checking availability...
              </p>
            ) : !subdomainAvailable ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                This subdomain is already taken. Please choose another one.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your project will be accessible at {formData.subdomain}.shard.dev
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !subdomainAvailable}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProject;