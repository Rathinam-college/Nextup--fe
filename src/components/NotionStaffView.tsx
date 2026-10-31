import React from 'react';
import { User, Role } from '../types';
import { Plus, Trash2, Edit2, Users, Mail, Shield, Building2, Phone } from 'lucide-react';

interface NotionStaffViewProps {
  staffList: User[];
  onOpenCreateStaff: () => void;
  onEditStaff: (user: User) => void;
  onDeleteStaff: (user: User) => void;
  currentUserRole?: Role;
}

export const NotionStaffView: React.FC<NotionStaffViewProps> = ({
  staffList,
  onOpenCreateStaff,
  onEditStaff,
  onDeleteStaff,
  currentUserRole,
}) => {
  const canManage = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'DEPT_MANAGER';

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
        return <span className="notion-tag tag-purple" style={{ fontSize: '11px', fontWeight: 700 }}>SuperAdmin</span>;
      case 'GENERAL_MANAGER':
        return <span className="notion-tag tag-yellow" style={{ fontSize: '11px', fontWeight: 700 }}>General Manager</span>;
      case 'DEPT_MANAGER':
        return <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 700 }}>Dept Manager</span>;
      default:
        return <span className="notion-tag tag-gray" style={{ fontSize: '11px', fontWeight: 600 }}>Staff Member</span>;
    }
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>👥</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.025em' }}>
              Personnel &amp; Staff Directory
            </h1>
            <span className="notion-tag tag-blue" style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 9px' }}>
              {staffList.length} Members
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--notion-text-muted)', margin: '6px 0 0' }}>
            Active enterprise team directory with role-based access levels, departmental affiliations, and contact information.
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
            {staffList.map((user) => (
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
                <td style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono', fontSize: '12px', color: 'var(--notion-text-muted)' }}>
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
                      background: (user.allowed_pages?.length ?? 0) > 0 ? 'rgba(79, 70, 229, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      color: (user.allowed_pages?.length ?? 0) > 0 ? '#4f46e5' : '#ef4444',
                      border: (user.allowed_pages?.length ?? 0) > 0 ? '1px solid rgba(79, 70, 229, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
