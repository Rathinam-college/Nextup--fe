import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, Department } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Building2,
  Phone,
  Search,
  X,
  RotateCcw,
  Shield,
  UserCheck,
} from 'lucide-react';

interface NotionStaffViewProps {
  staffList: User[];
  departments?: Department[];
  selectedDeptId?: number | 'ALL';
  onSelectDept?: (deptId: number | 'ALL') => void;
  selectedStaffId?: string | number | 'ALL';
  onSelectStaff?: (staffId: string | number | 'ALL') => void;
  onOpenCreateStaff: () => void;
  onEditStaff: (user: User) => void;
  onDeleteStaff: (user: User) => void;
  currentUserRole?: Role;
  currentUserDeptId?: number | null;
}

export const NotionStaffView: React.FC<NotionStaffViewProps> = ({
  staffList,
  departments,
  selectedDeptId,
  onSelectDept,
  selectedStaffId,
  onSelectStaff,
  onOpenCreateStaff,
  onEditStaff,
  onDeleteStaff,
  currentUserRole,
}) => {
  const canManage =
    currentUserRole === 'GENERAL_MANAGER' ||
    currentUserRole === 'SUPER_ADMIN' ||
    currentUserRole === 'DEPT_MANAGER';

  // Local filter states with fallback & sync with parent props
  const [deptFilter, setDeptFilter] = useState<number | 'ALL'>(selectedDeptId ?? 'ALL');
  const [staffFilter, setStaffFilter] = useState<string | number | 'ALL'>(selectedStaffId ?? 'ALL');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep synced when selectedDeptId prop changes externally
  useEffect(() => {
    if (selectedDeptId !== undefined) {
      setDeptFilter(selectedDeptId);
    }
  }, [selectedDeptId]);

  // Keep synced when selectedStaffId prop changes externally
  useEffect(() => {
    if (selectedStaffId !== undefined) {
      setStaffFilter(selectedStaffId);
    }
  }, [selectedStaffId]);

  const handleDeptChange = (newDept: number | 'ALL') => {
    setDeptFilter(newDept);
    // If a specific staff was selected that doesn't belong to the new department, reset staff filter
    if (staffFilter !== 'ALL' && newDept !== 'ALL') {
      const staffMember = staffList.find((s) => String(s.id) === String(staffFilter));
      if (staffMember && Number(staffMember.department) !== Number(newDept)) {
        setStaffFilter('ALL');
        if (onSelectStaff) onSelectStaff('ALL');
      }
    }
    if (onSelectDept) onSelectDept(newDept);
  };

  const handleStaffChange = (newStaff: string | number | 'ALL') => {
    setStaffFilter(newStaff);
    if (onSelectStaff) onSelectStaff(newStaff);
  };

  const handleResetFilters = () => {
    setDeptFilter('ALL');
    setStaffFilter('ALL');
    setRoleFilter('ALL');
    setSearchQuery('');
    if (onSelectDept) onSelectDept('ALL');
    if (onSelectStaff) onSelectStaff('ALL');
  };

  // Derive department options with member counts
  const departmentOptions = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => {
        const count = staffList.filter((s) => Number(s.department) === Number(d.id)).length;
        return {
          id: d.id,
          name: d.name,
          code: d.code,
          memberCount: count,
        };
      });
    }
    // Fallback: extract distinct departments from staffList
    const map = new Map<number, { id: number; name: string; code: string; memberCount: number }>();
    staffList.forEach((s) => {
      if (s.department) {
        const deptId = Number(s.department);
        if (!map.has(deptId)) {
          map.set(deptId, {
            id: deptId,
            name: s.department_name || `Dept #${deptId}`,
            code: s.department_code || '',
            memberCount: 0,
          });
        }
        map.get(deptId)!.memberCount++;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, staffList]);

  // Candidate staff dropdown options scoped to selected department if active
  const availableStaffOptions = useMemo(() => {
    let pool = staffList;
    if (deptFilter !== 'ALL') {
      pool = pool.filter((s) => Number(s.department) === Number(deptFilter));
    }
    return pool
      .slice()
      .sort((a, b) => (a.full_name || a.username).localeCompare(b.full_name || b.username));
  }, [staffList, deptFilter]);

  // Filtered staff list for the table
  const displayedStaff = useMemo(() => {
    return staffList.filter((user) => {
      // 1. Department filter
      if (deptFilter !== 'ALL') {
        if (Number(user.department) !== Number(deptFilter)) {
          return false;
        }
      }

      // 2. Staff member filter
      if (staffFilter !== 'ALL') {
        if (String(user.id) !== String(staffFilter)) {
          return false;
        }
      }

      // 3. Role filter
      if (roleFilter !== 'ALL') {
        if (user.role !== roleFilter) {
          return false;
        }
      }

      // 4. Search query (matches name, username, email, phone, job title, department)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (user.full_name || '').toLowerCase().includes(q);
        const usernameMatch = (user.username || '').toLowerCase().includes(q);
        const emailMatch = (user.email || '').toLowerCase().includes(q);
        const phoneMatch = (user.phone || '').toLowerCase().includes(q);
        const titleMatch = (user.job_title || '').toLowerCase().includes(q);
        const deptMatch = (user.department_name || '').toLowerCase().includes(q);
        if (!nameMatch && !usernameMatch && !emailMatch && !phoneMatch && !titleMatch && !deptMatch) {
          return false;
        }
      }

      return true;
    });
  }, [staffList, deptFilter, staffFilter, roleFilter, searchQuery]);

  const hasActiveFilters =
    deptFilter !== 'ALL' || staffFilter !== 'ALL' || roleFilter !== 'ALL' || searchQuery.trim() !== '';

  const canEditUser = (user: User) => {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    if (currentUserRole === 'GENERAL_MANAGER') return user.role !== 'SUPER_ADMIN';
    if (currentUserRole === 'DEPT_MANAGER') return user.role === 'STAFF';
    return false;
  };

  const canDeleteUser = (user: User) => {
    if (currentUserRole === 'SUPER_ADMIN') return user.role !== 'SUPER_ADMIN';
    if (currentUserRole === 'GENERAL_MANAGER') return user.role === 'STAFF' || user.role === 'DEPT_MANAGER';
    if (currentUserRole === 'DEPT_MANAGER') return user.role === 'STAFF';
    return false;
  };

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="notion-tag tag-purple" style={{ fontSize: '11px', fontWeight: 700 }}>
            SuperAdmin
          </span>
        );
      case 'GENERAL_MANAGER':
        return (
          <span className="notion-tag tag-yellow" style={{ fontSize: '11px', fontWeight: 700 }}>
            General Manager
          </span>
        );
      case 'DEPT_MANAGER':
        return (
          <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 700 }}>
            Dept Manager
          </span>
        );
      default:
        return (
          <span className="notion-tag tag-gray" style={{ fontSize: '11px', fontWeight: 600 }}>
            Staff Member
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>👥</span>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--notion-text)',
                letterSpacing: '-0.025em',
              }}
            >
              Personnel &amp; Staff Directory
            </h1>
            <span className="notion-tag tag-blue" style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 9px' }}>
              {displayedStaff.length} {displayedStaff.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--notion-text-muted)', margin: '6px 0 0' }}>
            Active enterprise team directory with departmental filtering, staff lookup, and role-based access management.
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenCreateStaff}
            className="notion-btn notion-btn-primary"
            style={{ fontSize: '12.5px', padding: '8px 16px', borderRadius: '9px', fontWeight: 700 }}
          >
            <Plus size={15} />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Notion-style Interactive Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '12px',
          marginBottom: '16px',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* 1. Real-time Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--notion-item-bg)',
              border: searchQuery ? '1.5px solid var(--notion-blue)' : '1px solid var(--notion-border)',
              minWidth: '220px',
              flex: '1 1 220px',
              maxWidth: '340px',
              transition: 'all 0.15s ease',
            }}
          >
            <Search
              size={14}
              style={{ color: searchQuery ? 'var(--notion-blue)' : 'var(--notion-text-muted)', flexShrink: 0 }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, phone..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12.5px',
                width: '100%',
                color: 'var(--notion-text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--notion-text-muted)',
                  padding: 0,
                  display: 'flex',
                }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Department Selector Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: deptFilter !== 'ALL' ? 'rgba(124, 58, 237, 0.09)' : 'var(--notion-item-bg)',
              border: deptFilter !== 'ALL' ? '1.5px solid #8b5cf6' : '1px solid var(--notion-border)',
              transition: 'all 0.15s ease',
            }}
          >
            <Building2
              size={13}
              style={{ color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)',
              }}
            >
              Dept:
            </span>
            <select
              value={String(deptFilter)}
              onChange={(e) => handleDeptChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: deptFilter !== 'ALL' ? 700 : 500,
                color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text)',
                cursor: 'pointer',
                maxWidth: '185px',
              }}
            >
              <option value="ALL">All Departments ({staffList.length})</option>
              {departmentOptions.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.name} {d.code ? `(${d.code})` : ''} ({d.memberCount})
                </option>
              ))}
            </select>
            {deptFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => handleDeptChange('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#7c3aed',
                  fontSize: '11px',
                  padding: '0 2px',
                  fontWeight: 700,
                }}
                title="Reset to All Departments"
              >
                ✕
              </button>
            )}
          </div>

          {/* 3. Staff Member Selector Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: staffFilter !== 'ALL' ? 'rgba(35, 131, 226, 0.09)' : 'var(--notion-item-bg)',
              border: staffFilter !== 'ALL' ? '1.5px solid var(--notion-blue)' : '1px solid var(--notion-border)',
              transition: 'all 0.15s ease',
            }}
          >
            <Users
              size={13}
              style={{ color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)',
              }}
            >
              Staff:
            </span>
            <select
              value={String(staffFilter)}
              onChange={(e) => handleStaffChange(e.target.value === 'ALL' ? 'ALL' : e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: staffFilter !== 'ALL' ? 700 : 500,
                color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text)',
                cursor: 'pointer',
                maxWidth: '200px',
              }}
            >
              <option value="ALL">All Staff ({availableStaffOptions.length})</option>
              {availableStaffOptions.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.full_name || s.username} {s.department_code ? `[${s.department_code}]` : ''}
                </option>
              ))}
            </select>
            {staffFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => handleStaffChange('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--notion-blue)',
                  fontSize: '11px',
                  padding: '0 2px',
                  fontWeight: 700,
                }}
                title="Reset to All Staff"
              >
                ✕
              </button>
            )}
          </div>

          {/* 4. Role Selector Dropdown */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: roleFilter !== 'ALL' ? 'rgba(234, 88, 12, 0.09)' : 'var(--notion-item-bg)',
              border: roleFilter !== 'ALL' ? '1.5px solid #ea580c' : '1px solid var(--notion-border)',
              transition: 'all 0.15s ease',
            }}
          >
            <Shield
              size={13}
              style={{ color: roleFilter !== 'ALL' ? '#ea580c' : 'var(--notion-text-muted)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: roleFilter !== 'ALL' ? '#ea580c' : 'var(--notion-text-muted)',
              }}
            >
              Role:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                fontWeight: roleFilter !== 'ALL' ? 700 : 500,
                color: roleFilter !== 'ALL' ? '#ea580c' : 'var(--notion-text)',
                cursor: 'pointer',
                maxWidth: '155px',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="GENERAL_MANAGER">General Manager</option>
              <option value="DEPT_MANAGER">Dept Manager</option>
              <option value="STAFF">Staff Member</option>
            </select>
            {roleFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ea580c',
                  fontSize: '11px',
                  padding: '0 2px',
                  fontWeight: 700,
                }}
                title="Reset Role Filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 5. Reset All Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="notion-btn notion-btn-bordered"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              color: 'var(--notion-red, #ef4444)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Clear all active filters"
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Summary Pills */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--notion-text-muted)', fontWeight: 600 }}>
            Showing {displayedStaff.length} of {staffList.length} members:
          </span>

          {deptFilter !== 'ALL' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 9px',
                borderRadius: '6px',
                background: 'rgba(124, 58, 237, 0.1)',
                color: '#7c3aed',
                fontWeight: 600,
                border: '1px solid rgba(124, 58, 237, 0.25)',
              }}
            >
              🏢 {departmentOptions.find((d) => String(d.id) === String(deptFilter))?.name || `Dept #${deptFilter}`}
              <button
                type="button"
                onClick={() => handleDeptChange('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#7c3aed',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </span>
          )}

          {staffFilter !== 'ALL' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 9px',
                borderRadius: '6px',
                background: 'rgba(35, 131, 226, 0.1)',
                color: 'var(--notion-blue)',
                fontWeight: 600,
                border: '1px solid rgba(35, 131, 226, 0.25)',
              }}
            >
              👤{' '}
              {staffList.find((s) => String(s.id) === String(staffFilter))?.full_name ||
                staffList.find((s) => String(s.id) === String(staffFilter))?.username ||
                `Staff #${staffFilter}`}
              <button
                type="button"
                onClick={() => handleStaffChange('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--notion-blue)',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </span>
          )}

          {roleFilter !== 'ALL' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 9px',
                borderRadius: '6px',
                background: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                fontWeight: 600,
                border: '1px solid rgba(234, 88, 12, 0.25)',
              }}
            >
              🏷️ Role: {roleFilter}
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ea580c',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery.trim() && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 9px',
                borderRadius: '6px',
                background: 'var(--notion-item-bg)',
                color: 'var(--notion-text)',
                fontWeight: 600,
                border: '1px solid var(--notion-border)',
              }}
            >
              🔍 "{searchQuery.trim()}"
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--notion-text-muted)',
                  padding: 0,
                  fontWeight: 700,
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}

      {/* Modern Table Container */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          background: 'var(--notion-card)',
          boxShadow: 'var(--notion-shadow)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--notion-border)',
                background: 'var(--notion-item-bg)',
                color: 'var(--notion-text-dim)',
                fontSize: '12px',
                textAlign: 'left',
                fontWeight: 700,
              }}
            >
              <th style={{ padding: '12px 18px' }}>👤 Member Name</th>
              <th style={{ padding: '12px 18px' }}>🔑 Username</th>
              <th style={{ padding: '12px 18px' }}>🏢 Department</th>
              <th style={{ padding: '12px 18px' }}>🏷️ Role</th>
              <th style={{ padding: '12px 18px' }}>📞 Contact Phone</th>
              <th style={{ padding: '12px 18px' }}>🛡️ Page Access</th>
              <th style={{ padding: '12px 18px' }}>💼 Job Title</th>
              <th style={{ padding: '12px 18px' }}>✉️ Institutional Email</th>
              {canManage && <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayedStaff.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--notion-item-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--notion-text-muted)',
                      }}
                    >
                      <Users size={24} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--notion-text)' }}>
                      No Personnel Found Matching Filters
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', maxWidth: '420px', margin: 0 }}>
                      No staff members match the selected department, staff member, role, or search keyword.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="notion-btn notion-btn-primary"
                        style={{ marginTop: '8px', fontSize: '12px', padding: '6px 14px' }}
                      >
                        <RotateCcw size={12} />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedStaff.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--notion-border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--notion-text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                          color: '#fff',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                        }}
                      >
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                      </span>
                      <span style={{ fontSize: '13.5px' }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '14px 18px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px',
                      color: 'var(--notion-text-muted)',
                    }}
                  >
                    {user.username}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="notion-tag tag-purple" style={{ fontSize: '11px', fontWeight: 600 }}>
                      {user.department_name || 'Global'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>{getRoleTag(user.role)}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>
                    {user.phone ? (
                      <a
                        href={`tel:${user.phone.replace(/\s+/g, '')}`}
                        style={{
                          color: '#0284c7',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: 'rgba(2, 132, 199, 0.08)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(2, 132, 199, 0.2)',
                        }}
                        title={`Call ${user.full_name || user.username} (${user.phone})`}
                      >
                        <Phone size={12} />
                        <span>{user.phone}</span>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--notion-text-dim)', fontSize: '11.5px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => canEditUser(user) && onEditStaff(user)}
                      className="notion-btn"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background:
                          (user.allowed_pages?.length ?? 0) > 0 ? 'rgba(79, 70, 229, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        color: (user.allowed_pages?.length ?? 0) > 0 ? '#4f46e5' : '#ef4444',
                        border:
                          (user.allowed_pages?.length ?? 0) > 0
                            ? '1px solid rgba(79, 70, 229, 0.25)'
                            : '1px solid rgba(239, 68, 68, 0.25)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        cursor: canEditUser(user) ? 'pointer' : 'default',
                      }}
                      title="Click Edit to configure page view permissions"
                    >
                      {user.role === 'SUPER_ADMIN'
                        ? 'All Pages (Full)'
                        : user.allowed_pages
                        ? `${user.allowed_pages.length} Pages View`
                        : 'Default Pages'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--notion-text-muted)', fontSize: '12.5px' }}>
                    {user.job_title || 'Staff Member'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--notion-text-dim)', fontSize: '12.5px' }}>
                    {user.email || '—'}
                  </td>
                  {canManage && (
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {canEditUser(user) && (
                          <button
                            onClick={() => onEditStaff(user)}
                            className="notion-btn notion-btn-bordered"
                            style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                            title={`Edit ${user.full_name || user.username}`}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                        )}
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => onDeleteStaff(user)}
                            className="notion-btn notion-btn-danger"
                            style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                            title={`Remove ${user.full_name || user.username}`}
                          >
                            <Trash2 size={12} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
