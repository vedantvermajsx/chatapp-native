import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from './THEMES';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEMES[0]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('chatTheme');
        if (savedTheme) {
          const parsed = JSON.parse(savedTheme);
          const existingTheme = THEMES.find(t => t.id === parsed.id);
          if (existingTheme) setThemeState(existingTheme);
        }
      } catch {}
      setLoaded(true);
    };
    loadTheme();
  }, []);

  const setTheme = async (next) => {
    setThemeState(next);
    try {
      await AsyncStorage.setItem('chatTheme', JSON.stringify(next));
    } catch {}
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
