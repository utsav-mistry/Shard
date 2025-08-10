import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center justify-between px-4 py-3 rounded-none shadow-lg max-w-sm animate-slide-in-right bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 ${
              toast.type === 'success' ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400' :
              toast.type === 'error' ? 'text-red-600 dark:text-red-400 border-red-600 dark:border-red-400' :
              toast.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400' :
              'text-black-900 dark:text-white-100'
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:opacity-80 text-black-900 dark:text-white-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};