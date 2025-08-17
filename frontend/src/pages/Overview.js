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
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      running: { icon: Activity, color: 'text-blue-600 bg-blue-50 border-blue-200' },
      completed: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
      failed: { icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
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
    <div className="space-y-6 bg-white dark:bg-black min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-black p-4 border-2 border-black dark:border-white">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Overview</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => navigate('/app/projects/new')}
            className="inline-flex items-center px-4 py-2 border-2 border-black dark:border-white text-sm font-medium text-black dark:text-white bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/app/projects/new')}
          className="flex items-center justify-center p-6 border-2 border-dashed border-black-300 dark:border-white-700 rounded-lg hover:border-black-400 dark:hover:border-white-600 hover:bg-black-50 dark:hover:bg-white-950 transition-colors group"
        >
          <div className="text-center">
            <Plus className="w-8 h-8 mx-auto mb-2 text-black-400 dark:text-white-600 group-hover:text-black-600 dark:group-hover:text-white-400" />
            <h3 className="text-sm font-medium text-black-900 dark:text-white-100">New Project</h3>
            <p className="text-xs text-black-500 dark:text-white-500">Create a new project</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/projects/import')}
          className="flex items-center justify-center p-6 border-2 border-dashed border-black-300 dark:border-white-700 rounded-lg hover:border-black-400 dark:hover:border-white-600 hover:bg-black-50 dark:hover:bg-white-950 transition-colors group"
        >
          <div className="text-center">
            <Github className="w-8 h-8 mx-auto mb-2 text-black-400 dark:text-white-600 group-hover:text-black-600 dark:group-hover:text-white-400" />
            <h3 className="text-sm font-medium text-black-900 dark:text-white-100">Import Git Repository</h3>
            <p className="text-xs text-black-500 dark:text-white-500">Deploy from GitHub</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/app/deployments/new')}
          className="flex items-center justify-center p-6 border-2 border-dashed border-black-300 dark:border-white-700 rounded-lg hover:border-black-400 dark:hover:border-white-600 hover:bg-black-50 dark:hover:bg-white-950 transition-colors group"
        >
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-black-400 dark:text-white-600 group-hover:text-black-600 dark:group-hover:text-white-400" />
            <h3 className="text-sm font-medium text-black-900 dark:text-white-100">Deploy</h3>
            <p className="text-xs text-black-500 dark:text-white-500">Deploy existing project</p>
          </div>
        </button>
      </div>

      {/* GitHub Integration Banner */}
      {!githubConnected && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Github className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Connect your GitHub account
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Import repositories and enable automatic deployments
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/integrations/github')}
              className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-black-900 dark:text-white-100">
              Recent Projects
            </h2>
            <button
              onClick={() => navigate('/app/projects')}
              className="text-sm text-black-600 dark:text-white-400 hover:text-black-900 dark:hover:text-white-100 transition-colors"
            >
              View all
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="border border-black-200 dark:border-white-800 rounded-lg p-6 text-center">
              <p className="text-sm text-black-500 dark:text-white-500 mb-3">
                No projects yet
              </p>
              <button
                onClick={() => navigate('/app/projects/new')}
                className="text-sm font-medium text-black-900 dark:text-white-100 hover:underline"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div
                  key={project._id}
                  className="border border-black-200 dark:border-white-800 rounded-lg p-4 hover:bg-black-50 dark:hover:bg-white-950 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/projects/${project._id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-black-900 dark:text-white-100">
                        {project.name}
                      </h3>
                      <p className="text-xs text-black-500 dark:text-white-500 mt-1">
                        {project.repoUrl}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-black-400 dark:text-white-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-black-900 dark:text-white-100">
              Recent Deployments
            </h2>
            <button
              onClick={() => navigate('/app/deployments')}
              className="text-sm text-black-600 dark:text-white-400 hover:text-black-900 dark:hover:text-white-100 transition-colors"
            >
              View all
            </button>
          </div>

          {recentDeployments.length === 0 ? (
            <div className="border border-black-200 dark:border-white-800 rounded-lg p-6 text-center">
              <p className="text-sm text-black-500 dark:text-white-500 mb-3">
                No deployments yet
              </p>
              <button
                onClick={() => navigate('/app/deployments/new')}
                className="text-sm font-medium text-black-900 dark:text-white-100 hover:underline"
              >
                Create your first deployment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeployments.map((deployment) => (
                <div
                  key={deployment._id}
                  className="border border-black-200 dark:border-white-800 rounded-lg p-4 hover:bg-black-50 dark:hover:bg-white-950 transition-colors cursor-pointer"
                  onClick={() => navigate(`/app/deployments/${deployment._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-black-900 dark:text-white-100">
                      {deployment.projectName || 'Unknown Project'}
                    </h3>
                    {getStatusBadge(deployment.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-black-500 dark:text-white-500">
                    <span>{deployment.commitHash?.substring(0, 8) || 'No commit'}</span>
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
