import React from 'react';
import { ExternalLink, CheckCircle, AlertTriangle, XCircle, Clock, PartyPopper } from 'lucide-react';

const DeploymentResults = ({ deployment, project, aiResults }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'pending':
            case 'deploying':
                return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getCustomDomain = (stack, subdomain) => {
        const PORT_CONFIG = {
            mern: { backend: 12000 },
            django: { backend: 13000 },
            flask: { backend: 14000 },
        };
        
        const ports = PORT_CONFIG[stack?.toLowerCase()];
        if (!ports) return 'http://localhost:3000';
        
        if (stack?.toLowerCase() === 'mern' && ports.frontend) {
            return `http://localhost:${ports.frontend}`;
        }
        
        return `http://localhost:${ports.backend}`;
    };

    const customDomain = project ? getCustomDomain(project.stack, project.subdomain) : null;

    return (
        <div className="space-y-6">
            {/* Deployment Status */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(deployment?.status)}
                    <h2 className="text-xl font-bold">Deployment Status</h2>
                </div>
                
                <div className="gap-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Project Name</p>
                        <p className="font-medium">{project?.name || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                        <p className="font-medium capitalize">{deployment?.status || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subdomain</p>
                        <p className="font-medium">{project?.subdomain || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stack</p>
                        <p className="font-medium uppercase">{project?.stack || 'Unknown'}</p>
                    </div>
                </div>

                {/* Custom Domain Access */}
                {deployment?.status === 'success' && customDomain && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
                                    <PartyPopper className="w-5 h-5" />
                                    Deployment Successful!
                                </h3>
                                <p className="text-green-700 dark:text-green-300 text-sm">
                                    Your application is now live and accessible
                                </p>
                            </div>
                            <a
                                href={customDomain}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Visit Site
                            </a>
                        </div>
                        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Live URL:</p>
                            <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                                {customDomain}
                            </code>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Review Results */}
            {aiResults && (
                <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">AI Code Review</h2>
                    
                    <div className="flex items-center gap-3 mb-4">
                        {aiResults.verdict === 'approve' && (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    Code Quality: Approved
                                </span>
                            </>
                        )}
                        {aiResults.verdict === 'deny' && (
                            <>
                                <XCircle className="w-5 h-5 text-red-500" />
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                    Code Quality: Issues Found
                                </span>
                            </>
                        )}
                        {aiResults.verdict === 'manual_review' && (
                            <>
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                    Code Quality: Manual Review Required
                                </span>
                            </>
                        )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-2xl font-bold">{aiResults.issueCount || 0}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Issues Found</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-2xl font-bold">{aiResults.criticalCount || 0}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-2xl font-bold">{aiResults.warningCount || 0}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
                        </div>
                    </div>

                    {/* Issues List */}
                    {aiResults.issues && aiResults.issues.length > 0 && (
                        <div>
                            <h3 className="font-bold mb-3">Issues Detected:</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {aiResults.issues.slice(0, 10).map((issue, index) => (
                                    <div 
                                        key={index}
                                        className="p-3 border border-gray-200 dark:border-gray-700 rounded"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                                                issue.severity === 'critical' 
                                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                                    : issue.severity === 'warning'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                                                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                            }`}>
                                                {issue.severity?.toUpperCase() || 'INFO'}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{issue.message}</p>
                                                {issue.file && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {issue.file}{issue.line ? `:${issue.line}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {aiResults.issues.length > 10 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                        ... and {aiResults.issues.length - 10} more issues
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Deployment Information */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Deployment Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Branch</p>
                        <p className="font-medium">{deployment?.branch || 'main'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commit</p>
                        <p className="font-medium font-mono text-sm">
                            {deployment?.commitHash ? deployment.commitHash.substring(0, 8) : 'latest'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Started At</p>
                        <p className="font-medium">
                            {deployment?.createdAt ? new Date(deployment.createdAt).toLocaleString() : 'Unknown'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                        <p className="font-medium">
                            {deployment?.finishedAt && deployment?.createdAt 
                                ? `${Math.round((new Date(deployment.finishedAt) - new Date(deployment.createdAt)) / 1000)}s`
                                : 'In progress...'
                            }
                        </p>
                    </div>
                </div>

                {deployment?.commitMessage && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commit Message</p>
                        <p className="font-medium">{deployment.commitMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeploymentResults;
