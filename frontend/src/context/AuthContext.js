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
    const fetchUserProfile = useCallback(async (token) => {
        try {
            // Validate token before setting it
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('Invalid token');
            }
            
            // Set the authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Fetch user profile - ensure this matches your backend route
            const response = await api.get('/auth/profile');
            
            if (response.data) {
                setCurrentUser(response.data);
            } else {
                throw new Error('No user data received');
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            // Only clear token if it's an auth error
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
            // Set the token in axios headers before fetching the profile
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUserProfile(token);
        } else {
            // Clear any invalid token and ensure no auth header is set
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [fetchUserProfile]);


        const login = async (email, password) => {
            try {
                setError('');
                setLoading(true);
                
                // Clear any existing tokens
                localStorage.removeItem('token');
                delete api.defaults.headers.common['Authorization'];
                
                // Make login request - ensure this matches your backend route
                const response = await api.post('/auth/login', {
                    email: email.trim(),
                    password: password.trim()
                });

                if (!response.data) {
                    throw new Error('No response data from server');
                }

                const { token, user } = response.data;
                
                if (!token) {
                    throw new Error('No authentication token received');
                }
                
                // Store token and set auth header
                localStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                // Update user state
                setCurrentUser(user);
                setError('');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 100);
                
                return user;
            } catch (err) {
                console.error('Login error:', err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        const register = async (email, password, name) => {
            try {
                setError('');
                setLoading(true);
                
                // Basic validation
                if (!email || !password) {
                    throw new Error('Email and password are required');
                }
                
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }

                const response = await api.post('api/auth/register', {
                    email: email.trim(),
                    password: password.trim(),
                    name: name ? name.trim() : ''
                });

                if (!response.data.success) {
                    throw new Error(response.data.message || 'Registration failed');
                }

                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setCurrentUser(user);
                setError('');

                // Redirect to dashboard after successful registration
                window.location.href = '/dashboard';
                return user;
            } catch (err) {
                console.error('Registration error:', err);
                const errorMessage = err.response?.data?.message || err.message || 'Failed to register. Please try again.';
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        const loginWithGoogle = async (code) => {
            try {
                setError('');
                const response = await api.post('api/auth/google/callback', { code });

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
                const response = await api.post('api/auth/github/callback', { code });

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