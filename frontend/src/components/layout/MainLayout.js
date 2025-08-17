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
    <div className="min-h-screen bg-white/80 dark:bg-black/80 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-black border-r-2 border-black dark:border-white transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        } lg:translate-x-0`}
      >
        <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Blur overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button - Moves with sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-50 p-2 text-black dark:text-white bg-white/80 dark:bg-black/80 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 ease-in-out top-4 ${
          sidebarOpen ? 'left-56' : 'left-4'
        } lg:left-64`}
        style={{
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      } relative z-20 bg-white dark:bg-black`}>
        {/* Header */}
        <header className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b-2 border-black dark:border-white h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-black dark:text-white" />
            </button>

            {/* Search */}
            <div className="hidden md:block relative">
              <div className="flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects, deployments..."
                    className="w-64 lg:w-80 pl-10 pr-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-black dark:text-white" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded"
                style={{
                  backdropFilter: 'blur(4px)'
                }}
              >
                <div className="w-8 h-8 bg-black dark:bg-white border-2 border-black dark:border-white flex items-center justify-center">
                  <span className="text-white dark:text-black text-sm font-bold">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-black dark:text-white" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black border-2 border-black dark:border-white shadow-lg z-50">
                  <div className="p-4 border-b-2 border-black dark:border-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black dark:bg-white border-2 border-black dark:border-white flex items-center justify-center">
                        <span className="text-white dark:text-black font-bold">
                          {currentUser?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-black dark:text-white">
                          {currentUser?.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/app/profile');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-black dark:text-white">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/app/settings');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-black dark:text-white">Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/app/support');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <HelpCircle className="w-4 h-4 text-black dark:text-white" />
                      <span className="text-black dark:text-white">Support</span>
                    </button>
                    <hr className="my-2 border-black dark:border-white" />
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Search */}
        {mobileSearchOpen && (
          <div className="md:hidden bg-white dark:bg-black border-b-2 border-black dark:border-white p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, deployments..."
                className="w-full pl-10 pr-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto ">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;