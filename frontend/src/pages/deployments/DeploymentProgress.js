import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle, Eye, Code, Settings, Rocket, Play } from 'lucide-react';

const DeploymentProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deployment steps (Vercel-style with AI review)
  const deploymentSteps = [
    { id: 'setup', label: 'Cloning Repository', icon: Code, description: 'Fetching your code from GitHub' },
    { id: 'ai-review', label: 'AI Code Review', icon: Eye, description: 'Analyzing code quality and security' },
    { id: 'config', label: 'Environment Setup', icon: Settings, description: 'Configuring environment variables' },
    { id: 'deploy', label: 'Building & Deploying', icon: Rocket, description: 'Creating your application container' },
    { id: 'complete', label: 'Deployment Ready', icon: Play, description: 'Your app is live and ready' }
  ];

  // Fetch deployment data
  const fetchData = async () => {
    try {
      const [deploymentResponse, logsResponse] = await Promise.all([
        api.get(`/api/deploy/${id}`),
        api.get(`/api/logs/${id}`)
      ]);

      if (deploymentResponse.data.success) {
        const deploymentData = deploymentResponse.data.data;
        setDeployment(deploymentData);

        // Fetch project data
        const projectResponse = await api.get(`/api/projects/${deploymentData.projectId}`);
        if (projectResponse.data.success) {
          setProject(projectResponse.data.data);
        }
      }

      if (logsResponse.data.success) {
        setLogs(logsResponse.data.data || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching deployment data:', err);
      setError('Failed to load deployment details');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh for active deployments
    const interval = setInterval(() => {
      if (deployment && (deployment.status === 'pending' || deployment.status === 'running')) {
        fetchData();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, deployment?.status]);

  // Get current step based on logs and status
  const getCurrentStep = () => {
    if (!deployment) return 0;
    
    const setupLogs = logs.filter(log => log.type === 'setup');
    const configLogs = logs.filter(log => log.type === 'config');
    const deployLogs = logs.filter(log => log.type === 'deploy');
    
    if (deployment.status === 'failed') {
      // Find where it failed
      const errorLogs = logs.filter(log => log.type === 'error');
      if (errorLogs.length > 0) {
        const lastError = errorLogs[errorLogs.length - 1];
        if (lastError.content.includes('AI')) return 1;
        if (deployLogs.length > 0) return 3;
        if (configLogs.length > 0) return 2;
        return 0;
      }
    }
    
    if (deployment.status === 'success') return 4;
    if (deployLogs.length > 0) return 3;
    if (configLogs.length > 0) return 2;
    if (deployment.aiReviewResults) return 1;
    if (setupLogs.length > 0) return 0;
    
    return 0;
  };

  // Get step status
  const getStepStatus = (stepIndex) => {
    const currentStep = getCurrentStep();
    
    if (deployment?.status === 'failed' && stepIndex === currentStep) {
      return 'error';
    }
    
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) {
      if (deployment?.status === 'success' && stepIndex === 4) return 'completed';
      return 'active';
    }
    return 'pending';
  };

  // Get AI review status
  const getAIReviewStatus = () => {
    if (!deployment?.aiReviewResults) return null;
    
    const { verdict, issue_count } = deployment.aiReviewResults;
    
    if (verdict === 'approve') {
      return { type: 'success', message: 'Code quality approved', issues: issue_count || 0 };
    } else if (verdict === 'deny') {
      return { type: 'error', message: 'Critical issues found', issues: issue_count || 0 };
    } else if (verdict === 'manual_review') {
      return { type: 'warning', message: 'Manual review required', issues: issue_count || 0 };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !deployment || !project) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        {error || 'Deployment not found'}
      </div>
    );
  }

  const currentStep = getCurrentStep();
  const aiReviewStatus = getAIReviewStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/projects/${project._id}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to project
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/deployments/${id}/logs`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650"
          >
            View Logs
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {deployment.commitMessage || 'Deploying latest changes'}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Branch: main</span>
              {deployment.commitHash && (
                <span>Commit: {deployment.commitHash.substring(0, 8)}</span>
              )}
              <span>Started: {new Date(deployment.createdAt).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {deployment.status === 'success' && (
              <a
                href={`https://${project.subdomain}.shard.dev`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Visit Site
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Steps */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Deployment Progress
        </h2>
        
        <div className="space-y-6">
          {deploymentSteps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                    status === 'active' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' :
                    status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                    'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : status === 'error' ? (
                      <XCircle className="w-5 h-5" />
                    ) : status === 'active' ? (
                      <div className="w-3 h-3 bg-current rounded-full animate-pulse" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      status === 'completed' ? 'text-green-600 dark:text-green-400' :
                      status === 'active' ? 'text-blue-600 dark:text-blue-400' :
                      status === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </h3>
                    
                    {status === 'active' && (
                      <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                        <Clock className="w-4 h-4 mr-1" />
                        In progress...
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                  
                  {/* AI Review Results */}
                  {step.id === 'ai-review' && aiReviewStatus && (
                    <div className={`mt-2 p-3 rounded-md ${
                      aiReviewStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
                      aiReviewStatus.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          aiReviewStatus.type === 'success' ? 'text-green-800 dark:text-green-200' :
                          aiReviewStatus.type === 'error' ? 'text-red-800 dark:text-red-200' :
                          'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {aiReviewStatus.message}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {aiReviewStatus.issues} issues found
                        </span>
                      </div>
                      
                      {aiReviewStatus.issues > 0 && (
                        <button
                          onClick={() => navigate(`/deployments/${id}`)}
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View details →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button
            onClick={() => navigate(`/deployments/${id}/logs`)}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View all logs →
          </button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.slice(-10).reverse().map((log, index) => (
            <div key={index} className="flex items-start space-x-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500 font-mono">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                log.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                log.type === 'setup' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                log.type === 'config' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                log.type === 'deploy' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {log.type}
              </span>
              <span className="text-gray-700 dark:text-gray-300 flex-1">
                {log.content}
              </span>
            </div>
          ))}
          
          {logs.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No logs available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentProgress;
