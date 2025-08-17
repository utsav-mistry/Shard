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

    // Handle OAuth login with token
    const loginWithToken = useCallback(async (token, userData) => {
        try {
            if (!token) throw new Error('No token provided');

            // Store the token
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Set the current user
            const userWithRole = {
                ...userData,
                role: userData.role || 'user'
            };
            setCurrentUser(userWithRole);
            setError('');

            return userWithRole;
        } catch (err) {
            console.error('Login with token error:', err);
            setError(err.message || 'Failed to log in with token');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Check if user is already logged in on component mount
    const fetchUserProfile = useCallback(async (token) => {
        try {
            // Validate token before setting it
            if (!token || token === 'null' || token === 'undefined') {
                throw new Error('Invalid token');
            }

            // Set the authorization header
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Fetch user profile - the response has the user data nested in response.data.data.user
            const response = await api.get('/auth/profile');

            if (response.data && response.data.data && response.data.data.user) {
                const userData = response.data.data.user;
                const userWithRole = {
                    ...userData,
                    name: userData.name || userData.username || userData.displayName || userData.email?.split('@')[0] || 'User',
                    role: userData.role || 'user' // Ensure role is set, default to 'user' if not provided
                };
                setCurrentUser(userWithRole);

                // Redirect to admin dashboard if user is admin and not already there
                if (userWithRole.role === 'admin' && !window.location.pathname.startsWith('/admin')) {
                    console.log('Admin user detected, redirecting to admin panel');
                    window.location.href = '/admin';
                }

                return userWithRole;
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

            if (!response.data || !response.data.data) {
                throw new Error('No response data from server');
            }

            // Extract token and user from the response data structure
            const { token, user } = response.data.data;

            if (!token) {
                throw new Error('No authentication token received');
            }

            // Store token and set auth header
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Update user state with the full user object from response
            const userWithRole = {
                ...user,
                name: user.name || user.username || user.displayName || user.email?.split('@')[0] || 'User',
                role: user.role || 'user' // Ensure role is set, default to 'user' if not provided
            };
            setCurrentUser(userWithRole);
            setError('');

            // Redirect based on role after a short delay
            setTimeout(() => {
                if (userWithRole.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/app';
                }
            }, 100);

            return userWithRole;
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

            const response = await api.post('/auth/register', {
                email: email.trim(),
                password: password.trim(),
                name: name ? name.trim() : ''
            });

            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Registration failed');
            }

            // Extract token and user from the response data structure
            const { token, user } = response.data.data || {};
            localStorage.setItem('token', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            const userWithRole = {
                ...user,
                name: user.name || user.username || user.displayName || user.email?.split('@')[0] || 'User',
                role: user.role || 'user'
            };
            setCurrentUser(userWithRole);
            setError('');

            // Redirect based on role after successful registration
            setTimeout(() => {
                if (userWithRole.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/app';
                }
            }, 100);
            
            return userWithRole;
        } catch (err) {
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to register. Please try again.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = () => {
        // Redirect to backend OAuth login endpoint
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google/login`;
    };

    const loginWithGithub = () => {
        // Redirect to backend OAuth login endpoint
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/github/login`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        // Redirect to login page after logout
        window.location.href = '/auth/login';
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

    // Create the context value object
    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        loginWithToken,
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
};

export default AuthContext;