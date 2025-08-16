import { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true); 
      const response = await api.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateUser = async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      setUsers([...users, response.data.data]);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const response = await api.put(`/admin/users/${currentUserData._id}`, userData);
      setUsers(users.map(user =>
        user._id === currentUserData._id ? response.data.data : user
      ));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(users.filter(user => user._id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEditUser = (user) => {
    setCurrentUserData(user);
    setIsEditing(true);
    setIsUserModalOpen(true);
  };

  return {
    users,
    isLoading,
    isUserModalOpen,
    setIsUserModalOpen,
    currentUserData,
    setCurrentUserData,
    isEditing,
    setIsEditing,
    handleEditUser,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    fetchUsers
  };
};
