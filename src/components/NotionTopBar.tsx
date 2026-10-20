import React from 'react';
import { LayoutGrid, List, Calendar, Table, Plus, Search, Filter, Sparkles, Command } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import rathinamLogo from '../image/image.png';

interface NotionTopBarProps {
  currentView: 'board' | 'list' | 'calendar' | 'table' | 'approvals' | 'staff' | 'departments' | 'report' | 'settings' | 'today';
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
}) => {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--notion-border)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--notion-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Left: Breadcrumbs & View Toggle Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            >
              <img
                src={rathinamLogo}
                alt="Rathinam"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontWeight: 800, color: 'var(--notion-text)', fontSize: '13.5px', letterSpacing: '-0.01em' }}>
              Rathinam
            </span>
          </div>

          <span style={{ color: 'var(--notion-text-dim)', fontSize: '12px' }}>/</span>

          <span
            style={{
              color: 'var(--notion-text)',
              fontWeight: 700,
              fontSize: '13.5px',
              maxWidth: '380px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentView === 'today'
              ? 'GM Priority Desk — Today & Urgent'
              : currentView === 'report'
              ? 'Executive Reports & Analytics'
              : currentView === 'settings'
              ? 'System Administration'
              : deptTitle}
          </span>
        </div>

        {/* Linear/Segmented View Switcher Tabs (Board, List, Table, Calendar) */}
        {(currentView === 'board' || currentView === 'list' || currentView === 'calendar' || currentView === 'table') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'var(--notion-item-bg)',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid var(--notion-border-subtle)',
              marginLeft: '6px',
            }}
          >
            {/* Board View */}
            <button
              type="button"
              onClick={() => onSelectView('board')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '5px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentView === 'board' ? 'var(--notion-card)' : 'transparent',
                fontWeight: currentView === 'board' ? 700 : 500,
                color: currentView === 'board' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                borderRadius: '8px',
                border: currentView === 'board' ? '1px solid var(--notion-border)' : '1px solid transparent',
                boxShadow: currentView === 'board' ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              <LayoutGrid size={13} style={{ color: currentView === 'board' ? '#4f46e5' : 'inherit' }} />
              <span>Board</span>
            </button>

            {/* List View */}
            <button
              type="button"
              onClick={() => onSelectView('list')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '5px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentView === 'list' ? 'var(--notion-card)' : 'transparent',
                fontWeight: currentView === 'list' ? 700 : 500,
                color: currentView === 'list' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                borderRadius: '8px',
                border: currentView === 'list' ? '1px solid var(--notion-border)' : '1px solid transparent',
                boxShadow: currentView === 'list' ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              <List size={13} style={{ color: currentView === 'list' ? '#0ea5e9' : 'inherit' }} />
              <span>List</span>
            </button>

            {/* Table Matrix View */}
            <button
              type="button"
              onClick={() => onSelectView('table')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '5px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentView === 'table' ? 'var(--notion-card)' : 'transparent',
                fontWeight: currentView === 'table' ? 700 : 500,
                color: currentView === 'table' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                borderRadius: '8px',
                border: currentView === 'table' ? '1px solid var(--notion-border)' : '1px solid transparent',
                boxShadow: currentView === 'table' ? 'var(--notion-shadow-sm)' : 'none',
              }}
              title="Staff Status Matrix Table"
            >
              <Table size={13} style={{ color: currentView === 'table' ? '#10b981' : 'inherit' }} />
              <span>Table</span>
            </button>

            {/* Calendar View */}
            <button
              type="button"
              onClick={() => onSelectView('calendar')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '5px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: currentView === 'calendar' ? 'var(--notion-card)' : 'transparent',
                fontWeight: currentView === 'calendar' ? 700 : 500,
                color: currentView === 'calendar' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                borderRadius: '8px',
                border: currentView === 'calendar' ? '1px solid var(--notion-border)' : '1px solid transparent',
                boxShadow: currentView === 'calendar' ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              <Calendar size={13} style={{ color: currentView === 'calendar' ? '#f59e0b' : 'inherit' }} />
              <span>Calendar</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search Bar with shortcut hint */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'var(--notion-input-bg)',
            border: '1px solid var(--notion-border)',
            width: '210px',
            transition: 'all 0.2s ease',
          }}
        >
          <Search size={14} style={{ color: 'var(--notion-text-dim)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search tasks, staff..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12.5px',
              color: 'var(--notion-text)',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Action Buttons */}
        {currentView === 'departments' && canCreateDepartment && onOpenCreateDepartment && (
          <button onClick={onOpenCreateDepartment} className="notion-btn notion-btn-primary" style={{ padding: '7px 14px' }}>
            <Plus size={14} />
            <span>New Department</span>
          </button>
        )}

        {currentView === 'staff' && canCreateStaff && (
          <button onClick={onOpenCreateStaff} className="notion-btn notion-btn-primary" style={{ padding: '7px 14px' }}>
            <Plus size={14} />
            <span>Add Staff</span>
          </button>
        )}

        {canCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="notion-btn notion-btn-primary"
            style={{
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '9px',
            }}
          >
            <Plus size={15} />
            <span>+ New Task / Issue</span>
          </button>
        )}

        {/* Top bar theme switcher */}
        <div style={{ borderLeft: '1px solid var(--notion-border)', paddingLeft: '10px' }}>
          <ThemeSwitcher compact={true} />
        </div>
      </div>
    </header>
  );
};
