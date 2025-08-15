import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we have a valid API URL
      if (!process.env.REACT_APP_API_URL) {
        throw new Error('API URL is not configured. Please set REACT_APP_API_URL in your .env file');
      }
      
      console.log('Fetching projects from:', `${process.env.REACT_APP_API_URL || ''}/api/projects`);
      
      // Use the full path including /api prefix
      const response = await api.get('/api/projects');
      
      // Check if response has the expected structure
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Handle successful response with data
      if (response.data.success && Array.isArray(response.data.data)) {
        setProjects(response.data.data);
      } else {
        // Handle case where data is not in expected format
        throw new Error(response.data.message || 'Invalid response format from server');
      }
      
      return response.data;
    } catch (err) {
      console.error('Failed to fetch projects:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      // Set user-friendly error message
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         err.message || 
                         'Failed to load projects. Please try again later.';
      
      setError(errorMessage);
      setProjects([]);
      
      // Rethrow to allow error boundaries to catch it if needed
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (projectData) => {
    try {
      const response = await api.post('/api/projects', projectData);
      await fetchProjects(); // Refresh the projects list
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to create project:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Failed to create project' 
      };
    }
  };

  return { 
    projects, 
    loading, 
    error, 
    refresh: fetchProjects,
    createProject
  };
};

export default useProjects;
