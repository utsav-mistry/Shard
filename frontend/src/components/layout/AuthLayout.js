import { Outlet } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const AuthLayout = () => {


  return (
    <div className="min-h-screen bg-white-100 dark:bg-black-900 flex flex-col">

      {/* Logo */}
      <div className="flex justify-center mt-8">
        <div className="text-3xl font-bold text-black-900 dark:text-white-100">
          Shard
        </div>
      </div>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-black-500 dark:text-white-300">
        © {new Date().getFullYear()} Shard. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;