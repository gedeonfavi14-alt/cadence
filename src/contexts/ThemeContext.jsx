import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const { restaurant, updateRestaurant } = useAuth();
  const [theme, setThemeState] = useState('light');
  const [isClientView, setIsClientView] = useState(false);

  // Sync theme from restaurant data
  useEffect(() => {
    if (restaurant?.theme) {
      setThemeState(restaurant.theme);
    }
  }, [restaurant?.theme]);

  // Apply theme to HTML element
  useEffect(() => {
    const effectiveTheme = isClientView ? 'dark' : theme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = effectiveTheme === 'dark' ? '#000000' : '#FFFFFF';
    }
  }, [theme, isClientView]);

  async function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    
    // Persist to Supabase
    if (updateRestaurant) {
      try {
        await updateRestaurant({ theme: newTheme });
      } catch (err) {
        console.error('Failed to save theme:', err);
        // Revert on error
        setThemeState(theme);
      }
    }
  }

  const setClientView = useCallback((value) => {
    setIsClientView(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isClientView, setClientView }}>
      {children}
    </ThemeContext.Provider>
  );
}
