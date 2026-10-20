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
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | 'ALL'>('ALL');

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
    if (taskDate === todayStr) return { isOverdue: false, isToday: true, label: 'Due Today' };
    return null;
  };

  // Filter staff inside the selected department
  const availableStaff = useMemo(() => {
    if (!staffList) return [];
    if (selectedDeptId === 'ALL') return staffList;
    return staffList.filter((s) => s.department === selectedDeptId);
  }, [staffList, selectedDeptId]);

  // Selected person object ("if person slected")
  const selectedPersonObj = useMemo(() => {
    if (selectedStaffId === 'ALL') return null;
    return availableStaff.find((s) => s.id === selectedStaffId) || null;
  }, [availableStaff, selectedStaffId]);

  // All tasks assigned to this selected person
  const personTasks = useMemo(() => {
    if (!selectedPersonObj) return [];
    return taskPool.filter((t) => t.assigned_to === selectedPersonObj.id);
  }, [taskPool, selectedPersonObj]);

  // Urgent Work Tiles for selected person ("share that ugnet wotk ... like tile only")
  const personUrgentWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => {
      if (t.status === 'CLOSED') return false;
      const timeline = isDueTodayOrOverdue(t);
      const isUrgentPri = t.priority === 'URGENT' || t.priority === 'HIGH';
      const isDueSoon = timeline?.isToday || timeline?.isOverdue;
      const isAwaitingReview = t.status === 'PENDING_GM_APPROVAL';
      return isUrgentPri || isDueSoon || isAwaitingReview;
    });
  }, [personTasks, selectedPersonObj, todayStr]);

  // In Process Work Tiles for selected person ("and in process list like tile only")
  const personInProcessWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => {
      return t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL';
    });
  }, [personTasks, selectedPersonObj]);

  // Share summary text generator for WhatsApp, Slack, Teams, Email
  const generateShareSummaryText = () => {
    if (!selectedPersonObj) return '';
    let text = `📋 Rathinam TaskTracker - Work Allocation for ${selectedPersonObj.full_name || selectedPersonObj.username}\n`;
    text += `👤 Assigned Staff: ${selectedPersonObj.full_name || selectedPersonObj.username} (${selectedPersonObj.email || 'No email'})\n`;
    if (selectedPersonObj.department_name) {
      text += `🏢 Department: ${selectedPersonObj.department_name}\n`;
    }
    text += `📅 Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (personUrgentWork.length > 0) {
      text += `🚨 URGENT WORK (${personUrgentWork.length} tasks):\n`;
      personUrgentWork.forEach((t, idx) => {
        const timeline = isDueTodayOrOverdue(t);
        const priBadge = t.priority === 'URGENT' ? '🚨 [URGENT]' : t.priority === 'HIGH' ? '⚡ [HIGH]' : '📌';
        text += `${idx + 1}. ${priBadge} #${t.id}: ${t.title}\n`;
        text += `   • Status: ${t.status.replace(/_/g, ' ')}\n`;
        text += `   • Due: ${t.due_date || 'No deadline'} ${timeline ? `(${timeline.label})` : ''}\n`;
        if (t.description) text += `   • Specs: ${t.description.slice(0, 85)}\n`;
        text += `\n`;
      });
    }

    if (personInProcessWork.length > 0) {
      text += `🔵 IN PROCESS WORK (${personInProcessWork.length} tasks):\n`;
      personInProcessWork.forEach((t, idx) => {
        text += `${idx + 1}. #${t.id}: ${t.title}\n`;
        text += `   • Status: ${t.status === 'PENDING_GM_APPROVAL' ? 'Pending GM Review' : 'In Progress'}\n`;
        text += `   • Due: ${t.due_date || 'No deadline'}\n`;
        text += `\n`;
      });
    }

    if (personUrgentWork.length === 0 && personInProcessWork.length === 0) {
      text += `✓ No urgent or in-progress tasks currently pending.\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Direct Workspace Link: ${typeof window !== 'undefined' ? window.location.href : ''}\n`;
    return text;
  };

  const handleCopySummary = () => {
    const text = generateShareSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleCopyDirectLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDispatchShareEmail = async () => {
    if (!selectedPersonObj) return;
    const targetTask = personUrgentWork[0] || personInProcessWork[0] || personTasks[0] || tasks[0];
    if (!targetTask) {
      alert('No task available to bind message to');
      return;
    }

    try {
      setSendingShare(true);
      const notePrefix = shareCustomNote.trim() ? `${shareCustomNote.trim()}\n\n` : '';
      const summaryText = generateShareSummaryText();
      const fullMessage = `${notePrefix}${summaryText}`;

      await api.pushMessageToAssignee(targetTask.id, {
        message: fullMessage,
        send_email: true,
        send_in_app: true,
        is_urgent: true,
      });

      setShareSuccessNotice(
        `✓ Tasks successfully dispatched via official email digest to ${selectedPersonObj.full_name || selectedPersonObj.username} (${selectedPersonObj.email})!`
      );
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccessNotice(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch tasks');
    } finally {
      setSendingShare(false);
    }
  };

  const displayTasks = useMemo(() => {
    let list = tasks;
    if (onlyMyTasks && currentUserId) {
      list = list.filter((t) => t.assigned_to === currentUserId);
    }
    if (selectedStaffId !== 'ALL') {
      list = list.filter((t) => t.assigned_to === selectedStaffId);
    }
    return list;
  }, [tasks, onlyMyTasks, currentUserId, selectedStaffId]);

  const columns: { id: TaskStatus; label: string; tagClass: string; icon: string }[] = [
    { id: 'TODO', label: 'To Do', tagClass: 'tag-gray', icon: '⚪' },
    { id: 'IN_PROGRESS', label: 'In Progress', tagClass: 'tag-blue', icon: '🔵' },
    { id: 'PENDING_GM_APPROVAL', label: 'Pending GM Review', tagClass: 'tag-yellow', icon: '🟡' },
    { id: 'CHANGES_REQUESTED', label: 'Changes Requested', tagClass: 'tag-red', icon: '🔴' },
    { id: 'CLOSED', label: 'Closed & Verified', tagClass: 'tag-green', icon: '🟢' },
  ];

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

  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
      {/* Top Quick Filter Bar */}
      <div
        style={{
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--notion-border)',
          background: 'var(--notion-card)',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Assigned to Me Toggle */}
          <button
            type="button"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className="notion-btn"
            style={{
              fontSize: '12.5px',
              padding: '6px 14px',
              background: onlyMyTasks ? 'var(--notion-blue)' : 'var(--notion-item-bg)',
              color: onlyMyTasks ? '#ffffff' : 'var(--notion-text)',
              fontWeight: 700,
              border: onlyMyTasks ? '1px solid var(--notion-blue)' : '1px solid var(--notion-border)',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: onlyMyTasks ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
            }}
            title="Toggle between All Tasks and My Assigned Tasks"
          >
            <CheckSquare size={14} />
            <span>Assigned to Me ({tasks.filter((t) => t.assigned_to === currentUserId).length})</span>
          </button>

          {/* Department Filter First */}
          {departments && departments.length > 0 && onSelectDept && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '9px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border)',
              }}
            >
              <Building size={14} style={{ color: '#4f46e5' }} />
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  onSelectDept(val);
                  setSelectedStaffId('ALL');
                }}
                style={{
                  fontSize: '12.5px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: selectedDeptId !== 'ALL' ? 700 : 500,
                  fontFamily: 'inherit',
                }}
                title="Filter tasks by Department first"
              >
                <option value="ALL">🏢 All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Staff Filter inside Department */}
          {availableStaff.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '9px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border)',
              }}
            >
              <Users size={14} style={{ color: '#10b981' }} />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{
                  fontSize: '12.5px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: selectedStaffId !== 'ALL' ? 700 : 500,
                  fontFamily: 'inherit',
                }}
                title="Filter by assigned staff member inside this department"
              >
                <option value="ALL">👤 All Staff Members ({availableStaff.length})</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.username} ({s.department_name || 'Staff'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset filter button if active */}
          {(selectedDeptId !== 'ALL' || selectedStaffId !== 'ALL' || onlyMyTasks) && (
            <button
              type="button"
              onClick={() => {
                onSelectDept?.('ALL');
                setSelectedStaffId('ALL');
                setOnlyMyTasks(false);
              }}
              className="notion-btn"
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '8px',
                color: 'var(--notion-text-dim)',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              ✕ Reset Filters
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Direct Switch to Department & Staff Status Table Matrix */}
          {onSelectView && (
            <button
              type="button"
              onClick={() => onSelectView('table')}
              className="notion-btn"
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontWeight: 700,
              }}
              title="Open Department Staff Status Breakdown Table"
            >
              <Table size={14} />
              <span>Staff Status Matrix</span>
            </button>
          )}

          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--notion-text-muted)',
              background: 'var(--notion-item-bg)',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--notion-border-subtle)',
            }}
          >
            {displayTasks.length} task{displayTasks.length === 1 ? '' : 's'} on board
          </span>
        </div>
      </div>

      {/* Staff Members Visual Chips Bar */}
      {availableStaff.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '8px 24px',
            background: 'var(--notion-card)',
            borderBottom: '1px solid var(--notion-border-subtle)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
            👥 Select Person:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStaffId('ALL')}
            className="notion-btn"
            style={{
              fontSize: '11px',
              padding: '3px 9px',
              borderRadius: '12px',
              background: selectedStaffId === 'ALL' ? 'var(--notion-hover)' : 'transparent',
              fontWeight: selectedStaffId === 'ALL' ? 700 : 400,
              color: selectedStaffId === 'ALL' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              border: selectedStaffId === 'ALL' ? '1px solid var(--notion-border)' : '1px solid transparent',
              flexShrink: 0,
            }}
          >
            All Staff ({availableStaff.length})
          </button>
          {availableStaff.map((staff) => {
            const isSelected = selectedStaffId === staff.id;
            const staffDeliverables = taskPool.filter((t) => t.assigned_to === staff.id && t.status !== 'CLOSED');
            const urgentDeliverables = staffDeliverables.filter((t) => {
              const tl = isDueTodayOrOverdue(t);
              return tl?.isToday || tl?.isOverdue || t.priority === 'URGENT' || t.status === 'PENDING_GM_APPROVAL';
            }).length;

            return (
              <button
                key={staff.id}
                type="button"
                onClick={() => setSelectedStaffId(isSelected ? 'ALL' : staff.id)}
                className="notion-btn"
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '14px',
                  background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--notion-item-bg)',
                  color: isSelected ? '#0284c7' : 'var(--notion-text)',
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? '1px solid #0284c7' : '1px solid var(--notion-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 4px rgba(2, 132, 199, 0.2)' : 'none',
                }}
                title={`Click to focus on ${staff.full_name || staff.username} and view/share their urgent and in-process deliverables`}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isSelected ? '#0284c7' : '#94a3b8',
                    color: '#fff',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {(staff.full_name || staff.username || '?').charAt(0).toUpperCase()}
                </span>
                <span>{staff.full_name || staff.username}</span>
                {staffDeliverables.length > 0 && (
                  <span
                    className={urgentDeliverables > 0 ? 'notion-tag tag-red' : isSelected ? 'notion-tag tag-blue' : 'notion-tag tag-gray'}
                    style={{ fontSize: '9px', padding: '0 5px', fontWeight: 700 }}
                  >
                    {staffDeliverables.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* SELECTED PERSON SPOTLIGHT & TILES VIEW ("if person slected me share that ugnet wotk and in process list like tile only to share that perosn make taht") */}
      {selectedPersonObj && (
        <div
          style={{
            margin: '16px 24px 0',
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: 'var(--notion-shadow)',
          }}
        >
          {/* Header with Person Profile and Share Action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '1px solid var(--notion-border-subtle)',
              paddingBottom: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '15px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0,
                }}
              >
                {(selectedPersonObj.full_name || selectedPersonObj.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                    {selectedPersonObj.full_name || selectedPersonObj.username}
                  </h3>
                  {selectedPersonObj.department_name && (
                    <span className="notion-tag tag-purple" style={{ fontSize: '10px', fontWeight: 600 }}>
                      {selectedPersonObj.department_name}
                    </span>
                  )}
                  <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>
                    {selectedPersonObj.role_display || selectedPersonObj.role}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                  {selectedPersonObj.email} • {personTasks.length} total deliverables assigned ({personTasks.filter((t) => t.status === 'CLOSED').length} completed)
                </div>
              </div>
            </div>

            {/* Action Buttons: Share Tasks Digest & Clear Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShareCustomNote('');
                  setShareSuccessNotice(null);
                  setIsShareModalOpen(true);
                }}
                className="notion-btn notion-btn-primary"
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                }}
                title={`Share ${personUrgentWork.length} urgent & ${personInProcessWork.length} in-process deliverables with ${selectedPersonObj.full_name}`}
              >
                <Share2 size={13} />
                <span>Share Tasks with {selectedPersonObj.full_name?.split(' ')[0] || selectedPersonObj.username}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStaffId('ALL')}
                className="notion-btn notion-btn-bordered"
                style={{ fontSize: '11px', padding: '5px 10px', color: 'var(--notion-text-dim)', gap: '4px' }}
                title="Clear person selection and view all tasks"
              >
                <X size={12} />
                <span>Show All Staff</span>
              </button>
            </div>
          </div>

          {/* TILES GRID: URGENT WORK & IN PROCESS LIST ("share that ugnet wotk and in process list like tile only") */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* TILE SECTION 1: URGENT WORK TILES ("ugnet wotk") */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                    🚨 Urgent Work ({personUrgentWork.length})
                  </span>
                </div>
                <span className="notion-tag tag-red" style={{ fontSize: '10px', fontWeight: 700 }}>
                  High Priority / Due
                </span>
              </div>

              {personUrgentWork.length === 0 ? (
                <div
                  style={{
                    padding: '20px 16px',
                    background: 'var(--notion-item-bg)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--notion-text-dim)',
                    textAlign: 'center',
                    border: '1px dashed var(--notion-border)',
                  }}
                >
                  ✓ No urgent or overdue deliverables pending for this person!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {personUrgentWork.map((task) => {
                    const timeline = isDueTodayOrOverdue(task);
                    const isAwaitingReview = task.status === 'PENDING_GM_APPROVAL';

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'var(--notion-item-bg)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.08)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)', lineHeight: 1.3 }}>
                            #{task.id}: {task.title}
                          </span>
                          {getPriorityTag(task.priority)}
                        </div>

                        {task.description && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--notion-text-muted)',
                              marginBottom: '8px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4,
                            }}
                          >
                            {task.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isAwaitingReview ? (
                              <span className="notion-tag tag-yellow" style={{ fontSize: '9px', fontWeight: 700 }}>
                                ⏳ Awaiting GM Signoff
                              </span>
                            ) : task.status === 'IN_PROGRESS' ? (
                              <span className="notion-tag tag-blue" style={{ fontSize: '9px' }}>
                                ▶ In Progress
                              </span>
                            ) : (
                              <span className="notion-tag tag-gray" style={{ fontSize: '9px' }}>
                                ⚪ To Do
                              </span>
                            )}

                            {task.due_date && (
                              <span
                                style={{
                                  color: timeline?.isOverdue ? '#ef4444' : timeline?.isToday ? '#f59e0b' : 'var(--notion-text-dim)',
                                  fontWeight: timeline?.isOverdue || timeline?.isToday ? 700 : 400,
                                }}
                              >
                                📅 {task.due_date} {timeline ? `(${timeline.label})` : ''}
                              </span>
                            )}
                          </div>

                          <span style={{ color: '#0284c7', fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span>Details</span>
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TILE SECTION 2: IN PROCESS LIST TILES ("in process list") */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} style={{ color: '#0284c7' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                    🔵 In Process List ({personInProcessWork.length})
                  </span>
                </div>
                <span className="notion-tag tag-blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                  Active Execution
                </span>
              </div>

              {personInProcessWork.length === 0 ? (
                <div
                  style={{
                    padding: '20px 16px',
                    background: 'var(--notion-item-bg)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--notion-text-dim)',
                    textAlign: 'center',
                    border: '1px dashed var(--notion-border)',
                  }}
                >
                  — No deliverables currently in process for this person.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {personInProcessWork.map((task) => {
                    const isReview = task.status === 'PENDING_GM_APPROVAL';
                    const timeline = isDueTodayOrOverdue(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'var(--notion-item-bg)',
                          border: isReview ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(2, 132, 199, 0.35)',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isReview ? '#eab308' : '#0284c7';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isReview ? 'rgba(234, 179, 8, 0.4)' : 'rgba(2, 132, 199, 0.35)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(2, 132, 199, 0.08)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)', lineHeight: 1.3 }}>
                            #{task.id}: {task.title}
                          </span>
                          {getPriorityTag(task.priority)}
                        </div>

                        {task.description && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--notion-text-muted)',
                              marginBottom: '8px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4,
                            }}
                          >
                            {task.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isReview ? (
                              <span className="notion-tag tag-yellow" style={{ fontSize: '9px', fontWeight: 700 }}>
                                ⏳ Pending Review
                              </span>
                            ) : (
                              <span className="notion-tag tag-blue" style={{ fontSize: '9px' }}>
                                ▶ In Progress
                              </span>
                            )}

                            {task.due_date && (
                              <span
                                style={{
                                  color: timeline?.isOverdue ? '#ef4444' : timeline?.isToday ? '#f59e0b' : 'var(--notion-text-dim)',
                                }}
                              >
                                📅 {task.due_date}
                              </span>
                            )}
                          </div>

                          <span style={{ color: '#0284c7', fontSize: '11px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span>Details</span>
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Board Columns */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          padding: '16px 24px 24px',
          alignItems: 'flex-start',
          flex: 1,
        }}
      >
        {columns.map((col) => {
          const colTasks = displayTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              style={{
                width: '286px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--notion-item-bg)',
                borderRadius: '14px',
                padding: '12px 10px',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 8px',
                  borderBottom: '1px solid var(--notion-border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`notion-tag ${col.tagClass}`} style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px' }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--notion-text-dim)',
                      fontWeight: 700,
                      background: 'var(--notion-card)',
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      border: '1px solid var(--notion-border-subtle)',
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks in column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    style={{
                      background: 'var(--notion-card)',
                      border: '1px solid var(--notion-border)',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow: 'var(--notion-shadow-sm)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--notion-card-hover)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--notion-shadow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--notion-card)';
                      e.currentTarget.style.borderColor = 'var(--notion-border)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--notion-shadow-sm)';
                    }}
                  >
                    {/* Task title */}
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--notion-text)',
                        marginBottom: '6px',
                        lineHeight: 1.35,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                      }}
                    >
                      <span>📄</span>
                      <span>{t.title}</span>
                    </div>

                    {/* Description Preview on Card */}
                    {t.description && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--notion-text-muted)',
                          margin: '0 0 8px',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {t.description}
                      </p>
                    )}

                    {/* GM Feedback Callout if present */}
                    {t.gm_feedback_notes && t.status === 'CHANGES_REQUESTED' && (
                      <div
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'rgba(235, 87, 87, 0.1)',
                          border: '1px solid rgba(235, 87, 87, 0.25)',
                          fontSize: '11px',
                          color: 'var(--tag-red-text)',
                          marginBottom: '8px',
                        }}
                      >
                        GM Note: "{t.gm_feedback_notes}"
                      </div>
                    )}

                    {/* Properties Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      <span className="notion-tag tag-gray">{t.department_name}</span>
                      {getPriorityTag(t.priority)}
                      {t.attachment_image && (
                        <span className="notion-tag tag-blue" style={{ fontSize: '10px', padding: '1px 5px' }}>
                          🖼️ Image
                        </span>
                      )}
                    </div>

                    {/* Footer info: Assignee & Due Date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11.5px',
                        color: 'var(--notion-text-dim)',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--notion-border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {t.assigned_to ? (
                          <>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                                color: '#fff',
                                fontSize: '10.5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
                              }}
                            >
                              {(t.assigned_to_name || '?').charAt(0).toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--notion-text)', fontSize: '12px' }}>
                              {t.assigned_to_name}
                            </span>
                          </>
                        ) : (
                          <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            Unassigned
                          </span>
                        )}
                      </div>

                      {t.due_date && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            color: isDueTodayOrOverdue(t)?.isOverdue ? '#ef4444' : isDueTodayOrOverdue(t)?.isToday ? '#f59e0b' : 'var(--notion-text-muted)',
                          }}
                        >
                          <Calendar size={12} />
                          <span>{t.due_date}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick 1-Click Action Buttons on Card */}
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(t);
                        }}
                        className="notion-btn notion-btn-bordered"
                        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', color: 'var(--notion-text)' }}
                        title="View task details and full attachments"
                      >
                        <span>Details &rarr;</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {t.status === 'TODO' && onStartTask && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTask(t);
                          }}
                          className="notion-btn"
                          style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--notion-blue)', border: '1px solid rgba(79, 70, 229, 0.25)', fontWeight: 600 }}
                          title="Start work on this task"
                        >
                          <Play size={11} />
                          <span>Start</span>
                        </button>
                      )}

                      {t.status === 'IN_PROGRESS' && onSubmitTask && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubmitTask(t);
                          }}
                          className="notion-btn"
                          style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', color: '#0ea5e9', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 600 }}
                          title="Submit for GM approval"
                        >
                          <Send size={11} />
                          <span>Submit</span>
                        </button>
                      )}

                      {t.status === 'CHANGES_REQUESTED' && onStartTask && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTask(t);
                          }}
                          className="notion-btn"
                          style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600 }}
                          title="Resume work with requested changes"
                        >
                          <RotateCcw size={11} />
                          <span>Resume</span>
                        </button>
                      )}

                      {t.status === 'PENDING_GM_APPROVAL' && isGM && onQuickApprove && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickApprove(t);
                          }}
                          className="notion-btn notion-btn-success"
                          style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}
                          title="Quick approve this task"
                        >
                          <CheckCircle2 size={11} />
                          <span>Approve</span>
                        </button>
                      )}

                      {t.status === 'CLOSED' && (
                        <span className="notion-tag tag-green" style={{ fontSize: '10.5px', padding: '2px 7px', fontWeight: 700 }}>
                          ✓ Done
                        </span>
                      )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* "+ New" page button */}
              {(canCreateTask !== false && onOpenCreateTask) && (
                <button
                  onClick={onOpenCreateTask}
                  className="notion-btn"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    color: 'var(--notion-text-dim)',
                    fontSize: '12px',
                    padding: '6px 8px',
                  }}
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Share Tasks Modal for Selected Person ("to share that perosn make taht") */}
      {isShareModalOpen && selectedPersonObj && (
        <div className="notion-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%' }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--notion-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} style={{ color: '#0284c7' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                  Share Work with {selectedPersonObj.full_name || selectedPersonObj.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="notion-btn"
                style={{ padding: '3px 6px', color: 'var(--notion-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '78vh' }}>
              {/* Target info card */}
              <div
                style={{
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {(selectedPersonObj.full_name || selectedPersonObj.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                    {selectedPersonObj.full_name || selectedPersonObj.username} ({selectedPersonObj.email})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                    {selectedPersonObj.department_name ? `${selectedPersonObj.department_name} • ` : ''}
                    {personUrgentWork.length} urgent deliverables & {personInProcessWork.length} in-process deliverables
                  </div>
                </div>
              </div>

              {/* Success Notification */}
              {shareSuccessNotice && (
                <div
                  className="notion-callout"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    marginBottom: '14px',
                    fontSize: '12px',
                    padding: '10px 14px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{shareSuccessNotice}</span>
                </div>
              )}

              {/* Optional Custom Note input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Add Executive Instructions or Priority Note (Optional):
                </label>
                <textarea
                  className="notion-textarea"
                  rows={2}
                  placeholder={`Hi ${selectedPersonObj.full_name?.split(' ')[0] || selectedPersonObj.username}, please review and complete these urgent tasks today...`}
                  value={shareCustomNote}
                  onChange={(e) => setShareCustomNote(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              {/* Preview of Work Digest */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)' }}>
                    Deliverables to be Shared:
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    {personUrgentWork.length + personInProcessWork.length} deliverables
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--notion-item-bg)',
                    border: '1px solid var(--notion-border-subtle)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    fontSize: '11px',
                    color: 'var(--notion-text)',
                    lineHeight: 1.5,
                  }}
                >
                  {personUrgentWork.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                        🚨 Urgent Work ({personUrgentWork.length}):
                      </div>
                      {personUrgentWork.map((t, idx) => (
                        <div key={t.id} style={{ paddingLeft: '8px', color: 'var(--notion-text)' }}>
                          {idx + 1}. [#{t.id}] {t.title} (Due: {t.due_date || 'No date'})
                        </div>
                      ))}
                    </div>
                  )}

                  {personInProcessWork.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                        🔵 In Process Work ({personInProcessWork.length}):
                      </div>
                      {personInProcessWork.map((t, idx) => (
                        <div key={t.id} style={{ paddingLeft: '8px', color: 'var(--notion-text)' }}>
                          {idx + 1}. [#{t.id}] {t.title} ({t.status === 'PENDING_GM_APPROVAL' ? 'Pending Review' : 'In Progress'})
                        </div>
                      ))}
                    </div>
                  )}

                  {personUrgentWork.length === 0 && personInProcessWork.length === 0 && (
                    <div style={{ color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>
                      No pending urgent or in-process tasks.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleDispatchShareEmail}
                  disabled={sendingShare}
                  className="notion-btn notion-btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                  }}
                >
                  <Mail size={15} />
                  <span>
                    {sendingShare
                      ? 'Dispatching Official Email...'
                      : `📧 Send Official Digest Email to ${selectedPersonObj.email}`}
                  </span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="notion-btn notion-btn-bordered"
                    style={{
                      justifyContent: 'center',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: copiedSummary ? '#10b981' : 'var(--notion-text)',
                      borderColor: copiedSummary ? '#10b981' : 'var(--notion-border)',
                    }}
                  >
                    {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedSummary ? 'Copied Summary!' : '📋 Copy for WhatsApp/Slack'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="notion-btn notion-btn-bordered"
                    style={{
                      justifyContent: 'center',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: copiedLink ? '#10b981' : 'var(--notion-text)',
                      borderColor: copiedLink ? '#10b981' : 'var(--notion-border)',
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied Link!' : '🔗 Copy Direct Link'}</span>
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
