import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, Shield, Sparkles, CheckCircle2, Building2, Zap } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import rathinamLogo from '../image/image.png';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
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
          left: '10%',
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
          right: '10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top right theme switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '28px', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>

      <div
        style={{
          maxWidth: '1020px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: '36px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
        className="login-container-grid"
      >
        {/* Left Side: Brand Narrative & Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px 8px' }}>
          {/* Rathinam Logo Card */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: '#ffffff',
                padding: '10px 18px',
                borderRadius: '16px',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={rathinamLogo}
                alt="Rathinam Group of Institutions"
                style={{
                  height: '48px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--notion-blue)',
                  marginBottom: '2px',
                }}
              >
                Rathinam Group of Institutions
              </span>
              <div style={{ fontSize: '13px', color: 'var(--notion-text-muted)', fontWeight: 500 }}>
                Enterprise Operations Command
              </div>
            </div>
          </div>

          <div>
            <h1
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.18,
                marginBottom: '12px',
                color: 'var(--notion-text)',
              }}
            >
              Enterprise Task Tracker <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                &amp; Audit Management
              </span>
            </h1>
            <p
              style={{
                color: 'var(--notion-text-muted)',
                fontSize: '14.5px',
                lineHeight: 1.6,
                maxWidth: '460px',
              }}
            >
              Unified multi-department task lifecycle, real-time GM verification desk, SLA tracking, and audit-ready governance for institutional excellence.
            </p>
          </div>

          {/* Value Props / Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '6px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(79, 70, 229, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--notion-blue)',
                  flexShrink: 0,
                }}
              >
                <Shield size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                  Strict GM Verification &amp; Sign-Off
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                  Two-stage completion requiring General Manager sign-off before official closure.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  flexShrink: 0,
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                  Multi-Department Isolation &amp; Matrix Views
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                  Board, List, Table, and Calendar views isolated per department with GM global oversight.
                </div>
              </div>
            </div>
          </div>

          {/* System status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>Django 6 REST API • PostgreSQL 16 Active • Live Audit Trail</span>
          </div>
        </div>

        {/* Right Side: High-End Login Card */}
        <div
          style={{
            background: 'var(--notion-sidebar)',
            border: '1px solid var(--notion-border)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: 'var(--notion-shadow-lg)',
            position: 'relative',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--notion-blue)',
                background: 'var(--notion-item-bg)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid var(--notion-border-subtle)',
                marginBottom: '10px',
              }}
            >
              <Sparkles size={13} /> Secure Authentication
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.025em' }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--notion-text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Sign in with institutional credentials to access your workspace.
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
                <span>Username</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                className="notion-input"
                placeholder="Enter username (e.g. admin)"
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
                  <span>Password</span>
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="notion-input"
                  placeholder="Enter your password"
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
                <span style={{ fontWeight: 500 }}>Remember this session</span>
              </label>
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--notion-blue)', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}
              >
                Django Admin &rarr;
              </a>
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
                marginTop: '4px',
              }}
            >
              {loading ? (
                <span>Authenticating workspace...</span>
              ) : (
                <>
                  <span>Sign In to TaskTracker</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Box */}
          <div
            style={{
              marginTop: '24px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>
                  1-Click Role Quick Fill
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Demo Credentials
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('gm', 'gm123')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>👑</span>
                <span>General Manager (gm)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>🛡️</span>
                <span>Super Admin (admin)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('kitchen@rathinam.in', 'Kitchen_123')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>🍳</span>
                <span>Kitchen Mgr (kitchen)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('renish@rathinam', 'Welcome123')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>📦</span>
                <span>Procurement Mgr</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sanjay', 'staff123')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>👷</span>
                <span>Staff (sanjay)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manimegalai.rgi@rathinam.in', 'manimegalai@5432!')}
                className="notion-btn notion-btn-bordered"
                style={{
                  padding: '7px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  borderRadius: '8px',
                }}
              >
                <span>📋</span>
                <span>Procurement Staff</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .login-container-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};
