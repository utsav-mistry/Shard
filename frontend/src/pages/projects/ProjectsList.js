import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Search, ExternalLink, Server, Zap } from 'lucide-react';
import useProjects from '../../hooks/useProjects';

const ProjectsList = () => {
  const { projects, loading, error, refresh } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.repoUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stack badge with enhanced design system
  const getStackBadge = (stack) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-none text-xs font-bold border-2 shadow-sm";
    
    const stackColors = {
      mern: 'bg-green-50 text-green-700 border-green-400 shadow-green-100/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600 dark:shadow-green-900/20',
      django: 'bg-blue-50 text-blue-700 border-blue-400 shadow-blue-100/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600 dark:shadow-blue-900/20',
      flask: 'bg-purple-50 text-purple-700 border-purple-400 shadow-purple-100/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600 dark:shadow-purple-900/20'
    };
    
    const colorClass = stackColors[stack] || 'bg-gray-50 text-gray-700 border-gray-400 shadow-gray-100/50 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600 dark:shadow-gray-900/20';
    
    return (
      <span className={`${baseClasses} ${colorClass}`}>
        {stack?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
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
    <div className="p-8">
      {/* Vercel-style header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">Projects</h1>
          <p className="text-black-600 dark:text-white-400 mt-1">
            Manage and deploy your projects
          </p>
        </div>
        <Link
          to="/app/projects/new"
          className="group relative inline-flex items-center px-4 py-2 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
          <span className="relative z-10 flex items-center transition-colors duration-200">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </span>
        </Link>
      </div>

      {/* Search with consistent design system */}
      <div className="relative max-w-md mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-black-900 dark:text-white-100" />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
          className="block w-full pl-10 pr-4 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-600 dark:placeholder-white-400 focus:outline-none focus:ring-2 focus:ring-black-500 dark:focus:ring-white-500 text-sm font-medium shadow-sm transition-all duration-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Vercel-style projects grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <Server className="mx-auto h-12 w-12 text-black-400 dark:text-white-400 mb-4" />
          <h3 className="text-lg font-medium text-black-900 dark:text-white-100 mb-2">No projects found</h3>
          <p className="text-black-600 dark:text-white-400 mb-6">
            {searchTerm 
              ? 'No projects match your search. Try a different term.'
              : 'Get started by creating your first project.'}
          </p>
          <Link
            to="/app/projects/new"
            className="group relative inline-flex items-center px-4 py-2 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 hover:scale-105 transition-all duration-200 shadow-sm overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <span className="relative z-10 flex items-center transition-colors duration-200">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div 
              key={project._id} 
              className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/10 dark:shadow-white/10"
              onClick={() => window.location.href = `/app/projects/${project._id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black-900 dark:text-white-100 group-hover:text-black-700 dark:group-hover:text-white-200 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-black-600 dark:text-white-400 mt-1 truncate font-medium">
                    {project.repoUrl}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-black-900 dark:text-white-100 group-hover:text-black-700 dark:group-hover:text-white-200 transition-colors flex-shrink-0" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                {getStackBadge(project.stack)}
                <span className="text-xs text-black-600 dark:text-white-400 font-medium">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/deployments/new/${project._id}`;
                  }}
                  className="group relative flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 hover:scale-105 transition-all duration-200 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                  <span className="relative z-10 flex items-center transition-colors duration-200">
                    <Zap className="w-3 h-3 mr-1" />
                    Deploy
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/environment/${project._id}`;
                  }}
                  className="group relative flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 overflow-hidden hover:scale-105"
                >
                  <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                  <span className="relative z-10 flex items-center">
                    <Server className="w-3 h-3 mr-1" />
                    Settings
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;