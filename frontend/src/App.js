import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import OAuthCallback from './pages/Auth/OAuthCallback';
import AuthRedirect from './components/auth/AuthRedirect';
import TokenCallback from './pages/Auth/TokenCallback';

// Integration pages
import GitHubIntegration from './pages/integrations/GitHubIntegration';
import GitHubCallbackPage from './pages/integrations/GitHubCallback';
import GitHubIntegrationCallback from './pages/GitHubIntegrationCallback';
import ImportRepository from './pages/projects/ImportRepository';
import Integrations from './pages/Integrations';

// Landing page
import LandingPage from './pages/LandingPage';

import Overview from './pages/Overview';

// Projects pages
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetail from './pages/projects/ProjectDetail';
import NewProject from './pages/projects/NewProject';

// Deployments pages
import DeploymentDetail from './pages/deployments/DeploymentDetail';
import DeploymentProgress from './pages/deployments/DeploymentProgress';
import DeploymentLogs from './pages/deployments/DeploymentLogs';

// Environment pages
import EnvironmentVariables from './pages/environment/EnvironmentVariables';
import NewEnvironmentVariable from './pages/environment/NewEnvironmentVariable';
import EditEnvironmentVariable from './pages/environment/EditEnvironmentVariable';

// Logs pages
import LogsList from './pages/logs/LogsList';

// Settings page
import Settings from './pages/Settings';

// Profile page
import Profile from './pages/Profile';

// Admin page
import Admin from './pages/Admin';

// Sidebar pages
import Documentation from './pages/Documentation';
import ApiReference from './pages/ApiReference';
import Support from './pages/Support';
import Changelog from './pages/Changelog';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-white/80 dark:bg-black/80 text-black dark:text-white">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth Routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route index element={<Navigate to="/auth/login" replace />} />
                  <Route path="login" element={<AuthRedirect><Login /></AuthRedirect>} />
                  <Route path="register" element={<AuthRedirect><Register /></AuthRedirect>} />
                </Route>

                {/* OAuth Callback Routes - Outside Auth Layout */}
                <Route path="/auth/oauth/callback" element={<OAuthCallback />} />
                <Route path="/auth/github/callback" element={<OAuthCallback />} />
                <Route path="/auth/google/callback" element={<OAuthCallback />} />
                {/* Token-based callback from backend redirects */}
                <Route path="/auth/callback" element={<TokenCallback />} />

                {/* Integration Callbacks - Outside MainLayout */}
                <Route path="/integrations/github/callback" element={<ProtectedRoute><GitHubCallbackPage /></ProtectedRoute>} />
                <Route path="/app/integrations/github/callback" element={<ProtectedRoute><GitHubIntegrationCallback /></ProtectedRoute>} />

                {/* Protected Routes under /app */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  {/* Overview - Default route (Vercel-style) */}
                  <Route index element={<Overview />} />

                  {/* Integration Routes */}
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="integrations/github" element={<GitHubIntegration />} />

                  {/* Projects Routes */}
                  <Route path="projects" element={<ProjectsList />} />
                  <Route path="projects/new" element={<NewProject />} />
                  <Route path="projects/import" element={<ImportRepository />} />
                  <Route path="projects/:id" element={<ProjectDetail />}>
                    <Route path="deployments/:deploymentId" element={<DeploymentDetail />} />
                    <Route path="deployments/:deploymentId/progress" element={<DeploymentProgress />} />
                    <Route path="deployments/:deploymentId/logs" element={<DeploymentLogs />} />
                  </Route>

                  {/* Standalone Deployment Routes */}
                  <Route path="deployments/:id" element={<DeploymentDetail />} />
                  <Route path="deployments/:id/progress" element={<DeploymentProgress />} />
                  <Route path="deployments/:id/logs" element={<DeploymentLogs />} />

                  {/* Environment routes */}
                  <Route path="environment/:projectId" element={<EnvironmentVariables />} />
                  <Route path="environment/:projectId/new" element={<NewEnvironmentVariable />} />
                  <Route path="environment/:projectId/edit/:variableId" element={<EditEnvironmentVariable />} />

                  {/* Logs route */}
                  <Route path="logs" element={<LogsList />} />

                  {/* Profile route */}
                  <Route path="profile" element={<Profile />} />

                  {/* Settings route */}
                  <Route path="settings" element={<Settings />} />

                  {/* Documentation route */}
                  <Route path="docs" element={<Documentation />} />

                  {/* API Reference route */}
                  <Route path="api-docs" element={<ApiReference />} />

                  {/* Support route */}
                  <Route path="support" element={<Support />} />

                  {/* Changelog route */}
                  <Route path="changelog" element={<Changelog />} />
                </Route>

                {/* Admin Routes - Separate Layout */}
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
      <ThemeToggle className="fixed bottom-4 right-4" />
    </ThemeProvider>
  );
}

export default App;