import React from 'react';

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

        {/* Page content with CSS transition animation */}
        <div className="animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageTemplate;
