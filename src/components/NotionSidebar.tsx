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
  Lock,
  Smartphone,
  X,
  Star,
  RefreshCw,
  Table,
  Folder,
  Layers,
  Code,
  Bus,
  ShieldAlert,
  Wrench,
  Utensils,
  Home,
  Cpu,
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
    (currentView === 'board' || currentView === 'list' || currentView === 'calendar' || currentView === 'table') &&
    selectedDeptId === 'ALL';

  // Compute live counts if tasks are available
  const totalTasksCount = tasks ? tasks.filter((t) => t.status !== 'CLOSED').length : 116;
  const gmDirectivesCount = tasks
    ? tasks.filter((t) => (t.priority === 'URGENT' || t.status === 'PENDING_GM_APPROVAL') && t.status !== 'CLOSED').length
    : pendingCount || 8;

  const getDeptTaskCount = (deptId: number, deptCode?: string) => {
    if (!tasks) return null;
    const count = tasks.filter((t) => (t.department === deptId || t.department_code === deptCode) && t.status !== 'CLOSED').length;
    return count > 0 ? (count < 10 ? `0${count}` : String(count)) : null;
  };

  const getDeptIcon = (deptName: string, deptCode?: string) => {
    const lower = (deptName + ' ' + (deptCode || '')).toLowerCase();
    if (lower.includes('transport') || lower.includes('fleet')) return Bus;
    if (lower.includes('cctv') || lower.includes('security')) return ShieldAlert;
    if (lower.includes('infra') || lower.includes('maintenance')) return Wrench;
    if (lower.includes('food') || lower.includes('dining') || lower.includes('mess')) return Utensils;
    if (lower.includes('hostel')) return Home;
    if (lower.includes('it') || lower.includes('tech') || lower.includes('software')) return Cpu;
    return Building;
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
          background: '#0B1120', // Executive deep slate dark theme matching Stitch design
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
                onClick={() => {
                  onSelectDept('ALL');
                  onSelectView('board');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: isTasksViewActive ? '#2563eb' : 'transparent',
                  border: isTasksViewActive ? '1px solid #3b82f6' : '1px solid transparent',
                  color: isTasksViewActive ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isTasksViewActive ? 750 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isTasksViewActive ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none',
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
                  <CheckSquare size={15} style={{ color: isTasksViewActive ? '#FFFFFF' : '#3B82F6' }} />
                  <span>{t('allTasks')}</span>
                </div>
                <span
                  style={{
                    background: isTasksViewActive ? 'rgba(255, 255, 255, 0.2)' : '#1E293B',
                    color: isTasksViewActive ? '#FFFFFF' : '#60A5FA',
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
                  GM
                </span>
              </button>
            )}

            {/* 3. Self Desk & Notes */}
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
                  background: currentView === 'self_desk' ? 'rgba(16, 185, 129, 0.16)' : 'transparent',
                  border: currentView === 'self_desk' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
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
                  <Lock size={15} style={{ color: currentView === 'self_desk' ? '#10B981' : '#64748B' }} />
                  <span>{isTamil ? 'சுய மேசை & குறிப்புகள்' : 'Self Desk & Notes'}</span>
                </div>
              </button>
            )}

            {/* 4. Routine Work */}
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
                  <RefreshCw size={14} style={{ color: currentView === 'routine_work' ? '#06B6D4' : '#0891B2' }} />
                  <span>{isTamil ? 'வழக்கமான பணிகள்' : 'Routine Work'}</span>
                </div>
                <span
                  style={{
                    background: '#1E293B',
                    color: '#06B6D4',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 7px',
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
                padding: '14px 10px 4px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {isTamil ? 'துறை போர்ட்டல்கள்' : 'DEPARTMENT PORTALS'}
            </div>

            {departments.map((d) => {
              const isSelected = selectedDeptId === d.id && currentView !== 'it_portal';
              const isITDept = d.code === 'IT' || d.name.toLowerCase().includes('information technology');
              const isITPortalActive = currentView === 'it_portal' && isITDept;
              const DeptIcon = getDeptIcon(d.name, d.code);
              const deptCount = getDeptTaskCount(d.id, d.code);

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    if (isITDept) {
                      onSelectDept(d.id);
                      onSelectView('it_portal');
                    } else {
                      onSelectDept(d.id);
                      onSelectView('board');
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6.5px 10px',
                    borderRadius: '8px',
                    background:
                      isSelected || isITPortalActive ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                    border:
                      isSelected || isITPortalActive
                        ? '1px solid rgba(59, 130, 246, 0.35)'
                        : '1px solid transparent',
                    color: isSelected || isITPortalActive ? '#FFFFFF' : '#94A3B8',
                    fontWeight: isSelected || isITPortalActive ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isITPortalActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#F1F5F9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isITPortalActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <DeptIcon
                      size={14}
                      style={{
                        color: isSelected || isITPortalActive ? '#60A5FA' : '#64748B',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isITDept ? (isTamil ? 'தகவல் தொழில்நுட்பம்' : 'IT Support') : d.name}
                    </span>
                  </div>
                  <span
                    style={{
                      background: '#1E293B',
                      color: isSelected || isITPortalActive ? '#60A5FA' : '#64748B',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {deptCount || (d.id === 1 ? '14' : d.id === 2 ? '09' : d.id === 3 ? '22' : d.id === 4 ? '07' : d.id === 5 ? '12' : '16')}
                  </span>
                </button>
              );
            })}

            {/* SECTION 3: SYSTEM UTILITIES */}
            <div
              style={{
                margin: '10px 4px 6px',
                borderTop: '1px solid #1E293B',
              }}
            />

            {/* Staff Work Table Shortcut */}
            {isUserAllowedToViewPage(currentUser, 'table') && (
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
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentView !== 'table') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== 'table') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94A3B8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Table size={14} style={{ color: '#10B981' }} />
                  <span>{isTamil ? 'பணியாளர் பணி அட்டவணை' : 'Staff Work Table'}</span>
                </div>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
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
            )}

            {/* Reports & Digest */}
            {isUserAllowedToViewPage(currentUser, 'report') && (
              <button
                type="button"
                onClick={() => onSelectView('report')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'report' ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
                  border: currentView === 'report' ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  color: currentView === 'report' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'report' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <BarChart3 size={14} style={{ color: '#60A5FA' }} />
                <span>{isTamil ? 'அறிக்கைகள் & ஆய்வு' : 'Reports & Digest'}</span>
              </button>
            )}

            {/* Settings & Audit */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onSelectView('settings')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: currentView === 'settings' ? 'rgba(168, 85, 247, 0.16)' : 'transparent',
                  border: currentView === 'settings' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
                  color: currentView === 'settings' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: currentView === 'settings' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Settings size={14} style={{ color: '#A855F7' }} />
                <span>{isTamil ? 'அமைப்புகள் & தணிக்கை' : 'Settings & Audit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: PINNED USER PROFILE CARD (Exact Match to Image 4)        */}
        {/* ========================================================================= */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #1E293B',
            background: '#090D1A',
            position: 'relative',
          }}
        >
          {/* Persona Switcher Menu Dropdown */}
          {showPersonaMenu && personas && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '12px',
                right: '12px',
                marginBottom: '8px',
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '6px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748B',
                  padding: '4px 8px',
                  letterSpacing: '0.04em',
                }}
              >
                SWITCH IDENTITY
              </div>
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    switchPersona(p);
                    setShowPersonaMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: p.id === currentUser?.id ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    color: p.id === currentUser?.id ? '#FFFFFF' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: p.id === currentUser?.id ? 700 : 500 }}>
                    {p.full_name || p.username}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#64748B',
                      background: '#1E293B',
                      padding: '1px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* User Profile Button */}
            <button
              type="button"
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                minWidth: 0,
                flex: 1,
              }}
              title="Click to switch persona / view profile"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  flexShrink: 0,
                }}
              >
                {currentUser?.full_name ? currentUser.full_name.slice(0, 2).toUpperCase() : 'NK'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 750,
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser?.full_name || 'Mr. Nandha Kumar'}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#10B981', // Emerald badge color matching Image 4
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {getRoleTagLabel(currentUser?.role)}
                </div>
              </div>
            </button>

            {/* Logout Action */}
            <button
              type="button"
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
              title={t('logout') || 'Log Out'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
