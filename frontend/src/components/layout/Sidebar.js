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
  Code,
  User,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 1024 && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const activeClass = "bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 border-2 border-black-900 dark:border-white-100";
  const hoverClass = "hover:bg-white-50 dark:hover:bg-black-800 hover:border-black-900 dark:hover:border-white-100";
  const textClass = "text-black-900 dark:text-white-100";
  const borderClass = "border-2 border-transparent";

  const navigation = [
    {
      name: 'Overview',
      href: '/app',
      icon: <LayoutDashboard className="w-5 h-5" />,
      exact: true
    },
    {
      name: 'Projects',
      icon: <Folder className="w-5 h-5" />,
      href: '/app/projects',
      children: [
        { name: 'All Projects', href: '/app/projects' },
        { name: 'New Project', href: '/app/projects/new' },
      ]
    },
    {
      name: 'Documentation',
      href: '/app/docs',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      name: 'Integrations',
      href: '/app/integrations',
      icon: <Package className="w-5 h-5" />,
      children: [
        { name: 'GitHub', href: '/app/integrations/' },
      ]
    }
  ];

  const bottomNavigation = [
    {
      name: 'Support',
      href: '/app/support',
      icon: <HelpCircle className="w-5 h-5" />
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { name: 'Profile', href: '/app/profile' }
      ]
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
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderLink = (item) => {
    const isExternal = item.external;
    const isActive = item.exact
      ? location.pathname === item.href
      : item.href === '/app'
        ? location.pathname === '/app'
        : item.href && location.pathname.startsWith(item.href);

    const content = (
      <>
        {item.icon}
        <span>{item.name}</span>
        {isExternal ? (
          <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
        ) : (
          item.children && (
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform ${expandedSections[item.name] ? 'rotate-180' : ''}`}
            />
          )
        )}
      </>
    );

    const className = `w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-none ${isActive ? activeClass : `${textClass} ${borderClass} ${hoverClass}`}`;

    if (isExternal) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={onClose}
        >
          {content}
        </a>
      );
    }

    if (item.children) {
      return (
        <div>
          <div
            onClick={() => toggleSection(item.name)}
            className={`${className} cursor-pointer`}
          >
            {content}
          </div>
          {expandedSections[item.name] && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => {
                const isChildActive = location.pathname === child.href ||
                  (child.href !== '/app' && location.pathname.startsWith(child.href));

                return (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={onClose}
                    className={`block px-3 py-2 text-sm rounded-none transition-colors ${isChildActive
                        ? 'font-semibold text-black-900 dark:text-white-100 bg-black-100 dark:bg-black-800'
                        : 'text-black-600 dark:text-white-500 hover:text-black-900 dark:hover:text-white-100 hover:bg-black-50 dark:hover:bg-black-800'
                      }`}
                  >
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link to={item.href} onClick={onClose} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <div ref={sidebarRef} className="flex flex-col h-full border-r-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-black-900 dark:border-white-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black-900 dark:bg-white-100 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
            <Zap className="w-5 h-5 text-white-100 dark:text-black-900" />
          </div>
          <span className=" text-xl font-extrabold text-black-900 dark:text-white-100">Shard</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-white-50 dark:hover:bg-black-800 transition-colors rounded-none border-2 border-transparent hover:border-black-900 dark:hover:border-white-100">
          <X className="w-5 h-5 text-black-900 dark:text-white-100" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-black-600 dark:text-white-400 uppercase tracking-wider mb-2 px-3">Navigation</p>
          <nav className="space-y-1 mb-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {renderLink(item)}
              </div>
            ))}
          </nav>

          <p className="text-xs font-semibold text-black-600 dark:text-white-400 uppercase tracking-wider mb-2 px-3 mt-6">Resources</p>
          <nav className="space-y-1">
            {bottomNavigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-black-900 dark:text-white-100 border-2 border-transparent hover:bg-white-50 dark:hover:bg-black-800 hover:border-black-900 dark:hover:border-white-100 transition-all duration-200 rounded-none"
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedSections[item.name] ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedSections[item.name] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            onClick={onClose}
                            className={`block px-3 py-2 text-sm font-medium transition-all duration-200 border-2 rounded-none ${location.pathname === child.href ? 'bg-black-900 text-white-100 dark:bg-white-100 dark:text-black-900 border-black-900 dark:border-white-100' : 'text-black-900 dark:text-white-100 border-transparent hover:bg-white-50 dark:hover:bg-black-800 hover:border-black-900 dark:hover:border-white-100'}`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  renderLink(item)
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="px-4 py-4 border-t-2 border-black-900 dark:border-white-100 space-y-2">
          <div className="p-3 bg-black-50 dark:bg-white-50/5 rounded-none border-2 border-black-900/10 dark:border-white-100/10">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-xs font-semibold text-black-900 dark:text-white-100">Need help?</p>
                <a
                  href="mailto:support@shard.dev"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Contact our support team
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-black-900 dark:text-white-100 border-2 border-black-900 dark:border-white-100 bg-white-100 dark:bg-black-900 hover:bg-black-900 hover:text-white-100 dark:hover:bg-white-100 dark:hover:text-black-900 transition-all duration-200 rounded-none mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-6 border-t-2 border-black-900 dark:border-white-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black-900 dark:bg-white-100 border-2 border-black-900 dark:border-white-100 rounded-none flex items-center justify-center">
            <User className="w-5 h-5 text-white-100 dark:text-black-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black-900 dark:text-white-100 truncate">
              {currentUser?.name || 'User'}
            </p>
            <p className="text-xs text-black-600 dark:text-white-400 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;