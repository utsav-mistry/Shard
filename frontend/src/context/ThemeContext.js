import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Helper function to get initial theme
const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme === 'dark';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme state with a function to prevent unnecessary re-renders
  const [darkMode, setDarkMode] = useState(() => getInitialTheme());

  // Apply theme class on initial render and when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};