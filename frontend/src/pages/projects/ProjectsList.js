import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, AlertTriangle, Search, ExternalLink, Server, Package } from 'lucide-react';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setProjects(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.repoUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stack badge
  const getStackBadge = (stack) => {
    switch (stack) {
      case 'mern':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-800 dark:border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md">
            MERN
          </span>
        );
      case 'django':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-800 dark:border-green-200 shadow-sm transition-all duration-200 hover:shadow-md">
            Django
          </span>
        );
      case 'flask':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-800 dark:border-purple-200 shadow-sm transition-all duration-200 hover:shadow-md">
            Flask
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-black-100 text-black-800 dark:bg-white-700 dark:text-white-300 border border-black-800 dark:border-white-300 shadow-sm transition-all duration-200 hover:shadow-md">
            {stack}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">Projects</h1>
          <p className="mt-1 text-sm text-black-500 dark:text-white-400">
            Manage your projects and deployments
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/dashboard/projects/new"
            className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none p-4 border-2 border-black-200 dark:border-white-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-black-400 dark:text-white-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-2 border-black-300 dark:border-white-700 rounded-none leading-5 bg-white-100 dark:bg-black-900 placeholder-black-500 dark:placeholder-white-400 focus:outline-none focus:placeholder-black-400 dark:focus:placeholder-white-500 focus:ring-1 focus:ring-black-900 dark:focus:ring-white-100 focus:border-black-900 dark:focus:border-white-100 sm:text-sm transition-all duration-200"
            placeholder="Search projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Projects list */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none p-6 text-center border-2 border-black-200 dark:border-white-700">
          <Package className="mx-auto h-12 w-12 text-black-400 dark:text-white-500" />
          <h3 className="mt-2 text-sm font-medium text-black-900 dark:text-white-100">
            {searchTerm ? 'No projects found' : 'No projects'}
          </h3>
          <p className="mt-1 text-sm text-black-500 dark:text-white-400">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Get started by creating a new project'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/dashboard/projects/new"
                className="inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none shadow-md text-sm font-medium text-white-100 bg-black-900 dark:text-black-900 dark:bg-white-100 hover:shadow-lg hover:translate-y-[-2px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-900 dark:focus:ring-white-100"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Project
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white-100 dark:bg-black-900 shadow-md rounded-none overflow-hidden border-2 border-black-200 dark:border-white-700">
          <ul className="divide-y divide-black-200 dark:divide-white-700">
            {filteredProjects.map((project) => (
              <li key={project._id} className="hover:bg-white-200 dark:hover:bg-black-800 transition-colors duration-200">
                <div className="px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-black-900 dark:text-white-100">{project.name}</h3>
                      <div className="ml-2">{getStackBadge(project.stack)}</div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-black-500 dark:text-white-400">
                      <ExternalLink className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      <span>{project.repoUrl}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-black-500 dark:text-white-400">
                      <Server className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      <span>{project.subdomain}.shard.dev</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-4">
                    <Link
                      to={`/dashboard/projects/${project._id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm leading-5 font-medium rounded-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    >
                      View
                    </Link>
                    <Link
                      to={`/dashboard/deployments/new/${project._id}`}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-none text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    >
                      Deploy
                    </Link>
                    <Link
                      to={`/dashboard/environment/${project._id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm leading-5 font-medium rounded-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                    >
                      Environment
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;