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
    stack: '',
    envVars: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  };


  // Fetch GitHub repositories
  const fetchGithubRepos = async () => {
    try {
      setLoadingRepos(true);
      setError(null);
      
      const response = await api.get('/api/integrations/github/repositories')
      
      setGithubRepos(response.data.data.repositories || response.data.data || []);
      setShowRepoSelector(true);
    } catch (err) {
      console.error('Error fetching GitHub repositories:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // GitHub not connected - redirect to GitHub connection
        setError('GitHub account not connected. Redirecting to connect your GitHub account...');
        setTimeout(() => {
          navigate('/app/integrations');
        }, 2000);
      } else {
        setError('Failed to fetch your GitHub repositories. Please try again.');
      }
    } finally {
      setLoadingRepos(false);
    }
  };
  
  // Select a GitHub repository
  const selectRepository = (repo) => {
    setFormData(prev => ({
      ...prev,
      name: repo.name,
      repoUrl: repo.url
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
    if (!formData.name || !formData.repoUrl || !formData.stack) {
      return setError('All fields are required');
    }

    // Validate repository URL format
    const repoUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+(\.[\w-]+)*$/;
    if (!repoUrlPattern.test(formData.repoUrl)) {
      return setError('Invalid GitHub repository URL format. Example: https://github.com/username/repository');
    }


    try {
      setLoading(true);
      
      // Create project first
      const projectData = {
        name: formData.name,
        repoUrl: formData.repoUrl,
        stack: formData.stack
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

      // Redirect to project detail page
      navigate(`/app/projects/${projectId}`);
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
          onClick={() => navigate('/app/projects')}
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

          {/* GitHub Repository Selection */}
          <div>
            <label className="block text-sm font-medium text-black-900 dark:text-white-100 mb-2">
              GitHub Repository
            </label>
            
            {!formData.repoUrl ? (
              <div>
                <button
                  type="button"
                  onClick={fetchGithubRepos}
                  disabled={loadingRepos}
                  className="w-full group relative inline-flex items-center justify-center px-6 py-4 border-2 border-black-900 dark:border-white-100 text-base font-medium text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
                  <span className="relative z-10 flex items-center">
                    <Github className="h-5 w-5 mr-2" />
                    {loadingRepos ? 'Loading Repositories...' : 'Connect GitHub & Select Repository'}
                  </span>
                </button>
                <p className="mt-2 text-sm text-black-600 dark:text-white-400">
                  Connect your GitHub account to select a repository for deployment
                </p>
              </div>
            ) : (
              <div className="border-2 border-black-900 dark:border-white-100 py-3 px-4 bg-black-50 dark:bg-black-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Github className="h-5 w-5 text-black-900 dark:text-white-100 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-black-900 dark:text-white-100">{formData.name}</p>
                      <p className="text-xs text-black-600 dark:text-white-400">{formData.repoUrl}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, name: '', repoUrl: '' }));
                      setShowRepoSelector(false);
                    }}
                    className="text-sm text-black-600 dark:text-white-400 hover:text-black-900 dark:hover:text-white-100 transition-colors duration-200"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            
            {/* GitHub Repository Selector */}
            {showRepoSelector && (
              <div className="mt-4 border-2 border-black-900 dark:border-white-100">
                <div className="max-h-60 overflow-y-auto">
                  {githubRepos.length > 0 ? (
                    <ul className="divide-y divide-black-200 dark:divide-white-800">
                      {githubRepos.map((repo) => (
                        <li 
                          key={repo.id} 
                          className="px-4 py-3 hover:bg-black-50 dark:hover:bg-white-950 cursor-pointer transition-colors duration-200"
                          onClick={() => selectRepository(repo)}
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-black-100 dark:bg-white-900 rounded-full flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                              <Github className="h-5 w-5 text-black-900 dark:text-white-100" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-black-900 dark:text-white-100">{repo.name}</p>
                              <p className="text-xs text-black-500 dark:text-white-400 truncate max-w-xs">{repo.url}</p>
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
            <label htmlFor="stack" className="block text-sm font-medium text-black-900 dark:text-white-100 mb-2">
              Technology Stack
            </label>
            <select
              id="stack"
              name="stack"
              value={formData.stack}
              onChange={handleChange}
              className="block w-full border-2 border-black-900 dark:border-white-100 py-3 px-4 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 text-base"
              required
            >
              <option value="">Select your technology stack</option>
              <option value="mern">MERN Stack (MongoDB, Express, React, Node.js)</option>
              <option value="django">Django (Python Web Framework)</option>
              <option value="flask">Flask (Python Microframework)</option>
            </select>
          </div>

          {/* Auto-generated Subdomain Display */}
          <div>
            <label className="block text-sm font-medium text-black-900 dark:text-white-100 mb-2">
              Deployment URL
            </label>
            <div className="border-2 border-black-900 dark:border-white-100 py-3 px-4 bg-black-50 dark:bg-black-800 text-black-600 dark:text-white-400 text-base">
              <span className="text-black-900 dark:text-white-100 font-medium">
                Auto-generated after project creation
              </span>
            </div>
            <p className="mt-2 text-sm text-black-600 dark:text-white-400">
              A unique subdomain will be automatically assigned to your project (e.g., my-project-alpha.localhost)
            </p>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-black-900 dark:text-white-100">
                Environment Variables (Optional)
              </label>
              <button
                type="button"
                onClick={addEnvVar}
                className="inline-flex items-center px-3 py-1 border-2 border-black-900 dark:border-white-100 text-xs font-medium text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-colors duration-200"
              >
                Add Variable
              </button>
            </div>
            
            {/* Environment Variables Table */}
            <div className="border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black-900 dark:border-white-100">
                    <th className="text-left py-3 px-4 font-bold text-black-900 dark:text-white-100">Key</th>
                    <th className="text-left py-3 px-4 font-bold text-black-900 dark:text-white-100">Value</th>
                    <th className="text-left py-3 px-4 font-bold text-black-900 dark:text-white-100">Secret</th>
                    <th className="text-left py-3 px-4 font-bold text-black-900 dark:text-white-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.envVars.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 px-4 text-center text-black-600 dark:text-white-400 italic">
                        No environment variables added. Click "Add Variable" to add your first environment variable.
                      </td>
                    </tr>
                  ) : (
                    formData.envVars.map((envVar, index) => (
                      <tr key={index} className="border-b border-black-200 dark:border-white-800 hover:bg-black-50 dark:hover:bg-white-950 transition-colors duration-200">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="API_KEY"
                            value={envVar.key}
                            onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                            className="w-full border-2 border-black-900 dark:border-white-100 py-2 px-3 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-500 text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type={envVar.secret ? "password" : "text"}
                            placeholder="your_api_key_value"
                            value={envVar.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                            className="w-full border-2 border-black-900 dark:border-white-100 py-2 px-3 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-500 text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={envVar.secret}
                              onChange={(e) => updateEnvVar(index, 'secret', e.target.checked)}
                              className="h-4 w-4 border-2 border-black-900 dark:border-white-100 text-black-900 focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="ml-2 text-xs text-black-600 dark:text-white-400">Hide value</span>
                          </label>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => removeEnvVar(index)}
                            className="text-black-900 dark:text-white-100 hover:text-black-600 dark:hover:text-white-400 font-bold text-lg transition-colors duration-200"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-black-600 dark:text-white-400">
              Environment variables are project-specific and encrypted. They will be available to your application at runtime.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative inline-flex items-center justify-center px-6 py-4 border-2 border-black-900 dark:border-white-100 text-base font-bold text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white-100 disabled:hover:text-black-900 dark:disabled:hover:bg-black-900 dark:disabled:hover:text-white-100"
            >
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 group-disabled:transform-none group-disabled:-translate-x-full"></span>
              <span className="relative z-10">
                {loading ? 'Creating Project...' : 'Create Project'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProject;