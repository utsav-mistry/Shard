import { Link, useLocation } from 'react-router-dom';
import { X, Home, Package, Server, Settings, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ThemeToggle';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Projects', href: '/dashboard/projects', icon: Package },
    { name: 'Deployments', href: '/dashboard/deployments', icon: Server },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  // Check if the current path matches the nav item
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black-600 bg-opacity-75 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        id="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white-100 dark:bg-black-900 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen overflow-x-hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-black-200 dark:border-white-700">
            <div className="text-xl font-bold text-black-900 dark:text-white-100">
              Shard
            </div>
            <button
              className="md:hidden text-black-500 dark:text-white-400 hover:text-black-600 dark:hover:text-white-300"
              onClick={() => setOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium group transition-colors border-l-2 ${active ? 'border-black-900 dark:border-white-100 bg-white-200 dark:bg-black-800 text-black-900 dark:text-white-100 shadow-inner' : 'border-transparent text-black-600 dark:text-white-300 hover:border-black-900 dark:hover:border-white-100 hover:bg-white-200 dark:hover:bg-black-800'}`}
                  onClick={() => setOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${active ? 'text-black-900 dark:text-white-100' : 'text-black-400 dark:text-white-500 group-hover:text-black-900 dark:group-hover:text-white-100'}`}
                  />
                  {item.name}
                </Link>
              );
            })}
            

          </nav>

          {/* User section */}
          <div className="p-4 border-t border-black-200 dark:border-white-700">
            <div className="flex flex-col space-y-4">
              {/* User info */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-black-700 dark:text-white-300 truncate">
                  {currentUser?.name || currentUser?.email}
                </div>
              </div>
              
              {/* Notifications */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="p-1 text-black-500 dark:text-white-400 hover:text-black-700 dark:hover:text-white focus:outline-none"
                >
                  <Bell className="h-5 w-5" />
                </button>
                
                {/* Logout button */}
                <button
                  onClick={logout}
                  className="group relative inline-flex items-center justify-center py-1 px-3 border-2 border-black-900 rounded-none shadow-sm bg-black-900 text-sm font-medium text-white-100 transition-all duration-200 overflow-hidden dark:bg-white-100 dark:border-white-100 dark:text-black-900"
                >
                  <span className="absolute inset-0 w-full h-full bg-white-100 transition-transform duration-300 ease-in-out transform -translate-x-[110%] group-hover:translate-x-0 dark:bg-black-900 pointer-events-none" />
                  <LogOut className="w-4 h-4 mr-2 transition-colors text-white-100 dark:text-black-900 dark:text-black-900 group-hover:text-black-900 dark:group-hover:text-white-100" />
                  <span className="relative z-10 transition-colors duration-200 text-white-100 dark:text-black-900 group-hover:text-black-900 dark:group-hover:text-white-100">Logout</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t border-black-200 dark:border-white-700">
            <div className="flex items-center">
              <div className="text-xs text-black-500 dark:text-white-400">
                <p>© {new Date().getFullYear()} Shard</p>
                <p className="mt-1">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;