import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Search, Filter, ExternalLink, Star, GitBranch, Calendar, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/axiosConfig';


/* --- IntersectionObserver hook for reveal animations (local to this file) --- */
function useReveal(options = { root: null, rootMargin: "0px", threshold: 0.15 }) {
    const refs = useRef([]);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.dataset.reveal = "true";
                }
            });
        }, options);

        refs.current.forEach((r) => r && observer.observe(r));
        return () => {
            refs.current.forEach((r) => r && observer.unobserve(r));
            observer.disconnect();
        };
    }, [options]);

    const setRef = (el, idx) => {
        refs.current[idx] = el;
    };

    return { setRef };
}

const ImportRepository = () => {
    const navigate = useNavigate();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(null);
    const { setRef } = useReveal();

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
                    <div ref={(el) => setRef(el, 1)} data-reveal className="mb-8 p-6 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[-6px_6px_0_rgba(239,68,68,0.8)] dark:shadow-[-6px_6px_0_rgba(239,68,68,0.3)] flex items-center space-x-4">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                        <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                    </div>
                )}

                {importSuccess && (
                    <div ref={(el) => setRef(el, 2)} data-reveal className="mb-8 p-6 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 shadow-[-6px_6px_0_rgba(34,197,94,0.8)] dark:shadow-[-6px_6px_0_rgba(34,197,94,0.3)]">
                        <div className="flex items-center space-x-4 mb-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                            <span className="text-green-700 dark:text-green-300 font-bold text-lg">
                                Repository imported successfully!
                            </span>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                            <p><strong>Project:</strong> {importSuccess.projectName}</p>
                            <p><strong>Subdomain:</strong> {importSuccess.subdomain}</p>
                            <p><strong>Custom Domain:</strong> {importSuccess.customDomain}</p>
                            <p className="text-xs font-medium">Redirecting to deployment progress...</p>
                        </div>
                    </div>
                )}

                <div>
                    {/* Repository List */}
                    <div className="space-y-8">
                        <div ref={(el) => setRef(el, 3)} data-reveal className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search repositories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-colors duration-200"
                            />
                        </div>

                        <div ref={(el) => setRef(el, 4)} data-reveal className="bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] max-h-96 overflow-y-auto">
                            {filteredRepos.map((repo, idx) => (
                                <div
                                    key={repo.id}
                                    onClick={() => handleRepoSelect(repo)}
                                    className={`p-6 border-b-2 border-black dark:border-white last:border-b-0 cursor-pointer transition-colors duration-200 ${selectedRepo?.id === repo.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30'
                                            : 'hover:bg-white dark:hover:bg-black'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Github className="w-5 h-5" />
                                                <h3 className="font-bold text-black dark:text-white text-lg">{repo.name}</h3>
                                                {repo.private && (
                                                    <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700 font-bold">
                                                        Private
                                                    </span>
                                                )}
                                            </div>
                                            {repo.description && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                                    {repo.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
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
                    <div ref={(el) => setRef(el, 5)} data-reveal className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
                        <h2 className=" text-xl font-bold text-black dark:text-white mb-6">Import Configuration</h2>

                        {selectedRepo ? (
                            <div className="space-y-6">
                                {/* Selected Repository */}
                                <div className="p-4 bg-white dark:bg-black border-2 border-black dark:border-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Github className="w-5 h-5" />
                                        <span className="font-bold text-black dark:text-white text-lg">{selectedRepo.full_name}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {selectedRepo.description || 'No description'}
                                    </p>
                                </div>

                                {/* Project Name */}
                                <div>
                                    <label className="block text-lg font-bold text-black dark:text-white mb-2">
                                        Project Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none transition-colors duration-200"
                                        placeholder="Enter project name"
                                    />
                                </div>

                                {/* Framework */}
                                <div>
                                    <label className="block text-lg font-bold text-black dark:text-white mb-2">
                                        Framework *
                                    </label>
                                    <select
                                        value={framework}
                                        onChange={(e) => setFramework(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white focus:outline-none transition-colors duration-200"
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
                                    className="w-full py-4 border-2 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold text-lg transition-colors duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent hover:text-black dark:hover:bg-transparent dark:hover:text-white"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-5 h-5" />
                                            Import & Deploy
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                                <div className="bg-black dark:bg-white p-6 mb-6 inline-block border-2 border-black dark:border-white">
                                    <Github className="w-16 h-16 text-white dark:text-black" />
                                </div>
                                <p className="text-lg font-medium">Select a repository to configure import settings</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportRepository;
