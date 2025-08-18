import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, Server, Clock, CheckCircle, XCircle, AlertTriangle, Key, Trash2, Settings, Activity, Globe } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [envVars, setEnvVars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Generic for deployment or env var
  const [deleteType, setDeleteType] = useState(''); // 'deployment' or 'envVar'
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Fetch project details first - this is critical
        try {
          const projectResponse = await api.get(`/api/projects/${id}`);
          if (projectResponse.data.success) {
            setProject(projectResponse.data.data);
          } else {
            throw new Error(projectResponse.data.message || 'Failed to load project');
          }
        } catch (projectErr) {
          console.error('Error fetching project:', projectErr);
          setError(projectErr.message || 'Failed to load project data');
          setLoading(false);
          return;
        }

        // Fetch deployments - non-critical, continue if fails
        try {
          const deploymentsResponse = await api.get('/api/deployments');
          if (deploymentsResponse.data.success) {
            const allDeployments = deploymentsResponse.data.data || [];
            const projectDeployments = allDeployments
              .filter(deployment => {
                const deploymentProjectId = deployment.projectId?._id || deployment.projectId;
                return deploymentProjectId === id || deploymentProjectId?.toString() === id;
              })
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setDeployments(projectDeployments);
          } else {
            console.error('Failed to load deployments:', deploymentsResponse.data);
            setDeployments([]);
          }
        } catch (deployErr) {
          console.error('Error fetching deployments:', deployErr);
          setDeployments([]);
        }

        // Fetch environment variables - non-critical, continue if fails
        try {
          const envVarsResponse = await api.get(`/api/projects/${id}/env`);
          if (envVarsResponse.data.success) {
            setEnvVars(envVarsResponse.data.data || []);
          } else {
            console.error('Failed to load environment variables:', envVarsResponse.data);
            setEnvVars([]);
          }
        } catch (envErr) {
          console.error('Error fetching environment variables:', envErr);
          setEnvVars([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error in fetchProjectData:', err);
        setError('An unexpected error occurred while loading project data');
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Server className="w-3 h-3 mr-1" />
            Running
          </span>
        );
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  // Handle project deletion
  // Handle project deletion
  const handleDeleteProject = async () => {
    try {
      setDeleteLoading(true);

      // Use the correct API endpoint with DELETE method
      const response = await api.delete(`/api/projects/${id}`);

      // Handle standardized response
      if (response.data && response.data.success) {
        // Redirect to projects list after successful deletion
        navigate('/app/projects');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      setDeleteLoading(false);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Show deployment status and options (Vercel-style)
  const showDeploymentStatus = () => {
    // Get latest deployment
    const latestDeployment = deployments.length > 0 ? deployments[0] : null;

    if (!latestDeployment) {
      // No deployments - show deploy button
      return triggerNewDeployment();
    }

    // Show current deployment status with logs and AI review
    navigate(`/app/deployments/${latestDeployment._id}`);
  };

  // Trigger new deployment
  const triggerNewDeployment = async () => {
    try {
      setLoading(true);

      // Create new deployment
      const response = await api.post('/api/deployments', {
        projectId: id,
        branch: 'main' // Default branch, could be configurable
      });

      if (response.data.success) {
        // Redirect to deployment progress page to show Vercel-style progress
        navigate(`/app/deployments/${response.data.data._id}`);
      } else {
        setError('Failed to trigger deployment');
      }
    } catch (err) {
      console.error('Error triggering deployment:', err);
      setError('Failed to trigger deployment');
    } finally {
      setLoading(false);
    }
  };

  // Handle deployment deletion
  const handleDeleteDeployment = (deploymentId) => {
    setItemToDelete(deploymentId);
    setDeleteType('deployment');
    setDeleteModalOpen(true);
  };

  // Handle env var deletion
  const handleDeleteEnvVar = (envVarId) => {
    setItemToDelete(envVarId);
    setDeleteType('envVar');
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      let response;
      if (deleteType === 'deployment') {
        response = await api.delete(`/api/deploy/${itemToDelete}`);
        if (response.data.success) {
          setDeployments(deployments.filter(d => d._id !== itemToDelete));
        }
      } else if (deleteType === 'envVar') {
        response = await api.delete(`/api/projects/${id}/env/${itemToDelete}`);
        if (response.data.success) {
          setEnvVars(envVars.filter(e => e._id !== itemToDelete));
        }
      }

      if (response && response.data.success) {
        setDeleteModalOpen(false);
        setItemToDelete(null);
        setDeleteType('');
      } else {
        setError(`Failed to delete ${deleteType}`);
      }
    } catch (err) {
      console.error(`Error deleting ${deleteType}:`, err);
      setError(`Failed to delete ${deleteType}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-none border-2 border-red-600 dark:border-red-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  const latestSuccessfulDeployment = deployments
    .filter(d => d.status === 'success')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  const getProductionUrl = () => {
    if (latestSuccessfulDeployment && latestSuccessfulDeployment.port) {
      return `http://${project.subdomain}.localhost:${latestSuccessfulDeployment.port}`;
    }
    // Fallback for older projects or if port isn't available
    return project.subdomain ? `http://${project.subdomain}.localhost:3000` : '#';
  };

  if (!project) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-none border-2 border-yellow-600 dark:border-yellow-400 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="font-medium">Project not found</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Vercel-style header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/projects')}
            className="group relative mr-4 p-2 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 rounded-none border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:scale-110 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <ArrowLeft className="h-4 w-4 relative z-10" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">{project.name}</h1>
            <p className="text-black-600 dark:text-white-400 text-sm mt-1 font-medium">
              {project.subdomain ? `${project.subdomain}.localhost` : project.repoUrl}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={showDeploymentStatus}
            className="group relative inline-flex items-center px-4 py-2 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <span className="relative z-10 transition-colors duration-200">
              {deployments.length > 0 ? 'View Deployment' : 'Deploy'}
            </span>
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="group relative inline-flex items-center px-4 py-2 text-sm font-bold border-2 border-red-600 text-red-600 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 overflow-hidden hover:scale-105"
          >
            <span className="absolute inset-0 w-full h-full bg-red-600 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <span className="relative z-10 flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </span>
          </button>
        </div>
      </div>

      {/* Consistent tabs design */}
      <div className="border-b-2 border-black-900 dark:border-white-100 mb-6">
        <nav className="-mb-px flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'overview'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'overview' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'deployments'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'deployments' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10 flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Deployments
            </span>
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${activeTab === 'environment'
              ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
              : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
              }`}
          >
            {activeTab !== 'settings' && (
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10 flex items-center">
                            <Key className="w-4 h-4 mr-1" />
              Environment
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Production</h3>
              </div>
              <div className="mt-2">
                <a
                  href={getProductionUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-medium"
                >
                  {project.subdomain ? `${project.subdomain}.localhost:${latestSuccessfulDeployment?.port || '3000'}` : 'Not Deployed'}
                </a>
              </div>
            </div>

            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Server className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Framework</h3>
              </div>
              <div className="mt-2">
                <span className="text-sm text-black-600 dark:text-white-400 font-medium capitalize">{project.framework}</span>
              </div>
            </div>

            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Last Deploy</h3>
              </div>
              <div className="mt-2">
                <span className="text-sm text-black-600 dark:text-white-400 font-medium">
                  {deployments.length > 0 ? new Date(deployments[0].createdAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-sm">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-black-900 dark:text-white-100 mr-2" />
                <h3 className="text-sm font-bold text-black-900 dark:text-white-100">Status</h3>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold border-2 bg-green-50 text-green-700 border-green-400 shadow-green-100/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600">
                  {project.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Project Details */}
          <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-lg shadow-black/10 dark:shadow-white/10">
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4">Project Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Owner</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center">
                    <span className="text-white-100 dark:text-black-900 text-sm font-bold">
                      {project.ownerId?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black-900 dark:text-white-100">{project.ownerId?.name || 'Unknown'}</p>
                    <p className="text-xs text-black-600 dark:text-white-400">{project.ownerId?.email || 'No email'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Repository</h4>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-medium break-all"
                >
                  {project.repoUrl}
                </a>
              </div>
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Subdomain</h4>
                <p className="text-sm text-black-600 dark:text-white-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-none">
                  {project.subdomain || 'Not assigned'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Created</h4>
                <p className="text-sm text-black-600 dark:text-white-400 font-medium">
                  {new Date(project.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Build Settings */}
          <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-lg shadow-black/10 dark:shadow-white/10">
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4">Build Configuration</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Build Command</h4>
                <p className="text-sm text-black-600 dark:text-white-400 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none">
                  {project.settings?.buildCommand || 'npm install && npm run build'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Start Command</h4>
                <p className="text-sm text-black-600 dark:text-white-400 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-none">
                  {project.settings?.startCommand || 'npm start'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-black-900 dark:text-white-100 mb-2">Deploy Mode</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-bold border-2 bg-blue-50 text-blue-700 border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600">
                  MANUAL ONLY
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deployments' && (
        <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none overflow-hidden shadow-md">
          <div className="px-6 py-4 border-b-2 border-black-900 dark:border-white-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">All Deployments</h2>
            <button
              onClick={showDeploymentStatus}
              className="group relative inline-flex items-center px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">{deployments.length > 0 ? 'View Status' : 'Deploy'}</span>
            </button>
          </div>
          {deployments.length === 0 ? (
            <div className="px-6 py-8 text-center text-black-600 dark:text-white-400">
              <div className="bg-black-900 dark:bg-white-100 p-4 rounded-none mb-4 inline-block">
                <Server className="h-12 w-12 text-white-100 dark:text-black-900" />
              </div>
              <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-2">No deployments yet</h3>
              <p className="text-sm mb-4 font-medium">Deploy your project to see it live on the web.</p>
              <button
                onClick={triggerNewDeployment}
                className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10">Deploy Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black-900 dark:divide-white-100">
                <thead className="bg-white-200 dark:bg-black-600">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Commit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Finished
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-black-900 dark:text-white-100 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white-100 dark:bg-black-700 divide-y divide-black-900 dark:divide-white-100">
                  {deployments.map((deployment) => (
                    <tr key={deployment._id} className="hover:bg-white-200 dark:hover:bg-black-600 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-bold text-black-900 dark:text-white-100">
                            {deployment.commitMessage ?
                              deployment.commitMessage.length > 50 ?
                                `${deployment.commitMessage.substring(0, 50)}...` :
                                deployment.commitMessage
                              : 'No commit message'
                            }
                          </div>
                          <div className="text-xs text-black-600 dark:text-white-400 font-medium">
                            {deployment.commitHash ? deployment.commitHash.substring(0, 8) : 'No commit hash'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deployment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600 dark:text-white-400 font-medium">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-black-600 dark:text-white-400 font-medium">
                        {deployment.finishedAt ? new Date(deployment.finishedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/app/deployments/${deployment._id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-b-2 border-transparent hover:border-blue-600 dark:hover:border-blue-400 transition-all font-bold"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteDeployment(deployment._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border-b-2 border-transparent hover:border-red-600 dark:hover:border-red-400 transition-all font-bold"
                            title="Delete deployment"
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
          )}
        </div>
      )}

      {activeTab === 'environment' && (
        <div className="space-y-8">
          {/* Environment Variables */}
          <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
            <div className="px-6 py-4 border-b-2 border-black-200 dark:border-white-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-black-900 dark:text-white-100">Environment Variables</h2>
              <Link
                to={`/app/environment/${id}/new`}
                className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none"
              >
                Add Variable
              </Link>
            </div>
            {envVars.length === 0 ? (
              <div className="px-6 py-4 text-center text-black-500 dark:text-white-400">
                <Key className="mx-auto h-12 w-12 text-black-400 dark:text-white-500 mb-2" />
                <p>No environment variables found</p>
                <p className="text-sm mt-1">Add environment variables to configure your application</p>
              </div>
            ) : (
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
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white-100 dark:bg-black-900 divide-y divide-black-200 dark:divide-white-700">
                    {envVars.map((envVar) => (
                      <tr key={envVar._id} className="hover:bg-white-200 dark:hover:bg-black-800 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black-900 dark:text-white-100">
                          {envVar.key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                          ••••••••••••
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                          {new Date(envVar.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/app/environment/${id}/edit/${envVar._id}`}
                            className="text-black-600 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => handleDeleteEnvVar(envVar._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generic Delete Confirmation Modal */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                      {`Delete ${deleteType === 'deployment' ? 'Deployment' : 'Environment Variable'}`}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this {deleteType === 'deployment' ? 'deployment' : 'environment variable'}? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && !itemToDelete && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Delete project
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this project? All of the project data including deployments, environment variables, and logs will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-750 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteProject}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail;