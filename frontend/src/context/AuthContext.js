import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if user is already logged in on component mount
    const fetchUserProfile = useCallback(async (token) => { // Added comment to force re-transpilation
        try {
            // Validate token before setting it
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('Invalid token');
            }
            
            // Token is automatically set in api requests via axiosConfig

            // Fetch user profile
            const response = await api.get('/auth/profile');
            setCurrentUser(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            logout(); // Clear invalid token
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
            fetchUserProfile(token);
        } else {
            // Clear any invalid token
            localStorage.removeItem('token');
            setLoading(false);
        }
    }, [fetchUserProfile]);


        const login = async (email, password) => {
            try {
                setError('');
                const response = await api.post('/auth/login', {
                    email,
                    password
                });

                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setCurrentUser(user);

                // Redirect to dashboard after successful login
                window.location.href = '/dashboard';

                return user;
            } catch (err) {
                console.error('Login error:', err);
                setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
                throw err;
            }
        };

        const register = async (email, password, name) => {
            try {
                setError('');
                const response = await api.post('/auth/register', {
                    email,
                    password,
                    name
                });

                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setCurrentUser(user);

                // Redirect to dashboard after successful registration
                window.location.href = '/dashboard';

                return user;
            } catch (err) {
                console.error('Registration error:', err);
                setError(err.response?.data?.message || 'Failed to register. Please try again.');
                throw err;
            }
        };

        const loginWithGoogle = async (code) => {
            try {
                setError('');
                const response = await api.post('/auth/google/callback', { code });

                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setCurrentUser(user);

                // Redirect to dashboard after successful login
                window.location.href = '/dashboard';

                return user;
            } catch (err) {
                console.error('Google login error:', err);
                setError(err.response?.data?.message || 'Failed to login with Google. Please try again.');
                throw err;
            }
        };

        const loginWithGithub = async (code) => {
            try {
                setError('');
                const response = await api.post('/auth/github/callback', { code });

                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setCurrentUser(user);

                // Redirect to dashboard after successful login
                window.location.href = '/dashboard';

                return user;
            } catch (err) {
                console.error('GitHub login error:', err);
                setError(err.response?.data?.message || 'Failed to login with GitHub. Please try again.');
                throw err;
            }
        };

        const logout = () => {
            localStorage.removeItem('token');
            setCurrentUser(null);
        };

        const updateProfile = async (userData) => {
            try {
                setError('');
                const response = await api.put('/auth/profile', userData);
                
                // Update the current user with the new data
                setCurrentUser(prev => ({
                    ...prev,
                    ...response.data
                }));
                
                return response.data;
            } catch (err) {
                console.error('Profile update error:', err);
                setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
                throw err;
            }
        };

        const updatePassword = async (currentPassword, newPassword) => {
            try {
                setError('');
                await api.put('/auth/password', {
                    currentPassword,
                    newPassword
                });
                return true;
            } catch (err) {
                console.error('Password update error:', err);
                setError(err.response?.data?.message || 'Failed to update password. Please try again.');
                throw err;
            }
        };

        const generateApiKey = async () => {
            try {
                setError('');
                const response = await api.post('/auth/api-key');
                return response.data.apiKey;
            } catch (err) {
                console.error('API key generation error:', err);
                setError(err.response?.data?.message || 'Failed to generate API key. Please try again.');
                throw err;
            }
        };

        const getApiKeys = async () => {
            try {
                setError('');
                const response = await api.get('/auth/api-keys');
                return response.data;
            } catch (err) {
                console.error('Get API keys error:', err);
                setError(err.response?.data?.message || 'Failed to fetch API keys. Please try again.');
                throw err;
            }
        };

        const revokeApiKey = async (keyId) => {
            try {
                setError('');
                await api.delete(`/auth/api-key/${keyId}`);
                return true;
            } catch (err) {
                console.error('Revoke API key error:', err);
                setError(err.response?.data?.message || 'Failed to revoke API key. Please try again.');
                throw err;
            }
        };

        const value = {
            currentUser,
            loading,
            error,
            login,
            register,
            loginWithGoogle,
            loginWithGithub,
            logout,
            updateProfile,
            updatePassword,
            generateApiKey,
            getApiKeys,
            revokeApiKey
        };

        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        );
}
export default AuthContext;