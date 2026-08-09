import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('neolife_admin_theme') || 'day';
  });

  const isDayMode = theme === 'day';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('neolife_admin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'day' ? 'night' : 'day'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'day' || newTheme === 'night') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDayMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if not wrapped
    return {
      theme: 'day',
      isDayMode: true,
      toggleTheme: () => {},
      setTheme: () => {}
    };
  }
  return context;
};

export default ThemeContext;
