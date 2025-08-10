import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

const NewEnvironmentVariable = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const toggleValueVisibility = () => {
    setShowValue((prev) => !prev);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyError, setKeyError] = useState('');
  const [valueError, setValueError] = useState('');

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setKeyError('');
    setValueError('');
    
    // Validate key
    if (!key.trim()) {
      setKeyError('Key is required');
      isValid = false;
    } else if (!/^[A-Za-z0-9_]+$/.test(key)) {
      setKeyError('Key can only contain letters, numbers, and underscores');
      isValid = false;
    }
    
    // Validate value
    if (!value.trim()) {
      setValueError('Value is required');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(
          `${process.env.REACT_APP_API_URL}/env`,
          {
            projectId,
            key: key.trim(),
            value: value.trim(),
            secret: isSecret
          },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      // Navigate back to environment variables list
      navigate(`/projects/${projectId}/env`);
    } catch (err) {
      console.error('Error creating environment variable:', err);
      
      if (err.response && err.response.status === 409) {
        setKeyError('An environment variable with this key already exists');
      } else {
        setError('Failed to create environment variable');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to={`/dashboard/environment/${projectId}`}
          className="inline-flex items-center text-sm font-medium text-black-500 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 border-b-2 border-transparent hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 px-2 py-1"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to environment variables
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black-900 dark:text-white-100">
          Add Environment Variable
        </h1>
        <p className="mt-1 text-sm text-black-500 dark:text-white-400">
          Create a new environment variable for your project
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-none border-2 border-red-600 dark:border-red-400 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white-100 dark:bg-black-900 shadow-md rounded-none border-2 border-black-200 dark:border-white-700 overflow-hidden">
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {/* Key */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-black-700 dark:text-white-300">
              Key
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="key"
                name="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className={`shadow-sm focus:ring-black-500 focus:border-black-500 dark:focus:ring-white-500 dark:focus:border-white-500 block w-full sm:text-sm border-2 border-black-300 dark:border-white-700 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 ${keyError ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500' : ''}`} 

                placeholder="DATABASE_URL"
              />
              {keyError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{keyError}</p>
              )}
              <p className="mt-2 text-sm text-black-500 dark:text-white-400">
                Environment variable keys should be uppercase with underscores
              </p>
            </div>
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-black-700 dark:text-white-300">
              Value
            </label>
            <div className="mt-1 relative rounded-none shadow-sm">
              <input
                type={showValue ? 'text' : 'password'}
                id="value"
                name="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`block w-full pr-10 sm:text-sm border-2 border-black-300 dark:border-white-700 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:ring-black-500 focus:border-black-500 dark:focus:ring-white-500 dark:focus:border-white-500 ${valueError ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:focus:ring-red-500 dark:focus:border-red-500' : ''}`} 

                placeholder="value"
              />
              <button
                type="button"
                onClick={toggleValueVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-black-400 hover:text-black-500 dark:text-white-500 dark:hover:text-white-300 z-20"
              >
                {showValue ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            {valueError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{valueError}</p>
            )}
          </div>

          {/* Secret toggle */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsSecret(!isSecret)}
              className={`${isSecret ? 'bg-black-900 dark:bg-white-100' : 'bg-white-200 dark:bg-black-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-none border-2 ${isSecret ? 'border-black-900 dark:border-white-100' : 'border-black-300 dark:border-white-700'} transition-colors duration-200 ease-in-out focus:outline-none`}
              role="switch"
              aria-checked={isSecret}
            >
              <span className="sr-only">Mark as secret</span>
              <span
                aria-hidden="true"
                className={`${isSecret ? 'translate-x-5 bg-white-100 dark:bg-black-900' : 'translate-x-0 bg-black-900 dark:bg-white-100'} pointer-events-none inline-block h-5 w-5 transform rounded-none shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
            <span className="ml-3 text-sm font-medium text-black-700 dark:text-white-300">
              Mark as secret
            </span>
            <span className="ml-2 text-sm text-black-500 dark:text-white-400">
              (Secret values are hidden in the UI and logs)
            </span>
          </div>
        </div>
        <div className="px-4 py-3 bg-white-200 dark:bg-black-800 text-right sm:px-6 border-t-2 border-black-200 dark:border-white-700">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/environment/${projectId}`)}
            className="mr-3 inline-flex justify-center py-2 px-4 border-2 border-black-300 dark:border-white-700 shadow-sm text-sm font-medium rounded-none text-black-700 dark:text-white-200 bg-white-100 dark:bg-black-900 hover:bg-black-200 dark:hover:bg-black-800 transition-all duration-200 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="group relative inline-flex justify-center py-2 px-4 border-2 border-black-900 dark:border-white-100 text-sm font-medium rounded-none text-black-900 bg-white-100 hover:text-white-100 hover:bg-black-900 dark:bg-white-100 dark:text-black-900 dark:hover:bg-black-900 dark:hover:text-white-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Create
                </span>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEnvironmentVariable;