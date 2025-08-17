import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { AlertTriangle, ArrowLeft, Github, Search, ChevronDown, X, Plus, Trash2 } from 'lucide-react';

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
    stack: '',
    rootDir: '',
    envVars: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const repos = response.data.data.repositories || response.data.data || [];
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

  const handleSelectRepo = (repo) => {
    setSelectedRepo(repo);
    setFormData(prev => ({ ...prev, name: repo.name }));
    setStep('configure_project');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !selectedRepo.url || !formData.stack) {
      return setError('Project name and technology stack are required.');
    }
    setLoading(true);
    setError(null);
    try {
      const projectData = {
        name: formData.name,
        repoUrl: selectedRepo.url,
        stack: formData.stack,
        rootDir: formData.rootDir,
      };
      const response = await api.post('/api/projects', projectData);
      const projectId = response.data.data._id;

      if (formData.envVars.length > 0) {
        const validEnvVars = formData.envVars.filter(env => env.key.trim());
        await api.post(`/api/env/${projectId}/bulk`, { envVars: validEnvVars });
      }

      navigate(`/app/projects/${projectId}/deployments`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
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
              className="w-full pl-12 pr-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
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
            className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
            required
          />
        </div>

        <div>
          <label htmlFor="stack" className="block text-lg font-bold text-black dark:text-white mb-2">Framework Preset</label>
          <select
            id="stack"
            name="stack"
            value={formData.stack}
            onChange={handleChange}
            className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
            required
          >
            <option value="">Select a framework</option>
            <option value="mern">MERN</option>
            <option value="django">Django</option>
            <option value="flask">Flask</option>
            <option value="nextjs">Next.js</option>
            <option value="react">React (Vite)</option>
            <option value="static">Static HTML</option>
          </select>
        </div>

        <div>
          <label htmlFor="rootDir" className="block text-lg font-bold text-black dark:text-white mb-2">Root Directory</label>
          <input
            type="text"
            id="rootDir"
            name="rootDir"
            placeholder="./"
            value={formData.rootDir}
            onChange={handleChange}
            className="w-full p-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black focus:ring-black dark:focus:ring-white"
          />
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
                className="flex-1 p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white"
              />
              <input
                type={env.secret ? 'password' : 'text'}
                placeholder="VALUE"
                value={env.value}
                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                className="flex-1 p-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white"
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