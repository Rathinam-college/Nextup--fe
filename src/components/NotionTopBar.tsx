import React from 'react';
import { LayoutGrid, List, Calendar, Table, Plus, Search, Filter, Sparkles, Command, Star, Bell, Menu, ChevronRight } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isUserAllowedToViewPage, ViewType } from '../utils/pagePermissions';
import rathinamLogo from '../image/image.png';

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
        return isTamil ? 'வழக்கமான பணிகள்' : 'Routine Work';
      case 'today':
        return t('todayUrgent');
      case 'self_desk':
        return t('personalDesk');
      case 'report':
        return t('reportsAnalytics');
      case 'settings':
        return t('systemSettings');
      case 'approvals':
        return t('approvalsHub');
      case 'staff':
        return t('staffDirectory');
      case 'departments':
        return t('departments');
      case 'board':
        return isTamil ? 'பணி பலகை' : 'Task Board';
      case 'list':
        return isTamil ? 'பணி பட்டியல்' : 'Task List';
      case 'calendar':
        return isTamil ? 'நாள்காட்டி' : 'Calendar';
      case 'table':
        return isTamil ? 'பணி அட்டவணை' : 'Task Matrix';
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

        {/* Clean Executive Breadcrumbs */}
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
                <LayoutGrid size={12} style={{ color: currentView === 'board' ? '#2563EB' : 'inherit' }} />
                <span>{t('boardView')}</span>
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
                <List size={12} style={{ color: currentView === 'list' ? '#0284C7' : 'inherit' }} />
                <span>{t('listView')}</span>
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
                <Table size={12} style={{ color: currentView === 'table' ? '#10B981' : 'inherit' }} />
                <span>{t('tableView')}</span>
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
                <Calendar size={12} style={{ color: currentView === 'calendar' ? '#F59E0B' : 'inherit' }} />
                <span>{t('calendarView')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RIGHT: SEARCH BAR, ACTIONS, LIVE SYNC & UTILITIES                         */}
      {/* ========================================================================= */}
      <div className="notion-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Pill-shaped Global Search Bar with ⌘K shortcut */}
        <div
          className="notion-topbar-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            width: '210px',
            minWidth: '140px',
            maxWidth: '240px',
            transition: 'all 0.2s ease',
            flexShrink: 1,
          }}
        >
          <Search size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
          <input
            type="text"
            placeholder={isTamil ? 'பணிகளைத் தேடுங்கள்...' : 'Quick find tasks, staff (#ID)...'}
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
              fontSize: '9px',
              fontWeight: 700,
              color: '#64748B',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '1px 5px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Action Buttons */}
        {currentView === 'departments' && canCreateDepartment && onOpenCreateDepartment && (
          <button
            onClick={onOpenCreateDepartment}
            className="notion-btn notion-btn-primary"
            style={{ padding: '7px 13px', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderRadius: '8px' }}
          >
            <Plus size={14} />
            <span>{t('newDepartment')}</span>
          </button>
        )}

        {currentView === 'staff' && canCreateStaff && (
          <button
            onClick={onOpenCreateStaff}
            className="notion-btn notion-btn-primary"
            style={{ padding: '7px 13px', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', borderRadius: '8px' }}
          >
            <Plus size={14} />
            <span>{t('addStaff')}</span>
          </button>
        )}

        {/* + New Task (Vibrant Royal Electric Blue Button) */}
        {canCreateTask && (
          <button
            type="button"
            onClick={onOpenCreateTask}
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.28)',
              transition: 'all 0.15s ease',
            }}
            title={t('newTask')}
          >
            <Plus size={14} />
            <span>{t('newTask')}</span>
          </button>
        )}

        {/* ⭐ Direct Task (Vibrant Amber Gold Button for GM/Admin) */}
        {onOpenCreateGmOwnTask && (
          <button
            type="button"
            onClick={onOpenCreateGmOwnTask}
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.28)',
              transition: 'all 0.15s ease',
            }}
            title={t('directTask')}
          >
            <Star size={13} />
            <span>{t('directTask')}</span>
          </button>
        )}

        {/* Campus Live Sync indicator (from screenshot) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#64748B',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          title="Real-time data synced with campus server"
        >
          <span
            style={{
              width: '6.5px',
              height: '6.5px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px #10B981',
            }}
          />
          <span>Campus Live Sync</span>
        </div>

        {/* Notification Bell */}
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: unreadNotifsCount > 0 ? '#F59E0B' : '#64748B',
              position: 'relative',
              flexShrink: 0,
            }}
            title={t('notifications')}
          >
            <Bell size={14} />
            {unreadNotifsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 800,
                  minWidth: '15px',
                  height: '15px',
                  padding: '0 3px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #FFFFFF',
                }}
              >
                {unreadNotifsCount}
              </span>
            )}
          </button>
        )}

        {/* Language Switcher (EN / தமிழ்) */}
        <div style={{ flexShrink: 0 }}>
          <LanguageToggle compact={true} />
        </div>

        {/* Theme Switcher (Day/Night) */}
        <div style={{ flexShrink: 0 }}>
          <ThemeSwitcher compact={true} />
        </div>
      </div>
    </header>
  );
};
