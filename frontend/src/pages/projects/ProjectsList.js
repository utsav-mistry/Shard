import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ExternalLink, Server, Zap, ArrowRight } from 'lucide-react';
import useProjects from '../../hooks/useProjects';

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

const ProjectsList = () => {
  const { projects, loading, error, refresh } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.repoUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.subdomain && project.subdomain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stack badge with colored variants based on stack type
  const getStackBadge = (stack) => {
    const stackType = stack?.toLowerCase() || 'unknown';
    let bgColor = 'bg-gray-100 dark:bg-gray-800';
    let textColor = 'text-gray-800 dark:text-gray-200';
    let borderColor = 'border-gray-300 dark:border-gray-600';

    // Assign different colors based on stack type
    if (stackType.includes('mern')) {
      bgColor = 'bg-blue-100 dark:bg-blue-900/50';
      textColor = 'text-blue-800 dark:text-blue-200';
      borderColor = 'border-blue-300 dark:border-blue-700';
    } else if (stackType.includes('django')) {
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/50';
      textColor = 'text-yellow-800 dark:text-yellow-200';
      borderColor = 'border-yellow-300 dark:border-yellow-700';
    } else if (stackType.includes('flask')) {
      bgColor = 'bg-emerald-100 dark:bg-emerald-900/50';
      textColor = 'text-emerald-800 dark:text-emerald-200';
      borderColor = 'border-emerald-300 dark:border-emerald-700';
    }

    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-none border-2 ${bgColor} ${textColor} ${borderColor}`}>
        {stack?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
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
      <div className="p-4 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
        {error}
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
        <div ref={(el) => setRef(el, 0)} data-reveal className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
          <div>
            <h1 className="text-5xl font-extrabold">Projects</h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mt-4">
              Manage and deploy your applications with one-click deployments
            </p>
          </div>
          <Link
            to="/app/projects/new"
            className="inline-flex items-center justify-center px-6 py-3 font-medium 
            bg-white-100 dark:bg-black-800 
           text-white dark:text-black hover:text-black dark:hover:text-white border-2 border-black dark:border-white 
             transition-colors duration-300 cursor-pointer rounded-none shadow-sm mt-6 sm:mt-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>

        </div>

        <div className="relative max-w-md mb-12">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-black-300 dark:text-white-600" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border-2 border-black-500 dark:border-white-700 
               bg-white-100 dark:bg-black-800 
               text-black-900 dark:text-white-100 
               placeholder-black-400 dark:placeholder-white-600 
               rounded-lg focus:outline-none focus:ring-0 transition-colors duration-200"
          />
        </div>





        {/* Projects grid with Overview-style design */}
        {filteredProjects.length === 0 ? (
          <div ref={(el) => setRef(el, 2)} data-reveal className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] text-center">
            <Server className="h-12 w-12 mx-auto mb-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-xl font-bold mb-4">No projects found</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'No projects match your search. Try a different term or create a new project.'
                : 'Get started by creating your first project and begin deploying your applications.'}
            </p>
            <Link
              to="/app/projects/new"
              className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black text-white hover:bg-white hover:text-black dark:bg-white dark:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-300 overflow-hidden border-2 border-black dark:border-white"
            >
              <span className="relative z-10 flex items-center transition-colors duration-300 text-white dark:text-black group-hover:text-black dark:group-hover:text-white">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => (
              <div
                key={project._id}
                ref={(el) => setRef(el, 10 + idx)}
                data-reveal
                onClick={() => window.location.href = `/app/projects/${project._id}?tab=deployments`}
                className="cursor-pointer p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold truncate">{project.name}</h3>
                  <ExternalLink className="w-4 h-4" />
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-4">
                  {project.subdomain ? `${project.subdomain}.localhost` : project.repoUrl}
                </p>

                <div className="flex items-center justify-between mb-6">
                  {getStackBadge(project.framework)}
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/app/projects/${project._id}`;
                    }}
                    className="group relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:text-black dark:hover:text-white border-2 border-black dark:border-white transition-all duration-300 overflow-hidden cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center transition-colors duration-300">
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/app/environment/${project._id}`;
                    }}
                    className="group relative flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-bold border-2 border-black dark:border-white text-black dark:text-white bg-transparent hover:text-white dark:hover:text-black transition-all duration-300 overflow-hidden cursor-pointer"
                  >
                    <span className="absolute inset-0 w-full h-full bg-black dark:bg-white transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                    <span className="relative z-10 flex items-center transition-colors duration-300">
                      <Server className="w-4 h-4 mr-2" />
                      Settings
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default ProjectsList;