import React from 'react';
import { LayoutGrid, List, Calendar, Table, Plus, Search, Star, Bell, Menu, ChevronRight } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isUserAllowedToViewPage, ViewType } from '../utils/pagePermissions';

interface NotionTopBarProps {
  currentView: ViewType;
  onSelectView: (view: any) => void;
  deptTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateTask: () => void;
  onOpenCreateStaff: () => void;
  onOpenCreateDepartment?: () => void;
  canCreateTask: boolean;
  canCreateStaff: boolean;
  canCreateDepartment?: boolean;
  onOpenCreateGmOwnTask?: () => void;
  unreadNotifsCount?: number;
  onOpenNotifications?: () => void;
  onToggleMobileNav?: () => void;
}

export const NotionTopBar: React.FC<NotionTopBarProps> = ({
  currentView,
  onSelectView,
  deptTitle,
  searchQuery,
  onSearchChange,
  onOpenCreateTask,
  onOpenCreateStaff,
  onOpenCreateDepartment,
  canCreateTask,
  canCreateStaff,
  canCreateDepartment,
  onOpenCreateGmOwnTask,
  unreadNotifsCount = 0,
  onOpenNotifications,
  onToggleMobileNav,
}) => {
  const { currentUser } = useAuth();
  const { t, isTamil } = useLanguage();

  const getViewTitle = () => {
    switch (currentView) {
      case 'routine_work':
        return isTamil ? 'வழக்கமான பணிகள் & சரிபார்ப்பு' : 'Routine Work Checklists';
      case 'it_portal':
        return isTamil ? 'தகவல் தொழில்நுட்பம் (IT) & மென்பொருள் மையம்' : 'IT Department — Software & Operations Hub';
      case 'today':
        return isTamil ? 'GM உடனடி பணிகள்' : 'GM Priority Desk';
      case 'self_desk':
        return isTamil ? 'சுய மேசை' : 'Personal Desk';
      case 'report':
        return isTamil ? 'அறிக்கைகள்' : 'Reports & Analytics';
      case 'settings':
        return isTamil ? 'கணினி அமைப்புகள்' : 'System Settings';
      case 'approvals':
        return isTamil ? 'GM ஒப்புதல் மையம்' : 'Approvals Hub';
      case 'staff':
        return isTamil ? 'பணியாளர் கோப்பகம்' : 'Staff Directory';
      case 'departments':
        return isTamil ? 'துறைகள்' : 'Departments';
      case 'board':
        return isTamil ? 'பணி பலகை' : 'Task Board';
      case 'list':
        return isTamil ? 'பணி பட்டியல்' : 'Task List';
      case 'calendar':
        return isTamil ? 'நாள்காட்டி' : 'Calendar';
      case 'table':
        return isTamil ? 'பணியாளர் பணி அட்டவணை' : 'Staff Work Table';
      default:
        return deptTitle === 'All Departments' ? t('allDepartments') : deptTitle;
    }
  };

  return (
    <header
      className="notion-topbar"
      style={{
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* ========================================================================= */}
      {/* LEFT: HAMBURGER, BREADCRUMBS & SEGMENTED VIEW SWITCHER                    */}
      {/* ========================================================================= */}
      <div className="notion-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="notion-mobile-menu-btn"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Menu size={19} />
          </button>
        )}

        {/* Clean Executive Breadcrumbs matching Image 4 */}
        <div
          className="notion-topbar-breadcrumbs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            minWidth: 0,
          }}
        >
          <span style={{ fontWeight: 600, color: '#64748B' }}>
            Rathinam Group
          </span>
          <ChevronRight size={13} style={{ color: '#94A3B8' }} />
          <span style={{ fontWeight: 600, color: '#64748B' }}>
            Operations
          </span>
          <ChevronRight size={13} style={{ color: '#94A3B8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }} />
            <span
              className="notion-topbar-view-title"
              style={{
                color: '#0F172A',
                fontWeight: 750,
                fontSize: '13px',
                maxWidth: '240px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getViewTitle()}
            </span>
          </div>
        </div>

        {/* Segmented View Switcher Tabs (Board, List, Table, Calendar) */}
        {(currentView === 'board' || currentView === 'list' || currentView === 'calendar' || currentView === 'table') && (
          <div
            className="notion-topbar-tabs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid #E2E8F0',
              marginLeft: '6px',
            }}
          >
            {/* Board View */}
            {isUserAllowedToViewPage(currentUser, 'board') && (
              <button
                type="button"
                onClick={() => onSelectView('board')}
                style={{
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: currentView === 'board' ? '#FFFFFF' : 'transparent',
                  fontWeight: currentView === 'board' ? 700 : 500,
                  color: currentView === 'board' ? '#0F172A' : '#64748B',
                  borderRadius: '7px',
                  border: 'none',
                  boxShadow: currentView === 'board' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <LayoutGrid size={13} style={{ color: currentView === 'board' ? '#2563EB' : '#64748B' }} />
                <span>{isTamil ? 'பலகை' : 'Board'}</span>
              </button>
            )}

            {/* List View */}
            {isUserAllowedToViewPage(currentUser, 'list') && (
              <button
                type="button"
                onClick={() => onSelectView('list')}
                style={{
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: currentView === 'list' ? '#FFFFFF' : 'transparent',
                  fontWeight: currentView === 'list' ? 700 : 500,
                  color: currentView === 'list' ? '#0F172A' : '#64748B',
                  borderRadius: '7px',
                  border: 'none',
                  boxShadow: currentView === 'list' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <List size={13} style={{ color: currentView === 'list' ? '#2563EB' : '#64748B' }} />
                <span>{isTamil ? 'பட்டியல்' : 'List'}</span>
              </button>
            )}

            {/* Table Matrix View */}
            {isUserAllowedToViewPage(currentUser, 'table') && (
              <button
                type="button"
                onClick={() => onSelectView('table')}
                style={{
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: currentView === 'table' ? '#FFFFFF' : 'transparent',
                  fontWeight: currentView === 'table' ? 700 : 500,
                  color: currentView === 'table' ? '#0F172A' : '#64748B',
                  borderRadius: '7px',
                  border: 'none',
                  boxShadow: currentView === 'table' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                title={t('staffMatrix')}
              >
                <Table size={13} style={{ color: currentView === 'table' ? '#2563EB' : '#64748B' }} />
                <span>{isTamil ? 'அட்டவணை' : 'Table'}</span>
              </button>
            )}

            {/* Calendar View */}
            {isUserAllowedToViewPage(currentUser, 'calendar') && (
              <button
                type="button"
                onClick={() => onSelectView('calendar')}
                style={{
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: currentView === 'calendar' ? '#FFFFFF' : 'transparent',
                  fontWeight: currentView === 'calendar' ? 700 : 500,
                  color: currentView === 'calendar' ? '#0F172A' : '#64748B',
                  borderRadius: '7px',
                  border: 'none',
                  boxShadow: currentView === 'calendar' ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Calendar size={13} style={{ color: currentView === 'calendar' ? '#2563EB' : '#64748B' }} />
                <span>{isTamil ? 'நாள்காட்டி' : 'Calendar'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: SEARCH BAR + ACTION BUTTONS + NOTIFS + LANG + THEME               */}
      {/* ========================================================================= */}
      <div className="notion-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick find tasks search input with shortcut hint */}
        <div
          className="notion-topbar-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '9px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            width: '230px',
            transition: 'all 0.2s ease',
            flexShrink: 1,
          }}
        >
          <Search size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={isTamil ? 'பணிகள், பணியாளர் (#ID)...' : 'Quick find tasks, staff (#ID)...'}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: '#0F172A',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: '#94A3B8',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '1px 5px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Primary Action Button: + New Task */}
        {canCreateTask && (
          <button
            type="button"
            onClick={onOpenCreateTask}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6.5px 14px',
              borderRadius: '8px',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563EB')}
          >
            <Plus size={14} />
            <span>{isTamil ? 'புதிய பணி' : 'New Task'}</span>
          </button>
        )}

        {/* Amber / Orange Button: Direct Task */}
        {onOpenCreateGmOwnTask && (
          <button
            type="button"
            onClick={onOpenCreateGmOwnTask}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6.5px 13px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
              transition: 'all 0.15s ease',
            }}
            title={t('directTask') || 'Direct GM Directive Task'}
          >
            <Star size={13} fill="#FFFFFF" />
            <span>{isTamil ? 'நேரடி பணி' : 'Direct Task'}</span>
          </button>
        )}

        {/* Notifications Bell */}
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              position: 'relative',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={t('notifications') || 'Notifications'}
          >
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 800,
                minWidth: '15px',
                height: '15px',
                padding: '0 3px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {unreadNotifsCount > 0 ? unreadNotifsCount : 14}
            </span>
          </button>
        )}

        {/* Language Switcher (EN / தமிழ்) */}
        <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <LanguageToggle compact={true} />
        </div>

        {/* Theme Switcher */}
        <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '8px' }}>
          <ThemeSwitcher compact={true} />
        </div>
      </div>
    </header>
  );
};
