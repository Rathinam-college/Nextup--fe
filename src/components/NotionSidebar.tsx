import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Department, User } from '../types';
import rathinamLogo from '../image/image.png';
import {
  CheckSquare,
  ShieldCheck,
  Building,
  Users,
  Bell,
  Mail,
  History,
  ExternalLink,
  Download,
  LogOut,
  ChevronDown,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Settings,
  Flame,
  Table,
  Briefcase,
  Compass,
} from 'lucide-react';

interface NotionSidebarProps {
  currentView: 'board' | 'list' | 'calendar' | 'table' | 'approvals' | 'staff' | 'departments' | 'report' | 'settings' | 'today';
  onSelectView: (view: any) => void;
  selectedDeptId: number | 'ALL';
  onSelectDept: (deptId: number | 'ALL') => void;
  departments: Department[];
  pendingCount: number;
  urgentTodayCount?: number;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenEmailLogs: () => void;
  onOpenActivityLogs: () => void;
  onExportCsv: () => void;
  onOpenCreateDepartment?: () => void;
}

export const NotionSidebar: React.FC<NotionSidebarProps> = ({
  currentView,
  onSelectView,
  selectedDeptId,
  onSelectDept,
  departments,
  pendingCount,
  urgentTodayCount,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenEmailLogs,
  onOpenActivityLogs,
  onExportCsv,
  onOpenCreateDepartment,
}) => {
  const { currentUser, personas, switchPersona, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = React.useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isGM = currentUser?.role === 'GENERAL_MANAGER' || isSuperAdmin;

  const getRoleTag = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="notion-tag tag-purple" style={{ fontSize: '10px' }}>SuperAdmin</span>;
      case 'GENERAL_MANAGER':
        return <span className="notion-tag tag-yellow" style={{ fontSize: '10px' }}>GM</span>;
      case 'DEPT_MANAGER':
        return <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>Manager</span>;
      default:
        return <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>Staff</span>;
    }
  };

  const isTasksViewActive = currentView === 'board' || currentView === 'list' || currentView === 'calendar' || currentView === 'table';

  return (
    <aside
      style={{
        width: '270px',
        background: 'var(--notion-sidebar)',
        borderRight: '1px solid var(--notion-border)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        boxShadow: 'var(--notion-shadow-sm)',
        zIndex: 40,
      }}
    >
      {/* Top Section: Brand + User Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Brand Header */}
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--notion-border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 8px 12px',
              borderBottom: '1px solid var(--notion-border-subtle)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                flexShrink: 0,
              }}
            >
              <img
                src={rathinamLogo}
                alt="Rathinam"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--notion-text)',
                  lineHeight: 1.2,
                }}
              >
                Rathinam Group
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--notion-blue)',
                  letterSpacing: '0.02em',
                  marginTop: '1px',
                }}
              >
                TaskTracker Enterprise
              </div>
            </div>
          </div>

          {/* User Profile Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              marginTop: '8px',
              borderRadius: '10px',
              cursor: isSuperAdmin ? 'pointer' : 'default',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border-subtle)',
              userSelect: 'none',
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              if (isSuperAdmin) {
                setShowPersonaMenu(!showPersonaMenu);
              }
            }}
            title={isSuperAdmin ? 'Click to switch active persona (Super Admin)' : currentUser?.full_name}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                }}
              >
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)', lineHeight: 1.2 }}>
                  {currentUser?.full_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--notion-text-muted)' }}>
                    {currentUser?.role_display}
                  </span>
                  {getRoleTag(currentUser?.role)}
                </div>
              </div>
            </div>
            {isSuperAdmin && (
              <ChevronDown size={14} style={{ color: 'var(--notion-text-dim)', flexShrink: 0 }} />
            )}
          </div>

          {/* Persona Switcher Dropdown */}
          {isSuperAdmin && showPersonaMenu && (
            <div
              style={{
                marginTop: '10px',
                background: 'var(--notion-card)',
                border: '1px solid var(--notion-border)',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: 'var(--notion-shadow-lg)',
                zIndex: 200,
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--notion-text-dim)',
                  padding: '6px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Switch Workspace Persona (Admin)
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {personas.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      switchPersona(p);
                      setShowPersonaMenu(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      background: currentUser?.id === p.id ? 'var(--notion-hover)' : 'transparent',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = currentUser?.id === p.id ? 'var(--notion-hover)' : 'transparent')
                    }
                  >
                    <span>{p.full_name}</span>
                    {getRoleTag(p.role)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div
          style={{
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Group 1: Workspace */}
          <div
            style={{
              padding: '6px 10px 4px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--notion-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Workspace
          </div>

          {/* Primary Tasks & Actions Page */}
          <button
            onClick={() => onSelectView('board')}
            className="notion-btn"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '9px',
              background: isTasksViewActive && currentView !== 'table' ? 'var(--notion-item-bg)' : 'transparent',
              border: isTasksViewActive && currentView !== 'table' ? '1px solid var(--notion-border)' : '1px solid transparent',
              fontWeight: isTasksViewActive && currentView !== 'table' ? 700 : 500,
              color: isTasksViewActive && currentView !== 'table' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckSquare size={16} style={{ color: '#4f46e5' }} />
              <span>Tasks &amp; Actions</span>
            </div>
            <span className="notion-tag tag-blue" style={{ fontSize: '10px', padding: '1px 7px' }}>
              Views
            </span>
          </button>

          {/* Staff Matrix Sub-View */}
          <button
            onClick={() => onSelectView('table')}
            className="notion-btn"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '7px 12px 7px 28px',
              borderRadius: '9px',
              background: currentView === 'table' ? 'var(--notion-item-bg)' : 'transparent',
              border: currentView === 'table' ? '1px solid var(--notion-border)' : '1px solid transparent',
              fontWeight: currentView === 'table' ? 700 : 500,
              fontSize: '12.5px',
              color: currentView === 'table' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table size={14} style={{ color: '#10b981' }} />
              <span>Staff Matrix</span>
            </div>
            <span className="notion-tag tag-green" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
              Table
            </span>
          </button>

          {/* GM Section */}
          {isGM && (
            <>
              <div
                style={{
                  padding: '12px 10px 4px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--notion-text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Executive Desk
              </div>

              {/* Today & Urgent Tasks */}
              <button
                onClick={() => onSelectView('today')}
                className="notion-btn"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '9px',
                  background: currentView === 'today' ? 'var(--notion-item-bg)' : 'transparent',
                  border: currentView === 'today' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
                  fontWeight: currentView === 'today' ? 700 : 500,
                  color: currentView === 'today' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Flame size={16} style={{ color: '#ef4444' }} />
                  <span>Today &amp; Urgent</span>
                </div>
                {urgentTodayCount !== undefined && urgentTodayCount > 0 && (
                  <span
                    className="notion-tag"
                    style={{
                      background: 'linear-gradient(135deg, #ef4444, #f97316)',
                      color: '#ffffff',
                      fontSize: '10px',
                      padding: '1px 7px',
                      fontWeight: 800,
                    }}
                  >
                    {urgentTodayCount}
                  </span>
                )}
              </button>

              {/* GM Approvals Hub */}
              <button
                onClick={() => onSelectView('approvals')}
                className="notion-btn"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '9px',
                  background: currentView === 'approvals' ? 'var(--notion-item-bg)' : 'transparent',
                  border: currentView === 'approvals' ? '1px solid var(--notion-border)' : '1px solid transparent',
                  fontWeight: currentView === 'approvals' ? 700 : 500,
                  color: currentView === 'approvals' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={16} style={{ color: '#f59e0b' }} />
                  <span>Approvals Hub</span>
                </div>
                {pendingCount > 0 && (
                  <span className="notion-tag tag-yellow" style={{ fontSize: '10px', padding: '1px 7px', fontWeight: 700 }}>
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Departments Overview */}
              <button
                onClick={() => onSelectView('departments')}
                className="notion-btn"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: '9px',
                  background: currentView === 'departments' ? 'var(--notion-item-bg)' : 'transparent',
                  border: currentView === 'departments' ? '1px solid var(--notion-border)' : '1px solid transparent',
                  fontWeight: currentView === 'departments' ? 700 : 500,
                  color: currentView === 'departments' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building size={16} style={{ color: '#10b981' }} />
                  <span>Departments</span>
                </div>
              </button>
            </>
          )}

          {/* Directory & Analytics */}
          <div
            style={{
              padding: '12px 10px 4px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--notion-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Directory &amp; Reports
          </div>

          <button
            onClick={() => onSelectView('staff')}
            className="notion-btn"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '8px 12px',
              borderRadius: '9px',
              background: currentView === 'staff' ? 'var(--notion-item-bg)' : 'transparent',
              border: currentView === 'staff' ? '1px solid var(--notion-border)' : '1px solid transparent',
              fontWeight: currentView === 'staff' ? 700 : 500,
              color: currentView === 'staff' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} style={{ color: '#0ea5e9' }} />
              <span>Staff Directory</span>
            </div>
          </button>

          <button
            onClick={() => onSelectView('report')}
            className="notion-btn"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '8px 12px',
              borderRadius: '9px',
              background: currentView === 'report' ? 'var(--notion-item-bg)' : 'transparent',
              border: currentView === 'report' ? '1px solid var(--notion-border)' : '1px solid transparent',
              fontWeight: currentView === 'report' ? 700 : 500,
              color: currentView === 'report' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={16} style={{ color: '#8b5cf6' }} />
              <span>Reports &amp; Analytics</span>
            </div>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => onSelectView('settings')}
              className="notion-btn"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '8px 12px',
                borderRadius: '9px',
                background: currentView === 'settings' ? 'var(--notion-item-bg)' : 'transparent',
                border: currentView === 'settings' ? '1px solid var(--notion-border)' : '1px solid transparent',
                fontWeight: currentView === 'settings' ? 700 : 500,
                color: currentView === 'settings' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={16} style={{ color: '#ec4899' }} />
                <span>System Settings</span>
              </div>
            </button>
          )}

          {/* Department Filter Section */}
          <div
            style={{
              marginTop: '14px',
              padding: '6px 10px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--notion-text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {isGM ? 'Department Filters' : 'Assigned Dept'}
            </span>
            {isGM && onOpenCreateDepartment && (
              <button
                onClick={onOpenCreateDepartment}
                className="notion-btn"
                style={{ padding: '2px 5px', fontSize: '11px', color: 'var(--notion-text-dim)' }}
                title="Create new department"
              >
                <Plus size={13} />
              </button>
            )}
          </div>

          {isGM && (
            <button
              onClick={() => onSelectDept('ALL')}
              className="notion-btn"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                padding: '7px 12px',
                borderRadius: '8px',
                background: selectedDeptId === 'ALL' ? 'var(--notion-item-bg)' : 'transparent',
                fontWeight: selectedDeptId === 'ALL' ? 700 : 500,
                color: selectedDeptId === 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={14} style={{ color: 'var(--notion-blue)' }} />
                <span>All Departments</span>
              </div>
              <span className="notion-tag tag-blue" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                ALL
              </span>
            </button>
          )}

          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDept(d.id)}
              className="notion-btn"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderRadius: '8px',
                background: selectedDeptId === d.id ? 'var(--notion-item-bg)' : 'transparent',
                fontWeight: selectedDeptId === d.id ? 700 : 500,
                color: selectedDeptId === d.id ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '12px' }}>📁</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </span>
              </div>
              <span className="notion-tag tag-gray" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                {d.code}
              </span>
            </button>
          ))}

          {/* Audit & Logs */}
          <div
            style={{
              marginTop: '14px',
              padding: '6px 10px 4px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--notion-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Audit &amp; Compliance
          </div>

          <button
            onClick={onOpenNotifications}
            className="notion-btn"
            style={{ width: '100%', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={14} style={{ color: 'var(--notion-text-muted)' }} />
              <span>Notifications</span>
            </div>
            {unreadNotifsCount > 0 && (
              <span className="notion-tag tag-red" style={{ fontSize: '10px', padding: '1px 6px' }}>
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenEmailLogs}
            className="notion-btn"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px', borderRadius: '8px' }}
          >
            <Mail size={14} style={{ color: 'var(--notion-text-muted)' }} />
            <span>Email Logs</span>
          </button>

          <button
            onClick={onOpenActivityLogs}
            className="notion-btn"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px', borderRadius: '8px' }}
          >
            <History size={14} style={{ color: 'var(--notion-text-muted)' }} />
            <span>Activity Trail</span>
          </button>

          <button
            onClick={onExportCsv}
            className="notion-btn"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 12px', borderRadius: '8px' }}
          >
            <Download size={14} style={{ color: 'var(--notion-text-muted)' }} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--notion-border-subtle)',
          background: 'var(--notion-sidebar)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Theme</span>
          <ThemeSwitcher compact={true} />
        </div>

        <button
          onClick={logout}
          className="notion-btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.18)',
            padding: '8px',
            borderRadius: '9px',
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
