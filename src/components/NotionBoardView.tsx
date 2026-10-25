import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Role, Department, User } from '../types';
import {
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Play,
  Send,
  RotateCcw,
  CheckSquare,
  Table,
  Building,
  Users,
  User as UserIcon,
  Filter,
  Share2,
  Copy,
  Check,
  X,
  Flame,
  Clock,
  Mail,
  ArrowRight,
  Eye,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface NotionBoardViewProps {
  tasks: Task[];
  allTasks?: Task[];
  departments?: Department[];
  staffList?: User[];
  selectedDeptId?: number | 'ALL';
  onSelectDept?: (deptId: number | 'ALL') => void;
  onSelectView?: (view: any) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateTask?: () => void;
  onStartTask?: (task: Task) => void;
  onSubmitTask?: (task: Task) => void;
  onQuickApprove?: (task: Task) => void;
  currentUserRole?: Role;
  currentUserId?: number;
  canCreateTask?: boolean;
}

export const NotionBoardView: React.FC<NotionBoardViewProps> = ({
  tasks,
  allTasks,
  departments,
  staffList,
  selectedDeptId = 'ALL',
  onSelectDept,
  onSelectView,
  onSelectTask,
  onOpenCreateTask,
  onStartTask,
  onSubmitTask,
  onQuickApprove,
  currentUserRole,
  currentUserId,
  canCreateTask,
}) => {
  const { t, isTamil } = useLanguage();
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Share Tasks Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCustomNote, setShareCustomNote] = useState('');
  const [sendingShare, setSendingShare] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const taskPool = allTasks && allTasks.length > 0 ? allTasks : tasks;
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isDueTodayOrOverdue = (task: Task) => {
    if (!task.due_date) return null;
    const taskDate = task.due_date.split('T')[0];
    if (taskDate < todayStr) return { isOverdue: true, isToday: false, label: 'Overdue' };
    if (taskDate === todayStr) return { isOverdue: false, isToday: true, label: 'Today' };
    return null;
  };

  const formatShortDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Filter staff inside the selected department
  const availableStaff = useMemo(() => {
    if (!staffList) return [];
    if (selectedDeptId === 'ALL') return staffList;
    return staffList.filter((s) => s.department === selectedDeptId);
  }, [staffList, selectedDeptId]);

  // Selected person object
  const selectedPersonObj = useMemo(() => {
    if (selectedStaffId === 'ALL') return null;
    return availableStaff.find((s) => s.id === selectedStaffId) || null;
  }, [availableStaff, selectedStaffId]);

  // All tasks assigned to this selected person
  const personTasks = useMemo(() => {
    if (!selectedPersonObj) return [];
    return taskPool.filter((t) => t.assigned_to === selectedPersonObj.id);
  }, [taskPool, selectedPersonObj]);

  const personUrgentWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => {
      if (t.status === 'CLOSED') return false;
      const timeline = isDueTodayOrOverdue(t);
      return t.priority === 'URGENT' || t.priority === 'HIGH' || timeline?.isToday || timeline?.isOverdue;
    });
  }, [personTasks, selectedPersonObj]);

  const personInProcessWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');
  }, [personTasks, selectedPersonObj]);

  // Direct filtered tasks list
  const displayTasks = useMemo(() => {
    let list = taskPool;
    if (selectedDeptId !== 'ALL') {
      list = list.filter((t) => t.department === selectedDeptId);
    }
    if (onlyMyTasks && currentUserId) {
      list = list.filter((t) => t.assigned_to === currentUserId);
    } else if (selectedStaffId !== 'ALL') {
      list = list.filter((t) => t.assigned_to === selectedStaffId);
    }
    if (selectedPriority !== 'ALL') {
      list = list.filter((t) => t.priority === selectedPriority);
    }
    return list;
  }, [taskPool, selectedDeptId, onlyMyTasks, currentUserId, selectedStaffId, selectedPriority]);

  const generateShareSummaryText = () => {
    if (!selectedPersonObj) return '';
    let text = `Tasks for ${selectedPersonObj.full_name || selectedPersonObj.username}\n`;
    text += `Date: ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

    if (personUrgentWork.length > 0) {
      text += `URGENT (${personUrgentWork.length}):\n`;
      personUrgentWork.forEach((t, idx) => {
        text += `${idx + 1}. [${t.priority}] #${t.id}: ${t.title} (Due: ${t.due_date || 'None'})\n`;
      });
      text += '\n';
    }

    if (personInProcessWork.length > 0) {
      text += `IN PROGRESS (${personInProcessWork.length}):\n`;
      personInProcessWork.forEach((t, idx) => {
        text += `${idx + 1}. #${t.id}: ${t.title}\n`;
      });
      text += '\n';
    }

    if (personUrgentWork.length === 0 && personInProcessWork.length === 0) {
      text += `No pending urgent or in-progress tasks.\n`;
    }

    return text;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateShareSummaryText());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyDirectLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDispatchShareEmail = async () => {
    if (!selectedPersonObj) return;
    const targetTask = personUrgentWork[0] || personInProcessWork[0] || personTasks[0] || tasks[0];
    if (!targetTask) {
      alert('No task available to link with digest email');
      return;
    }

    try {
      setSendingShare(true);
      const notePrefix = shareCustomNote.trim() ? `${shareCustomNote.trim()}\n\n` : '';
      const fullMessage = `${notePrefix}${generateShareSummaryText()}`;

      await api.pushMessageToAssignee(targetTask.id, {
        message: fullMessage,
        send_email: true,
        send_in_app: true,
        is_urgent: true,
      });

      setShareSuccessNotice(`Email sent to ${selectedPersonObj.email}`);
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccessNotice(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch email');
    } finally {
      setSendingShare(false);
    }
  };

  const columns: { id: TaskStatus; label: string; dotColor: string }[] = [
    { id: 'TODO', label: t('status_todo'), dotColor: '#94a3b8' },
    { id: 'IN_PROGRESS', label: t('status_in_progress'), dotColor: '#3b82f6' },
    { id: 'PENDING_GM_APPROVAL', label: t('status_pending_gm_approval'), dotColor: '#f59e0b' },
    { id: 'CHANGES_REQUESTED', label: t('status_changes_requested'), dotColor: '#ef4444' },
    { id: 'CLOSED', label: t('status_closed'), dotColor: '#10b981' },
  ];

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return (
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px', background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' }}>
            {t('priority_urgent')}
          </span>
        );
      case 'HIGH':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: 'rgba(249, 115, 22, 0.12)', color: '#ea580c' }}>
            {t('priority_high')}
          </span>
        );
      case 'MEDIUM':
        return (
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            {t('priority_medium')}
          </span>
        );
      case 'LOW':
        return (
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '5px', background: 'var(--notion-item-bg)', color: 'var(--notion-text-dim)' }}>
            {t('priority_low')}
          </span>
        );
      default:
        return null;
    }
  };

  const getAvatarBg = (name?: string) => {
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    if (!name) return colors[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)', background: 'var(--notion-bg)', padding: '16px 24px 28px' }}>
      {/* ========================================================================= */}
      {/* TOP COMPACT FILTER BAR                                                    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '12px',
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          boxShadow: 'var(--notion-shadow-sm)',
          marginBottom: '16px',
        }}
      >
        {/* Left Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Assigned to Me Button */}
          <button
            type="button"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            style={{
              fontSize: '12px',
              padding: '5px 12px',
              background: onlyMyTasks ? 'var(--notion-blue)' : 'var(--notion-item-bg)',
              color: onlyMyTasks ? '#ffffff' : 'var(--notion-text)',
              fontWeight: onlyMyTasks ? 700 : 500,
              border: onlyMyTasks ? '1px solid var(--notion-blue)' : '1px solid var(--notion-border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckSquare size={13} />
            <span>Assigned to Me ({tasks.filter((t) => t.assigned_to === currentUserId).length})</span>
          </button>

          {/* Department Filter */}
          {departments && departments.length > 0 && onSelectDept && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                fontSize: '12px',
              }}
            >
              <Building size={13} style={{ color: 'var(--notion-text-muted)' }} />
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  onSelectDept(val);
                  setSelectedStaffId('ALL');
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: selectedDeptId !== 'ALL' ? 700 : 500,
                  fontFamily: 'inherit',
                }}
              >
                <option value="ALL">{t('allDepartments')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Staff Filter */}
          {availableStaff.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                fontSize: '12px',
              }}
            >
              <Users size={13} style={{ color: 'var(--notion-text-muted)' }} />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: selectedStaffId !== 'ALL' ? 700 : 500,
                  fontFamily: 'inherit',
                }}
              >
                <option value="ALL">{isTamil ? 'அனைத்து பணியாளர்கள்' : 'All Staff'}</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border-subtle)',
              fontSize: '12px',
            }}
          >
            <Filter size={13} style={{ color: 'var(--notion-text-muted)' }} />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--notion-text)',
                cursor: 'pointer',
                outline: 'none',
                fontSize: '12px',
                fontWeight: selectedPriority !== 'ALL' ? 700 : 500,
                fontFamily: 'inherit',
              }}
            >
              <option value="ALL">{isTamil ? 'அனைத்து முன்னுரிமைகள்' : 'All Priorities'}</option>
              <option value="URGENT">{t('priority_urgent')}</option>
              <option value="HIGH">{t('priority_high')}</option>
              <option value="MEDIUM">{t('priority_medium')}</option>
              <option value="LOW">{t('priority_low')}</option>
            </select>
          </div>

          {/* Reset button */}
          {(selectedDeptId !== 'ALL' || selectedStaffId !== 'ALL' || selectedPriority !== 'ALL' || onlyMyTasks) && (
            <button
              type="button"
              onClick={() => {
                onSelectDept?.('ALL');
                setSelectedStaffId('ALL');
                setSelectedPriority('ALL');
                setOnlyMyTasks(false);
              }}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '7px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#dc2626',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Right Tools: Matrix switch & Task Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onSelectView && (
            <button
              type="button"
              onClick={() => onSelectView('table')}
              style={{
                fontSize: '12px',
                padding: '5px 12px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                color: 'var(--notion-text)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Table size={13} style={{ color: '#10b981' }} />
              <span>Table</span>
            </button>
          )}

          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: 'var(--notion-text-muted)',
              background: 'var(--notion-item-bg)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--notion-border-subtle)',
            }}
          >
            {displayTasks.length} {displayTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMPACT STAFF SPOTLIGHT BAR (Only if staff member filtered)               */}
      {/* ========================================================================= */}
      {selectedPersonObj && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(79, 70, 229, 0.06)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: getAvatarBg(selectedPersonObj.full_name || selectedPersonObj.username),
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getInitials(selectedPersonObj.full_name || selectedPersonObj.username)}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {selectedPersonObj.full_name || selectedPersonObj.username}
                {selectedPersonObj.department_name && (
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--notion-text-dim)', marginLeft: '8px' }}>
                    ({selectedPersonObj.department_name})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                {personUrgentWork.length} urgent • {personInProcessWork.length} in progress • {personTasks.length} total
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setShareCustomNote('');
                setShareSuccessNotice(null);
                setIsShareModalOpen(true);
              }}
              style={{
                fontSize: '11.5px',
                padding: '5px 12px',
                borderRadius: '7px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <Share2 size={12} />
              <span>Share Digest</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStaffId('ALL')}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '7px',
                background: 'var(--notion-card)',
                border: '1px solid var(--notion-border)',
                color: 'var(--notion-text-muted)',
                cursor: 'pointer',
              }}
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5 CLEAN KANBAN COLUMNS                                                    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '14px',
          alignItems: 'start',
          flex: 1,
        }}
      >
        {columns.map((col) => {
          const colTasks = displayTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              style={{
                background: 'var(--notion-item-bg)',
                borderRadius: '14px',
                padding: '12px 10px',
                border: '1px solid var(--notion-border-subtle)',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px 10px',
                  borderBottom: '1px solid var(--notion-border-subtle)',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.dotColor }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '0.02em' }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--notion-text-dim)',
                      background: 'var(--notion-card)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      border: '1px solid var(--notion-border-subtle)',
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {canCreateTask !== false && onOpenCreateTask && col.id === 'TODO' && (
                  <button
                    type="button"
                    onClick={onOpenCreateTask}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--notion-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Add Task"
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>

              {/* Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1 }}>
                {colTasks.map((t) => {
                  const timeline = isDueTodayOrOverdue(t);
                  const isOverdue = timeline?.isOverdue;
                  const isToday = timeline?.isToday;

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      style={{
                        background: 'var(--notion-card)',
                        borderRadius: '11px',
                        padding: '12px',
                        border: '1px solid var(--notion-border)',
                        boxShadow: 'var(--notion-shadow-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = col.dotColor;
                        e.currentTarget.style.boxShadow = 'var(--notion-shadow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'var(--notion-border)';
                        e.currentTarget.style.boxShadow = 'var(--notion-shadow-sm)';
                      }}
                    >
                      {/* Top Badges Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '7px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {getPriorityBadge(t.priority)}
                          {t.department_name && (
                            <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>
                              {t.department_name}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 700 }}>
                          #{t.id}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          margin: '0 0 6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--notion-text)',
                          lineHeight: 1.35,
                        }}
                      >
                        {t.title}
                      </h4>

                      {/* Description preview if present */}
                      {t.description && (
                        <p
                          style={{
                            margin: '0 0 8px',
                            fontSize: '11px',
                            color: 'var(--notion-text-muted)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {t.description}
                        </p>
                      )}

                      {/* Footer: Assignee, Due Date & Action */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--notion-border-subtle)',
                          fontSize: '11px',
                        }}
                      >
                        {/* Assignee */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: getAvatarBg(t.assigned_to_name),
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {getInitials(t.assigned_to_name)}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text)' }}>
                            {t.assigned_to_name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Due Date or Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {t.due_date && (
                            <span
                              style={{
                                color: isOverdue ? '#dc2626' : isToday ? '#d97706' : 'var(--notion-text-dim)',
                                fontWeight: isOverdue || isToday ? 700 : 500,
                                fontSize: '10.5px',
                              }}
                            >
                              {formatShortDueDate(t.due_date)}
                            </span>
                          )}

                          {/* 1-Click Action Buttons */}
                          {t.status === 'TODO' && onStartTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTask(t);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '5px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                color: '#2563eb',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Start
                            </button>
                          )}

                          {t.status === 'IN_PROGRESS' && onSubmitTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSubmitTask(t);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '5px',
                                background: 'rgba(2, 132, 199, 0.1)',
                                border: '1px solid rgba(2, 132, 199, 0.25)',
                                color: '#0284c7',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Submit
                            </button>
                          )}

                          {t.status === 'PENDING_GM_APPROVAL' && isGM && onQuickApprove && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickApprove(t);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '5px',
                                background: '#10b981',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {t.status === 'CHANGES_REQUESTED' && onStartTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTask(t);
                              }}
                              style={{
                                padding: '2px 7px',
                                borderRadius: '5px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#dc2626',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Resume
                            </button>
                          )}

                          {t.status === 'CLOSED' && (
                            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '10.5px' }}>
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div
                    style={{
                      padding: '24px 12px',
                      textAlign: 'center',
                      fontSize: '11.5px',
                      color: 'var(--notion-text-dim)',
                    }}
                  >
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SHARE DIGEST MODAL                                                        */}
      {/* ========================================================================= */}
      {isShareModalOpen && selectedPersonObj && (
        <div className="notion-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', width: '92%', borderRadius: '16px' }}
          >
            <div
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--notion-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} style={{ color: '#4f46e5' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                  Share Tasks with {selectedPersonObj.full_name || selectedPersonObj.username}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 18px' }}>
              {shareSuccessNotice && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  ✓ {shareSuccessNotice}
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '5px' }}>
                  Note (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Add a quick note..."
                  value={shareCustomNote}
                  onChange={(e) => setShareCustomNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--notion-item-bg)',
                  fontSize: '11px',
                  color: 'var(--notion-text-muted)',
                  marginBottom: '14px',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {generateShareSummaryText()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleDispatchShareEmail}
                  disabled={sendingShare}
                  className="notion-btn notion-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Mail size={14} />
                  <span>{sendingShare ? 'Sending...' : `Send Email to ${selectedPersonObj.email}`}</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="notion-btn notion-btn-bordered"
                    style={{ justifyContent: 'center', padding: '7px', fontSize: '11.5px' }}
                  >
                    {copiedSummary ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="notion-btn notion-btn-bordered"
                    style={{ justifyContent: 'center', padding: '7px', fontSize: '11.5px' }}
                  >
                    {copiedLink ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
