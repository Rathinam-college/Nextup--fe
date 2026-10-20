import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'blue' | 'green' | 'dark' | 'sepia' | 'navy';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: string;
  previewBg: string;
  previewBorder: string;
  previewAccent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    name: 'Full White & Bright',
    icon: '☀️',
    previewBg: '#ffffff',
    previewBorder: '#cbd5e1',
    previewAccent: '#0284c7',
  },
  {
    id: 'blue',
    name: 'Royal Blue',
    icon: '🔵',
    previewBg: '#091326',
    previewBorder: '#60a5fa',
    previewAccent: '#38bdf8',
  },
  {
    id: 'green',
    name: 'Emerald Green',
    icon: '🟢',
    previewBg: '#041a12',
    previewBorder: '#34d399',
    previewAccent: '#10b981',
  },
  {
    id: 'dark',
    name: 'Charcoal Dark',
    icon: '🌙',
    previewBg: '#191919',
    previewBorder: '#383838',
    previewAccent: '#2383e2',
  },
  {
    id: 'navy',
    name: 'Midnight Navy',
    icon: '🌌',
    previewBg: '#0b1120',
    previewBorder: '#1e293b',
    previewAccent: '#38bdf8',
  },
  {
    id: 'sepia',
    name: 'Warm Paper',
    icon: '📜',
    previewBg: '#f8f4ec',
    previewBorder: '#dcd1bd',
    previewAccent: '#b45309',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleNextTheme: () => void;
  availableThemes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const MAIN_THEMES: ThemeMode[] = ['light', 'blue', 'green', 'dark'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('task_tracker_theme') as ThemeMode;
    const valid: ThemeMode[] = ['light', 'blue', 'green', 'dark', 'sepia', 'navy'];
    return saved && valid.includes(saved) ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('task_tracker_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleNextTheme = () => {
    const currentIndex = MAIN_THEMES.indexOf(theme);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % MAIN_THEMES.length;
    setThemeState(MAIN_THEMES[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleNextTheme, availableThemes: THEME_OPTIONS }}>
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
