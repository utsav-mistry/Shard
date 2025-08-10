import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardRedirect from './components/DashboardRedirect';

// Layout components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import GitHubCallback from './pages/Auth/GitHubCallback';
import GoogleCallback from './pages/Auth/GoogleCallback';

// Landing page
import LandingPage from './pages/LandingPage';

// Dashboard pages
import Dashboard from './pages/Dashboard';

// Projects pages
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetail from './pages/projects/ProjectDetail';
import NewProject from './pages/projects/NewProject';

// Deployments pages
import DeploymentsList from './pages/deployments/DeploymentsList';
import DeploymentDetail from './pages/deployments/DeploymentDetail';
import DeploymentLogs from './pages/deployments/DeploymentLogs';
import NewDeployment from './pages/deployments/NewDeployment';

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
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth Routes */}
              <Route path="/auth" element={<AuthLayout />}>
                <Route index element={<Navigate to="/auth/login" replace />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="github/callback" element={<GitHubCallback />} />
                <Route path="google/callback" element={<GoogleCallback />} />
              </Route>

              {/* Dashboard redirect */}
              <Route path="/app" element={<DashboardRedirect />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />

                {/* Projects routes */}
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/new" element={<NewProject />} />
                <Route path="projects/:id" element={<ProjectDetail />} />

                {/* Deployments routes */}
                <Route path="deployments" element={<DeploymentsList />} />
                <Route path="deployments/new/:projectId" element={<NewDeployment />} />
                <Route path="deployments/:id" element={<DeploymentDetail />} />
                <Route path="deployments/:id/logs" element={<DeploymentLogs />} />

                {/* Environment routes */}
                <Route path="environment/:projectId" element={<EnvironmentVariables />} />
                <Route path="environment/:projectId/new" element={<NewEnvironmentVariable />} />
                <Route path="environment/:projectId/edit/:variableId" element={<EditEnvironmentVariable />} />

                {/* Logs route */}
                <Route path="logs" element={<LogsList />} />

                {/* Settings route */}
                <Route path="settings" element={<Settings />} />
                
                {/* Profile route */}
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
            <ThemeToggle className="fixed bottom-4 right-4" />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;