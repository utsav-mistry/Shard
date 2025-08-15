import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

const useDeployments = (projectId = null) => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeployments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we have a valid API URL
      if (!process.env.REACT_APP_API_URL) {
        throw new Error('API URL is not configured. Please set REACT_APP_API_URL in your .env file');
      }
      
      const url = projectId 
        ? `/api/projects/${projectId}/deployments`
        : '/api/deploy';
      
      const response = await api.get(url);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      
      setDeployments(response.data);
    } catch (err) {
      console.error('Failed to fetch deployments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load deployments');
      setDeployments([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDeployments();
    
    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(fetchDeployments, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  const createDeployment = async (deploymentData) => {
    try {
      const response = await api.post(
        projectId ? `/api/projects/${projectId}/deployments` : '/api/deployments',
        deploymentData
      );
      await fetchDeployments(); // Refresh the deployments list
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to create deployment:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Failed to create deployment' 
      };
    }
  };

  return { 
    deployments, 
    loading, 
    error, 
    refresh: fetchDeployments,
    createDeployment
  };
};

export default useDeployments;
