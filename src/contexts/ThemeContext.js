import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from './THEMES';
import { getChatBackgroundUri, setChatBackground, clearChatBackground } from '../utils/chatBackground';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEMES[0]);
  // Local-only chat screen background image (registered users can set this
  // from Appearance). Never uploaded — see utils/chatBackground.js.
  const [chatBackgroundUri, setChatBackgroundUriState] = useState(null);
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
      setChatBackgroundUriState(getChatBackgroundUri());
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

  const setChatBackgroundImage = (pickedUri) => {
    const savedUri = setChatBackground(pickedUri);
    setChatBackgroundUriState(savedUri);
  };

  const clearChatBackgroundImage = () => {
    clearChatBackground();
    setChatBackgroundUriState(null);
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, THEMES, chatBackgroundUri, setChatBackgroundImage, clearChatBackgroundImage }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
