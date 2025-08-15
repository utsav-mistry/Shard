import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  ChevronRight,
  Plus,
  Zap
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useClickAway } from 'react-use';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  // Close menus when clicking outside
  useClickAway(searchRef, () => setSearchOpen(false));
  useClickAway(userMenuRef, () => setUserMenuOpen(false));
  useClickAway(mobileSearchRef, () => setMobileSearchOpen(false));

  // Format page title from URL
  const getPageTitle = () => {
    const path = location.pathname.split('/').pop() || 'dashboard';
    return path
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Close sidebar when route changes or on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [sidebarOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        document.querySelector('.search-input')?.focus();
      }
      // Esc to close search or sidebar
      if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (sidebarOpen) setSidebarOpen(false);
        if (mobileSearchOpen) setMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, sidebarOpen, mobileSearchOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Toggle sidebar state
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.sidebar');
      const toggleButton = document.querySelector('.sidebar-toggle');

      if (sidebarOpen &&
        window.innerWidth < 1024 &&
        !sidebar?.contains(event.target) &&
        !toggleButton?.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} />

      {/* Sidebar Toggle Button - Fixed Position */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 p-2 text-black-900 dark:text-white-100 bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-300 ease-in-out lg:hidden`}
        style={{
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          left: sidebarOpen ? 'calc(19rem + 1rem)' : '1rem',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(0)'
        }}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Mobile sidebar overlay with blur effect */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{
              WebkitBackdropFilter: 'blur(4px)',
              backdropFilter: 'blur(4px)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`relative flex-1 h-full flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:blur-sm' : ''
        }`} style={{
          WebkitBackdropFilter: sidebarOpen ? 'blur(4px)' : 'none',
          backdropFilter: sidebarOpen ? 'blur(4px)' : 'none',
          transition: 'backdrop-filter 300ms ease',
          zIndex: 1, // Ensure content is above the grid background
          position: 'relative' // Establish stacking context
        }}>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 overflow-y-auto focus:outline-none relative">
            <div className="py-6 relative z-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;