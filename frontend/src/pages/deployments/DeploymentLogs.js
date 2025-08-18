import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, AlertTriangle, Download, RefreshCw, Clock, CheckCircle, XCircle, Server } from 'lucide-react';

const DeploymentLogs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Fetch deployment, project and logs data
  const fetchData = async () => {
    try {
      // Fetch deployment details first
      const deploymentResponse = await api.get(`/api/deploy/${id}`);
      const deploymentData = deploymentResponse.data.success ? deploymentResponse.data.data : deploymentResponse.data;
      setDeployment(deploymentData);
      
      // Only fetch project if we have a valid projectId
      if (!deploymentData.projectId) {
        console.warn('No projectId found in deployment data:', deploymentData);
        setError('Deployment missing project information');
        setLoading(false);
        return;
      }
      
      // Fetch project details and logs in parallel
      const [projectResponse, logsResponse] = await Promise.all([
        api.get(`/api/projects/${deploymentData.projectId}`),
        api.get(`/api/logs/${id}`)
      ]);
      
      setProject(projectResponse.data.success ? projectResponse.data.data : projectResponse.data);
      
      setLogs(logsResponse.data.success ? logsResponse.data.data : logsResponse.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load deployment logs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [id, fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && (deployment?.status === 'pending' || deployment?.status === 'running')) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData();
      }, 15000); // Refresh every 15 seconds (reduced from 5)
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, deployment?.status, id, fetchData]);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black-100 text-black-800 dark:bg-black-700 dark:text-black-300">
            {status}
          </span>
        );
    }
  };

  // Filter logs based on active tab
  const filteredLogs = logs.filter(log => {
    if (activeTab === 'all') return true;
    return log.type === activeTab;
  });

  // Helper function to get log type badge
  const getLogTypeBadge = (type) => {
    switch (type) {
      case 'setup':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Setup
          </span>
        );
      case 'config':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Config
          </span>
        );
      case 'deploy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            Deploy
          </span>
        );
      case 'runtime':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Runtime
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Error
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black-100 text-black-800 dark:bg-black-700 dark:text-black-300">
            Complete
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black-100 text-black-800 dark:bg-black-700 dark:text-black-300">
            {type}
          </span>
        );
    }
  };

  // Download logs as text file
  const downloadLogs = () => {
    if (!logs.length) return;
    
    const logText = logs.map(log => {
      const timestamp = new Date(log.createdAt).toISOString();
      return `[${timestamp}] [${log.type.toUpperCase()}] ${log.content}`;
    }).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${id}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  if (!deployment || !project) {
    return (
      <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Deployment or project not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(`/app/deployments/${id}`)}
          className="inline-flex items-center text-sm font-medium text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to deployment details
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-900 dark:text-white">
            Deployment Logs: {project.name}
          </h1>
          <p className="mt-1 text-sm text-black-500 dark:text-black-400">
            Deployment ID: {deployment._id}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {getStatusBadge(deployment.status)}
          <button
            onClick={fetchData}
            className="inline-flex items-center px-3 py-2 border border-black-300 dark:border-black-600 shadow-sm text-sm leading-4 font-medium rounded-md text-black-700 dark:text-black-200 bg-white dark:bg-black-700 hover:bg-black-50 dark:hover:bg-black-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-black-800"
          >
            <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={downloadLogs}
            className="inline-flex items-center px-3 py-2 border border-black-300 dark:border-black-600 shadow-sm text-sm leading-4 font-medium rounded-md text-black-700 dark:text-black-200 bg-white dark:bg-black-700 hover:bg-black-50 dark:hover:bg-black-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-black-800"
            disabled={logs.length === 0}
          >
            <Download className="-ml-0.5 mr-2 h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {/* Log filters and auto-refresh */}
      <div className="bg-white dark:bg-black-800 shadow-sm rounded-none p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Log type tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'setup' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Setup
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'config' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Config
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'deploy' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Deploy
            </button>
            <button
              onClick={() => setActiveTab('runtime')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'runtime' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Runtime
            </button>
            <button
              onClick={() => setActiveTab('error')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Error
            </button>
            <button
              onClick={() => setActiveTab('complete')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'complete' ? 'bg-black-100 text-black-700 dark:bg-black-700 dark:text-black-200' : 'text-black-500 hover:text-black-700 dark:text-black-400 dark:hover:text-black-300'}`}
            >
              Complete
            </button>
          </div>

          {/* Auto-refresh toggle */}
          <div className="flex items-center">
            <label htmlFor="auto-refresh" className="mr-2 text-sm text-black-500 dark:text-black-400">
              Auto-refresh
            </label>
            <button
              id="auto-refresh"
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${autoRefresh ? 'bg-indigo-600' : 'bg-black-200 dark:bg-black-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black-800`}
              role="switch"
              aria-checked={autoRefresh}
              disabled={deployment.status !== 'pending' && deployment.status !== 'running'}
            >
              <span className="sr-only">Auto-refresh logs</span>
              <span
                aria-hidden="true"
                className={`${autoRefresh ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Logs display */}
      <div className="bg-white dark:bg-black-800 shadow-sm rounded-none overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-black-200 dark:border-black-700 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-black-900 dark:text-white">
            Logs
          </h3>
          <span className="text-sm text-black-500 dark:text-black-400">
            {filteredLogs.length} entries
          </span>
        </div>
        
        {filteredLogs.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-sm text-black-500 dark:text-black-400">
              No logs available for this deployment
            </p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] p-4 bg-black-50 dark:bg-black-850 font-mono text-sm">
            {filteredLogs.map((log, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <div className="flex items-start">
                  <span className="text-black-400 dark:text-black-500 mr-2">
                    [{new Date(log.createdAt).toLocaleTimeString()}]
                  </span>
                  <div className="mr-2">
                    {getLogTypeBadge(log.type)}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-black-800 dark:text-black-200 flex-1">
                    {log.content}
                  </pre>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Link
          to={`/deployments/${id}`}
          className="inline-flex items-center px-4 py-2 border border-black-300 dark:border-black-600 shadow-sm text-sm font-medium rounded-md text-black-700 dark:text-black-200 bg-white dark:bg-black-700 hover:bg-black-50 dark:hover:bg-black-650 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-black-800"
        >
          Back to Deployment
        </Link>

        {deployment.status === 'failed' && (
          <button
            onClick={async () => {
              try {
                await api.post(`/deploy/retry/${deployment._id}`, {});
                navigate('/app/deployments');
              } catch (err) {
                console.error('Error retrying deployment:', err);
                setError('Failed to retry deployment');
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-black-800"
          >
            Retry Deployment
          </button>
        )}
      </div>
    </div>
  );
};

export default DeploymentLogs;