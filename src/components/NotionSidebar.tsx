import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageToggle } from './LanguageToggle';
import { Department, User, Task } from '../types';
import { isUserAllowedToViewPage, ViewType } from '../utils/pagePermissions';
import nextupLogo from '../image/nextup-logo.png';
import rathinamLogo from '../image/image.png';
import {
  CheckSquare,
  ListChecks,
  ShieldCheck,
  Building,
  Users,
  Bell,
  Mail,
  History,
  Download,
  LogOut,
  ChevronDown,
  Sparkles,
  Plus,
  BarChart3,
  Settings,
  Flame,
  Lock,
  Smartphone,
  X,
  Star,
  RefreshCw,
  Table,
  Folder,
  Layers,
  Compass,
} from 'lucide-react';

interface NotionSidebarProps {
  currentView: ViewType;
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  tasks?: Task[];
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
  isMobileOpen = false,
  onCloseMobile,
  tasks,
}) => {
  const { currentUser, personas, switchPersona, logout } = useAuth();
  const { t, isTamil } = useLanguage();
  const [showPersonaMenu, setShowPersonaMenu] = React.useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isGM = currentUser?.role === 'GENERAL_MANAGER' || isSuperAdmin;

  const isTasksViewActive =
    currentView === 'board' || currentView === 'list' || currentView === 'calendar' || currentView === 'table';

  // Compute live counts if tasks are available
  const totalTasksCount = tasks ? tasks.filter((t) => t.status !== 'CLOSED').length : 116;
  const gmDirectivesCount = tasks
    ? tasks.filter((t) => (t.priority === 'URGENT' || t.status === 'PENDING_GM_APPROVAL') && t.status !== 'CLOSED').length
    : pendingCount || 8;

  const getDeptTaskCount = (deptId: number) => {
    if (!tasks) return null;
    return tasks.filter((t) => t.department === deptId && t.status !== 'CLOSED').length;
  };

  const getRoleTagLabel = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'SUPER ADMIN';
      case 'GENERAL_MANAGER':
        return 'GENERAL MGR';
      case 'DEPT_MANAGER':
        return 'MANAGER';
      default:
        return 'STAFF';
    }
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="notion-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      <aside
        className={`notion-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          background: '#0B1120', // Executive deep slate dark theme
          borderRight: '1px solid #1E293B',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
          zIndex: 40,
          color: '#94A3B8',
          fontFamily: 'inherit',
          userSelect: 'none',
        }}
      >
        {/* ========================================================================= */}
        {/* TOP SECTION: BRAND + ORG HEADER                                           */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              padding: '16px 16px 14px',
              borderBottom: '1px solid #1E293B',
              background: '#090D1A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '3px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={nextupLogo || rathinamLogo}
                    alt="NextUp"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      NextUp
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
                        color: '#FFFFFF',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                        boxShadow: '0 1px 4px rgba(6, 182, 212, 0.4)',
                      }}
                    >
                      PRO
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: '#64748B',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Rathinam Group • Ops v2.4
                  </div>
                </div>
              </div>

              {/* Close Button on Mobile Drawer */}
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Close Navigation"
                  aria-label="Close Navigation"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SCROLLABLE NAVIGATION LIST                                                */}
          {/* ========================================================================= */}
          <div
            style={{
              padding: '10px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 165px)',
            }}
          >
            {/* SECTION 1: WORKSPACE */}
            <div
              style={{
                padding: '10px 10px 4px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {t('workspace') || 'WORKSPACE'}
            </div>

            {/* 1. All Tasks */}
            {isUserAllowedToViewPage(currentUser, 'board') && (
              <button
                type="button"
                onClick={() => onSelectView('board')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: isTasksViewActive ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                  border: isTasksViewActive ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid transparent',
                  color: isTasksViewActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isTasksViewActive ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isTasksViewActive ? '0 0 12px rgba(37, 99, 235, 0.15)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isTasksViewActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTasksViewActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <CheckSquare size={15} style={{ color: isTasksViewActive ? '#60A5FA' : '#3B82F6' }} />
                  <span>{t('allTasks')}</span>
                </div>
                <span
                  style={{
                    background: '#1E293B',
                    color: '#60A5FA',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '5px',
                  }}
                >
                  {totalTasksCount}
                </span>
              </button>
            )}

            {/* 2. GM Directives (Executive Focus) */}
            {isGM && (
              <button
                type="button"
                onClick={() => onSelectView(isUserAllowedToViewPage(currentUser, 'today') ? 'today' : 'approvals')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background:
                    currentView === 'today' || currentView === 'approvals' ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                  border:
                    currentView === 'today' || currentView === 'approvals'
                      ? '1px solid rgba(245, 158, 11, 0.35)'
                      : '1px solid transparent',
                  color: currentView === 'today' || currentView === 'approvals' ? '#F8FAFC' : '#94A3B8',
                  fontWeight: currentView === 'today' || currentView === 'approvals' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'today' && currentView !== 'approvals') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'today' && currentView !== 'approvals') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Star size={15} style={{ color: '#F59E0B' }} />
                  <span>{isTamil ? 'GM உத்தரவுகள்' : 'GM Directives'}</span>
                </div>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#000000',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {gmDirectivesCount > 0 ? `${gmDirectivesCount} NEW` : 'ACTIVE'}
                </span>
              </button>
            )}

            {/* 3. Self Desk & Notes (Strictly Private) */}
            {isUserAllowedToViewPage(currentUser, 'self_desk') && (
              <button
                type="button"
                onClick={() => onSelectView('self_desk')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'self_desk' ? 'rgba(168, 85, 247, 0.16)' : 'transparent',
                  border: currentView === 'self_desk' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
                  color: currentView === 'self_desk' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'self_desk' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'self_desk') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'self_desk') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Lock size={15} style={{ color: '#A855F7' }} />
                  <span>{t('personalDesk')}</span>
                </div>
                <Lock size={12} style={{ color: '#64748B' }} />
              </button>
            )}

            {/* 4. Routine Work Checklists */}
            {isUserAllowedToViewPage(currentUser, 'routine_work') && (
              <button
                type="button"
                onClick={() => onSelectView('routine_work')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'routine_work' ? 'rgba(6, 182, 212, 0.16)' : 'transparent',
                  border: currentView === 'routine_work' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
                  color: currentView === 'routine_work' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'routine_work' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'routine_work') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'routine_work') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <RefreshCw size={15} style={{ color: '#06B6D4' }} />
                  <span>{isTamil ? 'வழக்கமான பணிகள்' : 'Routine Work'}</span>
                </div>
                <span
                  style={{
                    background: '#1E293B',
                    color: '#94A3B8',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '5px',
                  }}
                >
                  18
                </span>
              </button>
            )}

            {/* SECTION 2: DEPARTMENT PORTALS */}
            <div
              style={{
                marginTop: '10px',
                padding: '10px 10px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                DEPARTMENT PORTALS
              </span>
              {isGM && onOpenCreateDepartment && (
                <button
                  type="button"
                  onClick={onOpenCreateDepartment}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Create new department"
                >
                  <Plus size={12} />
                </button>
              )}
            </div>

            {/* All Departments Option */}
            {isGM && (
              <button
                type="button"
                onClick={() => onSelectDept('ALL')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: selectedDeptId === 'ALL' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  color: selectedDeptId === 'ALL' ? '#60A5FA' : '#94A3B8',
                  fontWeight: selectedDeptId === 'ALL' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = selectedDeptId === 'ALL' ? '#60A5FA' : '#94A3B8')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={13} style={{ color: '#3B82F6' }} />
                  <span>{t('allDepartments')}</span>
                </div>
                <span
                  style={{
                    fontSize: '9.5px',
                    padding: '1px 5px',
                    background: '#1E293B',
                    color: '#60A5FA',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  ALL
                </span>
              </button>
            )}

            {/* Department List with Task Counts */}
            {departments.map((d) => {
              const count = getDeptTaskCount(d.id);
              const isSelected = selectedDeptId === d.id;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDept(d.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#94A3B8',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? 'rgba(37, 99, 235, 0.12)' : 'transparent';
                    e.currentTarget.style.color = isSelected ? '#FFFFFF' : '#94A3B8';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Folder size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      padding: '1px 5px',
                      background: isSelected ? '#1E293B' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#60A5FA' : '#64748B',
                      borderRadius: '4px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {count !== null && count !== undefined ? String(count).padStart(2, '0') : d.code}
                  </span>
                </button>
              );
            })}

            {/* SECTION 3: OPERATIONS & DIRECTORY */}
            <div
              style={{
                marginTop: '10px',
                padding: '10px 10px 4px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              OPERATIONS & MATRIX
            </div>

            {/* Staff Work Table (Live) */}
            <button
              type="button"
              onClick={() => onSelectView('table')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: '8px',
                background: currentView === 'table' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                border: currentView === 'table' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                color: currentView === 'table' ? '#FFFFFF' : '#94A3B8',
                fontWeight: currentView === 'table' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = currentView === 'table' ? '#FFFFFF' : '#94A3B8')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Table size={15} style={{ color: '#10B981' }} />
                <span>{isTamil ? 'பணியாளர் பணி அட்டவணை' : 'Staff Work Table'}</span>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                LIVE
              </span>
            </button>

            {/* Reports & Digest */}
            {isUserAllowedToViewPage(currentUser, 'report') && (
              <button
                type="button"
                onClick={() => onSelectView('report')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'report' ? 'rgba(139, 92, 246, 0.16)' : 'transparent',
                  border: currentView === 'report' ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                  color: currentView === 'report' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'report' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = currentView === 'report' ? '#FFFFFF' : '#94A3B8')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <BarChart3 size={15} style={{ color: '#8B5CF6' }} />
                  <span>{isTamil ? 'அறிக்கைகள்' : 'Reports & Digest'}</span>
                </div>
              </button>
            )}

            {/* Settings & Audit */}
            {isSuperAdmin && isUserAllowedToViewPage(currentUser, 'settings') && (
              <button
                type="button"
                onClick={() => onSelectView('settings')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'settings' ? 'rgba(236, 72, 153, 0.16)' : 'transparent',
                  border: currentView === 'settings' ? '1px solid rgba(236, 72, 153, 0.35)' : '1px solid transparent',
                  color: currentView === 'settings' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'settings' ? 700 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = currentView === 'settings' ? '#FFFFFF' : '#94A3B8')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Settings size={15} style={{ color: '#EC4899' }} />
                  <span>{isTamil ? 'அமைப்புகள்' : 'Settings & Audit'}</span>
                </div>
              </button>
            )}

            {/* Additional Admin Tools */}
            {isSuperAdmin && (
              <div style={{ marginTop: '8px', borderTop: '1px solid #1E293B', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={onOpenEmailLogs}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                  }}
                >
                  <Mail size={13} />
                  <span>{t('emailLogs')}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenActivityLogs}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                  }}
                >
                  <History size={13} />
                  <span>{t('activityTrail')}</span>
                </button>
                <a
                  href={typeof window !== 'undefined' && window.location.pathname.includes('/nextup') ? '/nextup/NextUp.apk' : './NextUp.apk'}
                  download="NextUp.apk"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#22c55e',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                  title="Download NextUp Android APK"
                >
                  <Smartphone size={13} />
                  <span>{isTamil ? 'மொபைல் செயலி (APK)' : 'Download Mobile APK'}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: USER PROFILE CARD + LOGOUT                                */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #1E293B',
            background: '#090D18',
            position: 'relative',
          }}
        >
          {/* Persona Switcher Dropdown (Admin Only) */}
          {isSuperAdmin && showPersonaMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '12px',
                right: '12px',
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                zIndex: 200,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748B',
                  padding: '4px 8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Switch Workspace Persona
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {personas.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      switchPersona(p);
                      setShowPersonaMenu(false);
                    }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: currentUser?.id === p.id ? '#FFFFFF' : '#94A3B8',
                      background: currentUser?.id === p.id ? '#1E293B' : 'transparent',
                      marginBottom: '2px',
                    }}
                  >
                    <span>{p.full_name}</span>
                    <span style={{ fontSize: '9px', color: '#64748B' }}>{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1E293B',
              cursor: isSuperAdmin ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (isSuperAdmin) setShowPersonaMenu(!showPersonaMenu);
            }}
          >
            {/* Avatar with online dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                {/* Glowing green status dot */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    right: '-1px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '2px solid #090D18',
                    boxShadow: '0 0 6px #10B981',
                  }}
                />
              </div>

              {/* Name & Role Pill */}
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 750,
                    color: '#F8FAFC',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }}
                >
                  {currentUser?.full_name || 'Mr. Nandha Kumar'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      background: 'rgba(6, 182, 212, 0.16)',
                      color: '#22D3EE',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      padding: '0.5px 5px',
                      borderRadius: '3px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {getRoleTagLabel(currentUser?.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
