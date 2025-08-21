import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, Server, Clock, CheckCircle, XCircle, AlertTriangle, Key, Trash2, Settings, Activity, Globe } from 'lucide-react';

/* --- IntersectionObserver hook for reveal animations --- */
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

      // Create new deployment with AI review settings
      const aiReviewEnabled = !(project?.settings?.aiOptOut || project?.aiOptOut);
      const deploymentPayload = {
        projectId: id,
        branch: 'main', // Default branch, could be configurable
        enableAiReview: aiReviewEnabled,
        aiModel: aiReviewEnabled ? 'deepseek_lite' : undefined
      };
      
      console.log('[DEBUG] Frontend deployment payload:', deploymentPayload);
      const response = await api.post('/api/deployments', deploymentPayload);

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

  const handleAiOptOutToggle = async (e) => {
    const isChecked = e.target.checked;
    // When checkbox is checked = AI review enabled = aiOptOut should be false
    const aiOptOutValue = !isChecked;
    try {
      const updatedProject = { ...project, settings: { ...project.settings, aiOptOut: aiOptOutValue } };
      setProject(updatedProject);

      await api.put(`/api/projects/${id}`, { settings: { aiOptOut: aiOptOutValue } });

    } catch (err) {
      console.error('Failed to update AI opt-out setting:', err);
      // Revert UI on failure
      const revertedProject = { ...project, settings: { ...project.settings, aiOptOut: !aiOptOutValue } };
      setProject(revertedProject);
      setError('Failed to update AI setting. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    try {
      let response;
      if (deleteType === 'deployment') {
        response = await api.delete(`/api/deployments/${itemToDelete}`);
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

  const { setRef } = useReveal();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-black">
        <div className="animate-spin border-2 border-black dark:border-white border-t-transparent h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 shadow-[-6px_6px_0_rgba(239,68,68,0.8)] dark:shadow-[-6px_6px_0_rgba(239,68,68,0.3)] flex items-center space-x-4">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
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
      <div className="p-6 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-[-6px_6px_0_rgba(245,158,11,0.8)] dark:shadow-[-6px_6px_0_rgba(245,158,11,0.3)] flex items-center space-x-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <span className="text-yellow-700 dark:text-yellow-300 font-medium">Project not found</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px)
          `,
        }}
      />

      {/* Reveal animation styles */}
      <style>{`
        [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms ease; }
        [data-reveal="true"] { opacity: 1; transform: translateY(0); }
      `}</style>

      <main className="relative z-10 px-10 py-16">
        {/* Header */}
        <div ref={(el) => setRef(el, 0)} data-reveal className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/app/projects')}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-black dark:border-white mr-6 transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-5xl font-extrabold mb-2">{project.name}</h1>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {project.subdomain ? `${project.subdomain}.localhost` : project.repoUrl}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={showDeploymentStatus}
              className="inline-flex items-center justify-center px-6 py-3 font-medium 
            bg-white-100 dark:bg-black-800 
           text-white dark:text-black hover:text-black dark:hover:text-white border-2 border-black dark:border-white 
             transition-colors duration-300 cursor-pointer rounded-none shadow-sm mt-6 sm:mt-0"
            >
              {deployments.length > 0 ? 'View Deployment' : 'Deploy'}
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center justify-center px-6 py-3 font-medium
             bg-white-100 dark:bg-black-800
             text-red-600 dark:text-red-600
             border-2 border-red-600 dark:border-red-600
             transition-colors duration-300 cursor-pointer rounded-none shadow-sm mt-6 sm:mt-0"
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Delete
            </button>



          </div>
        </div>

        {/* Tabs */}
        <div ref={(el) => setRef(el, 1)} data-reveal className="mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-base font-bold border-2 transition-colors duration-300 ${activeTab === 'overview'
                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                : 'border-black dark:border-white  text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('deployments')}
              className={`px-6 py-3 text-base font-bold border-2 transition-colors duration-300 flex items-center ${activeTab === 'deployments'
                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                : 'border-black dark:border-white  text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                }`}
            >
              <Activity className="w-5 h-5 mr-2" />
              Deployments
            </button>
            <button
              onClick={() => setActiveTab('environment')}
              className={`px-6 py-3 text-base font-bold border-2 transition-colors duration-300 flex items-center ${activeTab === 'environment'
                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                : 'border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                }`}
            >
              <Key className="w-5 h-5 mr-2" />
              Environment
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-base font-bold border-2 transition-colors duration-300 flex items-center ${activeTab === 'settings'
                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                : 'border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Project Info Cards */}
            <div ref={(el) => setRef(el, 2)} data-reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
                <div className="flex items-center mb-3">
                  <Globe className="h-5 w-5 text-black dark:text-white mr-2" />
                  <h3 className="text-sm font-bold text-black dark:text-white">Production</h3>
                </div>
                <a
                  href={project.subdomain ? `http://${project.subdomain}.localhost:${project.framework === 'mern' ? '12000' : project.framework === 'django' ? '13000' : '14000'}` : `http://localhost:3000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {project.subdomain ? `${project.subdomain}.localhost` : 'localhost:3000'}
                </a>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
                <div className="flex items-center mb-3">
                  <Server className="h-5 w-5 text-black dark:text-white mr-2" />
                  <h3 className="text-sm font-bold text-black dark:text-white">Framework</h3>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium capitalize">{project.framework}</span>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
                <div className="flex items-center mb-3">
                  <Activity className="h-5 w-5 text-black dark:text-white mr-2" />
                  <h3 className="text-sm font-bold text-black dark:text-white">Last Deploy</h3>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {deployments.length > 0 ? new Date(deployments[0].createdAt).toLocaleDateString() : 'Never'}
                </span>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
                <div className="flex items-center mb-3">
                  <Globe className="h-5 w-5 text-black dark:text-white mr-2" />
                  <h3 className="text-sm font-bold text-black dark:text-white">Status</h3>
                </div>
                <span className="inline-flex items-center px-3 py-1 text-xs font-bold border-2 bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700">
                  {project.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Additional Project Details */}
            <div ref={(el) => setRef(el, 3)} data-reveal className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
              <h3 className="text-xl font-bold text-black dark:text-white mb-6">Project Details</h3>
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
                    {deployments.map((deployment, index) => {
                      const isLatest = index === 0;
                      return (
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
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(deployment.status)}
                              {!isLatest && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold">
                                  Deprecated
                                </span>
                              )}
                            </div>
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
                      )
                    })}
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

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* AI Review Settings */}
            <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
              <div className="px-6 py-4 border-b-2 border-black-200 dark:border-white-700">
                <h2 className="text-lg font-medium text-black-900 dark:text-white-100">AI Code Review</h2>
                <p className="text-sm text-black-500 dark:text-white-400 mt-1">Configure AI-powered code analysis for your deployments</p>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-black-900 dark:text-white-100">Enable AI Review</h3>
                    <p className="text-sm text-black-500 dark:text-white-400">Automatically analyze code quality, security issues, and best practices before deployment</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!project?.settings?.aiOptOut && !project?.aiOptOut}
                      onChange={handleAiOptOutToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Project Danger Zone */}
            <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-red-200 dark:border-red-700">
              <div className="px-6 py-4 border-b-2 border-red-200 dark:border-red-700">
                <h2 className="text-lg font-medium text-red-900 dark:text-red-100">Danger Zone</h2>
                <p className="text-sm text-red-500 dark:text-red-400 mt-1">Irreversible and destructive actions</p>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-900 dark:text-red-100">Delete Project</h3>
                    <p className="text-sm text-red-500 dark:text-red-400">Permanently delete this project and all associated data</p>
                  </div>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border-2 border-red-600 rounded-none shadow-md text-sm font-medium text-red-600 bg-white hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-red-900/20 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {deleteModalOpen && !itemToDelete && (
          <div className="fixed inset-0 z-20 flex items-center justify-center">
            {/* Page blur overlay */}
            <div className="absolute inset-0 backdrop-blur-sm bg-black/30"></div>

            {/* Modal */}
            <div className="bg-white-200 dark:bg-gray-900 rounded-xl 
                    border-2 border-black dark:border-white 
                    shadow-xl max-w-lg w-full p-6 z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Delete Project
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this project? All project data including deployments, environment variables, and logs will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleDeleteProject}
                  disabled={deleteLoading}
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-bold rounded-lg border border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="inline-flex items-center justify-center px-4 py-2 
                     bg-white dark:bg-gray-900 
                     text-gray-700 dark:text-gray-100 
                     font-medium rounded-lg 
                     border-2 border-black-200 dark:border-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}



      </main>
    </div>
  )
}

export default ProjectDetail;