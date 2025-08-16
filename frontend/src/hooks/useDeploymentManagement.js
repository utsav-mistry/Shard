import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

export const useDeploymentManagement = () => {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeployments = async () => {
    try {
      const response = await api.get('/admin/deployments');
      setDeployments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  return {
    deployments,
    isLoading,
    fetchDeployments,
    getStatusBadge
  };
};
