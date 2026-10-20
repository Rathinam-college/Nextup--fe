import React from 'react';
import { User, Role } from '../types';
import { Plus, Trash2, Edit2, Users, Mail, Shield, Building2 } from 'lucide-react';

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
                <td style={{ padding: '14px 18px', color: 'var(--notion-text-muted)', fontSize: '12.5px' }}>
                  {user.job_title || 'Staff Member'}
                </td>
                <td style={{ padding: '14px 18px', color: 'var(--notion-text-dim)', fontSize: '12.5px' }}>
                  {user.email || '—'}
                </td>
                {canManage && (
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {user.role === 'STAFF' && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onEditStaff(user)}
                          className="notion-btn notion-btn-bordered"
                          style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteStaff(user)}
                          className="notion-btn notion-btn-danger"
                          style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                        >
                          <Trash2 size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
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
