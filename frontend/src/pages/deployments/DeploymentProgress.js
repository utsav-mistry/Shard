// DeploymentProgress.js
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  Code,
  Settings,
  Rocket,
  Play,
  Terminal
} from 'lucide-react';
import io from 'socket.io-client';

const DeploymentProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [project, setProject] = useState(null);
  const [logs, setLogs] = useState([]);
  const [realTimeLogs, setRealTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const logsEndRef = useRef(null);
  const [isLiveLogsEnabled, setIsLiveLogsEnabled] = useState(true);

  // -----------------------
  // Robust date parsing + formatting
  // -----------------------
  const parseFlexibleDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
      if (!isNaN(value.getTime())) return value;
      return null;
    }
    if (typeof value === 'number') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    if (!isNaN(Number(value))) {
      const d = new Date(Number(value));
      if (!isNaN(d.getTime())) return d;
    }
    try {
      const iso = parseISO(String(value));
      if (!isNaN(iso.getTime())) return iso;
    } catch (e) { }
    const d2 = new Date(String(value));
    if (!isNaN(d2.getTime())) return d2;
    const bracketMatch = String(value).match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      const extracted = bracketMatch[1].replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
      const d3 = new Date(extracted);
      if (!isNaN(d3.getTime())) return d3;
    }
    const isoLike = String(value).match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/);
    if (isoLike) {
      const d4 = new Date(isoLike[0]);
      if (!isNaN(d4.getTime())) return d4;
    }
    return null;
  };

  const formatDate = (dateCandidate) => {
    const d = parseFlexibleDate(dateCandidate);
    return d ? format(d, 'PPpp') : 'Date not available';
  };

  // -----------------------
  // Helpers for log display
  // -----------------------
  const stripDockerPrefix = (text) => {
    if (!text || typeof text !== 'string') return text;
    const openIdx = text.indexOf('[');
    const closeIdx = text.indexOf(']');
    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
      return text.slice(closeIdx + 1).trim();
    }
    return text;
  };

  const formatLogMessage = (message = '', step = '', level = '') => {
    const raw = stripDockerPrefix(message || '');

    if (raw.includes('Cloning into')) return 'Downloading your project code...';
    if (raw.includes('Successfully built')) return 'Application built successfully';
    if (raw.includes('docker build')) return 'Building your application...';
    if (raw.includes('docker run')) return 'Starting your application...';
    if (raw.includes('Container') && raw.includes('started')) return 'Application is now running';
    if (raw.includes('npm install') || raw.includes('yarn install')) return 'Installing dependencies...';
    if (raw.includes('FROM ') && step === 'build') return 'Setting up build environment...';
    if (raw.includes('COPY') && step === 'build') return 'Copying application files...';
    if (raw.includes('RUN') && step === 'build') return 'Running build commands...';
    if (raw.includes('EXPOSE') && step === 'build') return 'Configuring network access...';

    if (level === 'error') return `${raw}`;
    if (level === 'success') return `${raw}`;
    if (level === 'warning') return `${raw}`;

    return raw
      .replace(/^Step \d+\/\d+ : /, '')
      .replace(/^---> /, '')
      .replace(/^Removing intermediate container [a-f0-9]+/, 'Cleaning up...')
      .trim() || raw;
  };

  // -----------------------
  // Assign strong, distinct label colors per type (kept as requested)
  // -----------------------
  const getLabelClasses = (type = '') => {
    const t = (type || '').toString().toUpperCase();
    switch (t) {
      case 'BUILD':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
      case 'QUEUE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
      case 'SETUP':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
      case 'CONFIG':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600';
      case 'DEPLOY':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
      case 'RUNTIME':
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600';
      case 'COMPLETE':
        return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
      case 'INFO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600';
    }
  };

  // -----------------------
  // Socket init / cleanup
  // -----------------------
  const initializeSocket = () => {
    if (socketRef.current) return;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    socketRef.current = io(backendUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': window.location.origin
      }
    });

    // Connection established
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server for deployment logs');
      // Subscribe to deployment logs for this specific deployment
      socketRef.current.emit('subscribe-deployment-logs', id);
    });

    // Handle incoming deployment logs
    socketRef.current.on('deployment-log', (logEntry) => {
      try {
        if (logEntry.deploymentId === id) {
          setRealTimeLogs(prev => [
            ...prev,
            {
              ...logEntry,
              id: `${logEntry.timestamp || logEntry.ts || Date.now()}-${Math.random()}`,
              timestamp: logEntry.timestamp || new Date().toISOString()
            }
          ]);
          setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
        }
      } catch (e) {
        console.error('Error handling deployment-log', e);
      }
    });

    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server. Reason:', reason);
      if (reason === 'io server disconnect') {
        // The server intentionally disconnected the socket, don't try to reconnect
        console.log('Server intentionally disconnected the socket');
      }
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      console.error('Error details:', error);

      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (socketRef.current && socketRef.current.disconnected) {
          console.log('Attempting to reconnect to Socket.IO server...');
          socketRef.current.connect();
        }
      }, 2000);
    });

    // Handle reconnection events
    socketRef.current.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    });

    socketRef.current.on('reconnect', (attempt) => {
      console.log(`Successfully reconnected after ${attempt} attempts`);
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('Failed to reconnect to Socket.IO server');
    });
  };

  const cleanupSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // -----------------------
  // Data fetch
  // -----------------------
  const fetchData = async () => {
    try {
      const [deploymentResponse, logsResponse] = await Promise.all([
        api.get(`/api/deploy/${id}`),
        api.get(`/api/logs/${id}`)
      ]);

      if (deploymentResponse.data?.success) {
        const deploymentData = deploymentResponse.data.data;
        setDeployment(deploymentData);

        const projectResponse = await api.get(`/api/projects/${deploymentData.projectId._id}`);
        if (projectResponse.data?.success) {
          setProject(projectResponse.data.data);
        }
      }

      const lr = logsResponse.data;
      if (Array.isArray(lr)) {
        setLogs(lr);
      } else if (lr?.success) {
        setLogs(lr.data || []);
      } else {
        setLogs([]);
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
    if (isLiveLogsEnabled) {
      initializeSocket();
    }

    const interval = setInterval(() => {
      if (deployment && ['queued', 'pending', 'running', 'reviewing', 'configuring', 'building', 'deploying'].includes(deployment.status)) {
        fetchData();
      }
    }, 5000);

    // Cleanup function
    return () => {
      clearInterval(interval);

      // Unsubscribe from deployment logs before cleanup
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('unsubscribe-deployment-logs', id);
      }

      cleanupSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, deployment?.status, isLiveLogsEnabled]);

  // -----------------------
  // Steps UI helpers
  // -----------------------
  const deploymentSteps = [
    { id: 'setup', label: 'Cloning Repository', icon: Code, description: 'Fetching your code from GitHub' },
    { id: 'ai-review', label: 'AI Code Review', icon: Eye, description: 'Analyzing code quality and security' },
    { id: 'config', label: 'Environment Setup', icon: Settings, description: 'Configuring environment variables' },
    { id: 'deploy', label: 'Building & Deploying', icon: Rocket, description: 'Creating your application container' },
    { id: 'complete', label: 'Deployment Ready', icon: Play, description: 'Your app is live and ready' }
  ];

  const getCurrentStep = () => {
    if (!deployment) return 0;
    switch (deployment.status) {
      case 'queued':
      case 'pending':
      case 'running':
        return 0;
      case 'reviewing': return 1;
      case 'configuring': return 2;
      case 'building':
      case 'deploying': return 3;
      case 'success': return 4;
      case 'failed': {
        const errorLog = logs.find(log => log.type === 'error');
        if (errorLog) {
          if (errorLog.step === 'ai-review') return 1;
          if (errorLog.step === 'config') return 2;
          if (['deploy', 'build'].includes(errorLog.step)) return 3;
        }
        return 0;
      }
      default: return 0;
    }
  };

  const getStepStatus = (stepIndex) => {
    const currentStepIndex = getCurrentStep();
    if (deployment?.status === 'failed' && stepIndex === currentStepIndex) return 'error';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return deployment?.status === 'success' ? 'completed' : 'active';
    return 'pending';
  };

  const getAIReviewStatus = () => {
    if (!deployment?.aiReviewResults) return null;
    const { verdict, issue_count } = deployment.aiReviewResults;
    if (verdict === 'approve') return { type: 'success', message: 'Code quality approved', issues: issue_count || 0 };
    if (verdict === 'deny') return { type: 'error', message: 'Critical issues found', issues: issue_count || 0 };
    if (verdict === 'manual_review') return { type: 'warning', message: 'Manual review required', issues: issue_count || 0 };
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  if (error || !deployment || !project) {
    return (
      <div className="bg-gray-100 dark:bg-[#0b0b0b] text-red-700 dark:text-red-200 p-4 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="text-sm text-gray-900 dark:text-gray-100">{error || 'Deployment not found'}</span>
      </div>
    );
  }

  // Strict button classes for Live Logs toggle:
  const liveOnClasses = 'bg-red-600 text-white border-red-700 hover:bg-red-700 dark:bg-[#b91c1c] dark:hover:bg-[#9f1a1a]';
  const liveOffClasses = 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-[#111111] dark:text-gray-300 dark:border-[#2a2a2a] dark:hover:bg-[#1a1a1a]';

  const currentStep = getCurrentStep();
  const aiReviewStatus = getAIReviewStatus();

  return (

    <div className="max-w-5xl mx-auto space-y-6 px-4 ">

      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-1]" // <- key fix: put behind everything
        style={{
          backgroundImage: `
      repeating-linear-gradient(to right, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px),
      repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px)
    `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[-1] dark:block" // <- z-index behind everything
        style={{
          backgroundImage: `
      repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px),
      repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px)
    `,
        }}
      />


      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/app/projects/${project._id}`)}
            className="inline-flex items-center text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4 text-gray-700 dark:text-gray-200" />
            <span className="text-sm text-gray-900 dark:text-gray-100">Back to project</span>
          </button>
        </div>

        <div />
      </div>

      {/* Project Info */}
      <div className="border-2 border-black-900 dark:border-white-100 rounded-none p-6 shadow-md hover:shadow-lg transition-all duration-200 z-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className=" text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
              {deployment.commitMessage || 'Deploying latest changes'}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span className="text-gray-700 dark:text-gray-300">Branch: <span className="font-mono text-gray-800 dark:text-gray-200">main</span></span>
              {deployment.commitHash && (
                <span className="font-mono text-gray-700 dark:text-gray-300">Commit: <span className="text-gray-800 dark:text-gray-200">{deployment.commitHash.substring(0, 8)}</span></span>
              )}
              <span className="font-mono text-gray-700 dark:text-gray-300">Started: <span className="text-gray-800 dark:text-gray-200">{formatDate(deployment.createdAt || deployment.timestamp || deployment.startedAt)}</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {deployment.status === 'success' && (
              <a
                href={project.url || `http://localhost:3000`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow text-white bg-green-600 hover:bg-green-700"
              >
                <span className="text-sm">Visit Site</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Steps */}
      <div className="bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-[#1f1f1f] shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Deployment Progress
        </h2>

        <div className="space-y-6">
          {deploymentSteps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-start">
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'completed'
                      ? 'bg-gray-100 text-green-600 dark:bg-[#111111] dark:text-green-300'
                      : status === 'active'
                        ? 'bg-gray-100 text-gray-800 dark:bg-[#111111] dark:text-gray-200'
                        : status === 'error'
                          ? 'bg-gray-100 text-red-600 dark:bg-[#111111] dark:text-red-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-[#111111] dark:text-gray-400'
                      }`}
                  >
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
                    <h3
                      className={`text-sm font-medium ${status === 'completed'
                        ? 'text-gray-800 dark:text-gray-200'
                        : status === 'active'
                          ? 'text-gray-800 dark:text-gray-200'
                          : status === 'error'
                            ? 'text-gray-800 dark:text-gray-200'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {step.label}
                    </h3>

                    {status === 'active' && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-gray-600 dark:text-gray-300">In progress...</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">{step.description}</p>

                  {step.id === 'ai-review' && aiReviewStatus && (
                    <div className="mt-2 p-3 rounded-md bg-gray-50 dark:bg-[#111111]/40">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {aiReviewStatus.message}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {aiReviewStatus.issues} issues found
                        </span>
                      </div>

                      {aiReviewStatus.issues > 0 && (
                        <button
                          onClick={() => navigate(`/app/deployments/${id}`)}
                          className="mt-2 text-xs text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-200"
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

      {/* Unified Logs Section (historical + realtime together) */}
      <div className="bg-gray-50 dark:bg-[#0b0b0b] border border-gray-200 dark:border-[#1f1f1f] shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#1f1f1f]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Deployment Logs</h2>
              {realTimeLogs.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#111111] dark:text-gray-200">
                  Live
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Live Logs toggle: STRICT red when ON, neutral grey when OFF */}
              <button
                onClick={() => setIsLiveLogsEnabled(!isLiveLogsEnabled)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${isLiveLogsEnabled ? liveOnClasses : liveOffClasses}`}
              >
                <span className={`${isLiveLogsEnabled ? 'text-white' : 'text-gray-800 dark:text-gray-300'}`}>
                  {isLiveLogsEnabled ? 'Live Logs ON' : 'Live Logs OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  setRealTimeLogs([]);
                  setLogs([]);
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <style jsx>{`
            @keyframes fade-in {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fade-in 0.22s ease-out;
            }
          `}</style>

          {/* Logs area uses neutral canvas so labels keep their colors */}
          <div className="rounded-lg p-4 font-mono text-sm max-h-[65vh] overflow-y-auto bg-gray-100 dark:bg-[#0b0b0b]">
            {/* Historical Logs (older logs first) */}
            {logs.map((log, index) => (
              <div key={`historical-${index}`} className="mb-3 flex items-start space-x-3">
                <span className="text-xs font-mono min-w-[180px] text-gray-700 dark:text-gray-300">
                  {formatDate(log.createdAt || log.timestamp || log.time || log.date || log.ts)}
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold min-w-[72px] justify-center border ${getLabelClasses(
                    log.type || log.stage || log.step
                  )}`}
                  style={{ borderStyle: 'solid', borderWidth: 1 }}
                >
                  {(log.type || log.stage || log.step || 'INFO').toString().toUpperCase()}
                </span>

                <span className="flex-1 leading-relaxed text-gray-900 dark:text-gray-100">
                  {formatLogMessage(log.content || log.message || log.output || '', log.step || log.stage, log.type || log.level)}
                </span>
              </div>
            ))}

            {/* Real-time Logs (newest appended below historical) */}
            {realTimeLogs.map((log) => (
              <div key={log.id} className="mb-3 flex items-start space-x-3 animate-fade-in">
                <span className="text-xs font-mono min-w-[180px] text-gray-700 dark:text-gray-300">
                  {formatDate(log.timestamp || log.createdAt || log.ts || log.time)}
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold min-w-[72px] justify-center border ${getLabelClasses(
                    log.level || log.step || log.stage || log.type
                  )}`}
                  style={{ borderStyle: 'solid', borderWidth: 1 }}
                >
                  {(log.step || log.stage || log.type || 'INFO').toString().toUpperCase()}
                </span>

                <span className="flex-1 leading-relaxed text-gray-900 dark:text-gray-100">
                  {formatLogMessage(log.message || log.content || log.output || '', log.step || log.stage, log.level || log.type)}
                </span>
              </div>
            ))}

            {logs.length === 0 && realTimeLogs.length === 0 && (
              <div className="text-center py-8 text-gray-700 dark:text-gray-400">
                No logs available yet. Logs will appear here when deployment starts.
              </div>
            )}

            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentProgress;