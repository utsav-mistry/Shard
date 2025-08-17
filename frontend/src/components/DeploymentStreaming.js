import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Terminal, 
  Rocket,
  GitBranch,
  Bot,
  Settings,
  Hammer,
  Container,
  Zap,
  PartyPopper,
  Bomb,
  Trash2,
  BarChart3
} from 'lucide-react';

const DeploymentStreaming = ({ deploymentData, onStatusChange, onComplete }) => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [currentStep, setCurrentStep] = useState('init');
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const logsEndRef = useRef(null);

  // Deployment steps with icons and descriptions
  const deploymentSteps = [
    { id: 'init', label: 'Initializing', icon: Rocket, description: 'Setting up deployment environment' },
    { id: 'clone', label: 'Cloning Repository', icon: GitBranch, description: 'Fetching your code from repository' },
    { id: 'ai-review', label: 'AI Code Review', icon: Bot, description: 'Analyzing code quality and security' },
    { id: 'config', label: 'Environment Setup', icon: Settings, description: 'Configuring environment variables' },
    { id: 'build', label: 'Building Image', icon: Hammer, description: 'Creating Docker container image' },
    { id: 'deploy', label: 'Deploying Container', icon: Container, description: 'Starting your application container' },
    { id: 'runtime', label: 'Runtime Logs', icon: Zap, description: 'Application is starting up' },
    { id: 'complete', label: 'Deployment Complete', icon: PartyPopper, description: 'Your app is live and ready' }
  ];

  useEffect(() => {
    if (!deploymentData) return;

    // Connect to deployment worker Socket.io server on port 9000
    const socket = io('http://localhost:9000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to deployment worker on port 9000');
      setStatus('connected');
      addLog('Connected to deployment worker', 'info', 'init');
      
      // Start deployment
      socket.emit('start-deployment', deploymentData);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from deployment worker');
      setStatus('disconnected');
      addLog('Disconnected from deployment worker', 'warning', 'init');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus('error');
      setError(`Connection failed: ${error.message}`);
      addLog(`Connection error: ${error.message}`, 'error', 'init');
    });

    // Deployment log streaming
    socket.on('deployment-log', (logEntry) => {
      console.log('Deployment log:', logEntry);
      const { step, level, message, timestamp } = logEntry;
      
      setCurrentStep(step);
      addLog(message, level, step, timestamp);
      
      // Notify parent component of step changes
      if (onStatusChange) {
        onStatusChange({ step, level, message });
      }
    });

    // Deployment status updates
    socket.on('deployment-status', (statusUpdate) => {
      console.log('Deployment status:', statusUpdate);
      const { deploymentId, status: deployStatus, message } = statusUpdate;
      
      setStatus(deployStatus);
      addLog(message, deployStatus === 'failed' ? 'error' : 'success', 'status');
      
      // Handle completion
      if (deployStatus === 'completed' || deployStatus === 'failed' || deployStatus === 'cancelled') {
        if (onComplete) {
          onComplete({ status: deployStatus, message });
        }
      }
    });

    // Global deployment notifications
    socket.on('deployment-initiated', (deploymentInfo) => {
      console.log('Deployment initiated:', deploymentInfo);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, [deploymentData, onStatusChange, onComplete]);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message, level = 'info', step = 'unknown', timestamp = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      message: message.trim(),
      level,
      step,
      timestamp: timestamp || new Date().toISOString()
    };
    
    setLogs(prev => [...prev, logEntry]);
  };

  const getStepIcon = (step) => {
    const stepConfig = deploymentSteps.find(s => s.id === step);
    if (stepConfig?.icon && typeof stepConfig.icon === 'function') {
      const IconComponent = stepConfig.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    
    const iconComponents = {
      'init': <Rocket className="w-4 h-4" />,
      'clone': <GitBranch className="w-4 h-4" />,
      'ai-review': <Bot className="w-4 h-4" />,
      'config': <Settings className="w-4 h-4" />,
      'build': <Hammer className="w-4 h-4" />,
      'deploy': <Container className="w-4 h-4" />,
      'runtime': <Zap className="w-4 h-4" />,
      'complete': <PartyPopper className="w-4 h-4" />,
      'error': <Bomb className="w-4 h-4" />,
      'cleanup': <Trash2 className="w-4 h-4" />,
      'status': <BarChart3 className="w-4 h-4" />
    };
    return iconComponents[step] || <Terminal className="w-4 h-4" />;
  };

  const getLevelColor = (level) => {
    const colors = {
      'info': 'text-blue-600 dark:text-blue-400',
      'success': 'text-green-600 dark:text-green-400',
      'warning': 'text-yellow-600 dark:text-yellow-400',
      'error': 'text-red-600 dark:text-red-400'
    };
    return colors[level] || 'text-gray-600 dark:text-gray-400';
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Terminal className="w-5 h-5 text-blue-500" />;
    }
  };

  const cancelDeployment = () => {
    if (socketRef.current && deploymentData) {
      socketRef.current.emit('cancel-deployment', deploymentData.deploymentId);
      addLog('Deployment cancellation requested', 'warning', 'cancel');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Real-time Deployment Logs
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status: {status} • Current step: {currentStep}
              </p>
            </div>
          </div>
          
          {(status === 'connected' || status === 'running') && (
            <button
              onClick={cancelDeployment}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 overflow-x-auto">
          {deploymentSteps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = deploymentSteps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                <span className="flex items-center">{getStepIcon(step.id)}</span>
                <span>{step.label}</span>
                {isActive && <div className="w-2 h-2 bg-current rounded-full animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logs Container */}
      <div className="h-96 overflow-y-auto bg-gray-900 dark:bg-black">
        <div className="p-4 font-mono text-sm space-y-1">
          {logs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              {status === 'connecting' ? 'Connecting to deployment worker...' : 'Waiting for logs...'}
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3">
                <span className="text-gray-500 text-xs mt-1 w-20 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="flex items-center flex-shrink-0">
                  {getStepIcon(log.step)}
                </span>
                <span className={`text-xs uppercase font-bold w-16 flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {log.step}
                </span>
                <span className="text-gray-100 flex-1 break-words">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {logs.length} log entries • Connected to port 9000
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Deployment Worker Socket.io Stream
          </span>
        </div>
      </div>
    </div>
  );
};

export default DeploymentStreaming;
