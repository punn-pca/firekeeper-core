import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      localStorage.setItem('firekeeper_theme', 'dark');
    } catch (e) {
      // ignore
    }
    
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.remove('light-theme');
    document.documentElement.classList.remove('light');
  }, []);

  const toggleTheme = () => {
    // Single dark theme only
  };

  const setTheme = () => {
    // Single dark theme only
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
