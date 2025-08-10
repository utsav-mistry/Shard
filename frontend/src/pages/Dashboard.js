import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { Server, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const projectsResponse = await api.get('/projects');
        
        // Fetch recent deployments
        const deploymentsResponse = await api.get('/deploy');
        
        setProjects(projectsResponse.data);
        setDeployments(deploymentsResponse.data.slice(0, 5)); // Get only the 5 most recent deployments
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{currentUser?.email ? `, ${currentUser.email.split('@')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-neutral-150 dark:bg-neutral-850 text-neutral-850 dark:text-neutral-150">
              <div className="h-6 w-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                  <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"></path>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Projects</h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-neutral-250 dark:bg-neutral-750 text-neutral-750 dark:text-neutral-250">
              <Server className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Active Deployments</h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {deployments.filter(d => d.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-neutral-350 dark:bg-neutral-650 text-neutral-650 dark:text-neutral-350">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Pending Deployments</h2>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {deployments.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
          <Link to="/projects" className="text-sm font-medium text-neutral-850 hover:text-neutral-750 dark:text-neutral-250 dark:hover:text-neutral-350">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>You don't have any projects yet.</p>
            <Link to="/projects/new" className="mt-2 inline-block text-neutral-850 hover:text-neutral-750 dark:text-neutral-250 dark:hover:text-neutral-350">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.slice(0, 5).map((project) => (
              <div key={project._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {project.repoUrl}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Created on {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/projects/${project._id}`}
                    className="px-3 py-1 text-sm text-neutral-850 hover:text-neutral-750 dark:text-neutral-250 dark:hover:text-neutral-350 border border-neutral-850 dark:border-neutral-250 rounded-md hover:bg-neutral-150 dark:hover:bg-neutral-850 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent deployments */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Deployments</h2>
          <Link to="/deployments" className="text-sm font-medium text-neutral-850 hover:text-neutral-750 dark:text-neutral-250 dark:hover:text-neutral-350">
            View all
          </Link>
        </div>
        {deployments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>No deployments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deployments.map((deployment) => {
                  // Find the project for this deployment
                  const project = projects.find(p => p._id === deployment.projectId) || { name: 'Unknown Project' };
                  
                  return (
                    <tr key={deployment._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deployment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/deployments/${deployment._id}`}
                          className="text-neutral-850 hover:text-neutral-750 dark:text-neutral-250 dark:hover:text-neutral-350"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;