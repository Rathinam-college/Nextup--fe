import React, { useState } from 'react';
import { User, Department, Role } from '../types';
import { api } from '../services/api';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  departments: Department[];
  currentUserRole?: Role;
  currentUserDeptId?: number | null;
  editingUser?: User | null;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  departments,
  currentUserRole,
  currentUserDeptId,
  editingUser,
}) => {
  const isDeptManager = currentUserRole === 'DEPT_MANAGER';

  const [formData, setFormData] = useState({
    first_name: editingUser?.first_name || '',
    last_name: editingUser?.last_name || '',
    username: editingUser?.username || '',
    email: editingUser?.email || '',
    job_title: editingUser?.job_title || '',
    phone: editingUser?.phone || '',
    role: editingUser?.role || 'STAFF',
    department: editingUser?.department || (isDeptManager ? currentUserDeptId || '' : (departments[0]?.id || '')),
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        department: Number(formData.department) || null,
      };

      if (!payload.password && !editingUser) {
        payload.password = 'staff123';
      }

      if (editingUser) {
        if (!payload.password) delete payload.password;
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', borderRadius: '18px' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9333ea',
            }}>
              <UserPlus size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                {editingUser ? `Edit Staff Member: ${editingUser.full_name || editingUser.username}` : 'Add New Staff Member'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                User profile, enterprise role, and department allocation
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="notion-btn"
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--notion-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div className="notion-callout notion-callout-danger" style={{ marginBottom: '16px', borderRadius: '10px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  className="notion-input"
                  placeholder="e.g. John"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  className="notion-input"
                  placeholder="e.g. Doe"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingUser)}
                  className="notion-input"
                  placeholder="e.g. jdoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px', fontFamily: 'JetBrains Mono' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  className="notion-input"
                  placeholder="jdoe@enterprise.corp"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Job Title
                </label>
                <input
                  type="text"
                  className="notion-input"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="text"
                  className="notion-input"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Department
                </label>
                <select
                  className="notion-select"
                  disabled={isDeptManager}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                >
                  {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'GENERAL_MANAGER') && (
                    <option value="">Global / None (Company-Wide)</option>
                  )}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Role
                </label>
                <select
                  className="notion-select"
                  disabled={isDeptManager}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                >
                  <option value="STAFF">Staff Member</option>
                  {!isDeptManager && <option value="DEPT_MANAGER">Department Manager</option>}
                  {!isDeptManager && <option value="GENERAL_MANAGER">General Manager</option>}
                  {currentUserRole === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                </select>
              </div>
            </div>

            {!editingUser && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Initial Password (Optional, default: staff123)
                </label>
                <input
                  type="password"
                  className="notion-input"
                  placeholder="Default: staff123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ fontSize: '13px', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--notion-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--notion-hover)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="notion-btn notion-btn-bordered"
              disabled={loading}
              style={{ borderRadius: '8px', padding: '7px 16px', fontSize: '12.5px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="notion-btn notion-btn-primary"
              disabled={loading}
              style={{
                borderRadius: '8px',
                padding: '7px 18px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              {loading ? 'Saving...' : editingUser ? 'Update Staff Member' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
