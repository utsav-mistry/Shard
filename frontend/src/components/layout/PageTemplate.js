import React from 'react';
import { motion } from 'framer-motion';

const PageTemplate = ({ title, children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-white-100 dark:bg-black-900 ${className}`}>
      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">
              {title}
            </h1>
          </div>
        )}

        {/* Page content with smooth animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default PageTemplate;
