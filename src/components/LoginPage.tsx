import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, Smartphone, Download } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageToggle } from './LanguageToggle';
import nextupLogo from '../image/nextup-logo.png';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, isTamil } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(isTamil ? 'தயவுசெய்து பயனர் பெயர் மற்றும் கடவுச்சொல் இரண்டையும் உள்ளிடவும்.' : 'Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || (isTamil ? 'உள்நுழைவு தோல்வியடைந்தது. சரியான விவரங்களை உள்ளிடவும்.' : 'Authentication failed. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'var(--notion-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow accents */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top right language & theme switcher controls */}
      <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <LanguageToggle />
        <ThemeSwitcher />
      </div>

      {/* Centered Modern NextUp Login Card */}
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: 'var(--notion-sidebar)',
            border: '1px solid var(--notion-border)',
            borderRadius: '24px',
            padding: '40px 36px',
            boxShadow: 'var(--notion-shadow-lg)',
            position: 'relative',
          }}
        >
          {/* NextUp Brand Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img
              src={nextupLogo}
              alt="NextUp"
              style={{
                height: '92px',
                width: 'auto',
                maxWidth: '220px',
                objectFit: 'contain',
                margin: '0 auto 14px',
                display: 'block',
              }}
            />
            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: 'var(--notion-text)',
                letterSpacing: '-0.025em',
                marginBottom: '6px',
              }}
            >
              {t('loginWelcome')}
            </h2>
            <p
              style={{
                color: 'var(--notion-text-muted)',
                fontSize: '13.5px',
                lineHeight: 1.5,
              }}
            >
              {t('enterCredentials')}
            </p>
          </div>

          {error && (
            <div
              className="notion-callout notion-callout-danger"
              style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '10px' }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--notion-text)',
                  marginBottom: '7px',
                }}
              >
                <UserIcon size={14} style={{ color: 'var(--notion-text-dim)' }} />
                <span>{t('username')}</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                className="notion-input"
                placeholder={isTamil ? 'பயனர் பெயரை உள்ளிடவும்' : 'Enter your username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                style={{ padding: '11px 14px', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--notion-text)',
                  }}
                >
                  <Lock size={14} style={{ color: 'var(--notion-text-dim)' }} />
                  <span>{t('password')}</span>
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="notion-input"
                  placeholder={isTamil ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ padding: '11px 42px 11px 14px', fontSize: '13.5px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--notion-text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                color: 'var(--notion-text-muted)',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--notion-blue)', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 500 }}>{t('rememberMe')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="notion-btn notion-btn-primary"
              style={{
                width: '100%',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '12px',
                marginTop: '6px',
              }}
            >
              {loading ? (
                <span>{t('signingIn')}</span>
              ) : (
                <>
                  <span>{t('signIn')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '22px 0 16px',
              color: 'var(--notion-text-dim)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--notion-border)' }} />
            <span style={{ padding: '0 10px', fontWeight: 600 }}>
              {isTamil ? 'அல்லது மொபைல் செயலி' : 'OR ON MOBILE'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--notion-border)' }} />
          </div>

          {/* Download NextUp Android APK Button */}
          <a
            href={typeof window !== 'undefined' && window.location.pathname.includes('/nextup') ? '/nextup/NextUp.apk' : './NextUp.apk'}
            download="NextUp.apk"
            className="notion-apk-download-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.28)',
              textDecoration: 'none',
              color: 'var(--notion-text)',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.06)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)',
              }}
            >
              <Smartphone size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{isTamil ? 'ஆண்ட்ராய்டு செயலி (APK)' : 'Download Android App (APK)'}</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#22c55e', color: '#fff', fontWeight: 800 }}>v2.2.6</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isTamil ? 'அறிவிப்புகளுக்கு போனில் நிறுவவும்' : 'For live push notifications & task alerts'}
              </div>
            </div>
            <Download size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          </a>
        </div>
      </div>
    </div>
  );
};
