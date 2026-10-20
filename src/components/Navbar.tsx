import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Bell,
  Mail,
  History,
  ExternalLink,
  UserCheck,
  Building2,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenEmailLogs: () => void;
  onOpenActivityLogs: () => void;
  unreadNotifsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenEmailLogs,
  onOpenActivityLogs,
  unreadNotifsCount,
}) => {
  const { currentUser, personas, switchPersona, logout } = useAuth();

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'badge-role-super';
      case 'GENERAL_MANAGER':
        return 'badge-role-gm';
      case 'DEPT_MANAGER':
        return 'badge-role-manager';
      default:
        return 'badge-role-staff';
    }
  };

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(11, 15, 25, 0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Primary Brand & Actions Bar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TaskTracker
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                ENTERPRISE
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Multi-Department Governance & GM Sign-Off
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Activity Log Button */}
          <button
            onClick={onOpenActivityLogs}
            className="btn btn-secondary btn-sm"
            title="View system activity audit trail"
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>

          {/* Email Alert Logs Button */}
          <button
            onClick={onOpenEmailLogs}
            className="btn btn-secondary btn-sm"
            title="Inspect dispatched email alerts"
          >
            <Mail size={16} />
            <span>Dispatched Emails</span>
          </button>

          {/* In-app Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative' }}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadNotifsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0b0f19'
              }}>
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Django Admin External Link */}
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            title="Open Django Admin Panel"
          >
            <Building2 size={16} />
            <span>Django Admin</span>
            <ExternalLink size={12} />
          </a>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            title="Sign out of current workspace"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 1-Click Quick Persona Switcher Toolbar - Strictly for SUPER_ADMIN only */}
      {currentUser?.role === 'SUPER_ADMIN' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '8px 24px',
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={16} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1-Click Persona Switcher (Super Admin):
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {personas.map((p) => {
                const isActive = currentUser?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchPersona(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive
                        ? '1px solid #6366f1'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.35))'
                        : 'rgba(255, 255, 255, 0.03)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.35)' : 'none',
                    }}
                  >
                    {isActive && <CheckCircle2 size={12} style={{ color: '#34d399' }} />}
                    <span>{p.full_name}</span>
                    <span className={`badge ${getRoleBadgeClass(p.role)}`} style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                      {p.role === 'GENERAL_MANAGER' ? 'GM' : p.role === 'DEPT_MANAGER' ? `${p.department_code} Mgr` : p.role === 'STAFF' ? `${p.department_code} Staff` : 'Super'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active persona summary badge */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Viewing as:</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{currentUser.full_name}</span>
                <span className={`badge ${getRoleBadgeClass(currentUser.role)}`}>
                  {currentUser.role_display}
                </span>
                {currentUser.department_name && currentUser.department_name !== 'Global / None' && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    ({currentUser.department_name})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
