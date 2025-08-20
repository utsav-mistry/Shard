import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { useUserManagement } from '../hooks/useUserManagement';
import { useDeploymentManagement } from '../hooks/useDeploymentManagement';
import { useDatabaseManagement } from '../hooks/useDatabaseManagement';
import {
  Rocket,
  AlertTriangle,
  Users,
  Edit,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
  Clock,
  Server,
  Database,
  Table as TableIcon,
  RefreshCw,
  Activity,
  Settings,
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  ChevronDown
} from 'lucide-react';

// Database Record Modal Component
const DatabaseRecordModal = ({ isOpen, onClose, onSubmit, record = null, tableName, isEditing = false }) => {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data based on record or create empty form
  useEffect(() => {
    if (record && isEditing) {
      // Remove _id and __v from form data for editing
      const { _id, __v, createdAt, updatedAt, ...editableData } = record;
      setFormData(editableData);
    } else {
      // Create empty form based on table name
      const emptyForm = getEmptyFormForTable(tableName);
      setFormData(emptyForm);
    }
  }, [record, tableName, isEditing]);

  const getEmptyFormForTable = (table) => {
    switch (table) {
      case 'users':
        return {
          name: '',
          email: '',
          passwordHash: '',
          role: 'user',
          avatar: '',
          googleId: '',
          githubId: '',
          githubAccessToken: '',
          githubUsername: ''
        };
      case 'projects':
        return {
          name: '',
          repoUrl: '',
          framework: 'mern',
          subdomain: '',
          status: 'active',
          ownerId: '',
          description: '',
          port: 3000,
          buildCommand: '',
          startCommand: '',
          installCommand: '',
          envVars: []
        };
      case 'deployments':
        return {
          projectId: '',
          userId: '',
          userEmail: '',
          status: 'pending',
          branch: 'main',
          commitHash: '',
          commitMessage: '',
          buildLogs: '',
          deploymentUrl: '',
          environment: 'production'
        };
      case 'logs':
        return {
          projectId: '',
          deploymentId: '',
          type: 'setup',
          content: '',
          timestamp: new Date().toISOString()
        };
      default:
        return {};
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    return Object.entries(formData).map(([key, value]) => {
      if (key === 'password' && isEditing) {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">
              New {key} (leave blank to keep current)
            </label>
            <input
              type="password"
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        );
      }

      if (key === 'role') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        );
      }

      if (key === 'framework' && tableName === 'projects') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="mern">MERN</option>
              <option value="django">Django</option>
              <option value="flask">Flask</option>
              <option value="node">Node.js</option>
              <option value="react">React</option>
              <option value="nextjs">Next.js</option>
              <option value="vue">Vue.js</option>
              <option value="angular">Angular</option>
            </select>
          </div>
        );
      }

      if (key === 'status' && tableName === 'projects') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        );
      }

      if (key === 'status' && tableName === 'deployments') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="pending">Pending</option>
              <option value="building">Building</option>
              <option value="deploying">Deploying</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        );
      }

      if (key === 'environment' && tableName === 'deployments') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        );
      }

      if (key === 'port' && tableName === 'projects') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <input
              type="number"
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="1000"
              max="65535"
              placeholder="3000"
            />
          </div>
        );
      }

      if ((key === 'buildLogs' || key === 'description') && (tableName === 'projects' || tableName === 'deployments')) {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <textarea
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              placeholder={key === 'description' ? 'Project description...' : 'Build logs...'}
            />
          </div>
        );
      }

      if (key === 'envVars' && tableName === 'projects') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">Environment Variables</label>
            <textarea
              name={key}
              value={Array.isArray(value) ? JSON.stringify(value, null, 2) : value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              placeholder='[{"key": "NODE_ENV", "value": "production"}]'
            />
          </div>
        );
      }

      if (key === 'type' && tableName === 'logs') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="setup">Setup</option>
              <option value="config">Config</option>
              <option value="deploy">Deploy</option>
              <option value="runtime">Runtime</option>
              <option value="error">Error</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        );
      }

      if (key === 'content' && tableName === 'logs') {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <textarea
              name={key}
              value={value}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={4}
              required
            />
          </div>
        );
      }

      // Skip auto-generated fields in forms
      if (['createdAt', 'updatedAt', '__v', '_id', 'timestamp'].includes(key)) {
        return null;
      }

      return (
        <div key={key}>
          <label className="block text-sm font-medium mb-1 capitalize">
            {key === 'passwordHash' ? 'Password' :
              key === 'repoUrl' ? 'Repository URL' :
                key === 'ownerId' ? 'Owner ID (User ID)' :
                  key === 'projectId' ? 'Project ID' :
                    key === 'userId' ? 'User ID' :
                      key === 'deploymentId' ? 'Deployment ID' :
                        key === 'userEmail' ? 'User Email' :
                          key === 'commitHash' ? 'Commit Hash' :
                            key === 'commitMessage' ? 'Commit Message' :
                              key === 'deploymentUrl' ? 'Deployment URL' :
                                key === 'buildCommand' ? 'Build Command' :
                                  key === 'startCommand' ? 'Start Command' :
                                    key === 'installCommand' ? 'Install Command' :
                                      key === 'githubAccessToken' ? 'GitHub Access Token' :
                                        key === 'githubUsername' ? 'GitHub Username' :
                                          key === 'githubId' ? 'GitHub ID' :
                                            key === 'googleId' ? 'Google ID' :
                                              key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            {['name', 'email', 'repoUrl', 'framework', 'subdomain', 'ownerId', 'projectId'].includes(key) && ' *'}
          </label>
          <input
            type={key === 'email' || key === 'userEmail' ? 'email' :
              (key === 'passwordHash' || key === 'password' || key === 'githubAccessToken') ? 'password' :
                key === 'repoUrl' || key === 'deploymentUrl' ? 'url' :
                  key === 'port' ? 'number' :
                    'text'}
            name={key}
            value={value || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required={['name', 'email', 'repoUrl', 'framework', 'subdomain', 'ownerId', 'projectId'].includes(key) && !isEditing}
            placeholder={
              key === 'subdomain' ? 'my-app (will be localhost:port)' :
                key === 'commitHash' ? 'Git commit hash or "latest"' :
                  key === 'ownerId' || key === 'projectId' || key === 'userId' || key === 'deploymentId' ? 'MongoDB ObjectId (24 hex characters)' :
                    key === 'port' ? '3000' :
                      key === 'buildCommand' ? 'npm run build' :
                        key === 'startCommand' ? 'npm start' :
                          key === 'installCommand' ? 'npm install' :
                            key === 'branch' ? 'main' :
                              key === 'userEmail' ? 'user@example.com' :
                                ''
            }
            min={key === 'port' ? '1000' : undefined}
            max={key === 'port' ? '65535' : undefined}
          />
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? `Edit ${tableName.slice(0, -1)}` : `Add New ${tableName.slice(0, -1)}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
              {isSubmitting && (
                <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// User Management Tab Component
const UserManagementTab = ({ users, onCreateUser, onEditUser, onDeleteUser, loading }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className=" text-xl font-bold text-black-900 dark:text-white-100">User Management</h2>
        <button
          onClick={onCreateUser}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-black-50 dark:bg-black-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black-500 dark:text-white-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black-200 dark:divide-black-600">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-black-50 dark:hover:bg-black-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-black-900 dark:text-white-100">
                          {user.name || 'No name'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black-900 dark:text-white-100">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                        ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black-500 dark:text-white-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Modal component for user operations
const UserModal = ({ isOpen, onClose, onSubmit, user = null, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'user',
  });
  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'user',
    });
  }, [user]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 pr-10"
                required={!isEditing}
                minLength={isEditing ? 0 : 6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
              {isSubmitting && (
                <svg className="animate-spin ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Admin Navigation Bar Component
const AdminNavBar = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white-100 dark:bg-black-900 border-b-2 border-black-900 dark:border-white-100 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center">
            <Shield className="w-5 h-5 text-white-100 dark:text-black-900" />
          </div>
          <h1 className="text-xl font-bold text-black-900 dark:text-white-100">Shard Admin</h1>
        </div>

        {/* User Info & Logout */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-200 rounded-none"
          >
            <div className="w-8 h-8 bg-black-900 dark:bg-white-100 rounded-none flex items-center justify-center">
              <User className="w-4 h-4 text-white-100 dark:text-black-900" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">{user?.name || 'Admin'}</div>
              <div className="text-xs opacity-75">{user?.email}</div>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none shadow-lg z-50">
              <div className="p-4 border-b-2 border-black-900 dark:border-white-100">
                <div className="text-sm font-bold text-black-900 dark:text-white-100">{user?.name}</div>
                <div className="text-xs text-black-600 dark:text-white-400">{user?.email}</div>
                <div className="text-xs text-black-500 dark:text-white-500 mt-1">
                  Role: <span className="font-bold text-red-600 dark:text-red-400">Administrator</span>
                </div>
                <div className="text-xs text-black-500 dark:text-white-500">
                  Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-none transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const Admin = () => {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('health');
  const [backendHealth, setBackendHealth] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [deploymentWorkerHealth, setDeploymentWorkerHealth] = useState(null);
  const [availableTables] = useState(['users', 'projects', 'deployments', 'logs']);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // User management
  const {
    isUserModalOpen,
    setIsUserModalOpen,
    currentUserData,
    isEditing,
    handleCreateUser,
    handleUpdateUser,
    fetchUsers
  } = useUserManagement();

  // Deployment management
  const {
    fetchDeployments
  } = useDeploymentManagement();

  // Database management
  const {
    selectedTable,
    tableData,
    handleTableSelect,
    handleAddRecord,
    handleEditRecord,
    handleDeleteRecord: handleDeleteDbRecord,
    fetchTables
  } = useDatabaseManagement();

  // Manual fetch functions (no auto-polling)
  const fetchHealth = async (service, setter) => {
    try {
      let url;
      switch (service) {
        case 'backend':
          url = 'http://localhost:5000/health';
          break;
        case 'ai':
          url = 'http://localhost:8000/health';
          break;
        case 'deployment-worker':
          url = 'http://localhost:9000/health';
          break;
        default:
          url = `/admin/health/${service}`;
      }

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const raw = await res.json();
      console.log(`Health data for ${service}:`, raw);

      // Normalize status across services
      const rawStatus = (raw.status || raw.state || (raw.ok ? 'ok' : 'offline') || '').toString().toLowerCase();
      const normalizedStatus = ['ok', 'healthy', 'online', 'up'].includes(rawStatus) ? 'ok' :
        rawStatus === 'degraded' ? 'degraded' : 'offline';
      const data = { ...raw, status: normalizedStatus };
      setter(data);
    } catch (error) {
      console.error(`Health fetch error for ${service}:`, error);
      setter({ status: 'offline', error: error.message });
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/logs');
      // Logs fetched but not used in current UI
      console.log('Logs fetched:', res.data.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchHealth('backend', setBackendHealth),
        fetchHealth('ai', setAiHealth),
        fetchHealth('deployment-worker', setDeploymentWorkerHealth),
        fetchDeployments(),
        fetchLogs(),
        fetchTables()
      ]);
      // Auto-load users for admin config tab
      if (activeTab === 'admin-config') {
        await handleTableSelect('users');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    try {
      setLoading(true);
      // Use the hook's setters instead
      handleTableSelect(tableName);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (data) => {
    try {
      if (currentUserData) {
        await handleUpdateUser(data);
      } else {
        await handleCreateUser(data);
      }
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error submitting user data:', error);
    }
  };

  // Utility functions
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white dark:bg-black-900 flex items-center justify-center">
        <div className="text-center border-2 border-black-900 dark:border-white-100 p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
          <h3 className="mt-4 text-lg font-bold text-black-900 dark:text-white-100">Access Denied</h3>
          <p className="mt-2 text-sm text-black-600 dark:text-white-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-100 dark:bg-black-900">
      {/* Admin Navigation Bar */}
      <AdminNavBar user={currentUser} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-black-900 dark:border-white-100 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-black-900 dark:text-white-100">Admin Dashboard</h1>
            <p className="mt-2 text-base text-black-600 dark:text-white-400">
              Manage users, database, and monitor services
            </p>
          </div>
          <a
            href="http://localhost:5000/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Activity className="w-4 h-4 mr-2" />
            System Insights
          </a>
        </div>

        {/* Manual Refresh Button */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-black-900 dark:border-white-100 mb-8">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('health')}
              className={`${activeTab === 'health'
                ? 'border-black-900 dark:border-white-100 text-black-900 dark:text-white-100'
                : 'border-transparent text-black-500 hover:text-black-900 hover:border-black-900 dark:text-white-400 dark:hover:text-white-100 dark:hover:border-white-100'
                } pb-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Activity className="w-4 h-4 mr-2" />
              System Health
            </button>
            <button
              onClick={() => {
                setActiveTab('admin-config');
                handleTableSelect('users');
              }}
              className={`${activeTab === 'admin-config'
                  ? 'border-black-900 dark:border-white-100 text-black-900 dark:text-white-100'
                  : 'border-transparent text-black-500 dark:text-white-500 hover:text-black-700 dark:hover:text-white-300 hover:border-black-300 dark:hover:border-white-700'
                } pb-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <User className="w-4 h-4 mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`${activeTab === 'database'
                ? 'border-black-900 dark:border-white-100 text-black-900 dark:text-white-100'
                : 'border-transparent text-black-500 hover:text-black-900 hover:border-black-900 dark:text-white-400 dark:hover:text-white-100 dark:hover:border-white-100'
                } pb-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Database className="w-4 h-4 mr-2" />
              Database
            </button>
          </nav>
        </div>

        {/* System Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Health Status Cards - Masonry Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Backend Service */}
              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Server className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-black-900 dark:text-white-100">Backend Service</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Port 5000</p>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${backendHealth?.status === 'ok' ? 'bg-green-500' :
                      backendHealth?.status === 'degraded' ? 'bg-yellow-500' :
                        'bg-red-500'
                    }`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${backendHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' :
                        backendHealth?.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                      }`}>
                      {backendHealth?.status === 'ok' ? 'Online' :
                        backendHealth?.status === 'degraded' ? 'Degraded' : 'Offline'}
                    </span>
                  </div>
                  {backendHealth?.uptime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatUptime(backendHealth.uptime)}</span>
                    </div>
                  )}
                  {backendHealth?.db && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Database:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{backendHealth.db.status}</span>
                    </div>
                  )}
                  {backendHealth?.memory && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatBytes(backendHealth.memory.heapUsed)} / {formatBytes(backendHealth.memory.heapTotal)}</span>
                    </div>
                  )}
                  {backendHealth?.services?.['deployment-worker'] && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Deploy Worker:</span>
                      <span className={`text-sm font-medium ${backendHealth.services['deployment-worker'].status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {backendHealth.services['deployment-worker'].status === 'ok' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Service */}
              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-black-900 dark:text-white-100">AI Service</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Port 8000</p>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${aiHealth?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${aiHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {aiHealth?.status === 'ok' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {aiHealth?.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{aiHealth.responseTime}ms</span>
                    </div>
                  )}
                  {aiHealth?.system && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Platform:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{aiHealth.system.platform}</span>
                    </div>
                  )}
                  {aiHealth?.process?.cpu_percent !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">CPU:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{aiHealth.process.cpu_percent}%</span>
                    </div>
                  )}
                  {aiHealth?.process?.memory_info && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatBytes(aiHealth.process.memory_info.rss)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deployment Worker */}
              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Rocket className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-black-900 dark:text-white-100">Deployment Worker</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Port 9000</p>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${deploymentWorkerHealth?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${deploymentWorkerHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {deploymentWorkerHealth?.status === 'ok' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  {deploymentWorkerHealth?.uptime && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{formatUptime(deploymentWorkerHealth.uptime)}</span>
                    </div>
                  )}
                  {deploymentWorkerHealth?.queue && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Queue:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{deploymentWorkerHealth.queue.active} active, {deploymentWorkerHealth.queue.queued} queued</span>
                    </div>
                  )}
                  {deploymentWorkerHealth?.display?.memory && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{deploymentWorkerHealth.display.memory}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {stats?.system?.memory ? `${formatBytes(stats.system.memory.used)} / ${formatBytes(stats.system.memory.total)}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">System Uptime</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {stats?.system?.uptime ? formatUptime(stats.system.uptime) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center">
                  <Rocket className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Deployments</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {stats?.database?.activeDeployments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600 dark:text-orange-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projects</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {stats?.database?.totalProjects || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Config Tab - User Management */}
        {activeTab === 'admin-config' && (
          <UserManagementTab
            users={selectedTable === 'users' ? tableData || [] : []}
            onCreateUser={() => {
              setEditingRecord(null);
              handleTableSelect('users');
              setIsEditModalOpen(true);
            }}
            onEditUser={(user) => {
              setEditingRecord(user);
              setIsEditModalOpen(true);
            }}
            onDeleteUser={(userId) => {
              if (window.confirm('Are you sure you want to delete this user?')) {
                handleDeleteDbRecord('users', userId);
              }
            }}
            loading={loading}
          />
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Sidebar - 30% */}
            <div className="w-[30%] bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-lg p-4">
              <h3 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4 flex items-center">
                <TableIcon className="w-5 h-5 mr-2" />
                Database Tables
              </h3>
              <div className="space-y-2">
                {availableTables.map((table) => (
                  <button
                    key={table}
                    onClick={() => fetchTableData(table)}
                    className={`w-full text-left px-3 py-2 rounded border-2 transition-colors ${selectedTable === table
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{table}</span>
                      <Database className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content - 70% */}
            <div className="w-[70%] bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-lg p-4">
              {selectedTable ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-black-900 dark:text-white-100 capitalize">
                      {selectedTable} Collection
                    </h3>
                    <button
                      onClick={() => {
                        setEditingRecord(null);
                        setIsEditModalOpen(true);
                      }}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Record
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
                    </div>
                  ) : tableData.length > 0 ? (
                    <div className="overflow-auto max-h-[calc(100vh-400px)]">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            {Object.keys(tableData[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tableData.map((record, index) => (
                            <tr key={record._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              {Object.entries(record).map(([key, value]) => (
                                <td key={key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                  {typeof value === 'object' && value !== null
                                    ? JSON.stringify(value).substring(0, 50) + '...'
                                    : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')
                                  }
                                </td>
                              ))}
                              <td className="px-4 py-3 text-right text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this record?')) {
                                      handleDeleteDbRecord(selectedTable, record._id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Database className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No records found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Get started by adding a new record.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TableIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Select a table</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose a table from the sidebar to view its data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSubmit={handleUserSubmit}
          user={currentUserData}
          isEditing={isEditing}
        />

        <DatabaseRecordModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          onSubmit={async (data) => {
            try {
              if (editingRecord) {
                await handleEditRecord(selectedTable, editingRecord._id, data);
              } else {
                await handleAddRecord(selectedTable, data);
              }
              setIsEditModalOpen(false);
              setEditingRecord(null);
            } catch (error) {
              console.error('Error saving record:', error);
            }
          }}
          record={editingRecord}
          tableName={selectedTable}
          isEditing={!!editingRecord}
        />
      </div>
    </div>
  );
};

export default Admin;
