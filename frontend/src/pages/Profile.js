import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
    User, Camera, Loader2, Mail, Lock, Bell, Github,
    Link as LinkIcon, Edit2, Key
} from 'lucide-react';
import api from '../utils/axiosConfig';

// Common styles - Fixed to use consistent design system
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white-100 dark:bg-black-700 shadow-sm border-2 border-black-900 dark:border-white-100 hover:shadow-lg transition-shadow p-6 rounded-none`;

const TabButton = ({ active, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`group relative px-4 py-2 text-sm font-bold transition-all duration-200 overflow-hidden flex items-center rounded-none border-2 ${active
            ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900'
            : 'border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900'
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

const Profile = () => {
    const { currentUser, updateProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [fetchingProfile, setFetchingProfile] = useState(true);

    const [connectedAccounts, setConnectedAccounts] = useState([
        { provider: 'github', connected: false, email: '' }]);

    const getProviderIcon = (provider) => {
        switch (provider) {
            case 'github': return <Github className="h-5 w-5" />;
            default: return <LinkIcon className="h-5 w-5" />;
        }
    };

    const getProviderName = (provider) => {
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatDateTime = (dateTimeString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeString).toLocaleString(undefined, options);
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setFetchingProfile(true);
            const response = await api.get('/auth/profile');
            const userData = response.data?.data?.user || response.data?.user || response.data?.data;

            if (userData) {
                setUserProfile(userData);
                setName(userData.name || userData.username || '');
                setEmail(userData.email || '');
                setAvatar(userData.avatar || '');

                // Update connected accounts based on user data
                setConnectedAccounts([
                    {
                        provider: 'github',
                        connected: !!userData.githubUsername,
                        email: userData.githubUsername ? `${userData.githubUsername}@github.com` : ''
                    },
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            toast.error('Failed to load profile data');
            // Fallback to currentUser if available
            if (currentUser) {
                setName(currentUser.name || currentUser.username || '');
                setEmail(currentUser.email || '');
                setAvatar(currentUser.avatar || '');
            }
        } finally {
            setFetchingProfile(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile({ name, avatar });
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Profile update error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // For simplicity, we're just using a FileReader to convert to base64
            // In a production app, you might want to upload to a storage service
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (fetchingProfile) {
        return (
            <div className="min-h-screen bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-black-900 dark:text-white-100 mx-auto mb-4" />
                    <p className="text-black-900 dark:text-white-100">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-black-900 dark:text-white-100 mb-2">Profile Settings</h1>
                    <p className="text-lg text-black-600 dark:text-white-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                {/* Main Content */}
                <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none overflow-hidden shadow-md hover:shadow-lg transition-shadow">
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
                                icon={Lock}
                            >
                                Security
                            </TabButton>
                            <TabButton
                                active={activeTab === 'notifications'}
                                onClick={() => setActiveTab('notifications')}
                                icon={Bell}
                            >
                                Notifications
                            </TabButton>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            {avatar ? (
                                                <img
                                                    src={avatar}
                                                    alt="Profile"
                                                    className="w-32 h-32 object-cover border-2 border-black-900 dark:border-white-100 rounded-none"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 bg-white-200 dark:bg-black-600 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
                                                    <User className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute bottom-0 right-0 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 p-2 rounded-none cursor-pointer hover:scale-110 transition-all duration-200 border-2 border-black-900 dark:border-white-100"
                                                title="Change photo"
                                            >
                                                <Camera className="h-4 w-4" />
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarChange}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-2xl font-bold text-black-900 dark:text-white-100">Profile Information</h2>
                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="group relative inline-flex items-center px-3 py-1.5 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
                                                >
                                                    <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                                    <span className="relative z-10 flex items-center">
                                                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                                                        Edit Profile
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-bold text-black-900 dark:text-white-100 mb-2">
                                                    Full Name
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                    placeholder="Your name"
                                                    disabled={!isEditing}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-bold text-black-900 dark:text-white-100 mb-2">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 text-black-900 dark:text-white-100" />
                                                    </div>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 border-2 border-black-900 dark:border-white-100 rounded-none bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                        placeholder="your@email.com"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div className="flex space-x-3 pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                                                Saving...
                                                            </>
                                                        ) : 'Save Changes'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            if (userProfile) {
                                                                setName(userProfile.name || userProfile.username || '');
                                                                setEmail(userProfile.email || '');
                                                                setAvatar(userProfile.avatar || '');
                                                            }
                                                        }}
                                                        className="group relative inline-flex items-center px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 text-sm font-bold rounded-none transition-all duration-200 overflow-hidden"
                                                    >
                                                        <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                                        <span className="relative z-10">
                                                            Cancel
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>

                                {/* Connected Accounts */}
                                <div className="border-t-2 border-black-900 dark:border-white-100 pt-6">
                                    <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Connected Accounts</h3>
                                    <div className="space-y-3">
                                        {connectedAccounts.map((account, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 rounded-none">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-black-900 dark:bg-white-100 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
                                                        {getProviderIcon(account.provider)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-bold text-black-900 dark:text-white-100">
                                                            {getProviderName(account.provider)}
                                                        </p>
                                                        {account.email && (
                                                            <p className="text-xs text-black-600 dark:text-white-400">
                                                                {account.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`group relative inline-flex items-center px-3 py-1.5 border-2 text-xs font-bold rounded-none transition-all duration-200 overflow-hidden ${account.connected
                                                        ? 'border-red-600 text-red-600 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900'
                                                        : 'border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 hover:text-white-100 dark:hover:text-black-900'
                                                        }`}
                                                >
                                                    <span className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 ${account.connected ? 'bg-red-600' : 'bg-black-900 dark:bg-white-100'
                                                        }`} />
                                                    <span className="relative z-10">
                                                        {account.connected ? 'Disconnect' : 'Connect'}
                                                    </span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Security Settings</h3>

                                    {/* Two-Factor Authentication */}
                                    <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-black-900 dark:text-white-100">Two-Factor Authentication</h4>
                                                <p className="text-sm text-black-600 dark:text-white-400">Add an extra layer of security to your account</p>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-black-600 dark:text-white-400 mr-3">Disabled</span>
                                                <button className="group relative px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none font-bold">
                                                    <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                                    <span className="relative z-10">Enable 2FA</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Login Sessions */}
                                    <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-black-900 dark:text-white-100">Active Sessions</h4>
                                                <p className="text-sm text-black-600 dark:text-white-400">Manage your active login sessions</p>
                                            </div>
                                            <button className="group relative px-4 py-2 border-2 border-red-600 bg-red-600 text-white-100 hover:text-red-600 transition-all duration-200 overflow-hidden rounded-none font-bold">
                                                <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                                <span className="relative z-10">Revoke All Sessions</span>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-2 border-dotted border-gray-300 dark:border-gray-700 rounded-none shadow-sm">
                                                <div className="flex items-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-black-900 dark:text-white-100">Current Session</p>
                                                        <p className="text-xs text-black-600 dark:text-white-400">Chrome on Windows • {new Date().toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* API Keys */}
                                    <div className="bg-white-100 dark:bg-black-700 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-none p-6 shadow-lg shadow-black/5 dark:shadow-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-black-900 dark:text-white-100">API Keys</h4>
                                                <p className="text-sm text-black-600 dark:text-white-400">Manage your API access keys</p>
                                            </div>
                                            <button className="group relative px-4 py-2 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden rounded-none font-bold">
                                                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                                                <span className="relative z-10">Generate New Key</span>
                                            </button>
                                        </div>
                                        <div className="text-center py-8">
                                            <Key className="h-8 w-8 text-black-400 dark:text-white-600 mx-auto mb-2" />
                                            <p className="text-sm text-black-600 dark:text-white-400">No API keys created yet</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-black-900 dark:text-white-100 mb-4">Notification Preferences</h3>

                                    {/* Email Notifications */}
                                    <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6 mb-6">
                                        <h4 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4">Email Notifications</h4>
                                        <div className="space-y-4">
                                            {[
                                                { id: 'deployments', label: 'Deployment Status', description: 'Get notified when deployments succeed or fail', enabled: true },
                                                { id: 'security', label: 'Security Alerts', description: 'Important security notifications and login alerts', enabled: true },
                                                { id: 'updates', label: 'Product Updates', description: 'New features and platform updates', enabled: true },
                                                { id: 'marketing', label: 'Marketing', description: 'Tips, best practices, and promotional content', enabled: false }
                                            ].map((setting) => (
                                                <div key={setting.id} className="flex items-center justify-between p-4 bg-white-100 dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-none hover:shadow-md transition-shadow">
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-black-900 dark:text-white-100">{setting.label}</h5>
                                                        <p className="text-sm text-black-600 dark:text-white-400">{setting.description}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            defaultChecked={setting.enabled}
                                                        />
                                                        <div className="relative w-12 h-6 bg-black-200 dark:bg-white-700 peer-focus:outline-none rounded-none border-2 border-black-900 dark:border-white-100 transition-colors duration-200 overflow-hidden">
                                                            <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${setting.enabled ? 'translate-x-0' : 'translate-x-full'}`}>
                                                                <div className={`w-1/2 h-full flex items-center justify-center ${setting.enabled ? 'bg-black-900 dark:bg-white-100' : ''}`}>
                                                                    <div className={`w-3 h-3 border-2 ${setting.enabled ? 'border-white-100 dark:border-black-900' : 'border-black-900 dark:border-white-100'}`}></div>
                                                                </div>
                                                                <div className={`w-1/2 h-full flex items-center justify-center ${!setting.enabled ? 'bg-black-900 dark:bg-white-100' : ''}`}></div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Push Notifications */}
                                        <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6 mb-6">
                                            <h4 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4">Push Notifications</h4>
                                            <div className="space-y-4">
                                                {[
                                                    { id: 'browser', label: 'Browser Notifications', description: 'Show notifications in your browser', enabled: false },
                                                    { id: 'desktop', label: 'Desktop Notifications', description: 'Show system notifications on your desktop', enabled: true }
                                                ].map((setting) => (
                                                    <div key={setting.id} className="flex items-center justify-between p-4 bg-white-100 dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-none hover:shadow-md transition-shadow">
                                                        <div className="flex-1">
                                                            <h5 className="font-bold text-black-900 dark:text-white-100">{setting.label}</h5>
                                                            <p className="text-sm text-black-600 dark:text-white-400">{setting.description}</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer ml-4">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                defaultChecked={setting.enabled}
                                                            />
                                                            <div className="relative w-12 h-6 bg-black-200 dark:bg-white-700 peer-focus:outline-none rounded-none border-2 border-black-900 dark:border-white-100 transition-colors duration-200 overflow-hidden">
                                                                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${setting.enabled ? 'translate-x-0' : 'translate-x-full'}`}>
                                                                    <div className={`w-1/2 h-full flex items-center justify-center ${setting.enabled ? 'bg-black-900 dark:bg-white-100' : ''}`}>
                                                                        <div className={`w-3 h-3 border-2 ${setting.enabled ? 'border-white-100 dark:border-black-900' : 'border-black-900 dark:border-white-100'}`}></div>
                                                                    </div>
                                                                    <div className={`w-1/2 h-full flex items-center justify-center ${!setting.enabled ? 'bg-black-900 dark:bg-white-100' : ''}`}></div>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notification Frequency */}
                                        <div className="bg-white-100 dark:bg-black-700 border-2 border-black-900 dark:border-white-100 rounded-none p-6">
                                            <h4 className="text-lg font-bold text-black-900 dark:text-white-100 mb-4">Notification Frequency</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { id: 'instant', label: 'Instant', description: 'Get notified immediately' },
                                                    { id: 'hourly', label: 'Hourly Digest', description: 'Get a summary every hour' },
                                                    { id: 'daily', label: 'Daily Digest', description: 'Get a daily summary' },
                                                    { id: 'weekly', label: 'Weekly Summary', description: 'Receive a weekly summary' }
                                                ].map((option) => (
                                                    <label key={option.id} className="flex items-center p-4 bg-white-100 dark:bg-black-800 border-2 border-black-900 dark:border-white-100 rounded-none cursor-pointer hover:shadow-md transition-all group">
                                                        <div className={`relative w-5 h-5 border-2 rounded-none mr-3 flex-shrink-0 ${option.id === 'instant' ? 'border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100' : 'border-black-900 dark:border-white-100'}`}>
                                                            {option.id === 'instant' && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-2 h-2 bg-white-100 dark:bg-black-900"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5 className={`font-bold ${option.id === 'instant' ? 'text-black-900 dark:text-white-100' : 'text-black-900 dark:text-white-100'}`}>
                                                                {option.label}
                                                            </h5>
                                                            <p className="text-sm text-black-600 dark:text-white-400">{option.description}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
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

export default Profile;