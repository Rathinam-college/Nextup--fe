import React, { useState, useEffect } from 'react';
import { Task, Role, User, Department, Priority } from '../types';
import { api } from '../services/api';
import {
  X,
  Calendar,
  User as UserIcon,
  Building,
  CheckCircle,
  CheckCircle2,
  RotateCcw,
  Send,
  Play,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Mail,
  Clock,
  Image as ImageIcon,
  Upload,
  Trash2,
  Maximize2,
  Camera,
  Edit,
  Save,
} from 'lucide-react';

interface NotionTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  currentUserRole?: Role;
  departments?: Department[];
}

export const NotionTaskModal: React.FC<NotionTaskModalProps> = ({
  task,
  onClose,
  onTaskUpdated,
  currentUserRole,
  departments = [],
}) => {
  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  // Task Editing & Deletion State (GM & Super Admin only)
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number>(0);
  const [editAssignedTo, setEditAssignedTo] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingAssignmentEmail, setSendingAssignmentEmail] = useState(false);
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState<string | null>(null);

  // Department staff for assignment & reassignment
  const [departmentStaff, setDepartmentStaff] = useState<User[]>([]);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [assigneeSuccessNotice, setAssigneeSuccessNotice] = useState<string | null>(null);

  // Push Message to Assigned Staff state
  const [isPushMessageOpen, setIsPushMessageOpen] = useState(false);
  const [pushMessageText, setPushMessageText] = useState('');
  const [pushIsUrgent, setPushIsUrgent] = useState(false);
  const [pushSendEmail, setPushSendEmail] = useState(true);
  const [pushSendInApp, setPushSendInApp] = useState(true);
  const [sendingPushMessage, setSendingPushMessage] = useState(false);
  const [pushMessageSuccess, setPushMessageSuccess] = useState<string | null>(null);
  const [pushMessageError, setPushMessageError] = useState<string | null>(null);

  // Optional image attachment state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSuccessNotice, setImageSuccessNotice] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Sync edit form state when task loads
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditPriority(task.priority);
      setEditDueDate(task.due_date || '');
      setEditDepartmentId(task.department);
      setEditAssignedTo(task.assigned_to);
      setIsEditingTask(false);
    }
  }, [task?.id]);

  // Load department staff whenever modal opens or department changes
  useEffect(() => {
    const targetDeptId = isEditingTask && editDepartmentId ? editDepartmentId : task?.department;
    if (targetDeptId) {
      api.getUsers({ department: targetDeptId })
        .then((users) => {
          const activeUsers = users.filter((u) => u.is_active !== false);
          setDepartmentStaff(activeUsers.length > 0 ? activeUsers : users);
        })
        .catch(console.error);
    }
    setIsEditingAssignee(false);
    setAssigneeSuccessNotice(null);
  }, [task?.id, task?.department, editDepartmentId, isEditingTask]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!isGM) {
      setError("Permission denied: Only General Manager and Super Admin are permitted to edit tasks.");
      return;
    }
    if (!editTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);
      await api.updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
        department: Number(editDepartmentId),
        assigned_to: editAssignedTo ? Number(editAssignedTo) : null,
      });
      setIsEditingTask(false);
      onTaskUpdated();
    } catch (err: any) {
      setError(`Failed to update task: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!isGM) {
      setError("Permission denied: Only General Manager and Super Admin are permitted to delete tasks.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete task "${task.title}" (ID: #${task.id})? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingTask(true);
      setError(null);
      await api.deleteTask(task.id);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(`Failed to delete task: ${err.message}`);
      setDeletingTask(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = async () => {
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
        const finalBase64 = ctx ? canvas.toDataURL('image/jpeg', 0.7) : (reader.result as string);

        try {
          setUploadingImage(true);
          setError(null);
          await api.attachImage(task.id, finalBase64);
          setImageSuccessNotice('✅ Optional image attached successfully!');
          onTaskUpdated();
          setTimeout(() => setImageSuccessNotice(null), 3500);
        } catch (err: any) {
          setError(err.message || 'Failed to attach image');
        } finally {
          setUploadingImage(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    if (!task) return;
    try {
      setUploadingImage(true);
      setError(null);
      await api.attachImage(task.id, '');
      setImageSuccessNotice('Image removed from ticket.');
      onTaskUpdated();
      setTimeout(() => setImageSuccessNotice(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!task) return null;

  const canManageAssignment = isGM;

  const handleReassignStaff = async (newUserIdStr: string) => {
    if (!task) return;
    try {
      setUpdatingAssignee(true);
      setError(null);
      const newUserId = newUserIdStr ? Number(newUserIdStr) : null;
      await api.updateTask(task.id, { assigned_to: newUserId });
      const targetUser = departmentStaff.find((u) => u.id === newUserId);
      setAssigneeSuccessNotice(
        targetUser
          ? `Staff assigned: ${targetUser.full_name || targetUser.username}. Email sent!`
          : 'Task marked as Unassigned.'
      );
      setIsEditingAssignee(false);
      onTaskUpdated();
      setTimeout(() => setAssigneeSuccessNotice(null), 3500);
    } catch (err: any) {
      setError(`Failed to update assignee: ${err.message}`);
    } finally {
      setUpdatingAssignee(false);
    }
  };

  const handlePushMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !task.assigned_to) {
      setPushMessageError('Please assign a staff member to this task before pushing a message.');
      return;
    }
    if (!pushMessageText.trim()) {
      setPushMessageError('Message content cannot be empty.');
      return;
    }

    try {
      setSendingPushMessage(true);
      setPushMessageError(null);
      const res = await api.pushMessageToAssignee(task.id, {
        message: pushMessageText.trim(),
        send_email: pushSendEmail,
        send_in_app: pushSendInApp,
        is_urgent: pushIsUrgent,
      });

      setPushMessageSuccess(res.message || 'Direct message successfully pushed to staff!');
      setPushMessageText('');
      onTaskUpdated();
      setTimeout(() => {
        setIsPushMessageOpen(false);
        setPushMessageSuccess(null);
      }, 1800);
    } catch (err: any) {
      setPushMessageError(err.message || 'Failed to push message to staff.');
    } finally {
      setSendingPushMessage(false);
    }
  };

  const getTimelineInfo = (dueStr: string | null) => {
    if (!dueStr) return null;
    const target = new Date(dueStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: `🚨 Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
        colorClass: 'tag-red',
      };
    }
    if (diffDays === 0) {
      return {
        label: '⚠️ Due Today',
        colorClass: 'tag-yellow',
      };
    }
    if (diffDays === 1) {
      return {
        label: '⏰ Due Tomorrow',
        colorClass: 'tag-orange',
      };
    }
    return {
      label: `📅 ${diffDays} days remaining`,
      colorClass: 'tag-blue',
    };
  };

  const handleSendTimelineReminder = async () => {
    if (!task) return;
    try {
      setSendingReminder(true);
      setError(null);
      const res = await api.sendTaskTimelineReminder(task.id);
      setReminderSuccessMessage(res.message);
      setTimeout(() => setReminderSuccessMessage(null), 5000);
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch timeline reminder email.');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleSendAssignmentEmail = async () => {
    if (!task || !task.assigned_to) return;
    try {
      setSendingAssignmentEmail(true);
      setError(null);
      const res = await api.sendTaskAssignmentEmail(task.id);
      setReminderSuccessMessage(res.message);
      setTimeout(() => setReminderSuccessMessage(null), 5000);
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch task assignment email.');
    } finally {
      setSendingAssignmentEmail(false);
    }
  };


  const handleStartWork = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.startWork(task.id);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.submitForApproval(task.id);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGmReview = async (action: 'APPROVE' | 'REQUEST_CHANGES') => {
    if (action === 'REQUEST_CHANGES' && !gmNotes.trim()) {
      setError('Please provide feedback notes explaining what revisions are required.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.gmReview(task.id, action, gmNotes);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await api.addComment(task.id, commentText);
      setCommentText('');
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'TODO':
        return <span className="notion-tag tag-gray">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="notion-tag tag-blue">In Progress</span>;
      case 'PENDING_GM_APPROVAL':
        return <span className="notion-tag tag-yellow">Pending GM Review</span>;
      case 'CHANGES_REQUESTED':
        return <span className="notion-tag tag-red">Changes Requested</span>;
      case 'CLOSED':
        return <span className="notion-tag tag-green">Closed & Verified</span>;
      default:
        return <span className="notion-tag tag-gray">{status}</span>;
    }
  };

  const getPriorityTag = (p: string) => {
    switch (p) {
      case 'LOW':
        return <span className="notion-tag tag-gray">Low</span>;
      case 'MEDIUM':
        return <span className="notion-tag tag-blue">Medium</span>;
      case 'HIGH':
        return <span className="notion-tag tag-orange">High</span>;
      case 'URGENT':
        return <span className="notion-tag tag-red">Urgent</span>;
      default:
        return <span className="notion-tag tag-gray">{p}</span>;
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px', borderRadius: '20px' }}>
        {/* Top bar controls */}
        <div
          style={{
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--notion-text-dim)' }}>
            <span style={{ fontWeight: 700, color: 'var(--notion-text)', fontFamily: 'JetBrains Mono' }}>#{task.id}</span>
            <span>/</span>
            <span style={{ fontWeight: 600 }}>{task.department_name}</span>
            {isGM && (
              <span className="notion-tag tag-purple" style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                Executive GM Access
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isGM && !isEditingTask && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditingTask(true)}
                  className="notion-btn notion-btn-bordered"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    color: 'var(--notion-blue)',
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    background: 'rgba(37, 99, 235, 0.05)',
                  }}
                  title="Edit task details (GM & Super Admin only)"
                >
                  <Edit size={13} />
                  <span>Edit Task</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={deletingTask}
                  className="notion-btn notion-btn-bordered"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.05)',
                  }}
                  title="Permanently delete this task (GM & Super Admin only)"
                >
                  <Trash2 size={13} />
                  <span>{deletingTask ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="notion-btn"
              style={{ padding: '6px', borderRadius: '8px', color: 'var(--notion-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div className="notion-callout notion-callout-danger" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {reminderSuccessMessage && (
            <div
              className="notion-callout"
              style={{
                marginBottom: '16px',
                background: 'rgba(52, 199, 89, 0.12)',
                border: '1px solid rgba(52, 199, 89, 0.3)',
                color: 'var(--notion-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#34c759' }} />
              <span>{reminderSuccessMessage}</span>
            </div>
          )}

          {isEditingTask ? (
            <form
              onSubmit={handleSaveEdit}
              style={{
                background: 'var(--notion-card, #ffffff)',
                border: '1px solid var(--notion-accent, #2383e2)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit size={18} style={{ color: 'var(--notion-accent, #2383e2)' }} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--notion-text)', margin: 0 }}>
                    Edit Task #{task.id}
                  </h2>
                </div>
                <span className="notion-tag tag-purple" style={{ fontSize: '11px' }}>
                  GM & Super Admin Only
                </span>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  className="notion-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  placeholder="Enter task title..."
                  style={{ width: '100%', fontSize: '14px', fontWeight: 500 }}
                />
              </div>

              {/* Grid: Department, Assignee, Priority, Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    🏢 Department *
                  </label>
                  <select
                    className="notion-select"
                    value={editDepartmentId}
                    onChange={(e) => {
                      const newDeptId = Number(e.target.value);
                      setEditDepartmentId(newDeptId);
                      setEditAssignedTo(null);
                    }}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    👤 Assigned Staff
                  </label>
                  <select
                    className="notion-select"
                    value={editAssignedTo || ''}
                    onChange={(e) => setEditAssignedTo(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="">— Unassigned —</option>
                    {departmentStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username} ({s.role === 'DEPT_MANAGER' ? 'Manager' : s.job_title || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    ⚡ Priority
                  </label>
                  <select
                    className="notion-select"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    📅 Due Date
                  </label>
                  <input
                    type="date"
                    className="notion-input"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                  Description & Specifications
                </label>
                <textarea
                  className="notion-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  placeholder="Provide instructions, requirements, deliverables, or acceptance criteria..."
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(task.title);
                    setEditDescription(task.description || '');
                    setEditPriority(task.priority);
                    setEditDueDate(task.due_date || '');
                    setEditDepartmentId(task.department);
                    setEditAssignedTo(task.assigned_to);
                    setIsEditingTask(false);
                  }}
                  className="notion-btn notion-btn-ghost"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className="notion-btn notion-btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px' }}
                >
                  <Save size={14} />
                  <span>{savingEdit ? 'Saving Changes...' : 'Save Task Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Page Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px' }}>📄</span>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--notion-text)' }}>
                  {task.title}
                </h1>
              </div>

          {/* Properties Table (Notion Property List) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              rowGap: '10px',
              fontSize: '13px',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--notion-border-subtle)',
            }}
          >
            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔵</span> Status
            </div>
            <div>{getStatusTag(task.status)}</div>

            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡</span> Priority
            </div>
            <div>{getPriorityTag(task.priority)}</div>

            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👤</span> Assignee
            </div>
            <div>
              {isEditingAssignee ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="notion-select"
                    defaultValue={task.assigned_to || ''}
                    disabled={updatingAssignee}
                    onChange={(e) => handleReassignStaff(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    <option value="">— Unassign —</option>
                    {departmentStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username} ({s.role === 'DEPT_MANAGER' ? 'Manager' : s.job_title || 'Staff'}) {s.email ? `— ${s.email}` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsEditingAssignee(false)}
                    className="notion-btn notion-btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Cancel
                  </button>
                  {updatingAssignee && (
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>Saving...</span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {task.assigned_to ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#3373ba',
                          color: '#fff',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>
                        {task.assigned_to_name}
                      </span>
                    </div>
                  ) : (
                    <span className="notion-tag tag-yellow" style={{ fontSize: '11px' }}>
                      ⚠️ Unassigned
                    </span>
                  )}

                  {task.assigned_to_email && (
                    <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                      &lt;{task.assigned_to_email}&gt;
                    </span>
                  )}

                  {canManageAssignment && (
                    <button
                      type="button"
                      onClick={() => setIsEditingAssignee(true)}
                      className="notion-btn notion-btn-bordered"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        color: 'var(--notion-blue)',
                        borderColor: 'rgba(2, 132, 199, 0.3)',
                        background: 'rgba(2, 132, 199, 0.05)',
                      }}
                    >
                      {task.assigned_to ? 'Change / Reassign ▾' : '+ Assign Staff'}
                    </button>
                  )}

                  {task.assigned_to && (
                    <>
                      <button
                        type="button"
                        onClick={handleSendAssignmentEmail}
                        disabled={sendingAssignmentEmail}
                        className="notion-btn notion-btn-bordered"
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#2383e2',
                          borderColor: 'rgba(35, 131, 226, 0.4)',
                          background: 'rgba(35, 131, 226, 0.05)',
                        }}
                        title={`Send or re-send task details email directly to ${task.assigned_to_email || task.assigned_to_name}`}
                      >
                        <Mail size={12} />
                        <span>{sendingAssignmentEmail ? 'Sending...' : 'Send Task Email'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsPushMessageOpen(true);
                          setPushMessageError(null);
                          setPushMessageSuccess(null);
                        }}
                        className="notion-btn"
                        style={{
                          fontSize: '11px',
                          padding: '3px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#fff',
                          background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                          borderRadius: '4px',
                          fontWeight: 600,
                          border: 'none',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                          cursor: 'pointer',
                        }}
                        title={`Push custom direct message & notification to ${task.assigned_to_name}`}
                      >
                        <Send size={12} />
                        <span>Push Message to Staff</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {assigneeSuccessNotice && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--tag-green-text)', fontWeight: 500 }}>
                  ✅ {assigneeSuccessNotice}
                </div>
              )}
            </div>

            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏢</span> Department
            </div>
            <div>
              <span className="notion-tag tag-purple">
                {task.department_name} ({task.department_code})
              </span>
            </div>

            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📅</span> Due Date
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: task.due_date ? 'var(--notion-text)' : 'var(--notion-text-dim)' }}>
                {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'No deadline set'}
              </span>
              {task.due_date && (() => {
                const info = getTimelineInfo(task.due_date);
                return info ? <span className={`notion-tag ${info.colorClass}`}>{info.label}</span> : null;
              })()}
              {task.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={handleSendTimelineReminder}
                  disabled={sendingReminder}
                  className="notion-btn notion-btn-bordered"
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#2383e2',
                    borderColor: 'rgba(35, 131, 226, 0.4)',
                    cursor: sendingReminder ? 'not-allowed' : 'pointer',
                  }}
                  title="Send timeline status and milestone countdown email to assignee and manager"
                >
                  <Mail size={12} />
                  <span>{sendingReminder ? 'Sending Mail...' : 'Send Reminder Email'}</span>
                </button>
              )}
            </div>

            {task.verified_by_name && (
              <>
                <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span> Verified By
                </div>
                <div style={{ color: '#529e72', fontWeight: 500 }}>
                  {task.verified_by_name} ({task.closed_at ? new Date(task.closed_at).toLocaleDateString() : 'Signed off'})
                </div>
              </>
            )}

            <div style={{ color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={14} /> Attachment Image
            </div>
            <div>
              {task.attachment_image ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="notion-tag tag-green" style={{ fontSize: '11px' }}>
                    ✓ 1 Image Attached
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    View
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  None (Optional)
                </span>
              )}
            </div>
          </div>

          {/* GM Feedback Callout Box if present */}
          {task.gm_feedback_notes && (
            <div
              className={`notion-callout ${task.status === 'CLOSED' ? 'notion-callout-success' : 'notion-callout-warning'}`}
              style={{ marginBottom: '20px' }}
            >
              <Sparkles size={18} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                  {task.status === 'CLOSED' ? 'GM Verification Remarks' : 'GM Requested Changes & Revisions'}
                </div>
                <div>"{task.gm_feedback_notes}"</div>
              </div>
            </div>
          )}

          {/* GM Sign-Off Hub (If task is pending GM review) */}
          {isGM && task.status === 'PENDING_GM_APPROVAL' && (
            <div
              className="notion-callout notion-callout-warning"
              style={{ marginBottom: '24px', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <CheckCircle size={16} />
                <span>Executive GM Sign-Off & Verification</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                As General Manager, verify task completion before final closure. You may approve & close or request revisions.
              </p>

              <textarea
                className="notion-textarea"
                placeholder="Optional approval remarks or required change notes..."
                value={gmNotes}
                onChange={(e) => setGmNotes(e.target.value)}
                rows={2}
              />

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => handleGmReview('APPROVE')}
                  disabled={loading}
                  className="notion-btn notion-btn-success"
                  style={{ flex: 1, padding: '7px' }}
                >
                  <CheckCircle size={14} />
                  <span>Verify, Approve & Close</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGmReview('REQUEST_CHANGES')}
                  disabled={loading}
                  className="notion-btn notion-btn-danger"
                  style={{ flex: 1, padding: '7px' }}
                >
                  <RotateCcw size={14} />
                  <span>Request Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* Staff Workflow Actions */}
          {(!isGM || task.status !== 'PENDING_GM_APPROVAL') && task.status !== 'CLOSED' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {task.status === 'TODO' && (
                <button
                  type="button"
                  onClick={handleStartWork}
                  disabled={loading}
                  className="notion-btn notion-btn-primary"
                  style={{ padding: '7px 14px' }}
                >
                  <Play size={14} />
                  <span>Start Work (Move to In Progress)</span>
                </button>
              )}

              {(task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED') && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={loading}
                  className="notion-btn notion-btn-bordered"
                  style={{ padding: '7px 14px', color: '#e07d10', borderColor: 'rgba(217, 115, 13, 0.4)' }}
                >
                  <CheckCircle size={14} />
                  <span>Submit for GM Verification</span>
                </button>
              )}
            </div>
          )}

          {/* Task Description / Deliverables */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Description & Specifications
            </h3>
            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--notion-text)',
                whiteSpace: 'pre-wrap',
                background: 'var(--notion-item-bg)',
                padding: '12px 14px',
                borderRadius: '4px',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              {task.description || 'No description provided.'}
            </div>
          </div>
            </>
          )}

          {/* Work Progress & Deliverable Image Section */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '8px',
              background: task.attachment_image ? 'var(--notion-card)' : task.status === 'IN_PROGRESS' ? 'rgba(35, 131, 226, 0.05)' : 'var(--notion-item-bg)',
              border: task.attachment_image ? '1px solid rgba(35, 131, 226, 0.35)' : task.status === 'IN_PROGRESS' ? '1px solid rgba(35, 131, 226, 0.3)' : '1px solid var(--notion-border-subtle)',
              boxShadow: task.attachment_image ? '0 1px 4px rgba(0, 0, 0, 0.06)' : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} style={{ color: task.attachment_image ? '#2383e2' : task.status === 'IN_PROGRESS' ? '#2383e2' : 'var(--notion-text-dim)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                  {task.attachment_image ? 'Task Attached Image' : task.status === 'IN_PROGRESS'
                    ? 'In Progress Work Attachment / Proof Image (Optional)'
                    : 'Ticket Attachment Image (Optional)'}
                </span>
                {task.attachment_image ? (
                  <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>
                    Attached
                  </span>
                ) : (
                  <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                    Optional
                  </span>
                )}
              </div>

              {task.attachment_image && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '3px 8px', gap: '4px' }}
                  >
                    <Maximize2 size={12} />
                    <span>Full Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '3px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>

            {imageSuccessNotice && (
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                {imageSuccessNotice}
              </div>
            )}

            {task.attachment_image ? (
              <div style={{ position: 'relative', marginTop: '10px' }}>
                <img
                  src={task.attachment_image}
                  alt="Task attachment"
                  onClick={() => setIsImageModalOpen(true)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '260px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    border: '1px solid var(--notion-border)',
                    cursor: 'pointer',
                    background: 'rgba(0, 0, 0, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  }}
                />
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '11px', padding: '4px 10px', cursor: 'pointer', gap: '5px', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Upload size={12} />
                    <span>Replace Image (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    Click image to expand full size
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '6px' }}>
                <p style={{ fontSize: '12px', color: 'var(--notion-text-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {task.status === 'IN_PROGRESS'
                    ? 'Working on this ticket? You can optionally attach a progress screenshot, photo of fixed hardware, or diagnostic capture.'
                    : 'Attach an optional screenshot or photo reference for this deliverable.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <label
                    className="notion-btn notion-btn-primary"
                    style={{
                      fontSize: '12px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: task.status === 'IN_PROGRESS' ? '#2383e2' : undefined,
                    }}
                  >
                    <Camera size={14} />
                    <span>+ Add Image (Optional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    PNG, JPG, WebP supported • Completely optional
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notion Discussion / Comments Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
              <MessageSquare size={15} style={{ color: 'var(--notion-text-dim)' }} />
              <span>Discussion ({task.comments?.length || 0})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {task.comments?.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: 'var(--notion-item-bg)',
                    border: '1px solid var(--notion-border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>{c.author_name}</span>
                      <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                        {c.author_role}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--notion-text-muted)' }}>{c.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="notion-input"
                placeholder="Add a comment or note... (email notifications sent automatically)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !commentText.trim()} className="notion-btn notion-btn-bordered">
                <Send size={13} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Push Direct Message to Assigned Staff Modal Dialog */}
      {isPushMessageOpen && (
        <div
          className="notion-modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={() => setIsPushMessageOpen(false)}
        >
          <div
            className="notion-modal-content"
            style={{ maxWidth: '520px', padding: '24px', borderRadius: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(2, 132, 199, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--notion-blue)',
                  }}
                >
                  <Send size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--notion-text)', margin: 0 }}>
                    Push Message to Assigned Staff
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                    Dispatches live in-app notification & direct email alert
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPushMessageOpen(false)}
                className="notion-btn notion-btn-ghost"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Recipient Details Card */}
            <div
              style={{
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#3373ba',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--notion-text)' }}>
                    {task.assigned_to_name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    {task.assigned_to_email || 'No email registered'}
                  </div>
                </div>
              </div>
              <span className="notion-tag tag-purple" style={{ fontSize: '10px' }}>
                #{task.id} {task.department_code}
              </span>
            </div>

            {/* Quick Template Presets */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                Quick Message Presets:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  '⚡ Priority Focus: Please prioritize this task today.',
                  '📋 Status Check: Please submit current progress update on this deliverable.',
                  '⏰ Deadline Alert: Target deadline is approaching. Please submit your progress.',
                  '⚠️ Revisions Required: Please check remarks and update deliverable.',
                  '✅ Deliverable reviewed! Ready for final verification.',
                ].map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPushMessageText(tpl)}
                    className="notion-btn notion-btn-ghost"
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'var(--notion-item-bg)',
                      border: '1px solid var(--notion-border-subtle)',
                      textAlign: 'left',
                    }}
                  >
                    {tpl.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePushMessage}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Custom Message Content:
                </label>
                <textarea
                  className="notion-input"
                  rows={4}
                  value={pushMessageText}
                  onChange={(e) => setPushMessageText(e.target.value)}
                  placeholder={`Write your direct message to ${task.assigned_to_name}...`}
                  style={{ width: '100%', resize: 'vertical', fontSize: '13px', lineHeight: 1.5 }}
                  autoFocus
                />
              </div>

              {/* Delivery Channels */}
              <div
                style={{
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={pushSendInApp}
                    onChange={(e) => setPushSendInApp(e.target.checked)}
                  />
                  <span>🔔 Dispatch live in-app notification to staff tray</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={pushSendEmail}
                    onChange={(e) => setPushSendEmail(e.target.checked)}
                  />
                  <span>📨 Dispatch direct notification email to staff inbox</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: pushIsUrgent ? 'var(--tag-red-text)' : 'inherit' }}>
                  <input
                    type="checkbox"
                    checked={pushIsUrgent}
                    onChange={(e) => setPushIsUrgent(e.target.checked)}
                  />
                  <span>🚨 Mark as Urgent / High Priority Alert</span>
                </label>
              </div>

              {pushMessageError && (
                <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--tag-red-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{pushMessageError}</span>
                </div>
              )}

              {pushMessageSuccess && (
                <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--tag-green-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} />
                  <span>{pushMessageSuccess}</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPushMessageOpen(false)}
                  className="notion-btn notion-btn-ghost"
                  disabled={sendingPushMessage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingPushMessage || !pushMessageText.trim()}
                  className="notion-btn notion-btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Send size={13} />
                  <span>{sendingPushMessage ? 'Pushing...' : 'Push Message to Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {isImageModalOpen && task.attachment_image && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsImageModalOpen(false)}
          style={{ zIndex: 1200, background: 'rgba(0, 0, 0, 0.88)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="notion-btn"
                style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.2)', padding: '6px 12px' }}
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={task.attachment_image}
              alt="Full attachment preview"
              style={{
                maxWidth: '92vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
