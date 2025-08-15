import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X, Menu, Home, Folder, Settings, HelpCircle, LogOut, ChevronRight,
  ChevronDown, Plus, Zap, Server, Users, Activity, Box, CreditCard,
  FileText, BarChart2, Layers, Code, Database, Lock, Bell, Search, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    resources: false,
    account: false
  });

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900";
  const hoverClass = "hover:bg-black-100 hover:text-black-900 dark:hover:bg-white-900 dark:hover:text-white-100";
  const textClass = "text-black-900 dark:text-white-100";
  const borderClass = "border-black-900 dark:border-white-100";

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Navigation items with categories and icons
  const navigation = [
    {
      id: 'main',
      category: 'Navigation',
      icon: <Menu className="h-5 w-5" />,
      items: [
        { 
          name: 'Dashboard', 
          href: '/dashboard', 
          icon: <Home className="h-5 w-5" /> 
        },
        { 
          name: 'Projects', 
          href: '/dashboard/projects', 
          icon: <Folder className="h-5 w-5" /> 
        },
        { 
          name: 'Deployments', 
          href: '/dashboard/deployments', 
          icon: <Server className="h-5 w-5" /> 
        },
        { 
          name: 'Activity', 
          href: '/dashboard/activity', 
          icon: <Activity className="h-5 w-5" /> 
        },
      ]
    },
    {
      id: 'resources',
      category: 'Resources',
      icon: <FileText className="h-5 w-5" />,
      items: [
        { 
          name: 'Documentation', 
          href: '/docs', 
          icon: <HelpCircle className="h-5 w-5" /> 
        },
        { name: 'API Reference', href: '/api-docs', icon: <Code className="h-4 w-4" /> },
        { name: 'Support', href: '/support', icon: <Bell className="h-4 w-4" /> },
        { name: 'Changelog', href: '/changelog', icon: <Layers className="h-4 w-4" /> },
      ]
    },
    {
      id: 'account',
      category: 'Account',
      icon: <Settings className="h-4 w-4" />,
      items: [
        { name: 'Profile', href: '/dashboard/profile', icon: <Users className="h-4 w-4" /> },
        { name: 'Billing', href: '/dashboard/billing', icon: <CreditCard className="h-4 w-4" /> },
        { name: 'Team', href: '/dashboard/team', icon: <Users className="h-4 w-4" /> },
        { name: 'Settings', href: '/dashboard/settings', icon: <Settings className="h-4 w-4" /> },
      ]
    }
  ];

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
    <motion.div
      className="fixed inset-y-0 left-0 w-72 bg-white-100 dark:bg-black-900 border-r-2 border-black-900 dark:border-white-100 shadow-xl z-50 flex flex-col"
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={{
        open: {
          x: 0,
          transition: {
            type: 'tween',
            ease: [0.4, 0, 0.2, 1],
            duration: 0.3
          }
        },
        closed: {
          x: '-100%',
          transition: {
            type: 'tween',
            ease: [0.4, 0, 0.2, 1],
            duration: 0.2,
            delay: 0.1
          }
        }
      }}
      style={{
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransform: 'translateZ(0)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b-2 border-black-900 dark:border-white-100">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 flex items-center justify-center bg-black-900 dark:bg-white-100 transition-colors duration-200 group-hover:bg-white-100 dark:group-hover:bg-black-900">
              <Zap className="h-5 w-5 text-white-100 dark:text-black-900 group-hover:text-black-900 dark:group-hover:text-white-100 transition-colors duration-200" />
            </div>
            <span className="text-2xl font-extrabold text-black-900 dark:text-white-100">
              SHARD
            </span>
          </Link>
          <div className="w-8">
            {/* Empty div for layout consistency */}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          {/* Main Navigation */}
          <div className="space-y-2">
            {navigation.map((section) => (
              <div key={section.id} className="mb-6">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-black-900 dark:text-white-100 hover:bg-black-900/5 dark:hover:bg-white-100/10 transition-colors group"
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-black-900 dark:text-white-100 group-hover:text-black-900 dark:group-hover:text-white-100 transform transition-transform duration-200">
                      {expandedSections[section.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <span className="text-base font-semibold">{section.category}</span>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSections[section.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pl-10 py-1">
                        {section.items.map((item) => (
                          <div key={item.name} className="relative">
                            <Link
                              to={item.href}
                              className="flex items-center px-4 py-2 text-base font-medium text-black-900 dark:text-white-100 hover:bg-black-900/5 dark:hover:bg-white-100/10 transition-colors"
                              onClick={onClose}
                            >
                              <span className="mr-3 text-black-900 dark:text-white-100">
                                {item.icon}
                              </span>
                              <span>{item.name}</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-10 px-2">
            <h3 className="text-sm font-semibold text-black-900 dark:text-white-100 uppercase tracking-wider mb-4 px-2">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="group relative w-full flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-black-900 dark:border-white-100 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  New Project
                </span>
              </button>
              <button className="group relative w-full flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-black-900 dark:border-white-100 bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 hover:bg-transparent hover:text-black-900 dark:hover:text-white-100 transition-all duration-200 overflow-hidden">
                <span className="absolute inset-0 w-full h-full bg-white-100 dark:bg-black-900 transition-transform duration-300 ease-in-out transform translate-x-full group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Deploy
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* User section */}
        <div className="p-6 border-t-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900">
          <div className="flex items-center">
            <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-black-900 dark:bg-white-100 text-white-100 dark:text-black-900 font-bold text-lg">
              {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="text-base font-semibold text-black-900 dark:text-white-100 truncate">
                {currentUser?.name || currentUser?.email || 'User'}
              </p>
              <button
                onClick={handleLogout}
                className="mt-1 group relative inline-flex items-center text-sm font-medium text-black-900 dark:text-white-100 hover:opacity-90 transition-all duration-200"
              >
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black-900 dark:bg-white-100 transition-all duration-300 group-hover:w-full" />
                <LogOut className="h-4 w-4 mr-1.5 transition-transform group-hover:translate-x-0.5" />
                <span className="relative">Sign out</span>
              </button>
            </div>
          </div>
        </div>
        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            SHARD v1.0.0 • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;