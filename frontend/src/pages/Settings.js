import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { AlertTriangle, Save, Key, User, Shield } from 'lucide-react';

const Settings = () => {
    const { currentUser, updateUser } = useAuth();

    // Profile settings
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(null);
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Password settings
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // API key settings
    const [apiKeys, setApiKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState('never');
    const [apiKeyLoading, setApiKeyLoading] = useState(false);
    const [apiKeyError, setApiKeyError] = useState(null);
    const [newKeyGenerated, setNewKeyGenerated] = useState(null);
    const [showNewKey, setShowNewKey] = useState(false);

    // Security settings
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorSetupCode, setTwoFactorSetupCode] = useState(null);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);

    // Load user data
    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setEmail(currentUser.email || '');
            setTwoFactorEnabled(currentUser.twoFactorEnabled || false);

            // Fetch API keys
            fetchApiKeys();
        }
    }, [currentUser]);

    // Fetch API keys
    const fetchApiKeys = async () => {
        try {
            setApiKeyLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/api-keys`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setApiKeys(response.data);
            setApiKeyLoading(false);
        } catch (err) {
            console.error('Error fetching API keys:', err);
            setApiKeyError('Failed to load API keys');
            setApiKeyLoading(false);
        }
    };

    // Update profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError(null);
        setProfileSuccess(false);

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/auth/profile`,
                { name, email },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            updateUser(response.data);
            setProfileSuccess(true);
            setProfileLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setProfileError(err.response?.data?.message || 'Failed to update profile');
            setProfileLoading(false);
        }
    };

    // Update password
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }

        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/auth/password`,
                { currentPassword, newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordLoading(false);

            // Clear success message after 3 seconds
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating password:', err);
            setPasswordError(err.response?.data?.message || 'Failed to update password');
            setPasswordLoading(false);
        }
    };

    // Generate new API key
    const handleGenerateApiKey = async (e) => {
        e.preventDefault();

        if (!newKeyName.trim()) {
            setApiKeyError('Key name is required');
            return;
        }

        setApiKeyLoading(true);
        setApiKeyError(null);
        setNewKeyGenerated(null);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/api-keys`,
                {
                    name: newKeyName,
                    expiry: newKeyExpiry === 'never' ? null : newKeyExpiry
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            // The API returns the full key only once
            setNewKeyGenerated(response.data.key);
            setShowNewKey(true);
            setNewKeyName('');
            setNewKeyExpiry('never');

            // Refresh the API keys list
            fetchApiKeys();
            setApiKeyLoading(false);
        } catch (err) {
            console.error('Error generating API key:', err);
            setApiKeyError(err.response?.data?.message || 'Failed to generate API key');
            setApiKeyLoading(false);
        }
    };

    // Revoke API key
    const handleRevokeApiKey = async (keyId) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return;
        }

        try {
            setApiKeyLoading(true);
            await axios.delete(`${process.env.REACT_APP_API_URL}/auth/api-key/${keyId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // Refresh the API keys list
            fetchApiKeys();
        } catch (err) {
            console.error('Error revoking API key:', err);
            setApiKeyError(err.response?.data?.message || 'Failed to revoke API key');
            setApiKeyLoading(false);
        }
    };

    // Toggle two-factor authentication
    const handleToggleTwoFactor = async () => {
        setTwoFactorLoading(true);
        setTwoFactorError(null);
        setTwoFactorSuccess(false);
        setTwoFactorSetupCode(null);

        try {
            if (!twoFactorEnabled) {
                // Enable 2FA - this will return a setup code and QR code URL
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/auth/2fa/setup`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                setTwoFactorSetupCode(response.data);
            } else {
                // Disable 2FA
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/auth/2fa/disable`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                setTwoFactorEnabled(false);
                setTwoFactorSuccess(true);

                // Update user object
                const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                updateUser(userResponse.data);

                // Clear success message after 3 seconds
                setTimeout(() => setTwoFactorSuccess(false), 3000);
            }

            setTwoFactorLoading(false);
        } catch (err) {
            console.error('Error toggling 2FA:', err);
            setTwoFactorError(err.response?.data?.message || 'Failed to update two-factor authentication');
            setTwoFactorLoading(false);
        }
    };

    // Verify and enable two-factor authentication
    const handleVerifyTwoFactor = async (e) => {
        e.preventDefault();
        const code = e.target.elements.verificationCode.value;

        if (!code || code.length !== 6) {
            setTwoFactorError('Please enter a valid 6-digit code');
            return;
        }

        setTwoFactorLoading(true);
        setTwoFactorError(null);

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/auth/2fa/verify`,
                { code },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            setTwoFactorEnabled(true);
            setTwoFactorSetupCode(null);
            setTwoFactorSuccess(true);

            // Update user object
            const userResponse = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            updateUser(userResponse.data);

            // Clear success message after 3 seconds
            setTimeout(() => setTwoFactorSuccess(false), 3000);

            setTwoFactorLoading(false);
        } catch (err) {
            console.error('Error verifying 2FA:', err);
            setTwoFactorError(err.response?.data?.message || 'Failed to verify code');
            setTwoFactorLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage your account settings and security preferences
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar navigation */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <nav className="flex flex-col">
                            <a href="#profile" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 border-l-4 border-indigo-500 dark:border-indigo-400">
                                Profile Information
                            </a>
                            <a href="#password" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 border-l-4 border-transparent">
                                Password
                            </a>
                            <a href="#api-keys" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 border-l-4 border-transparent">
                                API Keys
                            </a>
                            <a href="#security" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 border-l-4 border-transparent">
                                Security
                            </a>
                        </nav>
                    </div>
                </div>

                {/* Settings content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Profile section */}
                    <section id="profile" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Profile Information
                                </h3>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                Update your account profile information
                            </p>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {profileError && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    {profileError}
                                </div>
                            )}

                            {profileSuccess && (
                                <div className="mb-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-3 rounded-md">
                                    Profile updated successfully!
                                </div>
                            )}

                            <form onSubmit={handleProfileUpdate}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {profileLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="-ml-1 mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Password section */}
                    <section id="password" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <Key className="h-5 w-5 text-gray-400 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Password
                                </h3>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                Update your account password
                            </p>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {passwordError && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mb-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-3 rounded-md">
                                    Password updated successfully!
                                </div>
                            )}

                            <form onSubmit={handlePasswordUpdate}>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            id="current-password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="new-password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirm-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="-ml-1 mr-2 h-4 w-4" />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* API Keys section */}
                    <section id="api-keys" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <Key className="h-5 w-5 text-gray-400 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    API Keys
                                </h3>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                Manage API keys for programmatic access to Shard
                            </p>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {apiKeyError && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-none border-2 border-red-600 dark:border-red-400 flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    {apiKeyError}
                                </div>
                            )}

                            {newKeyGenerated && (
                                <div className="mb-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-none border-2 border-yellow-600 dark:border-yellow-400">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">New API Key Generated</h3>
                                            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                                <p>This key will only be displayed once. Please copy it now and store it securely.</p>
                                                <div className="mt-2">
                                                    <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-950 p-2 rounded-none border-2 border-yellow-200 dark:border-yellow-800">
                                                        <code className="text-sm break-all">{showNewKey ? newKeyGenerated : '••••••••••••••••••••••••••••••••'}</code>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewKey(!showNewKey)}
                                                            className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                                                        >
                                                            {showNewKey ? 'Hide' : 'Show'}
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(newKeyGenerated);
                                                            alert('API key copied to clipboard');
                                                        }}
                                                        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                                    >
                                                        Copy to clipboard
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Generate new API key form */}
                            <form onSubmit={handleGenerateApiKey} className="mb-6">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="key-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Key Name
                                        </label>
                                        <input
                                            type="text"
                                            id="key-name"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            placeholder="e.g., Development, CI/CD, etc."
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="key-expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Expiration
                                        </label>
                                        <select
                                            id="key-expiry"
                                            value={newKeyExpiry}
                                            onChange={(e) => setNewKeyExpiry(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="never">Never</option>
                                            <option value="30d">30 Days</option>
                                            <option value="90d">90 Days</option>
                                            <option value="180d">180 Days</option>
                                            <option value="365d">1 Year</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <button
                                        type="submit"
                                        disabled={apiKeyLoading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {apiKeyLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Generating...
                                            </>
                                        ) : (
                                            <>Generate New API Key</>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* API keys list */}
                            <div className="mt-6">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Your API Keys</h4>

                                {apiKeyLoading && !apiKeys.length ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                                    </div>
                                ) : apiKeys.length === 0 ? (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                                        You don't have any API keys yet
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {apiKeys.map((key) => (
                                                <li key={key._id}>
                                                    <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                                                        <div>
                                                            <div className="flex items-center">
                                                                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                                                    {key.name}
                                                                </div>
                                                                {key.expiresAt && (
                                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                                        Expires {new Date(key.expiresAt).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Created on {new Date(key.createdAt).toLocaleDateString()}
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRevokeApiKey(key._id)}
                                                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Security section */}
                    <section id="security" className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Security
                                </h3>
                            </div>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                Manage your account security settings
                            </p>
                        </div>

                        <div className="px-4 py-5 sm:p-6">
                            {twoFactorError && (
                                <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    {twoFactorError}
                                </div>
                            )}

                            {twoFactorSuccess && (
                                <div className="mb-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-3 rounded-md">
                                    Two-factor authentication settings updated successfully!
                                </div>
                            )}

                            {/* Two-factor authentication */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Add an extra layer of security to your account
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleToggleTwoFactor}
                                        disabled={twoFactorLoading}
                                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                        <span className="sr-only">
                                            {twoFactorEnabled ? 'Disable two-factor authentication' : 'Enable two-factor authentication'}
                                        </span>
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>

                                {/* Two-factor setup */}
                                {twoFactorSetupCode && (
                                    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-750">
                                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Set up Two-Factor Authentication</h5>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            Scan the QR code below with your authenticator app (like Google Authenticator, Authy, or 1Password).
                                        </p>

                                        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                                            <div className="mb-4 md:mb-0 flex justify-center">
                                                {twoFactorSetupCode.qrCodeUrl && (
                                                    <img
                                                        src={twoFactorSetupCode.qrCodeUrl}
                                                        alt="QR Code for two-factor authentication"
                                                        className="h-48 w-48 border border-gray-300 dark:border-gray-600 rounded-md"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                    If you can't scan the QR code, you can manually enter this setup key in your app:
                                                </p>
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm mb-4">
                                                    {twoFactorSetupCode.secretKey}
                                                </div>

                                                <form onSubmit={handleVerifyTwoFactor}>
                                                    <div className="mb-4">
                                                        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Verification Code
                                                        </label>
                                                        <input
                                                            type="text"
                                                            id="verification-code"
                                                            name="verificationCode"
                                                            placeholder="Enter 6-digit code"
                                                            className="block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                            maxLength={6}
                                                            pattern="[0-9]{6}"
                                                            required
                                                        />
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={twoFactorLoading}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {twoFactorLoading ? (
                                                            <>
                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Verifying...
                                                            </>
                                                        ) : (
                                                            <>Verify and Enable</>
                                                        )}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Session management - could be added in the future */}
                            {/* <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Active Sessions</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  These are the devices that are currently logged into your account
                </p>
                
                <div className="mt-4">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[1, 2].map((session) => (
                      <li key={session} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Chrome on Windows
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Last active: Today at 2:43 PM
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              IP: 192.168.1.1 · Location: New York, USA
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            Revoke
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div> */}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;