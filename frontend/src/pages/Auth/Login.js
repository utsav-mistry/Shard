import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Github, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any existing token to ensure a fresh login
      localStorage.removeItem('token');
      
      // Call the login function from AuthContext
      await login(email, password);
      
      // The actual redirect happens in the AuthContext after successful login
      // We don't need to do anything here as the AuthContext will handle it
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleGithubLogin = () => {
    setError('');
    // GitHub OAuth flow - redirect to GitHub authorization page
    const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;

    window.location.href = githubAuthUrl;
  };

  const handleGoogleLogin = () => {
    setError('');
    // Google OAuth flow - redirect to Google authorization page
    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile email`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-black-900 dark:text-white-100">
        Sign in to your account
      </h2>
      <p className="mt-2 text-center text-sm text-black-500 dark:text-white-300">
        Or{' '}
        <Link to="/auth/register" className="font-medium text-black-700 hover:text-black-900 dark:text-white-300 dark:hover:text-white-100 underline">
          create a new account
        </Link>
      </p>

      {error && (
        <div className="mt-4 p-3 bg-white-200 dark:bg-black-700 text-black-900 dark:text-white-100 rounded-none text-sm border border-black-300 dark:border-white-700 shadow-lg">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-black-700 dark:text-white-300 mb-1">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-black-200 dark:border-white-700 bg-white-100 dark:bg-black-800 placeholder-black-400 dark:placeholder-white-500 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-black-500 dark:focus:ring-white-500 focus:border-black-500 dark:focus:border-white-500 focus:z-10 sm:text-sm shadow-sm transition-all duration-200"
              
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black-700 dark:text-white-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-black-200 dark:border-white-700 bg-white-100 dark:bg-black-800 placeholder-black-400 dark:placeholder-white-500 text-black-900 dark:text-white-100 rounded-none focus:outline-none focus:ring-2 focus:ring-black-500 dark:focus:ring-white-500 focus:border-black-500 dark:focus:border-white-500 focus:z-10 sm:text-sm shadow-sm transition-all duration-200 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-black-500 dark:text-white-400 focus:outline-none z-20"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-black-900 dark:text-white-100 focus:ring-black-500 dark:focus:ring-white-500 border border-black-300 dark:border-white-700 bg-white-100 dark:bg-black-800 rounded-none transition-all duration-200 accent-black dark:accent-white"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-black-700 dark:text-white-300">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link to="/auth/forgot-password" className="font-medium text-black-700 hover:text-black-900 dark:text-white-300 dark:hover:text-white-100 underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full inline-flex justify-center py-2.5 px-4 border border-black-900 rounded-none shadow-lg bg-white-100 text-sm font-medium text-black-900 hover:text-white-100 dark:bg-white-100 dark:text-black-900 dark:hover:text-white-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-500 dark:focus:ring-white-500 transition-all duration-200 overflow-hidden hover:border-black-900 dark:hover:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0"></span>
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </span>
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black-200 dark:border-white-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white-100 dark:bg-black-900 text-black-500 dark:text-white-300">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleGithubLogin}
            className="group relative w-full inline-flex justify-center py-2.5 px-4 border border-black-900 rounded-none shadow-lg bg-white-100 text-sm font-medium text-black-900 hover:text-white-100 dark:bg-black-900 dark:border dark:border-white-100 dark:text-white-100 dark:hover:text-black-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-500 dark:focus:ring-white-500 transition-all duration-200 overflow-hidden hover:border-black-900 dark:hover:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-white-100"></span>
            <span className="relative z-10 flex items-center justify-center">
              <Github className="h-5 w-5 mr-2" />
              Github
            </span>
          </button>
          <button
            onClick={handleGoogleLogin}
            className="group relative w-full inline-flex justify-center py-2.5 px-4 border border-white-100 rounded-none shadow-lg bg-black-900 text-sm font-medium text-white-100 hover:text-black-900 dark:bg-white-100 dark:border-black-900 dark:text-black-900 dark:hover:text-white-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black-500 dark:focus:ring-white-500 transition-all duration-200 overflow-hidden hover:border-black-900 dark:hover:border-white-100"
          >
            <span className="absolute inset-0 w-full h-full bg-white-100 transition-all duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0 dark:bg-black-900"></span>
            <span className="relative z-10 flex items-center justify-center">
              <Mail className="h-5 w-5 mr-2" />
              Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;