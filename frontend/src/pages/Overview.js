import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Github, ExternalLink, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import api from '../utils/axiosConfig';

const Overview = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [projectsRes, deploymentsRes, profileRes] = await Promise.all([
        api.get('/projects'),
        api.get('/deployments'),
        api.get('/auth/profile')
      ]);

      setProjects(projectsRes.data?.projects || []);
      setDeployments(deploymentsRes.data?.deployments || []);
      
      const user = profileRes.data?.data?.user || profileRes.data?.user;
      setGithubConnected(!!user?.githubUsername);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: 'Pending'
      },
      running: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Activity className="w-3 h-3 mr-1" />,
        label: 'Running'
      },
      completed: {
        bg: 'bg-black-900 dark:bg-white-100',
        text: 'text-white-100 dark:text-black-900',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        label: 'Completed'
      },
      failed: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
        label: 'Failed'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-none ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const recentProjects = projects.slice(0, 3);
  const recentDeployments = deployments.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black-900 dark:border-white-100 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white-100 dark:bg-black-900 min-h-screen p-6 relative">
      {/* Grid Background */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white-100 dark:bg-black-900 p-6 border-2 border-black-900 dark:border-white-100 rounded-none shadow-lg shadow-black/10 dark:shadow-white/10 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-black-900 dark:text-white-100">Overview</h1>
          <p className="mt-2 text-lg text-black-600 dark:text-white-400">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => navigate('/app/projects/new')}
            className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
            <span className="relative z-10 flex items-center">
              <Plus className="w-5 w-5 mr-2" />
              New Project
            </span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate('/app/projects/new')}
          className="group relative flex flex-col items-center justify-center p-8 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/10 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20"
        >
          <div className="text-center">
            <div className="mb-4 p-3 border-2 border-dotted border-gray-400 dark:border-gray-600 group-hover:border-black-900 dark:group-hover:border-white-100 rounded-none group-hover:bg-black-900 group-hover:text-white-100 dark:group-hover:bg-white-100 dark:group-hover:text-black-900 transition-all duration-200 shadow-sm">
              <Plus className="text-black-900 dark:text-white-100 group-hover:text-white-100 dark:group-hover:text-black-900" />
            </div>
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-2">New Project</h3>
            <p className="text-sm text-black-600 dark:text-white-400">Create a new project from scratch</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/projects/import')}
          className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-black-900 dark:hover:border-white-100 rounded-none bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10"
        >
          <div className="text-center">
            <div className="mb-4 p-3 border-2 border-dotted border-gray-300 dark:border-gray-700 group-hover:border-black-900 dark:group-hover:border-white-100 rounded-none group-hover:bg-black-900 group-hover:text-white-100 dark:group-hover:bg-white-100 dark:group-hover:text-black-900 transition-all duration-200 shadow-sm">
              <Github className="w-8 h-8 text-black-900 dark:text-white-100 group-hover:text-white-100 dark:group-hover:text-black-900" />
            </div>
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-2">Import Repository</h3>
            <p className="text-sm text-black-600 dark:text-white-400">Deploy from GitHub</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/deployments/new')}
          className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-400 dark:border-gray-600 hover:border-black-900 dark:hover:border-white-100 rounded-none bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/5 dark:shadow-white/5 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10"
        >
          <div className="text-center">
            <div className="mb-4 p-3 border-2 border-dotted border-gray-300 dark:border-gray-700 group-hover:border-black-900 dark:group-hover:border-white-100 rounded-none group-hover:bg-black-900 group-hover:text-white-100 dark:group-hover:bg-white-100 dark:group-hover:text-black-900 transition-all duration-200 shadow-sm">
              <Zap className="w-8 h-8 text-black-900 dark:text-white-100 group-hover:text-white-100 dark:group-hover:text-black-900" />
            </div>
            <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-2">Deploy</h3>
            <p className="text-sm text-black-600 dark:text-white-400">Deploy existing project</p>
          </div>
        </button>
      </div>

      {/* GitHub Integration Banner */}
      {!githubConnected && (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black-900 dark:border-white-100 rounded-none shadow-lg shadow-black/10 dark:shadow-white/10 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 border-2 border-black-900 dark:border-white-100 rounded-none mr-4 shadow-sm">
                <Github className="w-6 h-6 text-black-900 dark:text-white-100" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-1">
                  Connect your GitHub account
                </h3>
                <p className="text-sm text-black-600 dark:text-white-400">
                  Import repositories and enable automatic deployments
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/integrations/github')}
              className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
              <span className="relative z-10">Connect</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">
              Recent Projects
            </h2>
            <button
              onClick={() => navigate('/app/projects')}
              className="text-sm font-medium text-black-600 dark:text-white-400 hover:text-black-900 dark:hover:text-white-100 transition-colors hover:underline"
            >
              View all →
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="border-2 border-black-900 dark:border-white-100 rounded-none p-8 text-center bg-white-100 dark:bg-black-900 shadow-lg shadow-black/10 dark:shadow-white/10 relative z-10">
              <p className="text-lg text-black-600 dark:text-white-400 mb-4">
                No projects yet
              </p>
              <button
                onClick={() => navigate('/app/projects/new')}
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
              >
                <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
                <span className="relative z-10">Create your first project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div
                  key={project._id}
                  className="border-2 border-black-900 dark:border-white-100 rounded-none p-6 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-95 bg-white-100 dark:bg-black-900 shadow-sm"
                  onClick={() => navigate(`/app/projects/${project._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-black-600 dark:text-white-400">
                        {project.repoUrl}
                      </p>
                    </div>
                    <div className="p-2 border-2 border-dotted border-gray-400 dark:border-gray-600 rounded-none shadow-sm">
                      <ExternalLink className="w-5 h-5 text-black-900 dark:text-white-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">
              Recent Deployments
            </h2>
            <button
              onClick={() => navigate('/app/deployments')}
              className="text-sm font-medium text-black-600 dark:text-white-400 hover:text-black-900 dark:hover:text-white-100 transition-colors hover:underline"
            >
              View all →
            </button>
          </div>

          {recentDeployments.length === 0 ? (
            <div className="border-2 border-black-900 dark:border-white-100 rounded-none p-8 text-center bg-white-100 dark:bg-black-900 shadow-sm">
              <p className="text-lg text-black-600 dark:text-white-400 mb-4">
                No deployments yet
              </p>
              <button
                onClick={() => navigate('/app/deployments/new')}
                className="group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
              >
                <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
                <span className="relative z-10">Create your first deployment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDeployments.map((deployment) => (
                <div
                  key={deployment._id}
                  className="border-2 border-black-900 dark:border-white-100 rounded-none p-6 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-95 bg-white-100 dark:bg-black-900 shadow-sm"
                  onClick={() => navigate(`/app/deployments/${deployment._id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-black-900 dark:text-white-100">
                      {deployment.projectName || 'Unknown Project'}
                    </h3>
                    {getStatusBadge(deployment.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-black-600 dark:text-white-400">
                    <span className="font-medium">{deployment.commitHash?.substring(0, 8) || 'No commit'}</span>
                    <span>{new Date(deployment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
