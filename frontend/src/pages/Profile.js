import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Camera, Loader2, Mail, Lock, Bell, Shield, Check, X, 
  Github, Twitter, Link as LinkIcon, Clock, Calendar,
  CreditCard, Key, LogOut, Edit2, Eye, EyeOff, CheckCircle, GitBranch
} from 'lucide-react';

// Common styles
const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
const textClass = "text-black-900 dark:text-white-100";
const borderClass = "border-black-900 dark:border-white-100";
const cardClass = `bg-white dark:bg-black-800/50  shadow-sm border-2 ${borderClass} p-6`;

const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium transition-colors flex items-center ${
      active
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
    }`}
  >
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    {children}
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
    
    const connectedAccounts = [
      { provider: 'github', connected: true, email: 'user@github.com' },
      { provider: 'twitter', connected: false }
    ];
    
    const getProviderIcon = (provider) => {
      switch (provider) {
        case 'github': return <Github className="h-5 w-5" />;
        case 'twitter': return <Twitter className="h-5 w-5 text-blue-400" />;
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
        if (currentUser) {
            setName(currentUser.name || '');
            setEmail(currentUser.email || '');
            setAvatar(currentUser.avatar || '');
        }
    }, [currentUser]);

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

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account settings and preferences
                </p>
            </div>
            
            
            {/* Main Content */}
            <div className="bg-white dark:bg-black-800/50  shadow-sm border-2 border-black-900/10 dark:border-white/10 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-2">
                    <nav className="flex space-x-4" aria-label="Tabs">
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
                
                {/* Tab Panels */}
                <div className="p-6">
                    {/* Profile Tab */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col items-center md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            {avatar ? (
                                                <img 
                                                    src={avatar} 
                                                    alt="Profile" 
                                                    className="w-32 h-32 object-cover border-2 border-blue-500"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <User className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}
                                            <label 
                                                htmlFor="avatar-upload" 
                                                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 cursor-pointer hover:bg-blue-600 transition-colors"
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
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
                                            {!isEditing ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium shadow-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                                                    Edit Profile
                                                </button>
                                            ) : null}
                                        </div>
                                        
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Full Name
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Your name"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                        placeholder="your@email.com"
                                                        disabled={!isEditing}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {isEditing && (
                                                <div className="flex space-x-3 pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            // Reset form
                                                            if (currentUser) {
                                                                setName(currentUser.name || '');
                                                                setEmail(currentUser.email || '');
                                                                setAvatar(currentUser.avatar || '');
                                                            }
                                                        }}
                                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                                
                                {/* Connected Accounts */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Connected Accounts</h3>
                                    <div className="space-y-3">
                                        {connectedAccounts.map((account, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-white dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                                        {getProviderIcon(account.provider)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {getProviderName(account.provider)}
                                                        </p>
                                                        {account.email && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {account.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                                                        account.connected
                                                            ? 'border-red-300 text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-gray-600'
                                                            : 'border-gray-300 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {account.connected ? 'Disconnect' : 'Connect'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="text-center py-12">
                                    <Lock className="h-12 w-12 mx-auto text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Security settings</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Manage your account security settings
                                    </p>
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        This section is under development
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="text-center py-12">
                                    <Bell className="h-12 w-12 mx-auto text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Notification preferences</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Manage your notification settings
                                    </p>
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        This section is under development
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Profile;