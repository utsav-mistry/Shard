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
    project.repoUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.subdomain && project.subdomain.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-3xl font-extrabold text-black-900 dark:text-white-100">Projects</h1>
          <p className="mt-2 text-lg text-black-600 dark:text-white-400">
            Manage and deploy your projects
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/app/projects/new"
            className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
            <span className="relative z-10 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </span>
          </Link>
        </div>
      </div>

      {/* Search with enhanced styling */}
      <div className="relative max-w-md bg-white-100 dark:bg-black-900 p-4 border-2 border-black-900 dark:border-white-100 rounded-none shadow-lg shadow-black/10 dark:shadow-white/10 relative z-10">
        <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-black-600 dark:text-white-400" />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
          className="block w-full pl-12 pr-4 py-3 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 placeholder-black-600 dark:placeholder-white-400 focus:outline-none focus:ring-2 focus:ring-black-500 dark:focus:ring-white-500 text-base font-medium shadow-sm transition-all duration-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects grid with enhanced styling */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-12 text-center shadow-lg shadow-black/10 dark:shadow-white/10 relative z-10">
          <div className="p-4 border-2 border-dotted border-gray-400 dark:border-gray-600 rounded-none mb-6 inline-block">
            <Server className="h-12 w-12 text-black-600 dark:text-white-400" />
          </div>
          <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-3">No projects found</h3>
          <p className="text-base text-black-600 dark:text-white-400 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'No projects match your search. Try a different term or create a new project.'
              : 'Get started by creating your first project and begin deploying your applications.'}
          </p>
          <Link
            to="/app/projects/new"
            className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
            <span className="relative z-10 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
          {filteredProjects.map((project) => (
            <div 
              key={project._id} 
              className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none p-6 hover:shadow-xl hover:shadow-black/20 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer group shadow-lg shadow-black/10 dark:shadow-white/10"
              onClick={() => window.location.href = `/app/projects/${project._id}?tab=deployments`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-black-900 dark:text-white-100 group-hover:text-black-700 dark:group-hover:text-white-200 transition-colors mb-2 truncate">
                    {project.name}
                  </h3>
                  <p className="text-sm text-black-600 dark:text-white-400 font-medium truncate">
                    {project.subdomain ? `${project.subdomain}.localhost` : project.repoUrl}
                  </p>
                </div>
                <div className="p-2 border-2 border-dotted border-gray-400 dark:border-gray-600 rounded-none group-hover:border-black-900 dark:group-hover:border-white-100 transition-all duration-200">
                  <ExternalLink className="h-4 w-4 text-black-900 dark:text-white-100" />
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-6">
                {getStackBadge(project.framework)}
                <span className="text-xs text-black-600 dark:text-white-400 font-medium px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-none">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/projects/${project._id}`;
                  }}
                  className="group relative flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:text-black-900 dark:hover:text-white-100 rounded-none border-2 border-black-900 dark:border-white-100 transition-all duration-200 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                  <span className="relative z-10 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Deploy
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/environment/${project._id}`;
                  }}
                  className="group relative flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900 rounded-none transition-all duration-200 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                  <span className="relative z-10 flex items-center">
                    <Server className="w-4 h-4 mr-2" />
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