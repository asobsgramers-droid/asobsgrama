import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    accent: string;
    success: string;
    error: string;
    online: string;
    sent: string;
    received: string;
  };
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#0088CC',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    border: '#E5E5EA',
    accent: '#0088CC',
    success: '#34C759',
    error: '#FF3B30',
    online: '#34C759',
    sent: '#E3F2FD',
    received: '#F5F5F5',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#64B5F6',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    surfaceSecondary: '#3A3A3C',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    border: '#38383A',
    accent: '#64B5F6',
    success: '#32D74B',
    error: '#FF453A',
    online: '#32D74B',
    sent: '#1E3A5F',
    received: '#2C2C2E',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@asobsgram_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Load saved theme preference
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      // Use localStorage for web compatibility
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        }
      }
    } catch {
      console.log('Error loading theme preference');
    }
  };

  const saveThemePreference = async (dark: boolean) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
      }
    } catch {
      console.log('Error saving theme preference');
    }
  };

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    saveThemePreference(dark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
