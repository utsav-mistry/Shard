import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Search, ExternalLink, Server, Zap } from 'lucide-react';
import useProjects from '../../hooks/useProjects';
import { motion } from 'framer-motion';

const ProjectsList = () => {
  const { projects, loading, error, refresh } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.repoUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get stack badge
  const getStackBadge = (stack) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-none text-xs font-medium border-2 shadow-sm transition-all duration-200";
    
    switch (stack) {
      case 'mern':
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 border-black-900 dark:border-white-100`}>
            MERN
          </span>
        );
      case 'django':
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 border-black-900 dark:border-white-100`}>
            Django
          </span>
        );
      case 'flask':
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 border-black-900 dark:border-white-100`}>
            Flask
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-900 dark:text-white-100 border-black-900 dark:border-white-100`}>
            {stack}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black-900 dark:border-white-100 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white-100 dark:bg-black-900 p-6 rounded-none border-2 border-black-900 dark:border-white-100 shadow-sm flex items-center">
        <AlertTriangle className="h-5 w-5 mr-3 text-black-900 dark:text-white-100" />
        <span className="text-black-900 dark:text-white-100">
          {error}
        </span>
      </div>
    );
  }

  return (
    <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl">
      {/* Subtle grid background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2">
        <div>
          <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">Projects</h1>
          <p className="mt-2 text-base text-black-600 dark:text-white-400">
            Manage your projects and deployments
          </p>
        </div>
        <Link
          to="/projects/new"
          className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100 hover:scale-[1.01] active:scale-95"
        >
          <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
          <span className="relative z-10 flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mb-8 px-2">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-black-400 dark:text-white-400" />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
          className="block w-full pl-10 pr-4 py-3 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-400 focus:outline-none focus:ring-0 focus:border-black-900 dark:focus:border-white-100 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects list */}
      <div className="px-2">
        {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white-100/90 dark:bg-black-900/90 backdrop-blur-sm border-2 border-black-900 dark:border-white-100 px-6">
          <Server className="mx-auto h-12 w-12 text-black-400 dark:text-white-400" />
          <h3 className="mt-4 text-lg font-medium text-black-900 dark:text-white-100">No projects found</h3>
          <p className="mt-2 text-base text-black-600 dark:text-white-400 max-w-md mx-auto">
            {searchTerm 
              ? 'No projects match your search. Try a different term.'
              : 'Get started by creating your first project.'}
          </p>
          <div className="mt-8">
            <Link
              to="/projects/new"
              className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100 hover:scale-[1.01] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
              <span className="relative z-10 flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                New Project
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 relative z-0">
          {filteredProjects.map((project) => (
            <motion.div 
              key={project._id} 
              whileHover={{ y: -2 }}
              className="relative bg-white-100 dark:bg-black-900 overflow-hidden border-2 border-black-900 dark:border-white-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Link to={`/dashboard/projects/${project._id}`} className="block p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-black-900 dark:text-white-100 group-hover:underline">
                    {project.name}
                  </h3>
                  <ExternalLink className="h-5 w-5 text-black-400 dark:text-white-400 group-hover:text-black-900 dark:group-hover:text-white-100 transition-colors duration-200 flex-shrink-0 mt-1 ml-2" />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-black-600 dark:text-white-400 truncate">
                    {project.repoUrl}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex space-x-2">
                      {getStackBadge(project.stack)}
                    </div>
                    <span className="text-sm text-black-500 dark:text-white-400">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
              <div className="px-6 pb-6 flex space-x-3">
                <Link
                  to={`/dashboard/deploy/new?projectId=${project._id}`}
                  className="group relative flex-1 inline-flex justify-center items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-medium text-black-900 dark:text-white-100 bg-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy
                </Link>
                <Link
                  to={`/dashboard/projects/${project._id}/environment`}
                  className="group relative flex-1 inline-flex justify-center items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-medium text-black-900 dark:text-white-100 bg-transparent hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Server className="w-4 h-4 mr-2" />
                  Environment
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProjectsList;