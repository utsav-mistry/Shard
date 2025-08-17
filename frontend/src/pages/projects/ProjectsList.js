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

  // Vercel-style stack badge
  const getStackBadge = (stack) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium";
    
    const stackColors = {
      mern: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      django: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      flask: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    
    const colorClass = stackColors[stack] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    
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
          <h1 className="text-2xl font-semibold text-black-900 dark:text-white-100">Projects</h1>
          <p className="text-black-600 dark:text-white-400 mt-1">
            Manage and deploy your projects
          </p>
        </div>
        <Link
          to="/app/projects/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-md hover:bg-black-800 dark:hover:bg-white-200 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Vercel-style search */}
      <div className="relative max-w-md mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-black-400 dark:text-white-400" />
        </div>
        <input
          type="text"
          placeholder="Search projects..."
          className="block w-full pl-10 pr-4 py-2 border border-black-300 dark:border-white-700 rounded-md bg-white dark:bg-black text-black-900 dark:text-white-100 placeholder-black-400 dark:placeholder-white-400 focus:outline-none focus:ring-2 focus:ring-black-500 dark:focus:ring-white-500 focus:border-transparent text-sm"
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
            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-md hover:bg-black-800 dark:hover:bg-white-200 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div 
              key={project._id} 
              className="border border-black-200 dark:border-white-800 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => window.location.href = `/app/projects/${project._id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-black-900 dark:text-white-100 group-hover:text-black-600 dark:group-hover:text-white-300 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-black-500 dark:text-white-500 mt-1 truncate">
                    {project.repoUrl}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-black-400 dark:text-white-600 group-hover:text-black-600 dark:group-hover:text-white-400 transition-colors flex-shrink-0" />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                {getStackBadge(project.stack)}
                <span className="text-xs text-black-500 dark:text-white-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/deployments/new/${project._id}`;
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-md hover:bg-black-800 dark:hover:bg-white-200 transition-colors"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Deploy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/app/environment/${project._id}`;
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium border border-black-300 dark:border-white-700 text-black-700 dark:text-white-300 rounded-md hover:bg-black-50 dark:hover:bg-white-950 transition-colors"
                >
                  <Server className="w-3 h-3 mr-1" />
                  Settings
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