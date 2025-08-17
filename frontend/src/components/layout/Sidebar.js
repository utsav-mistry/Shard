import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronRight, 
  LogOut, 
  LayoutDashboard,
  Folder,
  Package,
  BarChart3,
  Activity,
  BookOpen,
  FileText,
  Settings,
  ExternalLink,
  Zap, 
  Server, 
  Layers, 
  Code, 
  Bell, 
  User, 
  Plus, 
  Github,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
  const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
  const textClass = "text-black-900 dark:text-white-100";
  const borderClass = "border-black-900 dark:border-white-100";

  // Vercel-style navigation - clean and minimal
  const navigation = [
    {
      name: 'Overview',
      href: '/app/overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      exact: true
    },
    {
      name: 'Projects',
      icon: <Folder className="w-5 h-5" />,
      children: [
        { name: 'All Projects', href: '/app/projects' },
        { name: 'New Project', href: '/app/projects/new' },
        { name: 'Templates', href: '/app/projects/templates' }
      ]
    },
    {
      name: 'Deployments',
      href: '/app/deployments',
      icon: <Package className="w-5 h-5" />
    },
    {
      name: 'Resources',
      icon: <Server className="w-5 h-5" />,
      children: [
        { name: 'Domains', href: '/app/domains' },
        { name: 'Environment Variables', href: '/app/env-vars' },
        { name: 'Integrations', href: '/app/integrations' }
      ]
    },
    {
      name: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/app/analytics'
    },
    { 
      name: 'Monitoring', 
      href: '#', 
      icon: <Activity className="w-5 h-5" />,
      children: [
        { name: 'Metrics', href: '/app/monitoring/metrics' },
        { name: 'Logs', href: '/app/monitoring/logs' },
        { name: 'Alerts', href: '/app/monitoring/alerts' },
      ]
    },
  ];

  const bottomNavigation = [
    { 
      name: 'Documentation', 
      href: '/app/docs', 
      icon: <BookOpen className="w-5 h-5" />
    },
    { 
      name: 'API Reference', 
      href: '/app/api-reference', 
      icon: <Code className="w-5 h-5" /> 
    },
    { 
      name: 'Support', 
      href: '/app/support', 
      icon: <HelpCircle className="w-5 h-5" /> 
    },
    { 
      name: 'Changelog', 
      href: '/app/changelog', 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      name: 'Settings', 
      href: '/app/settings', 
      icon: <Settings className="w-5 h-5" /> 
    }
  ];

  const toggleSection = (name) => {
    setExpandedSections(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Animation variants for sidebar
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30
      }
    }
  };

  const itemVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    closed: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-y-auto">
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 
          bg-white dark:bg-black border-r-2 border-black dark:border-white 
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-full
        `}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-white bg-white dark:bg-black">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black dark:bg-white border-2 border-black dark:border-white flex items-center justify-center">
                <Zap className="w-4 h-4 text-white dark:text-black" />
              </div>
              <span className="text-xl font-bold text-black dark:text-white">Shard</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-black dark:text-white" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b-2 border-black dark:border-white bg-white dark:bg-black">
            <div className="flex items-center space-x-3">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 border-2 border-black dark:border-white"
                />
              ) : (
                <div className="w-8 h-8 bg-black dark:bg-white border-2 border-black dark:border-white flex items-center justify-center">
                  <User className="w-4 h-4 text-white dark:text-black" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black dark:text-white truncate">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs text-black-600 dark:text-white-400 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-black dark:text-white border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        expandedSections[item.name] ? 'rotate-90' : ''
                      }`} />
                    </button>
                    {expandedSections[item.name] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={onClose}
                            className={`block px-3 py-2 text-sm font-medium transition-colors border-2 ${
                              location.pathname === child.href
                                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                : 'text-black dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white'
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors border-2 ${
                      location.pathname === item.href
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                        : 'text-black dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t-2 border-black dark:border-white space-y-1 bg-white dark:bg-black">
            {bottomNavigation.map((item) => {
              const content = (
                <>
                  {item.icon}
                  <span>{item.name}</span>
                  {item.external && (
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  )}
                </>
              );
              
              return item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors border-2 text-black dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white"
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium transition-colors border-2 ${
                    location.pathname === item.href
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                      : 'text-black dark:text-white border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white'
                  }`}
                >
                  {content}
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border-2 border-transparent hover:bg-red-50 dark:hover:bg-red-900 hover:border-red-600 dark:hover:border-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;