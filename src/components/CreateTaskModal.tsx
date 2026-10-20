import React, { useState, useEffect } from 'react';
import { Department, User, Role, Priority } from '../types';
import { api } from '../services/api';
import { X, Plus, AlertCircle, Calendar, Clock, Mail, ShieldAlert, CheckCircle2, UserCheck, Wrench, AlertTriangle, Camera } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  departments: Department[];
  currentUserRole?: Role;
  currentUserDeptId?: number | null;
  currentUserId?: number | null;
  initialDeptId?: number | null;
  initialIsIssue?: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  departments,
  currentUserRole,
  currentUserDeptId,
  currentUserId,
  initialDeptId,
  initialIsIssue = false,
}) => {
  const isDeptManager = currentUserRole === 'DEPT_MANAGER';
  const isStaff = currentUserRole === 'STAFF';
  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';
  const isRestrictedDept = isDeptManager || isStaff;

  const [itemType, setItemType] = useState<'TASK' | 'ISSUE'>(initialIsIssue ? 'ISSUE' : 'TASK');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    assigned_to: '',
    priority: 'MEDIUM' as Priority,
    due_date: '',
  });

  const [attachmentImage, setAttachmentImage] = useState<string>('');
  const [departmentStaff, setDepartmentStaff] = useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const selectedStaff = departmentStaff.find((s) => s.id === Number(formData.assigned_to));

  // Determine active department object
  const activeDept = departments.find((d) => String(d.id) === String(formData.department)) ||
    (isRestrictedDept && currentUserDeptId ? departments.find((d) => d.id === currentUserDeptId) : departments[0]);

  // Initialize form whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessNotice(null);
      setAttachmentImage('');

      const targetType = initialIsIssue ? 'ISSUE' : 'TASK';
      setItemType(targetType);

      // Target department priority:
      // 1. If staff or dept manager: their assigned department
      // 2. If initialDeptId passed from card/drilldown: use initialDeptId
      // 3. Otherwise: first available department
      let targetDeptId: string | number = '';
      if (isRestrictedDept && currentUserDeptId) {
        targetDeptId = currentUserDeptId;
      } else if (initialDeptId) {
        targetDeptId = initialDeptId;
      } else if (departments.length > 0) {
        targetDeptId = departments[0].id;
      }

      setFormData({
        title: targetType === 'ISSUE' ? '[ISSUE] ' : '',
        description: '',
        department: String(targetDeptId),
        assigned_to: '',
        priority: targetType === 'ISSUE' ? 'HIGH' : 'MEDIUM',
        due_date: '',
      });

      if (targetDeptId) {
        loadDepartmentStaff(Number(targetDeptId));
      }
    }
  }, [isOpen, departments, currentUserRole, currentUserDeptId, initialDeptId, initialIsIssue]);

  // Load staff for specific department
  const loadDepartmentStaff = async (deptId: number) => {
    setLoadingStaff(true);
    try {
      const users = await api.getUsers({ department: deptId });
      const activeUsers = users.filter((u) => u.is_active !== false);
      setDepartmentStaff(activeUsers);
    } catch (err) {
      console.error('Failed to load department staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Switch type mode
  const handleTypeChange = (type: 'TASK' | 'ISSUE') => {
    setItemType(type);
    if (type === 'ISSUE') {
      if (!formData.title.startsWith('[ISSUE]')) {
        setFormData((prev) => ({
          ...prev,
          title: prev.title.trim() ? `[ISSUE] ${prev.title}` : '[ISSUE] ',
          priority: prev.priority === 'LOW' || prev.priority === 'MEDIUM' ? 'HIGH' : prev.priority,
        }));
      }
    } else {
      // Standard Task
      setFormData((prev) => ({
        ...prev,
        title: prev.title.replace(/^\[ISSUE\]\s*/i, ''),
      }));
    }
  };

  // Handle department change in dropdown
  const handleDepartmentChange = (deptIdStr: string) => {
    setFormData((prev) => ({ ...prev, department: deptIdStr, assigned_to: '' }));
    if (deptIdStr) {
      loadDepartmentStaff(Number(deptIdStr));
    } else {
      setDepartmentStaff([]);
    }
  };

  if (!isOpen) return null;

  const setQuickDeadline = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const isoDate = d.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, due_date: isoDate }));
  };

  const getTimelineSummary = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, tagClass: 'tag-red' };
    if (diffDays === 0) return { label: 'Due Today', tagClass: 'tag-yellow' };
    if (diffDays === 1) return { label: 'Due Tomorrow', tagClass: 'tag-orange' };
    return { label: `${diffDays} days remaining`, tagClass: 'tag-blue' };
  };

  const timelineSummary = getTimelineSummary(formData.due_date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isGM) {
      setError("Permission denied: Only General Manager and Super Admin are permitted to create tasks.");
      return;
    }

    setLoading(true);

    try {
      let finalTitle = formData.title.trim();
      if (itemType === 'ISSUE' && !finalTitle.toUpperCase().startsWith('[ISSUE]')) {
        finalTitle = `[ISSUE] ${finalTitle}`;
      }

      const payload: any = {
        title: finalTitle,
        description: formData.description,
        department: Number(formData.department),
        priority: formData.priority,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        due_date: formData.due_date || null,
        attachment_image: attachmentImage || '',
      };

      await api.createTask(payload);

      if (itemType === 'ISSUE') {
        setSuccessNotice(`🚨 Department Issue logged successfully! Manager and staff in ${activeDept?.name || 'department'} have been alerted.`);
      } else if (selectedStaff) {
        setSuccessNotice(`✅ Task created! Assignment email dispatched to ${selectedStaff.full_name} (${selectedStaff.email}).`);
      } else {
        setSuccessNotice(`✅ Task created in department queue!`);
      }

      setTimeout(() => {
        onCreated();
        onClose();
        setSuccessNotice(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create department item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', borderRadius: '18px' }}>
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
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: itemType === 'ISSUE'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(225, 29, 72, 0.2))'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              {itemType === 'ISSUE' ? '🚨' : '📋'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {itemType === 'ISSUE'
                    ? 'Report Department Issue / Incident'
                    : 'Create New Task / Deliverable'}
                </span>
                {activeDept && (
                  <span
                    className="notion-tag tag-purple"
                    style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', padding: '1px 8px', borderRadius: '6px', fontWeight: 700 }}
                  >
                    {activeDept.code}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                {itemType === 'ISSUE'
                  ? 'Urgent operational incident tracking & alert routing'
                  : 'Assign institutional deliverables with deadline milestones'}
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

        {/* Item Type Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--notion-border-subtle)',
            background: 'var(--notion-hover)',
            padding: '6px 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleTypeChange('TASK')}
            className="notion-btn"
            style={{
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: itemType === 'TASK' ? 'var(--notion-card)' : 'transparent',
              fontWeight: itemType === 'TASK' ? 700 : 500,
              color: itemType === 'TASK' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
              border: itemType === 'TASK' ? '1px solid var(--notion-border)' : '1px solid transparent',
              boxShadow: itemType === 'TASK' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              gap: '6px',
            }}
          >
            <span>📋</span>
            <span>Deliverable Task</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('ISSUE')}
            className="notion-btn"
            style={{
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: itemType === 'ISSUE' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
              fontWeight: itemType === 'ISSUE' ? 700 : 500,
              color: itemType === 'ISSUE' ? '#ef4444' : 'var(--notion-text-dim)',
              border: itemType === 'ISSUE' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
              boxShadow: itemType === 'ISSUE' ? '0 1px 4px rgba(239, 68, 68, 0.1)' : 'none',
              gap: '6px',
            }}
          >
            <span>🚨</span>
            <span>Report Incident / Issue</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
            {successNotice && (
              <div
                className="notion-callout"
                style={{
                  marginBottom: '16px',
                  background: 'rgba(15, 123, 108, 0.15)',
                  border: '1px solid #0f7b6c',
                  color: '#0f7b6c',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <span>{successNotice}</span>
              </div>
            )}
            {error && (
              <div className="notion-callout notion-callout-danger" style={{ marginBottom: '16px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Department Isolation Banner for Staff */}
            {isStaff && activeDept && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(15, 123, 108, 0.08)',
                  border: '1px solid rgba(15, 123, 108, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--notion-text)',
                }}
              >
                <UserCheck size={14} style={{ color: '#0f7b6c', flexShrink: 0 }} />
                <span>
                  Reporting for <strong>{activeDept.name}</strong> ({activeDept.code}). Automatically routed to your department team.
                </span>
              </div>
            )}

            {/* Issue Notice Banner */}
            {itemType === 'ISSUE' && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#e11d48',
                }}
              >
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Department Issue Ticket:</strong> Submitting will record this incident in the department queue and notify the Department Manager and GM.
                </span>
              </div>
            )}

            {/* Title Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '5px' }}>
                {itemType === 'ISSUE' ? 'Issue Summary / Problem Title' : 'Task Title'}
              </label>
              <input
                type="text"
                required
                autoFocus
                className="notion-input"
                placeholder={
                  itemType === 'ISSUE'
                    ? '[ISSUE] e.g. Network switch failure in CCTV rack / Fiber packet loss'
                    : 'Untitled Task...'
                }
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
            </div>

            {/* Description Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '5px' }}>
                {itemType === 'ISSUE' ? 'Issue Details & Steps to Reproduce' : 'Description & Deliverables'}
              </label>
              <textarea
                className="notion-textarea"
                placeholder={
                  itemType === 'ISSUE'
                    ? 'Describe what happened, error codes observed, affected systems, and operational impact...'
                    : 'Write task specifications and deliverables...'
                }
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Department and Assignee Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '5px' }}>
                  Department {isRestrictedDept && <span style={{ color: 'var(--notion-text-dim)', fontSize: '11px' }}>(Locked)</span>}
                </label>
                <select
                  className="notion-select"
                  disabled={isRestrictedDept}
                  value={formData.department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                    Assignee
                  </label>
                  {isStaff && currentUserId && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assigned_to: String(currentUserId) })}
                      className="notion-btn"
                      style={{ fontSize: '11px', padding: '1px 6px', color: '#2383e2' }}
                    >
                      Assign to me
                    </button>
                  )}
                </div>
                <select
                  className="notion-select"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">
                    {itemType === 'ISSUE'
                      ? '— Unassigned (Department Queue for Manager Review) —'
                      : '— Unassigned (Department Backlog) —'}
                  </option>
                  {departmentStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.username} ({s.role === 'DEPT_MANAGER' ? 'Manager' : s.job_title || 'Staff'}) {s.id === currentUserId ? '★ You' : ''} {s.email ? `— ${s.email}` : ''}
                    </option>
                  ))}
                </select>
                {loadingStaff && (
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '4px' }}>
                    Loading departmental staff...
                  </div>
                )}
                {!loadingStaff && departmentStaff.length === 0 && formData.department && (
                  <div style={{ fontSize: '11px', color: 'var(--tag-orange-text)', marginTop: '4px' }}>
                    ⚠️ No staff members assigned to this department yet.
                  </div>
                )}
                {selectedStaff && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      borderRadius: '5px',
                      background: 'rgba(35, 131, 226, 0.08)',
                      border: '1px solid rgba(35, 131, 226, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--notion-text)',
                    }}
                  >
                    <Mail size={14} style={{ color: '#2383e2', flexShrink: 0 }} />
                    <div>
                      <div>
                        Assigned to: <strong>{selectedStaff.full_name || selectedStaff.username}</strong> ({selectedStaff.role === 'DEPT_MANAGER' ? 'Manager' : selectedStaff.job_title || 'Staff'})
                      </div>
                      <div style={{ color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                        Assignment email will be dispatched to: <strong style={{ color: '#2383e2' }}>{selectedStaff.email || 'No email registered'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Priority & Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '5px' }}>
                  Priority
                </label>
                <select
                  className="notion-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High (Important)</option>
                  <option value="URGENT">Urgent (Immediate Attention)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                    Timeline / Due Date
                  </label>
                  {timelineSummary && (
                    <span className={`notion-tag ${timelineSummary.tagClass}`} style={{ fontSize: '11px', padding: '1px 6px' }}>
                      {timelineSummary.label}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  className="notion-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
                {/* Quick Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(0)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '2px 6px', lineHeight: 1.2 }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(1)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '2px 6px', lineHeight: 1.2 }}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(3)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '2px 6px', lineHeight: 1.2 }}
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(7)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '2px 6px', lineHeight: 1.2 }}
                  >
                    +1 Week
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Image Attachment */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>
                    📸 Attachment Image
                  </label>
                  <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 500 }}>
                    Optional (Not Required)
                  </span>
                </div>
                {attachmentImage && (
                  <button
                    type="button"
                    onClick={() => setAttachmentImage('')}
                    className="notion-btn notion-btn-ghost"
                    style={{ fontSize: '11px', color: '#ef4444', padding: '1px 6px' }}
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {attachmentImage ? (
                <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--notion-border)', maxHeight: '180px', background: 'rgba(0,0,0,0.1)' }}>
                  <img
                    src={attachmentImage}
                    alt="Attachment preview"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <label
                  className="notion-btn notion-btn-bordered"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    width: '100%',
                    color: 'var(--notion-text-muted)',
                  }}
                >
                  <Camera size={14} />
                  <span style={{ fontSize: '12px' }}>Choose or drag image file (Optional — skip anytime)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new window.Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxDim = 1200;
                            let width = img.width;
                            let height = img.height;
                            if (width > maxDim || height > maxDim) {
                              if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                              } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height);
                              setAttachmentImage(canvas.toDataURL('image/jpeg', 0.7));
                            } else {
                              setAttachmentImage(event.target?.result as string);
                            }
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                ℹ️ Images are 100% optional. You can create tickets without attaching an image.
              </div>
            </div>

            {/* Email Notification Callout */}
            <div
              className="notion-callout"
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12px',
                lineHeight: 1.5,
                background: itemType === 'ISSUE' ? 'rgba(225, 29, 72, 0.08)' : selectedStaff ? 'rgba(35, 131, 226, 0.12)' : 'rgba(35, 131, 226, 0.08)',
                border: itemType === 'ISSUE' ? '1px solid rgba(225, 29, 72, 0.25)' : selectedStaff ? '1px solid rgba(35, 131, 226, 0.35)' : '1px solid rgba(35, 131, 226, 0.25)',
                borderRadius: '6px',
                padding: '10px 14px',
              }}
            >
              <Mail size={16} style={{ color: itemType === 'ISSUE' ? '#e11d48' : '#2383e2', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--notion-text)', display: 'block', marginBottom: '2px' }}>
                  {itemType === 'ISSUE'
                    ? '🚨 Automated Department Issue Alerts'
                    : selectedStaff
                    ? `✉️ Direct Email Dispatch to ${selectedStaff.full_name}`
                    : 'Automated Timeline Mail Dispatch'}
                </strong>
                <span style={{ color: 'var(--notion-text-muted)' }}>
                  {itemType === 'ISSUE' ? (
                    'When submitted, an incident alert email with priority details will be dispatched immediately to the Department Manager and General Manager.'
                  ) : selectedStaff ? (
                    <>
                      When created, an email with task specifications and timeline will be sent to{' '}
                      <strong style={{ color: '#2383e2' }}>{selectedStaff.email}</strong>.
                    </>
                  ) : (
                    'When assigned to a staff member, an automated assignment notice email with deliverables and timeline milestone countdown will be dispatched.'
                  )}
                </span>
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
              disabled={loading || !isGM}
              title={!isGM ? "Only General Manager and Super Admin can create tasks" : undefined}
              style={{
                borderRadius: '8px',
                padding: '7px 20px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: itemType === 'ISSUE'
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: itemType === 'ISSUE'
                  ? '0 4px 14px rgba(239, 68, 68, 0.3)'
                  : '0 4px 14px rgba(37, 99, 235, 0.3)',
                color: '#ffffff',
                border: 'none',
              }}
            >
              {loading
                ? 'Submitting...'
                : itemType === 'ISSUE'
                ? '🚨 Report Department Issue'
                : 'Create & Assign Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
