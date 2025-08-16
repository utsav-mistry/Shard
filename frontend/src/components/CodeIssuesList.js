import React from 'react';
import { AlertTriangle, Shield, AlertCircle, Info, Code } from 'lucide-react';

const CodeIssuesList = ({ issues, title = "Code Analysis Results" }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              No issues found in code analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'style':
        return <Code className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'security':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'style':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'style':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Group issues by severity for better organization
  const groupedIssues = issues.reduce((acc, issue) => {
    const severity = issue.severity || 'info';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(issue);
    return acc;
  }, {});

  const severityOrder = ['security', 'error', 'warning', 'style', 'info'];
  const sortedSeverities = severityOrder.filter(severity => groupedIssues[severity]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      
      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Issues: {issues.length}
          </span>
          <div className="flex space-x-2">
            {severityOrder.map(severity => {
              const count = groupedIssues[severity]?.length || 0;
              if (count === 0) return null;
              return (
                <span
                  key={severity}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeColor(severity)}`}
                >
                  {severity}: {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {sortedSeverities.map(severity => (
          <div key={severity}>
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2 capitalize">
              {severity} Issues ({groupedIssues[severity].length})
            </h4>
            <div className="space-y-2">
              {groupedIssues[severity].map((issue, index) => (
                <div
                  key={`${severity}-${index}`}
                  className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          {issue.tool && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {issue.tool}
                            </span>
                          )}
                        </div>
                        {issue.file && issue.line && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {issue.file}:{issue.line}
                          </span>
                        )}
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                        {issue.message}
                      </p>
                      
                      {issue.suggestion && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </p>
                        </div>
                      )}
                      
                      {issue.code && (
                        <div className="mt-2">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                            {issue.code}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeIssuesList;
