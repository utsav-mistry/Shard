import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Search, Filter, ExternalLink, Star, GitBranch, Calendar, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/axiosConfig';

const ImportRepository = () => {
    const navigate = useNavigate();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(null);
    
    // Import form state
    const [projectName, setProjectName] = useState('');
    const [framework, setFramework] = useState('');
    const [branch, setBranch] = useState('main');
    const [envVars, setEnvVars] = useState([]);

    const frameworks = [
        { value: 'mern', label: 'MERN Stack', description: 'MongoDB, Express, React, Node.js' },
        { value: 'django', label: 'Django', description: 'Python web framework' },
        { value: 'flask', label: 'Flask', description: 'Python micro framework' },
    ];

    useEffect(() => {
        fetchRepositories();
    }, []);

    const fetchRepositories = async () => {
        try {
            const response = await api.get('/api/integrations/github/repositories');

            if (response.data.success) {
                setRepos(response.data.data?.repositories || response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch repositories');
            }
        } catch (error) {
            console.error('Failed to fetch repositories:', error);
            if (error.response?.status === 401) {
                setError('GitHub not connected. Please connect your GitHub account first.');
            } else if (error.response?.status === 400) {
                setError('GitHub integration not properly configured. Please reconnect your account.');
            } else {
                setError(error.response?.data?.message || 'Failed to fetch repositories. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRepoSelect = (repo) => {
        setSelectedRepo(repo);
        setProjectName(repo.name);
        // Auto-detect framework based on repo contents or language
        if (repo.language) {
            const lang = repo.language.toLowerCase();
            if (lang === 'javascript' || lang === 'typescript') {
                setFramework('mern');
            } else if (lang === 'python') {
                setFramework('django');
            }
        }
    };

    const addEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '', isSecret: false }]);
    };

    const updateEnvVar = (index, field, value) => {
        const updated = [...envVars];
        updated[index][field] = value;
        setEnvVars(updated);
    };

    const removeEnvVar = (index) => {
        setEnvVars(envVars.filter((_, i) => i !== index));
    };

    const handleImport = async () => {
        if (!selectedRepo || !projectName || !framework) {
            setError('Please fill in all required fields');
            return;
        }

        setImporting(true);
        setError('');

        try {
            const response = await api.post('/api/github/setup-deployment', {
                owner: selectedRepo.owner.login,
                repo: selectedRepo.name,
                branch: branch,
                projectName: projectName,
                framework: framework,
                envVars: envVars.filter(env => env.key && env.value)
            });

            if (response.data.success) {
                setImportSuccess(response.data.data);
                // Redirect to deployment progress after 2 seconds
                setTimeout(() => {
                    navigate(`/app/projects/${response.data.data._id}`);
                }, 2000);
            }
        } catch (error) {
            console.error('Import failed:', error);
            setError(error.response?.data?.message || 'Failed to import repository');
        } finally {
            setImporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Loading repositories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-2">Import Repository</h1>
                    <p className="text-lg text-black-600 dark:text-white-400">
                        Select a repository from your GitHub account to deploy
                    </p>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 rounded-none flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
                    </div>
                )}

                {importSuccess && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 rounded-none">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-green-800 dark:text-green-200 font-medium">
                                Repository imported successfully!
                            </span>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                            <p><strong>Project:</strong> {importSuccess.projectName}</p>
                            <p><strong>Subdomain:</strong> {importSuccess.subdomain}</p>
                            <p><strong>Custom Domain:</strong> {importSuccess.customDomain}</p>
                            <p className="text-xs">Redirecting to deployment progress...</p>
                        </div>
                    </div>
                )}

                <div>
                    {/* Repository List */}
                    <div>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black-900 dark:text-white-100" />
                                <input
                                    type="text"
                                    placeholder="Search repositories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredRepos.map((repo) => (
                                <div
                                    key={repo.id}
                                    onClick={() => navigate('/app/projects')}
                                    className={`p-4 border-2 rounded-none cursor-pointer transition-all duration-200 hover:shadow-md ${
                                        selectedRepo?.id === repo.id
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-700 hover:shadow-lg'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Github className="w-4 h-4" />
                                                <h3 className="font-bold text-black-900 dark:text-white-100">{repo.name}</h3>
                                                {repo.private && (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded">
                                                        Private
                                                    </span>
                                                )}
                                            </div>
                                            {repo.description && (
                                                <p className="text-sm text-black-600 dark:text-white-400 mb-2 font-medium">
                                                    {repo.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-black-600 dark:text-white-400 font-medium">
                                                {repo.language && (
                                                    <span className="flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                        {repo.language}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {repo.stargazers_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <GitBranch className="w-3 h-3" />
                                                    {repo.default_branch}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(repo.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Import Configuration */}
                    <div className="border-2 border-black-900 dark:border-white-100 rounded-none p-6 bg-white-100 dark:bg-black-700 shadow-md">
                        <h2 className="text-2xl font-bold text-black-900 dark:text-white-100 mb-4">Import Configuration</h2>
                        
                        {selectedRepo ? (
                            <div className="space-y-4">
                                {/* Selected Repository */}
                                <div className="p-3 bg-white-200 dark:bg-black-600 rounded-none border-2 border-black-900 dark:border-white-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Github className="w-4 h-4" />
                                        <span className="font-bold text-black-900 dark:text-white-100">{selectedRepo.full_name}</span>
                                    </div>
                                    <p className="text-sm text-black-600 dark:text-white-400 font-medium">
                                        {selectedRepo.description || 'No description'}
                                    </p>
                                </div>

                                {/* Project Name */}
                                <div>
                                    <label className="block text-sm font-bold text-black-900 dark:text-white-100 mb-2">
                                        Project Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="Enter project name"
                                    />
                                </div>

                                {/* Framework */}
                                <div>
                                    <label className="block text-sm font-bold text-black-900 dark:text-white-100 mb-2">
                                        Framework *
                                    </label>
                                    <select
                                        value={framework}
                                        onChange={(e) => setFramework(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        <option value="">Select framework</option>
                                        {frameworks.map((fw) => (
                                            <option key={fw.value} value={fw.value}>
                                                {fw.label} - {fw.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-bold text-black-900 dark:text-white-100 mb-2">
                                        Branch
                                    </label>
                                    <input
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                        placeholder="main"
                                    />
                                </div>

                                {/* Environment Variables */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-black-900 dark:text-white-100">
                                            Environment Variables
                                        </label>
                                        <button
                                            onClick={addEnvVar}
                                            className="group relative px-3 py-1 text-sm border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none font-bold transition-all duration-200 overflow-hidden"
                                        >
                                            <span className="relative z-10">
                                                Add Variable
                                            </span>
                                        </button>
                                    </div>
                                    
                                    {envVars.map((env, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                placeholder="Key"
                                                value={env.key}
                                                onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                                                className="flex-1 px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 text-sm font-medium"
                                            />
                                            <input
                                                type={env.isSecret ? 'password' : 'text'}
                                                placeholder="Value"
                                                value={env.value}
                                                onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                                                className="flex-1 px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 text-sm font-medium"
                                            />
                                            <label className="flex items-center gap-1 text-sm font-medium text-black-900 dark:text-white-100">
                                                <input
                                                    type="checkbox"
                                                    checked={env.isSecret}
                                                    onChange={(e) => updateEnvVar(index, 'isSecret', e.target.checked)}
                                                />
                                                Secret
                                            </label>
                                            <button
                                                onClick={() => removeEnvVar(index)}
                                                className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none text-sm font-bold border border-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Import Button */}
                                <button
                                    onClick={handleImport}
                                    disabled={importing || !projectName || !framework}
                                    className="group relative w-full py-3 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-4 h-4" />
                                            Import & Deploy
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-black-600 dark:text-white-400">
                                <div className="bg-black-900 dark:bg-white-100 p-4 rounded-none mb-4 inline-block">
                                    <Github className="w-12 h-12 text-white-100 dark:text-black-900" />
                                </div>
                                <p className="font-medium">Select a repository to configure import settings</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportRepository;
