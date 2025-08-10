import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ className }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [transformY, setTransformY] = useState(0);

  const handleClick = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Move down
    setTransformY(100);
    
    setTimeout(() => {
      // Change theme while button is down
      toggleDarkMode();
      
      // Move back up
      setTransformY(0);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 500);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-sm bg-white-100 dark:bg-black-900 text-black-900 dark:text-white-100 hover:bg-white-300 dark:hover:bg-black-700 focus:outline-none transition-all duration-500 shadow-md ${className || ''}`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        transform: `translateY(${transformY}px)`,
      }}
    >
      <div className="relative w-5 h-5">
        <div className={`absolute inset-0 transition-opacity duration-300 ${darkMode ? 'opacity-0' : 'opacity-100'}`}>
          <Sun size={20} className="text-black-900 dark:text-white-100" />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-0'}`}>
          <Moon size={20} className="text-black-900 dark:text-white-100" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;