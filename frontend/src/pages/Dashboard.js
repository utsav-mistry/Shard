import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useProjects from '../hooks/useProjects';
import useDeployments from '../hooks/useDeployments';
import {
  ArrowRight,
  Plus,
  Zap,
  Box,
  Activity,
  Users,
  User,
  Settings,
  FileText,
  AlertTriangle,
  Server,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
// Removed framer-motion import - using CSS transitions instead
import PageTemplate from '../components/layout/PageTemplate';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Use custom hooks for data fetching
  const {
    projects = [],
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useProjects();

  const {
    deployments = [],
    loading: deploymentsLoading,
    error: deploymentsError,
    refetch: refetchDeployments
  } = useDeployments();

  const loading = projectsLoading || deploymentsLoading;
  const error = projectsError || deploymentsError;

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  // Stats data - matching landing page style
  const stats = [
    {
      id: 'total-projects',
      name: 'Total Projects',
      value: projects?.length || 0,
      icon: Box,
      action: () => navigate('/projects')
    },
    {
      id: 'active-deployments',
      name: 'Active Deployments',
      value: deployments?.filter(d => d.status === 'active' || d.status === 'deploying').length || 0,
      icon: Zap,
      action: () => navigate('/deployments')
    },
    {
      id: 'this-month',
      name: 'This Month',
      value: `${deployments?.filter(d => {
        const deployDate = new Date(d.createdAt || d.updatedAt);
        const now = new Date();
        return deployDate.getMonth() === now.getMonth() &&
          deployDate.getFullYear() === now.getFullYear();
      }).length || 0}`,
      icon: Activity,
      action: () => navigate('/deployments')
    }
  ];

  // Quick actions - matching landing page button style
  const quickActions = [
    {
      id: 'new-project',
      name: 'New Project',
      description: 'Create a new project from scratch',
      icon: Plus,
      action: () => navigate('/projects/new'),
      buttonText: 'Create Project',
      className: "group relative flex flex-col items-start p-6 h-full w-full text-left border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 hover:scale-[1.01]",
      iconClassName: 'mb-4 p-2 border-2 border-black-900 dark:border-white-100 rounded-none group-hover:bg-white-100 dark:group-hover:bg-black-900 transition-colors duration-200',
    },
    {
      id: 'new-deployment',
      name: 'New Deployment',
      description: 'Deploy a project',
      icon: Zap,
      action: () => navigate('/deployments/new'),
      buttonText: 'Deploy Now',
      className: "group relative flex flex-col items-start p-6 h-full w-full text-left border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 hover:scale-[1.01]",
      iconClassName: 'mb-4 p-2 border-2 border-black-900 dark:border-white-100 rounded-none group-hover:bg-white-100 dark:group-hover:bg-black-900 transition-colors duration-200',
    },
    {
      id: 'view-docs',
      name: 'View Docs',
      description: 'Read the documentation',
      icon: FileText,
      action: () => window.open('https://docs.shard.dev', '_blank', 'noopener,noreferrer'),
      buttonText: 'Read More',
      className: "group relative flex flex-col items-start p-6 h-full w-full text-left border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 hover:scale-[1.01]",
      iconClassName: 'mb-4 p-2 border-2 border-black-900 dark:border-white-100 rounded-none group-hover:bg-white-100 dark:group-hover:bg-black-900 transition-colors duration-200',
    }
  ];

  // Helper function to get status badge with black/white theme
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: 'Pending'
      },
      running: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <Server className="w-3 h-3 mr-1" />,
        label: 'Running'
      },
      success: {
        bg: 'bg-black-900 dark:bg-white-100',
        text: 'text-white-100 dark:text-black-900',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        label: 'Success'
      },
      failed: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        label: 'Failed'
      },
      default: {
        bg: 'bg-white-100 dark:bg-black-800',
        text: 'text-black-900 dark:text-white-100',
        border: 'border-2 border-black-900 dark:border-white-100',
        icon: null,
        label: status
      }
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <PageTemplate title="Loading Dashboard...">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="animate-pulse">
            <div className="h-12 w-12 border-4 border-black-900 dark:border-white-100 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </PageTemplate>
    );
  }

  // Render error state
  if (error) {
    return (
      <PageTemplate>
        <div className="min-h-screen bg-white-100 dark:bg-black-900 transition-colors duration-300 flex items-center justify-center p-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-black-900 dark:text-white-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-black-600 dark:text-white-400 mb-6 max-w-md">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-none shadow-sm bg-black-900 text-white-100 hover:text-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-2 dark:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
            <span className="relative z-10">
              Try Again
            </span>
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title="Dashboard">
      <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black-900 dark:text-white-100">
        {/* Subtle grid background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        </div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-black-700 dark:text-white-300">
              Welcome back, {currentUser?.name || currentUser?.email?.split('@')[0] || 'User'}
              {currentUser?.name && currentUser?.email && ` (${currentUser.email.split('@')[0]})`}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => navigate('/settings')}
              className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <span className="h-5 w-5 mr-2"><Settings /></span>
                Settings
              </span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100 hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <span className="h-5 w-5 mr-2"><User /></span>
                Profile
              </span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Matching Landing Page Style */}
        <div className="mb-10 relative z-0">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                onClick={stat.action}
                className="group relative p-6 border-2 border-black-900 dark:border-white-100 bg-transparent hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-300 cursor-pointer hover:transform hover:-translate-y-0.5 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-80">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2 border-2 border-black-900 dark:border-white-100 group-hover:bg-white-100 group-hover:text-black-900 dark:group-hover:bg-black-900 dark:group-hover:text-white-100 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions - Matching Landing Page Buttons */}
        <div className="mb-10 relative z-0">
          <h2 className="text-xl font-bold text-black-900 dark:text-white-100 mb-6">
            Quick Actions
          </h2>
          <div>
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="group relative p-6 border-2 border-black-900 dark:border-white-100 bg-transparent hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-300 cursor-pointer hover:transform hover:-translate-y-0.5 hover:scale-[1.01]"
                onClick={action.action}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 border-2 border-black-900 dark:border-white-100 group-hover:bg-white-100 group-hover:text-black-900 dark:group-hover:bg-black-900 dark:group-hover:text-white-100 transition-colors">
                      <action.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{action.name}</h3>
                  {action.description && (
                    <p className="text-sm opacity-80 mb-4">
                      {action.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center text-sm font-medium group-hover:underline">
                    {action.buttonText || 'Get started'}
                    <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity - Enhanced Table */}
        <div className="mb-10 relative z-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black-900 dark:text-white-100">
              Recent Deployments
            </h2>
            <button
              onClick={() => navigate('/deployments')}
              className="group relative inline-flex items-center text-sm font-medium text-black-900 dark:text-white-100 hover:opacity-80 transition-opacity"
            >
              View all
              <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="overflow-hidden border-2 border-black-100 dark:border-white-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-black-900/20 dark:divide-white-100/20">
                <thead className="bg-black-900/5 dark:bg-white-100/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                      Last Deployed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-black-500 dark:text-white-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-black-900 divide-y divide-black-900/10 dark:divide-white-100/10">
                  {deployments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Server className="h-12 w-12 text-black-400 dark:text-white-400 mb-3" />
                          <h3 className="text-lg font-medium text-black-900 dark:text-white-100 mb-1">
                            No deployments yet
                          </h3>
                          <p className="text-black-600 dark:text-white-400 max-w-md mb-4">
                            Create your first project and deploy it to see it here.
                          </p>
                          <button
                            onClick={() => navigate('/deployments/new')}
                            className="group relative inline-flex items-center px-4 py-2 bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 font-medium hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-colors duration-200 overflow-hidden border-2 border-black-900 dark:border-white-100"
                          >
                            <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
                            <span className="relative z-10 flex items-center">
                              <Zap className="h-4 w-4 mr-2" />
                              New Deployment
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    deployments.slice(0, 5).map((deployment) => (
                      <tr
                        key={deployment._id}
                        className="group hover:bg-black-900/5 dark:hover:bg-white-100/5 transition-colors cursor-pointer"
                        onClick={() => navigate(`/deployments/${deployment._id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-black-900 dark:border-white-100">
                              <Server className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-black-900 dark:text-white-100">
                                {deployment.projectName || 'Unknown Project'}
                              </div>
                              <div className="text-sm text-black-500 dark:text-white-500">
                                {deployment.branch || 'main'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deployment.status === 'success'
                              ? 'bg-black-900/10 text-black-900 dark:bg-white-100/10 dark:text-white-100'
                              : deployment.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                          >
                            {deployment.status === 'success' ? (
                              <CheckCircle className="mr-1 h-3.5 w-3.5" />
                            ) : deployment.status === 'failed' ? (
                              <XCircle className="mr-1 h-3.5 w-3.5" />
                            ) : (
                              <Clock className="mr-1 h-3.5 w-3.5" />
                            )}
                            {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-500">
                          {formatDate(deployment.updatedAt || deployment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/deployments/${deployment._id}`);
                            }}
                            className="group relative inline-flex items-center text-black-900 dark:text-white-100 hover:opacity-80 transition-opacity"
                          >
                            View details
                            <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {deployments.length > 0 && (
                <div className="mt-4 text-right p-4">
                  <button
                    onClick={() => navigate('/deployments')}
                    className="text-sm font-medium hover:underline text-black-900 dark:text-white-100"
                  >
                    View all deployments →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Dashboard;