import React from 'react';
import { useTheme, THEME_OPTIONS } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { theme, toggleNextTheme } = useTheme();

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Full White';
      case 'blue':
        return 'Royal Blue';
      case 'green':
        return 'Emerald Green';
      case 'dark':
        return 'Dark';
      default:
        return currentTheme.name;
    }
  };

  return (
    <button
      type="button"
      onClick={toggleNextTheme}
      className="notion-btn notion-btn-bordered"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '4px 8px' : '5px 10px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      title="Click to cycle theme (White → Blue → Green → Dark)"
    >
      <span style={{ fontSize: '13px' }}>{currentTheme.icon}</span>
      {!compact && (
        <span style={{ color: 'var(--notion-text)', fontWeight: 600 }}>
          {getThemeLabel()}
        </span>
      )}
    </button>
  );
};
