import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Camera, Loader2 } from 'lucide-react';

const Profile = () => {
    const { currentUser, updateProfile } = useAuth();
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
            setAvatar(currentUser.avatar || '');
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await updateProfile({ name, avatar });
            toast.success('Profile updated successfully');
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile Settings</h1>
                
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-4">
                        {avatar ? (
                            <img 
                                src={avatar} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                            </div>
                        )}
                        <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer">
                            <Camera className="w-4 h-4" />
                            <input 
                                id="avatar-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleAvatarChange}
                            />
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Display Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                            placeholder="Your display name"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Updating...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;