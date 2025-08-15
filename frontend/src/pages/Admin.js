import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { 
  Cpu, 
  Server, 
  FileText, 
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Users,
  Database
} from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [workerStatus, setWorkerStatus] = useState(null);
  const [aiServiceStatus, setAiServiceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Move useEffect before any conditional returns
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch all admin data in parallel using the existing API utility
        const [statsRes, deploymentsRes, logsRes, workerRes, aiRes] = await Promise.allSettled([
          api.get('/admin/stats'),
          api.get('/admin/deployments'),
          api.get('/admin/logs?limit=50'),
          api.get('/admin/worker/status'),
          api.get('/admin/ai-service/status')
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        }
        
        if (deploymentsRes.status === 'fulfilled') {
          setDeployments(deploymentsRes.value.data);
        }
        
        if (logsRes.status === 'fulfilled') {
          setLogs(logsRes.value.data);
        }
        
        if (workerRes.status === 'fulfilled') {
          setWorkerStatus(workerRes.value.data);
        }
        
        if (aiRes.status === 'fulfilled') {
          setAiServiceStatus(aiRes.value.data);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchAdminData();
      // Refresh data every 30 seconds
      const interval = setInterval(fetchAdminData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // fetchAdminData has been moved inside the useEffect hook

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Activity className="w-3 h-3 mr-1" />
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Monitor system health, deployments, and service status
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Cpu },
              { id: 'deployments', name: 'Deployments', icon: Rocket },
              { id: 'services', name: 'Services', icon: Server },
              { id: 'logs', name: 'Logs', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Database className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Memory Usage
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {formatBytes(stats.system.memory.used)} / {formatBytes(stats.system.memory.total)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Server className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Uptime
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {formatUptime(stats.system.uptime)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Rocket className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Active Deployments
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {stats.database.activeDeployments}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Total Projects
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {stats.database.totalProjects}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.system.platform}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Architecture</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.system.arch}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Node Version</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.system.nodeVersion}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU Cores</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.system.cpu.cores}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.database.totalUsers}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Environment</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100">{stats.services.backend.environment}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployments Tab */}
        {activeTab === 'deployments' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                Active Deployments
              </h3>
              {deployments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No active deployments</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Stack
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Started
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deployments.map((deployment) => (
                        <tr key={deployment.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {deployment.projectName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {deployment.subdomain}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(deployment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {deployment.stack}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {deployment.duration ? `${deployment.duration}s` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(deployment.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deployment Worker Status */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Deployment Worker
                  </h3>
                  {workerStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        {getStatusBadge(workerStatus.status)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>URL:</strong> {workerStatus.url}</p>
                        {workerStatus.queue && (
                          <>
                            <p><strong>Active Jobs:</strong> {workerStatus.queue.active}</p>
                            <p><strong>Queued Jobs:</strong> {workerStatus.queue.queued}</p>
                            <p><strong>Concurrency:</strong> {workerStatus.queue.concurrency}</p>
                          </>
                        )}
                        {workerStatus.uptime && (
                          <p><strong>Uptime:</strong> {formatUptime(workerStatus.uptime)}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status unavailable</p>
                  )}
                </div>
              </div>

              {/* AI Service Status */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                    AI Review Service
                  </h3>
                  {aiServiceStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center">
                        {getStatusBadge(aiServiceStatus.status)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>URL:</strong> {aiServiceStatus.url}</p>
                        {aiServiceStatus.responseTime && (
                          <p><strong>Response Time:</strong> {aiServiceStatus.responseTime}</p>
                        )}
                        <p><strong>Last Check:</strong> {new Date(aiServiceStatus.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status unavailable</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                System Logs
              </h3>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No logs available</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className={`ml-2 font-semibold ${
                        log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                        log.level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-600 dark:text-gray-300'
                      }`}>
                        [{log.level?.toUpperCase() || 'INFO'}]
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
