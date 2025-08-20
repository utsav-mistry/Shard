import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { useUserManagement } from '../hooks/useUserManagement';
import { useDeploymentManagement } from '../hooks/useDeploymentManagement';
import { useDatabaseManagement } from '../hooks/useDatabaseManagement';
import axios from 'axios';
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
          password: '',
          role: 'user'
        };
      case 'projects':
        return {
          name: '',
          subdomain: '',
          stack: '',
          githubUrl: '',
          status: 'active'
        };
      case 'deployments':
        return {
          projectId: '',
          status: 'pending',
          commitHash: '',
          branch: 'main'
        };
      case 'logs':
        return {
          projectId: '',
          deploymentId: '',
          type: 'info',
          content: ''
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
    return Object.keys(formData).map((key) => {
      if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') {
        return null;
      }

      const value = formData[key];
      const isPassword = key.toLowerCase().includes('password');
      const isEmail = key.toLowerCase().includes('email');
      const isDate = key.toLowerCase().includes('date') || key === 'timestamp';
      const isSelect = key === 'role' || key === 'status' || key === 'stack' || key === 'level' || key === 'type';
      const isObject = typeof value === 'object' && value !== null;

      if (isObject) {
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key} (JSON)</label>
            <textarea
              name={key}
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange({ target: { name: key, value: parsed } });
                } catch (error) {
                  // Keep the raw text for editing
                  handleChange({ target: { name: key, value: e.target.value } });
                }
              }}
              rows={6}
              className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200 font-mono text-sm"
              placeholder="Enter valid JSON"
            />
          </div>
        );
      }

      if (isSelect) {
        let options = [];
        if (key === 'role') options = ['user', 'admin'];
        else if (key === 'status') options = ['active', 'inactive', 'pending', 'completed', 'failed', 'building', 'deploying', 'success'];
        else if (key === 'stack') options = ['mern', 'django', 'flask', 'nextjs'];
        else if (key === 'level') options = ['error', 'warn', 'info', 'debug'];
        else if (key === 'type') options = ['setup', 'config', 'build', 'deploy', 'runtime', 'error', 'complete', 'ai-review', 'queue'];

        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
            <select
              name={key}
              value={value || ''}
              onChange={handleChange}
              className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200"
            >
              <option value="">Select {key}</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      }

      return (
        <div key={key}>
          <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
          <input
            type={isPassword ? 'password' : isEmail ? 'email' : isDate ? 'datetime-local' : 'text'}
            name={key}
            value={isDate && value ? new Date(value).toISOString().slice(0, 16) : value || ''}
            onChange={handleChange}
            className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200"
            required={key === 'name' || key === 'email'}
          />
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black-900 dark:text-white-100">
            {isEditing ? `Edit ${tableName?.slice(0, -1) || 'Record'}` : `Add ${tableName?.slice(0, -1) || 'Record'}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// System Status Banner Component
const SystemStatusBanner = ({ systemStatus }) => {
  if (!systemStatus) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded': return 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'offline': return 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok': return <Activity className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'offline': return <X className="w-5 h-5 text-red-600" />;
      default: return <Server className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className={`border-l-4 p-4 mb-6 ${getStatusColor(systemStatus.status)}`}>
      <div className="flex items-center">
        {getStatusIcon(systemStatus.status)}
        <div className="ml-3">
          <h3 className="text-lg font-semibold">
            System Status: {systemStatus.status.toUpperCase()}
          </h3>
          <div className="mt-1 text-sm">
            <p>Uptime: {systemStatus.uptime ? `${Math.floor(systemStatus.uptime / 3600)}h ${Math.floor((systemStatus.uptime % 3600) / 60)}m` : 'Unknown'}</p>
            <p>Last Updated: {systemStatus.timestamp ? new Date(systemStatus.timestamp).toLocaleString() : 'Unknown'}</p>
            {systemStatus.version && <p>Version: {systemStatus.version}</p>}
          </div>
        </div>
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
      <div className="fixed inset-0 bg-black-900 bg-opacity-75 dark:bg-black-900 dark:bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white-100 dark:bg-black-800 border-2 border-black-900 dark:border-white-100 p-6 rounded-none w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {isEditing ? 'Edit User' : 'Add New User'}
            </h2>
            <button onClick={onClose} className="text-black-500 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 transition-colors duration-200">
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
                className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200"
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
                className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200"
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
                  className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200 pr-10"
                  required={!isEditing}
                  minLength={isEditing ? 0 : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-black-500 hover:text-black-900 dark:text-white-400 dark:hover:text-white-100 transition-colors duration-200"
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
                className="w-full p-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:border-black-900 dark:focus:border-white-100 transition-colors duration-200"
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
                className="px-4 py-2 border-2 border-black-300 dark:border-white-600 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:bg-black-100 dark:hover:bg-black-800 transition-colors duration-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 rounded-none hover:bg-black-800 dark:hover:bg-white-200 flex items-center transition-colors duration-200 border-2 border-black-900 dark:border-white-100"
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
    const [systemStatus, setSystemStatus] = useState(null);
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

    // Fetch all health data from single endpoint
    const fetchAllHealthData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/health');
        const healthData = response.data;
        console.log('All health data:', healthData);

        // Set overall system status
        setSystemStatus({
          status: healthData.status || 'unknown',
          timestamp: healthData.timestamp,
          uptime: healthData.uptime,
          version: healthData.version,
          environment: healthData.environment
        });

        // Extract backend health
        const backendHealth = {
          status: healthData.db?.status === 'connected' ? 'ok' : 'offline',
          uptime: healthData.uptime,
          memory: healthData.memory,
          database: healthData.db,
          timestamp: healthData.timestamp,
          cpu: healthData.cpu,
          disk: healthData.disk
        };
        setBackendHealth(backendHealth);

        // Extract AI service health
        const aiService = healthData.services?.['ai-review'];
        if (aiService) {
          setAiHealth({
            status: aiService.status === 'ok' ? 'ok' : 'offline',
            responseTime: aiService.responseTime,
            timestamp: aiService.timestamp,
            error: aiService.error
          });
        } else {
          setAiHealth({ status: 'offline', error: 'Service not found' });
        }

        // Extract deployment worker health
        const deploymentService = healthData.services?.['deployment-worker'];
        if (deploymentService) {
          setDeploymentWorkerHealth({
            status: deploymentService.status,
            responseTime: deploymentService.responseTime,
            timestamp: deploymentService.timestamp,
            uptime: deploymentService.details?.uptime,
            queue: deploymentService.details?.queue,
            docker: deploymentService.details?.docker,
            memory: deploymentService.details?.memory,
            display: deploymentService.details?.display
          });
        } else {
          setDeploymentWorkerHealth({ status: 'offline', error: 'Service not found' });
        }

      } catch (error) {
        console.error('Health fetch error:', error);
        
        // Check if error has response data (503 with valid health data)
        if (error.response && error.response.data) {
          const healthData = error.response.data;
          console.log('Health data from 503 response:', healthData);
          
          // Set overall system status from error response
          setSystemStatus({
            status: healthData.status || 'degraded',
            timestamp: healthData.timestamp,
            uptime: healthData.uptime,
            version: healthData.version,
          });
          
          // Extract backend health
          const backendHealth = {
            status: healthData.db?.status === 'connected' ? 'ok' : 'offline',
            uptime: healthData.uptime,
            memory: healthData.memory,
            database: healthData.db,
            timestamp: healthData.timestamp,
            cpu: healthData.cpu,
            disk: healthData.disk
          };
          setBackendHealth(backendHealth);

          // Extract AI service health
          const aiService = healthData.services?.['ai-review'];
          if (aiService) {
            setAiHealth({
              status: aiService.status === 'ok' ? 'ok' : 'offline',
              responseTime: aiService.responseTime,
              timestamp: aiService.timestamp,
              error: aiService.error
            });
          } else {
            setAiHealth({ status: 'offline', error: 'Service not found' });
          }

          // Extract deployment worker health
          const deploymentService = healthData.services?.['deployment-worker'];
          if (deploymentService) {
            setDeploymentWorkerHealth({
              status: deploymentService.status,
              responseTime: deploymentService.responseTime,
              timestamp: deploymentService.timestamp,
              error: deploymentService.error
            });
          } else {
            setDeploymentWorkerHealth({ status: 'offline', error: 'Service not found' });
          }
        } else {
          // True network error - no response data
          setBackendHealth({ status: 'offline', error: error.message });
          setAiHealth({ status: 'offline', error: error.message });
          setDeploymentWorkerHealth({ status: 'offline', error: error.message });
        }
      }
    };


    const fetchSystemStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        console.log('System stats response:', response.data.data); // Debug log
        setStats(response.data.data);
      } catch (error) {
        console.error('Error fetching system stats:', error);
        // Set default stats if API fails
        setStats({
          system: {
            memory: { used: 0, total: 0 },
            uptime: 0
          },
          database: {
            activeDeployments: 0,
            totalProjects: 0,
            totalUsers: 0,
            totalDeployments: 0
          }
        });
      }
    };

    const fetchAllData = async () => {
      try {
        // Fetch data sequentially to ensure proper loading
        await fetchAllHealthData();
        await fetchSystemStats();
        await fetchDeployments();
        await fetchTables();
        
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
              {/* System Status Banner */}
              <SystemStatusBanner systemStatus={systemStatus} />
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
                    {/* Status - always show if backendHealth exists */}
                    {backendHealth && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`text-sm font-medium ${backendHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' :
                          backendHealth?.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                          {backendHealth?.status === 'ok' ? 'Online' :
                            backendHealth?.status === 'degraded' ? 'Degraded' : 
                            backendHealth?.status || 'Offline'}
                        </span>
                      </div>
                    )}
                    
                    {/* Dynamic fields - only show if data exists */}
                    {backendHealth?.uptime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatUptime(backendHealth.uptime)}</span>
                      </div>
                    )}
                    
                    {backendHealth?.memory?.heapUsed && backendHealth?.memory?.heapTotal && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatBytes(backendHealth.memory.heapUsed)} / {formatBytes(backendHealth.memory.heapTotal)}
                        </span>
                      </div>
                    )}
                    
                    {backendHealth?.cpu?.usage !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{backendHealth.cpu.usage}%</span>
                      </div>
                    )}
                    
                    {backendHealth?.disk?.used && backendHealth?.disk?.total && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Disk:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatBytes(backendHealth.disk.used)} / {formatBytes(backendHealth.disk.total)}
                          {backendHealth.disk.percentage && ` (${backendHealth.disk.percentage}%)`}
                        </span>
                      </div>
                    )}
                    
                    {backendHealth?.timestamp && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(backendHealth.timestamp).toLocaleTimeString()}
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
                    {/* Status - always show if aiHealth exists */}
                    {aiHealth && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`text-sm font-medium ${aiHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {aiHealth?.status === 'ok' ? 'Online' : aiHealth?.status || 'Offline'}
                        </span>
                      </div>
                    )}
                    
                    {/* Dynamic fields - only show if data exists */}
                    {aiHealth?.responseTime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{aiHealth.responseTime}ms</span>
                      </div>
                    )}
                    
                    {aiHealth?.system?.platform && (
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
                    
                    {aiHealth?.process?.memory_info?.rss && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatBytes(aiHealth.process.memory_info.rss)}</span>
                      </div>
                    )}
                    
                    {aiHealth?.timestamp && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(aiHealth.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {aiHealth?.error && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Error:</span>
                        <span className="text-sm text-red-600 dark:text-red-400">{aiHealth.error}</span>
                      </div>
                    )}
                    
                    {/* Show any additional fields dynamically */}
                    {aiHealth && Object.entries(aiHealth)
                      .filter(([key, value]) => 
                        !['status', 'responseTime', 'system', 'process', 'timestamp', 'error'].includes(key) && 
                        value !== null && value !== undefined && value !== ''
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))
                    }
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
                    {/* Status - always show if deploymentWorkerHealth exists */}
                    {deploymentWorkerHealth && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`text-sm font-medium ${deploymentWorkerHealth?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {deploymentWorkerHealth?.status === 'ok' ? 'Online' : deploymentWorkerHealth?.status || 'Offline'}
                        </span>
                      </div>
                    )}
                    
                    {/* Dynamic fields - only show if data exists */}
                    {deploymentWorkerHealth?.uptime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatUptime(deploymentWorkerHealth.uptime)}</span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.responseTime !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{deploymentWorkerHealth.responseTime}ms</span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.queue && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Queue:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {deploymentWorkerHealth.queue.active !== undefined && deploymentWorkerHealth.queue.queued !== undefined
                            ? `${deploymentWorkerHealth.queue.active} active, ${deploymentWorkerHealth.queue.queued} queued`
                            : JSON.stringify(deploymentWorkerHealth.queue)
                          }
                        </span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.docker && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Docker:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {typeof deploymentWorkerHealth.docker === 'object' 
                            ? deploymentWorkerHealth.docker.status || JSON.stringify(deploymentWorkerHealth.docker)
                            : deploymentWorkerHealth.docker
                          }
                        </span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.memory && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {typeof deploymentWorkerHealth.memory === 'object'
                            ? `${formatBytes(deploymentWorkerHealth.memory.used || 0)} / ${formatBytes(deploymentWorkerHealth.memory.total || 0)}`
                            : deploymentWorkerHealth.memory
                          }
                        </span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.display?.memory && deploymentWorkerHealth.display.memory !== deploymentWorkerHealth?.memory && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Display Memory:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{deploymentWorkerHealth.display.memory}</span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.timestamp && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Last Check:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(deploymentWorkerHealth.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {deploymentWorkerHealth?.error && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Error:</span>
                        <span className="text-sm text-red-600 dark:text-red-400">{deploymentWorkerHealth.error}</span>
                      </div>
                    )}
                    
                    {/* Show any additional fields dynamically */}
                    {deploymentWorkerHealth && Object.entries(deploymentWorkerHealth)
                      .filter(([key, value]) => 
                        !['status', 'uptime', 'responseTime', 'queue', 'docker', 'memory', 'display', 'timestamp', 'error'].includes(key) && 
                        value !== null && value !== undefined && value !== ''
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))
                    }
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
                console.log('Editing user:', user); // Debug log
                setEditingRecord(user);
                handleTableSelect('users'); // Ensure table is selected
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
                      <h3 className="text-lg font-bold text-black-900 dark:text-white-100 capitalize flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        {selectedTable === 'logs' ? 'Deployment Logs Collection' : `${selectedTable} Collection`}
                        {tableData && tableData.length > 0 && (
                          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                            ({tableData.length} document{tableData.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <div className="flex space-x-2">
                        {selectedTable !== 'logs' && (
                          <button
                            onClick={() => {
                              setEditingRecord(null);
                              setIsEditModalOpen(true);
                            }}
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Document
                          </button>
                        )}
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-black-900 dark:border-white-100"></div>
                      </div>
                    ) : tableData && tableData.length > 0 ? (
                      <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                        {tableData.map((record, index) => (
                          <div key={record._id || index} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Document #{index + 1}</span>
                                {record._id && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {record._id}</span>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    console.log('Editing record:', record, 'Table:', selectedTable);
                                    setEditingRecord(record);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                  title="Edit Document"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this document?')) {
                                      handleDeleteDbRecord(selectedTable, record._id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                  title="Delete Document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-black-900 border border-gray-200 dark:border-gray-600 rounded p-3 overflow-x-auto">
                              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                                {JSON.stringify(
                                  {
                                    ...Object.fromEntries(
                                      Object.entries(record).map(([key, value]) => [
                                        key,
                                        key === 'password' || key === 'passwordHash' ? '••••••••' : value
                                      ])
                                    )
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Database className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No documents found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          This collection is empty. Add a new document to get started.
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
              console.log('Closing modal'); // Debug log
              setIsEditModalOpen(false);
              setEditingRecord(null);
            }}
            onSubmit={async (data) => {
              try {
                console.log('Submitting data:', data, 'Editing:', !!editingRecord, 'Table:', selectedTable); // Debug log
                if (editingRecord) {
                  await handleEditRecord(selectedTable, editingRecord._id, data);
                } else {
                  await handleAddRecord(selectedTable, data);
                }
                setIsEditModalOpen(false);
                setEditingRecord(null);
                // Refresh the table data
                if (selectedTable) {
                  await handleTableSelect(selectedTable);
                }
              } catch (error) {
                console.error('Error saving record:', error);
                alert('Error saving record: ' + (error.response?.data?.message || error.message));
              }
            }}
            record={editingRecord}
            tableName={selectedTable}
            isEditing={!!editingRecord}
          />
        </div>
      </div>
    )
  }

export default Admin;
