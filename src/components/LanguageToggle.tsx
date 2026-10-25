import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages, Globe } from 'lucide-react';

interface LanguageToggleProps {
  compact?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { language, toggleLanguage, setLanguage, isTamil } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className="notion-btn notion-btn-bordered"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 700,
          borderRadius: '8px',
          cursor: 'pointer',
          background: isTamil ? 'rgba(79, 70, 229, 0.12)' : 'var(--notion-item-bg)',
          borderColor: isTamil ? 'rgba(79, 70, 229, 0.4)' : 'var(--notion-border)',
          color: isTamil ? '#4f46e5' : 'var(--notion-text)',
          transition: 'all 0.18s ease',
          boxShadow: isTamil ? '0 1px 4px rgba(79, 70, 229, 0.15)' : 'none',
        }}
        title="மொழியை மாற்றவும் / Switch Language (English ⇄ தமிழ்)"
      >
        <span style={{ fontSize: '13px' }}>🌐</span>
        <span style={{ letterSpacing: '0.02em' }}>
          {isTamil ? 'தமிழ்' : 'EN'}
        </span>
        <span
          style={{
            fontSize: '9.5px',
            padding: '1px 5px',
            borderRadius: '4px',
            background: isTamil ? '#4f46e5' : 'var(--notion-border)',
            color: isTamil ? '#ffffff' : 'var(--notion-text-dim)',
            fontWeight: 800,
          }}
        >
          {isTamil ? 'TA' : 'தமிழ்'}
        </span>
      </button>
    );
  }

  // Full segmented pill toggle (used in sidebar, login screen, settings)
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--notion-item-bg)',
        border: '1px solid var(--notion-border)',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
        boxShadow: 'var(--notion-shadow-sm)',
      }}
      title="Switch Language / மொழியை மாற்றவும்"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          fontSize: '12px',
          fontWeight: language === 'en' ? 700 : 500,
          borderRadius: '7px',
          border: 'none',
          cursor: 'pointer',
          background: language === 'en' ? 'var(--notion-card)' : 'transparent',
          color: language === 'en' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
          boxShadow: language === 'en' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <span>🇬🇧</span>
        <span>English</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ta')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          fontSize: '12px',
          fontWeight: language === 'ta' ? 700 : 500,
          borderRadius: '7px',
          border: 'none',
          cursor: 'pointer',
          background: language === 'ta' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
          color: language === 'ta' ? '#ffffff' : 'var(--notion-text-dim)',
          boxShadow: language === 'ta' ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <span>🇮🇳</span>
        <span>தமிழ்</span>
      </button>
    </div>
  );
};
