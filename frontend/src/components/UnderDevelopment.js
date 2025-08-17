import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const UnderDevelopment = ({ 
  title = "Feature Under Development", 
  description = "This feature is currently being developed and will be available soon.",
  backLink = "/app",
  backText = "Back to Dashboard"
}) => {
  return (
    <div className="min-h-screen bg-white-100 dark:bg-black-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 border-2 border-yellow-600 dark:border-yellow-400">
              <Construction className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-black-900 dark:text-white-100 mb-4">
            {title}
          </h1>
          
          <p className="text-black-600 dark:text-white-400 mb-8">
            {description}
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-400 p-4">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2">
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
              className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 text-sm font-bold bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:bg-white-100 hover:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
              <span className="relative z-10 flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backText}
              </span>
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-black-500 dark:text-white-400">
            Questions? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnderDevelopment;
