import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useClickAway } from 'react-use';

const Header = ({ onMenuClick }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useClickAway(userMenuRef, () => setUserMenuOpen(false));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section: Mobile Menu Button */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="group relative p-2 text-black-900 dark:text-white-100 hover:text-white-100 dark:hover:text-black-900 transition-all duration-200 rounded-none border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 overflow-hidden z-50"
            aria-label="Open menu"
          >
            <span className="absolute inset-0 w-full h-full bg-black-900 dark:bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-full group-hover:translate-x-0" />
            <Menu className="w-6 h-6 relative z-10 transition-colors duration-200" />
          </button>
        </div>

        {/* Right Section: User Menu */}
        <div className="flex items-center">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-white-50 dark:hover:bg-black-800 transition-colors rounded-none border-2 border-transparent hover:border-black-900 dark:hover:border-white-100"
            >
              <div className="w-10 h-10 bg-black-900 dark:bg-white-100 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
                <span className="text-white-100 dark:text-black-900 text-sm font-bold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-black-900 dark:text-white-100" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-none shadow-lg py-2 bg-white-100 dark:bg-black-900 border-2 border-black-900 dark:border-white-100 focus:outline-none">
                <div className="p-4 border-b-2 border-black-900 dark:border-white-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-black-900 dark:bg-white-100 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
                      <span className="text-white-100 dark:text-black-900 font-bold text-lg">
                        {currentUser?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-black-900 dark:text-white-100">
                        {currentUser?.name || 'User'}
                      </p>
                      <p className="text-sm text-black-600 dark:text-white-400">
                        {currentUser?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-2 space-y-1">
                  <Link
                    to="/app/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 text-black-900 dark:text-white-100 border-2 border-transparent hover:border-black-900 dark:hover:border-white-100 rounded-none"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-white-50 dark:hover:bg-black-800 transition-all duration-200 text-black-900 dark:text-white-100 border-2 border-black-900 dark:border-white-100 rounded-none"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
