import React, { useState, useEffect } from 'react';
import { User, Department, Role } from '../types';
import { api } from '../services/api';
import {
  X, UserPlus, Edit2, AlertCircle, CheckCircle2, Shield, Eye, EyeOff,
  CheckSquare, Table, List, Calendar, Lock, Flame, ShieldCheck, Building,
  Users, BarChart3, Settings, Check
} from 'lucide-react';
import { ALL_APP_PAGES, getDefaultAllowedPagesForRole, ViewType } from '../utils/pagePermissions';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  departments: Department[];
  currentUserRole?: Role;
  currentUserDeptId?: number | null;
  editingUser?: User | null;
}

const renderPageIcon = (iconName: string) => {
  switch (iconName) {
    case 'CheckSquare': return <CheckSquare size={15} style={{ color: '#4f46e5' }} />;
    case 'Table': return <Table size={15} style={{ color: '#10b981' }} />;
    case 'List': return <List size={15} style={{ color: '#0ea5e9' }} />;
    case 'Calendar': return <Calendar size={15} style={{ color: '#f59e0b' }} />;
    case 'Lock': return <Lock size={15} style={{ color: '#8b5cf6' }} />;
    case 'Flame': return <Flame size={15} style={{ color: '#ef4444' }} />;
    case 'ShieldCheck': return <ShieldCheck size={15} style={{ color: '#f59e0b' }} />;
    case 'Building': return <Building size={15} style={{ color: '#10b981' }} />;
    case 'Users': return <Users size={15} style={{ color: '#0ea5e9' }} />;
    case 'BarChart3': return <BarChart3 size={15} style={{ color: '#8b5cf6' }} />;
    case 'Settings': return <Settings size={15} style={{ color: '#ec4899' }} />;
    default: return <Eye size={15} />;
  }
};

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
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    job_title: '',
    phone: '',
    role: 'STAFF' as Role,
    department: '',
    password: '',
  });

  const [allowedPages, setAllowedPages] = useState<ViewType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize form data whenever the modal opens or the editing target changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        first_name: editingUser.first_name || '',
        last_name: editingUser.last_name || '',
        username: editingUser.username || '',
        email: editingUser.email || '',
        job_title: editingUser.job_title || '',
        phone: editingUser.phone || '',
        role: editingUser.role || 'STAFF',
        department: editingUser.department != null ? String(editingUser.department) : (isDeptManager && currentUserDeptId != null ? String(currentUserDeptId) : ''),
        password: '',
      });
      const existingPages = Array.isArray(editingUser.allowed_pages) && editingUser.allowed_pages.length > 0
        ? (editingUser.allowed_pages as ViewType[])
        : getDefaultAllowedPagesForRole(editingUser.role);
      setAllowedPages(existingPages);
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        job_title: '',
        phone: '',
        role: 'STAFF',
        department: isDeptManager && currentUserDeptId != null ? String(currentUserDeptId) : (departments[0]?.id != null ? String(departments[0].id) : ''),
        password: '',
      });
      setAllowedPages(getDefaultAllowedPagesForRole('STAFF'));
    }
    setError(null);
    setSuccessMsg(null);
  }, [editingUser, isOpen, isDeptManager, currentUserDeptId, departments]);

  const togglePagePermission = (pageKey: ViewType) => {
    setAllowedPages((prev) =>
      prev.includes(pageKey) ? prev.filter((p) => p !== pageKey) : [...prev, pageKey]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (editingUser) {
        // Prepare update payload
        const payload: Record<string, any> = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          job_title: formData.job_title.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          department: formData.department ? Number(formData.department) : null,
          allowed_pages: allowedPages,
        };

        // If a new password is provided, include it in update
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        await api.updateUser(editingUser.id, payload);
      } else {
        // Prepare create payload
        const payload: Record<string, any> = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          job_title: formData.job_title.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          department: formData.department ? Number(formData.department) : null,
          password: formData.password.trim() || 'staff123',
          allowed_pages: allowedPages,
        };

        await api.createUser(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save staff member. Please check input values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '88vh', borderRadius: '18px' }}>
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
              background: editingUser
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.2))'
                : 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: editingUser ? '#2563eb' : '#9333ea',
            }}>
              {editingUser ? <Edit2 size={17} /> : <UserPlus size={17} />}
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

            {successMsg && (
              <div className="notion-callout notion-callout-success" style={{ marginBottom: '16px', borderRadius: '10px' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  First Name <span style={{ color: '#ef4444' }}>*</span>
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
                  Last Name <span style={{ color: '#ef4444' }}>*</span>
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
                  Username {editingUser && <span style={{ fontWeight: 400, color: 'var(--notion-text-muted)', fontSize: '11px' }}>(Permanent)</span>}
                  {!editingUser && <span style={{ color: '#ef4444' }}> *</span>}
                </label>
                <input
                  type="text"
                  required={!editingUser}
                  disabled={Boolean(editingUser)}
                  className="notion-input"
                  placeholder="e.g. jdoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{
                    fontSize: '13px',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    opacity: editingUser ? 0.75 : 1,
                    cursor: editingUser ? 'not-allowed' : 'text',
                    backgroundColor: editingUser ? 'var(--notion-hover)' : 'transparent',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Work Email <span style={{ color: '#ef4444' }}>*</span>
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

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                {editingUser ? 'Reset Password (Optional)' : 'Initial Password (Optional, default: staff123)'}
              </label>
              <input
                type="password"
                className="notion-input"
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Default: staff123'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ fontSize: '13px', borderRadius: '8px' }}
              />
              {editingUser && (
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '4px' }}>
                  Leave this field empty unless you want to update this staff member's password.
                </div>
              )}
            </div>

            {/* Page View Permissions (Page Access Control) */}
            <div
              style={{
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid var(--notion-border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                      Page View &amp; Access Control
                    </span>
                    <span
                      className="notion-tag tag-blue"
                      style={{ fontSize: '10.5px', fontWeight: 700, padding: '1px 8px' }}
                    >
                      {allowedPages.length} of {ALL_APP_PAGES.length} Allowed
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '3px' }}>
                    Click any page to toggle between <strong>View Allowed</strong> and <strong>No View (Hidden)</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setAllowedPages(ALL_APP_PAGES.map((p) => p.key))}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}
                  >
                    Allow All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowedPages(getDefaultAllowedPagesForRole(formData.role))}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}
                  >
                    Role Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowedPages([])}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600, color: '#ef4444' }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Grid of Pages */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '8px',
                  marginTop: '12px',
                }}
              >
                {ALL_APP_PAGES.map((page) => {
                  const isAllowed = allowedPages.includes(page.key);
                  return (
                    <div
                      key={page.key}
                      onClick={() => togglePagePermission(page.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isAllowed ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--notion-border)',
                        background: isAllowed ? 'var(--notion-item-bg)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = isAllowed ? '#10b981' : 'var(--notion-text-muted)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isAllowed ? 'rgba(16, 185, 129, 0.45)' : 'var(--notion-border)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            background: isAllowed ? 'rgba(16, 185, 129, 0.12)' : 'var(--notion-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {renderPageIcon(page.iconName)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12.5px',
                              fontWeight: isAllowed ? 700 : 500,
                              color: isAllowed ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {page.label}
                          </div>
                          <div
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--notion-text-dim)',
                              fontFamily: 'JetBrains Mono',
                            }}
                          >
                            {page.route}
                          </div>
                        </div>
                      </div>

                      {/* Interactive View / No View Pill */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePagePermission(page.key);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isAllowed ? '1px solid #a7f3d0' : '1px solid #fecaca',
                          background: isAllowed ? '#ecfdf5' : '#fef2f2',
                          color: isAllowed ? '#059669' : '#dc2626',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {isAllowed ? (
                          <>
                            <Eye size={12} />
                            <span>View</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>No View</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
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
