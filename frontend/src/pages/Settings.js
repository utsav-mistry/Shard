import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { AlertTriangle, Save, Key, User, Shield, Loader2 } from 'lucide-react';

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

    // Active tab
    const [activeTab, setActiveTab] = useState('profile');

    // Two-factor authentication state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState(null);
    const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
    const [twoFactorSetupCode, setTwoFactorSetupCode] = useState(null);

    // Load user data
    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setEmail(currentUser.email || '');
        }
    }, [currentUser]);

    // Update profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError(null);
        setProfileSuccess(false);

        try {
            const response = await api.put('/api/auth/profile', { name, email });
            updateUser(response.data);
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setProfileError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    // Update password
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

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
            await api.put('/api/auth/password', { currentPassword, newPassword });
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err) {
            console.error('Error updating password:', err);
            setPasswordError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    // API key management
    const handleRevokeApiKey = async (keyId) => {
        // Implementation for revoking API key
        console.log('Revoking API key:', keyId);
    };

    // Toggle two-factor authentication
    const handleToggleTwoFactor = async () => {
        setTwoFactorLoading(true);
        setTwoFactorError(null);
        if (twoFactorEnabled) {
            // Disable 2FA
            await api.post(
                '/api/auth/2fa/disable',
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
            const userResponse = await api.get('/auth/profile', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            updateUser(userResponse.data);

            // Clear success message after 3 seconds
            setTimeout(() => setTwoFactorSuccess(false), 3000);
        } else {
            // Enable 2FA
            const response = await api.post('/api/auth/2fa/setup', {}, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setTwoFactorSetupCode(response.data);
        }

        setTwoFactorLoading(false);
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
            await api.post('/api/auth/2fa/verify', { code }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setTwoFactorEnabled(true);
            setTwoFactorSetupCode(null);
            setTwoFactorSuccess(true);

            // Update user object
            const userResponse = await api.get('/api/auth/profile', {
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

    const TabButton = ({ active, onClick, children, icon: Icon }) => (
        <button
            onClick={onClick}
            className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 flex items-center border-2 rounded-none overflow-hidden ${active
                ? 'bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 border-black-900 dark:border-white-100'
                : 'text-black-900 dark:text-white-100 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900'
                }`}
        >
            {!active && (
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            )}
            <span className="relative z-10 flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {children}
            </span>
        </button>
    );

    return (
        <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white">
            {/* Grid background */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-[-1]"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(to right, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px),
                        repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0 1px, transparent 1px 32px)
                    `,
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-[-1] dark:block"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px),
                        repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0 1px, transparent 1px 32px)
                    `,
                }}
            />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none overflow-hidden shadow-md">
                    {/* Tabs */}
                    <div className="border-b-2 border-black-900 dark:border-white-100 px-6 pt-4">
                        <nav className="flex space-x-2 pb-4" aria-label="Tabs">
                            <TabButton
                                active={activeTab === 'profile'}
                                onClick={() => setActiveTab('profile')}
                                icon={User}
                            >
                                Profile
                            </TabButton>
                            <TabButton
                                active={activeTab === 'security'}
                                onClick={() => setActiveTab('security')}
                                icon={Shield}
                            >
                                Security
                            </TabButton>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Profile Information</h2>

                                    {profileError && (
                                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-red-800 dark:text-red-200">{profileError}</span>
                                        </div>
                                    )}

                                    {profileSuccess && (
                                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 flex items-center gap-3">
                                            <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-800 dark:text-green-200">Profile updated successfully!</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                placeholder="your@email.com"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={profileLoading}
                                            className="inline-flex items-center px-4 py-2 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold border-2 border-black-900 dark:border-white-100 rounded-none hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {profileLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="-ml-1 mr-2 h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-4">Change Password</h2>

                                    {passwordError && (
                                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 rounded-none flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-red-800 dark:text-red-200">{passwordError}</span>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 rounded-none flex items-center gap-3">
                                            <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-800 dark:text-green-200">Password updated successfully!</span>
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                        <div>
                                            <label htmlFor="current-password" className="block text-sm font-medium mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                id="current-password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="new-password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                required
                                                minLength={8}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="confirm-password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                required
                                                minLength={8}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="inline-flex items-center px-4 py-2 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold border-2 border-black-900 dark:border-white-100 rounded-none hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {passwordLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Key className="-ml-1 mr-2 h-4 w-4" />
                                                    Update Password
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold mb-4">Two-Factor Authentication</h2>

                                    {twoFactorError && (
                                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 flex items-center gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-red-800 dark:text-red-200">{twoFactorError}</span>
                                        </div>
                                    )}

                                    {twoFactorSuccess && (
                                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-400 flex items-center gap-3">
                                            <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <span className="text-green-800 dark:text-green-200">Two-factor authentication updated successfully!</span>
                                        </div>
                                    )}

                                    {twoFactorEnabled ? (
                                        <button
                                            onClick={handleToggleTwoFactor}
                                            disabled={twoFactorLoading}
                                            className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium border-2 border-black dark:border-white hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {twoFactorLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                    Disabling...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="-ml-1 mr-2 h-4 w-4" />
                                                    Disable Two-Factor Authentication
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div>
                                            <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                                                <div>
                                                    <label htmlFor="verificationCode" className="block text-sm font-medium mb-2">
                                                        Verification Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id="verificationCode"
                                                        required
                                                        minLength={6}
                                                        maxLength={6}
                                                        className="w-full px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={twoFactorLoading}
                                                    className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-medium border-2 border-black dark:border-white hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {twoFactorLoading ? (
                                                        <>
                                                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                            Verifying...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield className="-ml-1 mr-2 h-4 w-4" />
                                                            Enable Two-Factor Authentication
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'api-keys' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-4">API Keys</h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Manage API keys for programmatic access to your account.
                                    </p>

                                    <div className="text-center py-12 border-2 border-dashed border-black-900 dark:border-white-100 rounded-none">
                                        <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No API Keys</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't created any API keys yet.</p>
                                        <button className="inline-flex items-center px-4 py-2 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold border-2 border-black-900 dark:border-white-100 rounded-none hover:scale-[1.02] active:scale-95 transition-all duration-200">
                                            <Key className="-ml-1 mr-2 h-4 w-4" />
                                            Create API Key
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
