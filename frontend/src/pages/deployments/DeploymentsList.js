import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, AlertTriangle, Search, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import useDeployments from '../../hooks/useDeployments';
import useProjects from '../../hooks/useProjects';

const DeploymentsList = () => {
  const { deployments, loading, error, refresh } = useDeployments();
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Helper function to get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-none text-xs font-medium border shadow-sm";
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-800 dark:text-white-100 border-black-900 dark:border-white-100`}>
            <Clock className="w-3 h-3 mr-1.5" />
            Pending
          </span>
        );
      case 'running':
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-800 dark:text-white-100 border-black-900 dark:border-white-100`}>
            <Server className="w-3 h-3 mr-1.5" />
            Running
          </span>
        );
      case 'success':
        return (
          <span className={`${baseClasses} bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 border-black-900 dark:border-white-100`}>
            <CheckCircle className="w-3 h-3 mr-1.5" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 border-black-900 dark:border-white-100`}>
            <XCircle className="w-3 h-3 mr-1.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-white-100 text-black-900 dark:bg-black-800 dark:text-white-100 border-black-900 dark:border-white-100`}>
            {status}
          </span>
        );
    }
  };

  // Filter deployments based on search term and status filter
  const filteredDeployments = deployments.filter(deployment => {
    const projectName = getProjectName(deployment.projectId).toLowerCase();
    const matchesSearch = projectName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
      </div>
    );
  }

  if (error || projectsError) {
    return (
      <div className="bg-white-100 dark:bg-black-900 p-6 rounded-none border-2 border-black-900 dark:border-white-100 shadow-sm flex items-center">
        <AlertTriangle className="h-5 w-5 mr-3 text-black-900 dark:text-white-100" />
        <span className="text-black-900 dark:text-white-100">
          {error || projectsError || 'An error occurred while loading deployments.'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deployments</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage all your project deployments
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm"
              placeholder="Search by project name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deployments list */}
      {filteredDeployments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 text-center">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No deployments found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Deploy a project to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
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
                    Finished
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeployments.map((deployment) => (
                  <tr key={deployment._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        <Link 
                          to={`/projects/${deployment.projectId}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {getProjectName(deployment.projectId)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deployment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {deployment.finishedAt ? new Date(deployment.finishedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/deployments/${deployment._id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        to={`/deployments/${deployment._id}/logs`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Logs
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentsList;