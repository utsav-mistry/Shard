import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, ArrowLeft, Github, Search, ChevronDown, X, Plus, Trash2, Folder } from 'lucide-react';

const NewProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('select_repo'); // 'select_repo' or 'configure_project'
  const [githubRepos, setGithubRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    techStack: '',
    rootDir: './',
    envVars: [{ key: '', value: '', secret: false }]
  });

  const [repoStructure, setRepoStructure] = useState([{ name: 'Root', path: './', type: 'dir' }]);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    techStack: ''
  });

  useEffect(() => {
    if (githubRepos.length > 0) {
      setFilteredRepos(
        githubRepos.filter(repo =>
          repo.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, githubRepos]);

  const fetchGithubRepos = async () => {
    setLoadingRepos(true);
    setError(null);
    try {
      const response = await api.get('/api/integrations/github/repositories');
      const repos = response.data.data?.repositories || response.data.data || [];
      setGithubRepos(repos);
      setFilteredRepos(repos);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('GitHub account not connected. Redirecting to connect...');
        setTimeout(() => navigate('/app/integrations'), 2000);
      } else {
        setError('Failed to fetch GitHub repositories.');
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchRepoStructure = async (repo) => {
    setLoadingStructure(true);
    setError(null);

    try {
      const response = await api.get(`/api/integrations/github/repositories/${repo.name}/contents`);

      // Always include the root directory
      const directories = [
        { name: 'Root', path: './', type: 'dir' },
        ...(response.data.data || []).filter(item => item.type === 'dir')
      ];

      setRepoStructure(directories);

      // Set default root directory if not set
      if (!formData.rootDir) {
        setFormData(prev => ({ ...prev, rootDir: './' }));
      }

    } catch (error) {
      console.error('Failed to fetch repository structure:', error);

      // Default to root directory on error
      setError('Failed to load directory structure. Using root directory.');
      setRepoStructure([{ name: 'Root', path: './', type: 'dir' }]);
      setFormData(prev => ({ ...prev, rootDir: './' }));

    } finally {
      setLoadingStructure(false);
    }
  };

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setFormData(prev => ({ ...prev, name: repo.name }));
    await fetchRepoStructure(repo);
    setStep('configure_project');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addEnvVar = () => {
    setFormData(prev => ({ ...prev, envVars: [...prev.envVars, { key: '', value: '', secret: false }] }));
  };

  const removeEnvVar = (index) => {
    setFormData(prev => ({ ...prev, envVars: prev.envVars.filter((_, i) => i !== index) }));
  };

  const updateEnvVar = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      envVars: prev.envVars.map((env, i) => (i === index ? { ...env, [field]: value } : env)),
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Project name is required';
      isValid = false;
    }

    if (!formData.techStack) {
      errors.techStack = 'Please select a tech stack';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare the project data according to backend validation schema
      const projectData = {
        name: formData.name.trim(),
        framework: formData.techStack,
        repoUrl: selectedRepo ? selectedRepo.html_url : 'https://github.com/example/repo',
        branch: selectedRepo ? selectedRepo.default_branch || 'main' : 'main'
      };

      // Add description if available
      if (selectedRepo && selectedRepo.description) {
        projectData.description = selectedRepo.description;
      }

      // Submit the project
      const response = await api.post('/api/projects', projectData);

      const projectId = response.data.data._id;

      // If there are env vars, submit them
      const validEnvVars = formData.envVars.filter(env => env.key.trim() !== '');
      if (validEnvVars.length > 0) {
        await api.post(`/api/projects/${projectId}/env`, { envVars: validEnvVars });
      }

      // Redirect to the project page
      navigate(`/app/projects/${projectId}`);

    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderRepoSelection = () => (
    <div className="space-y-6">
      <div className="border-2 border-black dark:border-white p-6">
        <h2 className="text-xl font-bold text-black dark:text-white">Import Git Repository</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a repository to deploy.</p>
        <div className="mt-4">
          <button
            onClick={fetchGithubRepos}
            disabled={loadingRepos}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-bold"
          >
            <Github className="w-5 h-5" />
            <span>{loadingRepos ? 'Loading...' : 'Import from GitHub'}</span>
          </button>
        </div>
      </div>

      {githubRepos.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
            />
          </div>
          <div className="border-2 border-black dark:border-white max-h-96 overflow-y-auto">
            {filteredRepos.length > 0 ? (
              filteredRepos.map(repo => (
                <div
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="flex items-center justify-between p-4 border-b-2 border-black dark:border-white last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Github className="w-6 h-6 text-black dark:text-white" />
                    <div>
                      <p className="font-bold text-black dark:text-white">{repo.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{repo.private ? 'Private' : 'Public'}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 border-2 border-black dark:border-white text-sm font-bold bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Import</button>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">No repositories match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderConfiguration = () => (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="border-2 border-black dark:border-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Github className="w-6 h-6 text-black dark:text-white" />
            <p className="font-bold text-lg text-black dark:text-white">{selectedRepo.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep('select_repo')}
            className="text-sm font-medium text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
          >
            Change
          </button>
        </div>
      </div>

      <div className="space-y-6 p-6 border-2 border-black dark:border-white">
        <div>
          <label htmlFor="name" className="block text-lg font-bold text-black dark:text-white mb-2">Project Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-3 border-2 ${fieldErrors.name
              ? 'border-red-500'
              : 'border-black dark:border-white focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white'
              } bg-white dark:bg-black text-black dark:text-white focus:outline-none`}
            placeholder="my-awesome-project"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="stack" className="block text-lg font-bold text-black dark:text-white mb-2">Framework Preset</label>
          <div className="relative">
            <select
              id="techStack"
              name="techStack"
              value={formData.techStack}
              onChange={handleChange}
              className={`w-full p-3 border-2 ${fieldErrors.techStack
                ? 'border-red-500'
                : 'border-black dark:border-white focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white'
                } bg-white dark:bg-black text-black dark:text-white focus:outline-none appearance-none`}
            >
              <option value="">Select a tech stack</option>
              <option value="mern">MERN Stack (MongoDB, Express, React, Node.js)</option>
              <option value="django">Django (Python)</option>
              <option value="flask">Flask (Python)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          {fieldErrors.techStack && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.techStack}</p>
          )}
        </div>

        <div>
          <label htmlFor="rootDir" className="block text-lg font-bold text-black dark:text-white mb-2">Root Directory</label>
          <div className="relative">
            <select
              id="rootDir"
              name="rootDir"
              value={formData.rootDir}
              onChange={handleChange}
              className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingStructure}
            >
              {loadingStructure ? (
                <option>Loading directories...</option>
              ) : (
                repoStructure.map((dir, index) => (
                  <option key={index} value={dir.path}>
                    {dir.name} {dir.path !== './' ? `(${dir.path})` : ''}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          {repoStructure.length === 0 && !loadingStructure && (
            <p className="mt-1 text-sm text-gray-500">No subdirectories found. Using root directory.</p>
          )}
        </div>
      </div>

      <div className="border-2 border-black dark:border-white">
        <div className="p-6 border-b-2 border-black dark:border-white">
          <h3 className="text-lg font-bold">Environment Variables</h3>
          <p className="text-sm text-gray-500">These will be exposed to your application during build and runtime.</p>
        </div>
        <div className="p-6 space-y-4">
          {formData.envVars.map((env, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="KEY"
                value={env.key}
                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                className="flex-1 p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
              />
              <input
                type={env.secret ? 'password' : 'text'}
                placeholder="VALUE"
                value={env.value}
                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                className="flex-1 p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
              />
              <button type="button" onClick={() => removeEnvVar(index)} className="p-2 text-gray-500 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEnvVar}
            className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-black dark:hover:border-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full p-4 bg-black text-white dark:bg-white dark:text-black font-bold text-lg border-2 border-black dark:border-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Deploying...' : 'Deploy'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center">
        <button
          onClick={() => step === 'configure_project' ? setStep('select_repo') : navigate('/app/projects')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full mr-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-gray-500">{step === 'select_repo' ? 'Step 1: Import Repository' : 'Step 2: Configure & Deploy'}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {step === 'select_repo' ? renderRepoSelection() : renderConfiguration()}
    </div>
  );
};

export default NewProject;