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

      // Use the correct backend endpoint
      const url = '/api/deployments';

      const response = await api.get(url);

      // Handle the standardized API response format
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response format from server');
      }

      const deploymentsData = response.data.data || [];

      // Filter by projectId if specified (client-side filtering)
      const filteredDeployments = projectId
        ? deploymentsData.filter(deployment => deployment.projectId?._id === projectId)
        : deploymentsData;

      setDeployments(filteredDeployments);
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

    // Set up polling every 60 seconds for real-time updates (reduced from 30)
    const interval = setInterval(fetchDeployments, 60000);

    return () => clearInterval(interval);
  }, [fetchDeployments]);

  const createDeployment = async (deploymentData) => {
    try {
      const response = await api.post('/api/deployments', deploymentData);
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
