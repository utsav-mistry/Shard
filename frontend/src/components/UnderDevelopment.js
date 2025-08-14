import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const UnderDevelopment = ({ 
  title = "Feature Under Development", 
  description = "This feature is currently being developed and will be available soon.",
  backLink = "/dashboard",
  backText = "Back to Dashboard"
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-full">
              <Construction className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {description}
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Coming Soon
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Enhanced user interface</li>
                <li>• Advanced functionality</li>
                <li>• Real-time updates</li>
                <li>• Mobile optimization</li>
              </ul>
            </div>
            
            <Link
              to={backLink}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backText}
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnderDevelopment;
