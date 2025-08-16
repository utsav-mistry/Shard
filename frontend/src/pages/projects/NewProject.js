import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
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
    envVars: []
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
      
      // Check subdomain availability via backend API
      const response = await api.get(`/api/projects/check-subdomain/${formData.subdomain}`);
      setSubdomainAvailable(response.data.available);
      setSubdomainChecking(false);
    } catch (err) {
      console.error('Error checking subdomain:', err);
      // If API fails, assume subdomain is available (fallback behavior)
      setSubdomainAvailable(true);
      setSubdomainChecking(false);
    }
  };

  // Fetch GitHub repositories
  const fetchGithubRepos = async () => {
    try {
      setLoadingRepos(true);
      setError(null);
      
      const response = await api.get('/github/repos')
      
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

  // Add environment variable
  const addEnvVar = () => {
    setFormData(prev => ({
      ...prev,
      envVars: [...prev.envVars, { key: '', value: '', secret: false }]
    }));
  };

  // Remove environment variable
  const removeEnvVar = (index) => {
    setFormData(prev => ({
      ...prev,
      envVars: prev.envVars.filter((_, i) => i !== index)
    }));
  };

  // Update environment variable
  const updateEnvVar = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      envVars: prev.envVars.map((env, i) => 
        i === index ? { ...env, [field]: value } : env
      )
    }));
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
      
      // Create project first
      const projectData = {
        name: formData.name,
        repoUrl: formData.repoUrl,
        stack: formData.stack,
        subdomain: formData.subdomain
      };
      
      const response = await api.post('/api/projects', projectData);
      const projectId = response.data.data?._id || response.data._id;
      
      // Add environment variables if any
      if (formData.envVars && formData.envVars.length > 0) {
        const validEnvVars = formData.envVars.filter(env => env.key.trim() && env.value.trim());
        
        for (const envVar of validEnvVars) {
          try {
            await api.post(`/api/env/${projectId}`, {
              key: envVar.key.trim(),
              value: envVar.value.trim(),
              secret: envVar.secret || false
            });
          } catch (envErr) {
            console.warn('Failed to add environment variable:', envVar.key, envErr);
          }
        }
      }

      // Redirect to the new project page
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/projects')}
          className="mr-4 text-black-600 hover:text-black-900 dark:text-white-600 dark:hover:text-white-100 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">Create New Project</h1>
          <p className="mt-2 text-base text-black-600 dark:text-white-400">
            Set up a new project for deployment
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 p-6">
        {error && (
          <div className="mb-6 p-4 bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 text-black-900 dark:text-white-100" />
            <span className="text-black-900 dark:text-white-100">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black-900 dark:text-white-100 mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="block w-full border-2 border-black-900 dark:border-white-100 py-3 px-4 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-500 text-base"
              placeholder="My Awesome Project"
              required
            />
          </div>

          {/* Repository URL */}
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium text-black-900 dark:text-white-100 mb-2">
              GitHub Repository URL
            </label>
            <div className="flex">
              <div className="relative flex-1">
                <input
                  type="url"
                  id="repoUrl"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleChange}
                  className="block w-full border-2 border-black-900 dark:border-white-100 py-3 px-4 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-500 text-base"
                  placeholder="https://github.com/username/repository"
                  required
                />
              </div>
              <button
                type="button"
                onClick={fetchGithubRepos}
                disabled={loadingRepos}
                className="ml-2 group relative inline-flex items-center justify-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-medium text-black-900 dark:text-white-100 bg-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
                <span className="relative z-10">
                  {loadingRepos ? 'Loading...' : 'Import from GitHub'}
                </span>
              </button>
            </div>
            <p className="mt-2 text-sm text-black-500 dark:text-white-400">
              Must be a public GitHub repository URL
            </p>
            
            {/* GitHub Repository Selector */}
            {showRepoSelector && (
              <div className="mt-4 border-2 border-black-900 dark:border-white-100">
                <div className="max-h-60 overflow-y-auto">
                  {githubRepos.length > 0 ? (
                    <ul className="divide-y divide-black-200 dark:divide-white-800">
                      {githubRepos.map((repo) => (
                        <li 
                          key={repo.id} 
                          className="px-4 py-3 hover:bg-black-50 dark:hover:bg-white-900 cursor-pointer transition-colors duration-200"
                          onClick={() => selectRepository(repo)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-black-100 dark:bg-white-900 rounded-full flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                              <Github className="h-5 w-5 text-black-900 dark:text-white-100" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-black-900 dark:text-white-100">{repo.name}</p>
                              <p className="text-xs text-black-500 dark:text-white-400 truncate max-w-xs">{repo.html_url}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-sm text-black-500 dark:text-white-400">
                      No repositories found. Make sure your GitHub account has some repositories.
                    </div>
                  )}
                </div>
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

          {/* Environment Variables */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Environment Variables (Optional)
              </label>
              <button
                type="button"
                onClick={addEnvVar}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900 dark:hover:bg-indigo-800"
              >
                Add Variable
              </button>
            </div>
            
            {formData.envVars.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No environment variables added. You can add them later if needed.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="KEY"
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type={envVar.secret ? "password" : "text"}
                      placeholder="VALUE"
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={envVar.secret}
                        onChange={(e) => updateEnvVar(index, 'secret', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">Secret</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
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