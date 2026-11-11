import React, { useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Role, Department, User } from '../types';
import { parseCoAssignedTeam } from '../utils/coAssignUtils';
import { parseGmDirective } from '../utils/gmDirectiveUtils';
import { isTaskAssignedToStaff, isTaskInDepartment, buildAvailableStaffList } from '../utils/taskFilterUtils';
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
  Printer,
  Download,
  Search,
  Zap,
  Circle,
  SlidersHorizontal,
  Layers,
  GripVertical,
  ChevronDown,
  CheckCheck,
  Inbox,
  AlertTriangle,
  MoreHorizontal,
  MoveRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { printTasksTableReport } from '../utils/printReportUtils';

interface NotionBoardViewProps {
  tasks: Task[];
  allTasks?: Task[];
  departments?: Department[];
  staffList?: User[];
  selectedDeptId?: number | 'ALL';
  onSelectDept?: (deptId: number | 'ALL') => void;
  selectedStaffId?: string | number | 'ALL';
  onSelectStaff?: (staffId: string | number | 'ALL') => void;
  onSelectView?: (view: any) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateTask?: () => void;
  onStartTask?: (task: Task) => void;
  onSubmitTask?: (task: Task) => void;
  onQuickApprove?: (task: Task) => void;
  onUpdateTaskStatus?: (taskId: number, newStatus: TaskStatus, notes?: string) => Promise<void>;
  currentUserRole?: Role;
  currentUserId?: number;
  canCreateTask?: boolean;
}

type QuickFilterType = 'ALL' | 'MY_TASKS' | 'URGENT' | 'GM_DIRECTIVES' | 'DUE_SOON';
type CardDensity = 'comfortable' | 'compact';

export const NotionBoardView: React.FC<NotionBoardViewProps> = ({
  tasks,
  allTasks,
  departments,
  staffList,
  selectedDeptId = 'ALL',
  onSelectDept,
  selectedStaffId: selectedStaffIdProp,
  onSelectStaff: onSelectStaffProp,
  onSelectView,
  onSelectTask,
  onOpenCreateTask,
  onStartTask,
  onSubmitTask,
  onQuickApprove,
  onUpdateTaskStatus,
  currentUserRole,
  currentUserId,
  canCreateTask,
}) => {
  const { t, isTamil } = useLanguage();
  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('ALL');
  const [cardDensity, setCardDensity] = useState<CardDensity>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nextup_board_density') as CardDensity) || 'comfortable';
    }
    return 'comfortable';
  });

  const [internalStaffId, setInternalStaffId] = useState<string | number | 'ALL'>('ALL');
  const activeStaffId = selectedStaffIdProp !== undefined ? selectedStaffIdProp : internalStaffId;
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Drag and Drop & Context Menu State
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<number | null>(null);

  // Share Tasks Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCustomNote, setShareCustomNote] = useState('');
  const [sendingShare, setSendingShare] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const taskPool = allTasks && allTasks.length > 0 ? allTasks : tasks;
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleToggleDensity = () => {
    const next = cardDensity === 'comfortable' ? 'compact' : 'comfortable';
    setCardDensity(next);
    try {
      localStorage.setItem('nextup_board_density', next);
    } catch {}
  };

  const handleSelectStaff = (id: string | number | 'ALL') => {
    setInternalStaffId(id);
    if (onSelectStaffProp) {
      onSelectStaffProp(id);
    }
  };

  // Timeline helper
  const isDueTodayOrOverdue = useCallback(
    (task: Task) => {
      if (!task.due_date) return null;
      const taskDate = task.due_date.split('T')[0];
      if (taskDate < todayStr) return { isOverdue: true, isToday: false, label: 'Overdue' };
      if (taskDate === todayStr) return { isOverdue: false, isToday: true, label: 'Today' };
      return null;
    },
    [todayStr]
  );

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

  // Comprehensive staff list extracted from staffList & tasks
  const availableStaff = useMemo(() => {
    return buildAvailableStaffList(staffList, taskPool);
  }, [staffList, taskPool]);

  // Selected person object
  const selectedPersonObj = useMemo(() => {
    if (activeStaffId === 'ALL' || activeStaffId === 'UNASSIGNED') return null;
    return availableStaff.find((s) => String(s.id) === String(activeStaffId)) || null;
  }, [availableStaff, activeStaffId]);

  // All tasks assigned or co-assigned to this selected person
  const personTasks = useMemo(() => {
    if (!selectedPersonObj && activeStaffId === 'ALL') return [];
    return taskPool.filter((t) => isTaskAssignedToStaff(t, activeStaffId, selectedPersonObj));
  }, [taskPool, activeStaffId, selectedPersonObj]);

  const personUrgentWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => {
      if (t.status === 'CLOSED') return false;
      const timeline = isDueTodayOrOverdue(t);
      return t.priority === 'URGENT' || t.priority === 'HIGH' || timeline?.isToday || timeline?.isOverdue;
    });
  }, [personTasks, selectedPersonObj, isDueTodayOrOverdue]);

  const personInProcessWork = useMemo(() => {
    if (!selectedPersonObj) return [];
    return personTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');
  }, [personTasks, selectedPersonObj]);

  // Direct filtered tasks list
  const displayTasks = useMemo(() => {
    let list = taskPool;

    // GM privacy filter
    list = list.filter((t) => {
      if (!isGM) {
        if (t.is_gm_own_task || t.department_code === 'GM') return false;
        const assignee = staffList?.find((s) => s.id === t.assigned_to);
        if (assignee && (assignee.role === 'GENERAL_MANAGER' || assignee.role === 'SUPER_ADMIN')) {
          return false;
        }
      }
      return true;
    });

    // 1. Department Filter
    if (selectedDeptId !== 'ALL') {
      const selectedDeptObj = departments?.find((d) => String(d.id) === String(selectedDeptId));
      list = list.filter((t) => isTaskInDepartment(t, selectedDeptId, selectedDeptObj?.name));
    }

    // 2. Staff Filter
    if (activeStaffId !== 'ALL') {
      list = list.filter((t) => isTaskAssignedToStaff(t, activeStaffId, selectedPersonObj));
    }

    // 3. Priority Filter
    if (selectedPriority !== 'ALL') {
      list = list.filter((t) => t.priority === selectedPriority);
    }

    // 4. Quick Filter Tabs
    if (quickFilter === 'MY_TASKS' && currentUserId) {
      list = list.filter((t) => isTaskAssignedToStaff(t, currentUserId));
    } else if (quickFilter === 'URGENT') {
      list = list.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH');
    } else if (quickFilter === 'GM_DIRECTIVES') {
      list = list.filter((t) => parseGmDirective(t).isAssignedByGm);
    } else if (quickFilter === 'DUE_SOON') {
      list = list.filter((t) => {
        if (t.status === 'CLOSED') return false;
        const tl = isDueTodayOrOverdue(t);
        return tl?.isToday || tl?.isOverdue;
      });
    }

    // 5. Live Search Input
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const idMatch = `#${t.id}`.includes(q) || String(t.id) === q;
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const deptMatch = (t.department_name || t.department_code || '').toLowerCase().includes(q);
        const assigneeMatch = (t.assigned_to_name || '').toLowerCase().includes(q);
        return idMatch || titleMatch || descMatch || deptMatch || assigneeMatch;
      });
    }

    return list;
  }, [
    taskPool,
    selectedDeptId,
    departments,
    activeStaffId,
    selectedPersonObj,
    selectedPriority,
    quickFilter,
    currentUserId,
    searchQuery,
    isGM,
    staffList,
    isDueTodayOrOverdue,
  ]);

  // Overall Board KPIs
  const boardKpis = useMemo(() => {
    const total = displayTasks.length;
    const todo = displayTasks.filter((t) => t.status === 'TODO').length;
    const inProgress = displayTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pendingApproval = displayTasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
    const changesRequested = displayTasks.filter((t) => t.status === 'CHANGES_REQUESTED').length;
    const completed = displayTasks.filter((t) => t.status === 'CLOSED').length;
    const urgentCount = displayTasks.filter((t) => t.status !== 'CLOSED' && (t.priority === 'URGENT' || t.priority === 'HIGH')).length;
    return { total, todo, inProgress, pendingApproval, changesRequested, completed, urgentCount };
  }, [displayTasks]);

  // Status Transition Handler (Drag and Drop + 1-Click Buttons)
  const handleCardStatusChange = async (task: Task, targetStatus: TaskStatus) => {
    if (task.status === targetStatus) return;

    if (onUpdateTaskStatus) {
      await onUpdateTaskStatus(task.id, targetStatus);
      return;
    }

    // Fallbacks
    try {
      if (targetStatus === 'IN_PROGRESS' && onStartTask) {
        onStartTask(task);
      } else if (targetStatus === 'PENDING_GM_APPROVAL' && onSubmitTask) {
        onSubmitTask(task);
      } else if (targetStatus === 'CLOSED' && onQuickApprove) {
        onQuickApprove(task);
      } else {
        await api.updateTask(task.id, { status: targetStatus });
      }
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDropOnColumn = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    if (!taskId || isNaN(taskId)) return;

    const draggedTask = displayTasks.find((t) => t.id === taskId) || taskPool.find((t) => t.id === taskId);
    if (!draggedTask) return;
    if (draggedTask.status === targetStatus) return;

    await handleCardStatusChange(draggedTask, targetStatus);
  };

  // Share Digest Text
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

  // Helper colors & initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (name?: string) => {
    const colors = [
      'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
      'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
    ];
    let hash = 0;
    const str = name || 'User';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getPriorityTheme = (p: string) => {
    switch (p) {
      case 'URGENT':
        return {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          label: t('priority_urgent'),
          stripe: '#ef4444',
        };
      case 'HIGH':
        return {
          color: '#f97316',
          bg: 'rgba(249, 115, 22, 0.1)',
          border: 'rgba(249, 115, 22, 0.3)',
          label: t('priority_high'),
          stripe: '#f97316',
        };
      case 'MEDIUM':
        return {
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)',
          border: 'rgba(59, 130, 246, 0.25)',
          label: t('priority_medium'),
          stripe: '#3b82f6',
        };
      case 'LOW':
      default:
        return {
          color: '#64748b',
          bg: 'var(--notion-item-bg)',
          border: 'var(--notion-border-subtle)',
          label: t('priority_low'),
          stripe: '#94a3b8',
        };
    }
  };

  // 5 Canonical Kanban Columns Configuration
  const columnsConfig: {
    id: TaskStatus;
    label: string;
    taLabel: string;
    color: string;
    lightBg: string;
    borderColor: string;
    icon: any;
    emptyHint: string;
  }[] = [
    {
      id: 'TODO',
      label: t('status_todo'),
      taLabel: 'செய்ய வேண்டியவை',
      color: '#64748b',
      lightBg: 'rgba(100, 116, 139, 0.08)',
      borderColor: 'rgba(100, 116, 139, 0.25)',
      icon: Circle,
      emptyHint: 'No backlog tasks waiting',
    },
    {
      id: 'IN_PROGRESS',
      label: t('status_in_progress'),
      taLabel: 'செயலில் உள்ளவை',
      color: '#2563eb',
      lightBg: 'rgba(37, 99, 235, 0.08)',
      borderColor: 'rgba(37, 99, 235, 0.25)',
      icon: Zap,
      emptyHint: 'No tasks currently underway',
    },
    {
      id: 'PENDING_GM_APPROVAL',
      label: t('status_pending_gm_approval'),
      taLabel: 'GM ஒப்புதலுக்கு காத்திருக்கிறது',
      color: '#d97706',
      lightBg: 'rgba(217, 119, 6, 0.09)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      icon: ShieldCheck,
      emptyHint: 'No tasks waiting for GM review',
    },
    {
      id: 'CHANGES_REQUESTED',
      label: t('status_changes_requested'),
      taLabel: 'மாற்றங்கள் தேவை',
      color: '#e11d48',
      lightBg: 'rgba(225, 29, 72, 0.08)',
      borderColor: 'rgba(225, 29, 72, 0.25)',
      icon: AlertCircle,
      emptyHint: 'All tasks approved! None need rework',
    },
    {
      id: 'CLOSED',
      label: t('status_closed'),
      taLabel: 'முடிவடைந்தவை',
      color: '#059669',
      lightBg: 'rgba(5, 150, 105, 0.08)',
      borderColor: 'rgba(5, 150, 105, 0.25)',
      icon: CheckCircle2,
      emptyHint: 'No completed tasks in current view',
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedDeptId !== 'ALL' ||
    activeStaffId !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    quickFilter !== 'ALL';

  return (
    <div
      className="notion-board-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 80px)',
        background: 'var(--notion-bg)',
        padding: '16px 24px 32px',
        maxWidth: '1800px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND & FILTER BAR                                          */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '16px',
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          padding: '12px 16px',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        {/* Row A: KPI Counters & Quick Status Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Quick Segmented Filter Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--notion-item-bg)',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid var(--notion-border-subtle)',
            }}
          >
            {[
              { id: 'ALL', label: isTamil ? 'அனைத்து பணிகள்' : 'All Tasks', count: boardKpis.total, icon: Layers },
              { id: 'MY_TASKS', label: isTamil ? 'என் பணிகள்' : 'Assigned to Me', count: taskPool.filter((t) => (currentUserId ? isTaskAssignedToStaff(t, currentUserId) : false)).length, icon: CheckSquare },
              { id: 'URGENT', label: isTamil ? 'அவசரப் பணிகள்' : 'Urgent & High', count: boardKpis.urgentCount, icon: Flame, color: '#ef4444' },
              { id: 'GM_DIRECTIVES', label: isTamil ? 'GM உத்தரவுகள்' : 'GM Directives', count: taskPool.filter((t) => parseGmDirective(t).isAssignedByGm).length, icon: ShieldCheck, color: '#7c3aed' },
              { id: 'DUE_SOON', label: isTamil ? 'இன்று / காலாவதி' : 'Due Today / Overdue', count: taskPool.filter((t) => t.status !== 'CLOSED' && isDueTodayOrOverdue(t)).length, icon: Clock, color: '#d97706' },
            ].map((tab) => {
              const isSelected = quickFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQuickFilter(tab.id as QuickFilterType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    background: isSelected ? 'var(--notion-card)' : 'transparent',
                    color: isSelected ? (tab.color || 'var(--notion-text)') : 'var(--notion-text-muted)',
                    fontWeight: isSelected ? 800 : 500,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={12} style={{ color: tab.color || (isSelected ? 'var(--notion-blue)' : 'inherit') }} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(79, 70, 229, 0.1)' : 'var(--notion-border-subtle)',
                      color: isSelected ? '#4f46e5' : 'var(--notion-text-dim)',
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Tools: Density Toggle, Staff Work Table Shortcut, Export & Print */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Card Density Toggle */}
            <button
              type="button"
              onClick={handleToggleDensity}
              className="notion-btn notion-btn-bordered"
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: 'var(--notion-text)',
                background: 'var(--notion-item-bg)',
                cursor: 'pointer',
              }}
              title="Toggle between comfortable and compact cards"
            >
              <SlidersHorizontal size={12} style={{ color: '#6366f1' }} />
              <span>{cardDensity === 'comfortable' ? 'Comfortable' : 'Compact'}</span>
            </button>

            {/* Direct Switch to Staff Work Table */}
            {onSelectView && (
              <button
                type="button"
                onClick={() => onSelectView('table')}
                style={{
                  fontSize: '11.5px',
                  padding: '5px 11px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  color: 'var(--notion-text)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 650,
                  cursor: 'pointer',
                }}
                title={t('staffMatrix')}
              >
                <Table size={12} style={{ color: '#10b981' }} />
                <span>{isTamil ? 'பணியாளர் பணி அட்டவணை' : 'Staff Work Table'}</span>
              </button>
            )}

            {/* Export Official CSV */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.downloadTasksCsv(selectedDeptId === 'ALL' ? undefined : selectedDeptId);
                } catch (err: any) {
                  alert(err.message || 'Export failed');
                }
              }}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                color: 'var(--notion-text)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Export complete clear details CSV"
            >
              <Download size={12} style={{ color: '#16a34a' }} />
              <span>{isTamil ? 'பதிவிறக்கு' : 'Export CSV'}</span>
            </button>

            {/* Print Official Matrix */}
            <button
              type="button"
              onClick={() => {
                const activeDeptObj = departments?.find((d) => String(d.id) === String(selectedDeptId));
                const deptTitle = selectedDeptId === 'ALL' ? 'All Departments' : activeDeptObj?.name || 'Department';
                printTasksTableReport(displayTasks, 'Tasks Digest Report', deptTitle);
              }}
              style={{
                fontSize: '11.5px',
                padding: '5px 10px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                color: 'var(--notion-text)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Print executive tasks matrix"
            >
              <Printer size={12} style={{ color: '#2563eb' }} />
              <span>{isTamil ? 'அச்சிடு' : 'Print'}</span>
            </button>

            {canCreateTask !== false && onOpenCreateTask && (
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="notion-btn notion-btn-primary"
                style={{
                  fontSize: '11.5px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
                }}
              >
                <Plus size={13} />
                <span>{t('newTask')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row B: Live Search & Dropdown Filter Selectors */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px solid var(--notion-border-subtle)',
          }}
        >
          {/* Real-time search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'var(--notion-input-bg)',
              border: '1px solid var(--notion-border)',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            <Search size={13} style={{ color: 'var(--notion-text-dim)' }} />
            <input
              type="text"
              placeholder={isTamil ? 'பணிகளைத் தேடுங்கள்...' : 'Search tasks by title, ID, assignee...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '12px',
                color: 'var(--notion-text)',
                width: '100%',
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--notion-text-dim)', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Department, Staff, Priority Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            {departments && departments.length > 0 && onSelectDept && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '7px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  fontSize: '11.5px',
                }}
              >
                <Building size={12} style={{ color: 'var(--notion-text-muted)' }} />
                <select
                  value={String(selectedDeptId)}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    onSelectDept?.(val);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--notion-text)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontSize: '11.5px',
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
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '7px',
                  background: activeStaffId !== 'ALL' ? 'rgba(79, 70, 229, 0.09)' : 'var(--notion-item-bg)',
                  border: activeStaffId !== 'ALL' ? '1.5px solid #4f46e5' : '1px solid var(--notion-border-subtle)',
                  fontSize: '11.5px',
                }}
              >
                <Users size={12} style={{ color: activeStaffId !== 'ALL' ? '#4f46e5' : 'var(--notion-text-muted)' }} />
                <select
                  value={String(activeStaffId)}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : e.target.value;
                    handleSelectStaff(val);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: activeStaffId !== 'ALL' ? '#4f46e5' : 'var(--notion-text)',
                    cursor: 'pointer',
                    outline: 'none',
                    fontSize: '11.5px',
                    fontWeight: activeStaffId !== 'ALL' ? 700 : 500,
                    fontFamily: 'inherit',
                    maxWidth: '170px',
                  }}
                >
                  <option value="ALL">{isTamil ? 'அனைத்து பணியாளர்கள்' : 'All Staff'} ({taskPool.length})</option>
                  <option value="UNASSIGNED">
                    {isTamil ? 'ஒதுக்கப்படாதவை' : 'Unassigned Tasks'} ({taskPool.filter((t) => !t.assigned_to && parseCoAssignedTeam(t.description).team.length === 0).length})
                  </option>
                  {availableStaff.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>
                      {s.name} {s.dept ? `[${s.dept}]` : ''}
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
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '7px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border-subtle)',
                fontSize: '11.5px',
              }}
            >
              <Filter size={12} style={{ color: 'var(--notion-text-muted)' }} />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontSize: '11.5px',
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

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setQuickFilter('ALL');
                  onSelectDept?.('ALL');
                  handleSelectStaff('ALL');
                  setSelectedPriority('ALL');
                }}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕ Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT STAFF SPOTLIGHT BAR (When a staff member is filtered)          */}
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
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: getAvatarBg(selectedPersonObj.full_name || selectedPersonObj.username),
                color: '#fff',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              }}
            >
              {getInitials(selectedPersonObj.full_name || selectedPersonObj.username)}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--notion-text)' }}>
                {selectedPersonObj.full_name || selectedPersonObj.username}
                {selectedPersonObj.department_name && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', marginLeft: '8px' }}>
                    [{selectedPersonObj.department_name}]
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                {personUrgentWork.length} urgent • {personInProcessWork.length} in progress • {personTasks.length} total tasks
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
                fontWeight: 650,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Share2 size={12} />
              <span>Share Digest</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectStaff('ALL')}
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
      {/* 3. 5 HIGH-GRADE KANBAN COLUMNS WITH INTERACTIVE DRAG & DROP               */}
      {/* ========================================================================= */}
      <div
        className="notion-kanban-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(250px, 1fr))',
          gap: '14px',
          alignItems: 'start',
          flex: 1,
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {columnsConfig.map((col) => {
          const colTasks = displayTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              className={`notion-kanban-column ${isOver ? 'column-drag-over' : ''}`}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              style={{
                background: isOver ? col.lightBg : 'var(--notion-item-bg)',
                borderRadius: '14px',
                padding: '12px 10px 14px',
                border: isOver ? `2px dashed ${col.color}` : '1px solid var(--notion-border-subtle)',
                minHeight: '520px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isOver ? `0 0 16px ${col.color}25` : 'none',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 10px',
                  borderBottom: `2px solid ${col.color}`,
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '6px',
                      background: col.lightBg,
                      color: col.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <col.icon size={12} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                    {isTamil ? col.taLabel : col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: col.color,
                      background: col.lightBg,
                      padding: '1px 7px',
                      borderRadius: '10px',
                      border: `1px solid ${col.borderColor}`,
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
                      background: 'rgba(79, 70, 229, 0.1)',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Quick Add Task"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Task Cards List / Drop Zone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colTasks.map((t) => {
                  const timeline = isDueTodayOrOverdue(t);
                  const isOverdue = timeline?.isOverdue;
                  const isToday = timeline?.isToday;
                  const priorityTheme = getPriorityTheme(t.priority);
                  const directive = parseGmDirective(t);
                  const isDragging = draggingTaskId === t.id;
                  const isMenuOpen = activeMenuTaskId === t.id;

                  return (
                    <div
                      key={t.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectTask(t)}
                      style={{
                        background: 'var(--notion-card)',
                        borderRadius: '12px',
                        padding: cardDensity === 'compact' ? '9px 11px' : '12px 13px',
                        border: '1px solid var(--notion-border)',
                        borderLeft: `4px solid ${priorityTheme.stripe}`,
                        boxShadow: 'var(--notion-shadow-sm)',
                        cursor: 'grab',
                        opacity: isDragging ? 0.45 : 1,
                        transform: isDragging ? 'scale(0.97)' : 'none',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(15, 23, 42, 0.12)';
                        e.currentTarget.style.borderColor = col.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'var(--notion-shadow-sm)';
                        e.currentTarget.style.borderColor = 'var(--notion-border)';
                      }}
                    >
                      {/* Top Badges Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {/* Priority Pill */}
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '1.5px 6px',
                              borderRadius: '6px',
                              background: priorityTheme.bg,
                              color: priorityTheme.color,
                              border: `1px solid ${priorityTheme.border}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityTheme.color }} />
                            <span>{priorityTheme.label}</span>
                          </span>

                          {/* GM Directive Pill */}
                          {directive.isAssignedByGm && (
                            <span
                              title={`Assigned by General Manager (${directive.channelDisplay}) • Created by ${t.created_by_name || 'Staff'}`}
                              style={{
                                fontSize: '9.5px',
                                background: 'rgba(124, 58, 237, 0.12)',
                                color: '#7c3aed',
                                border: '1px solid rgba(124, 58, 237, 0.3)',
                                fontWeight: 800,
                                padding: '1.5px 6px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <span>{directive.channelIcon}</span>
                              <span>GM</span>
                            </span>
                          )}

                          {/* Department Tag */}
                          {t.department_name && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                color: 'var(--notion-text-dim)',
                                fontWeight: 700,
                                background: 'var(--notion-item-bg)',
                                padding: '1.5px 5px',
                                borderRadius: '4px',
                                border: '1px solid var(--notion-border-subtle)',
                              }}
                              title={t.department_name}
                            >
                              {t.department_code || t.department_name.slice(0, 12)}
                            </span>
                          )}
                        </div>

                        {/* Task ID and Quick Move Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            #{t.id}
                          </span>

                          {/* 1-Click Move Menu Trigger */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTaskId(isMenuOpen ? null : t.id);
                              }}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '4px',
                                border: 'none',
                                background: isMenuOpen ? 'var(--notion-border)' : 'transparent',
                                color: 'var(--notion-text-dim)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Move task to stage"
                            >
                              <MoreHorizontal size={12} />
                            </button>

                            {/* Floating Move Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '22px',
                                  right: 0,
                                  background: 'var(--notion-card)',
                                  border: '1px solid var(--notion-border)',
                                  borderRadius: '8px',
                                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                                  padding: '4px',
                                  zIndex: 100,
                                  minWidth: '150px',
                                }}
                              >
                                <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--notion-text-dim)', padding: '3px 8px', textTransform: 'uppercase' }}>
                                  Move Task To:
                                </div>
                                {columnsConfig.map((targetCol) => {
                                  if (targetCol.id === t.status) return null;
                                  return (
                                    <button
                                      key={targetCol.id}
                                      type="button"
                                      onClick={async () => {
                                        setActiveMenuTaskId(null);
                                        await handleCardStatusChange(t, targetCol.id);
                                      }}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: targetCol.color,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = targetCol.lightBg)}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <MoveRight size={11} />
                                      <span>{targetCol.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4
                        style={{
                          margin: '0 0 5px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: 'var(--notion-text)',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {t.title}
                      </h4>

                      {/* Description preview (Comfortable Mode) */}
                      {cardDensity === 'comfortable' && t.description && (
                        <p
                          style={{
                            margin: '0 0 6px',
                            fontSize: '11px',
                            color: 'var(--notion-text-muted)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {t.description.replace(/<!--.*?-->/g, '').trim()}
                        </p>
                      )}

                      {/* Co-Assigned Badge */}
                      {(() => {
                        const { team } = parseCoAssignedTeam(t.description);
                        if (team.length > 1) {
                          return (
                            <div style={{ marginBottom: '6px' }}>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  color: '#0284c7',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.25)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                                title={team.map((m) => `${m.staffName} (${m.deptName})`).join(', ')}
                              >
                                <Users size={9} />
                                <span>+{team.length - 1} co-assigned</span>
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Footer: Assignee, Timeline & 1-Click Action */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px solid var(--notion-border-subtle)',
                        }}
                      >
                        {/* Assignee Avatar + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: getAvatarBg(t.assigned_to_name),
                              color: '#ffffff',
                              fontSize: '9px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(t.assigned_to_name)}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 650,
                              color: 'var(--notion-text)',
                              maxWidth: '100px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.assigned_to_name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Right: Due Date & 1-Click Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {/* Due Date Indicator */}
                          {t.due_date && (
                            <span
                              style={{
                                color: isOverdue ? '#dc2626' : isToday ? '#d97706' : 'var(--notion-text-dim)',
                                background: isOverdue ? 'rgba(239, 68, 68, 0.08)' : isToday ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                                padding: isOverdue || isToday ? '1px 5px' : 0,
                                borderRadius: '4px',
                                fontWeight: isOverdue || isToday ? 800 : 500,
                                fontSize: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                              title={`Due: ${t.due_date}`}
                            >
                              {isOverdue && <AlertTriangle size={9} />}
                              {isToday && <Clock size={9} />}
                              <span>{formatShortDueDate(t.due_date)}</span>
                            </span>
                          )}

                          {/* 1-Click Status Action Buttons */}
                          {t.status === 'TODO' && onStartTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTask(t);
                              }}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 4px rgba(37, 99, 235, 0.3)',
                              }}
                              title="Start working on this task"
                            >
                              <Play size={9} />
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
                              style={{
                                padding: '2px 8px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.3)',
                              }}
                              title="Submit task for GM verification"
                            >
                              <Send size={9} />
                              <span>Submit</span>
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
                                padding: '2px 8px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.3)',
                              }}
                              title="Approve and close this task"
                            >
                              <CheckCircle2 size={10} />
                              <span>Approve</span>
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
                                padding: '2px 8px',
                                borderRadius: '5px',
                                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 1px 4px rgba(225, 29, 72, 0.3)',
                              }}
                              title="Resume work with requested updates"
                            >
                              <RotateCcw size={9} />
                              <span>Resume</span>
                            </button>
                          )}

                          {t.status === 'CLOSED' && (
                            <span
                              style={{
                                color: '#059669',
                                fontWeight: 800,
                                fontSize: '10px',
                                background: 'rgba(5, 150, 105, 0.1)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <CheckCheck size={10} />
                              <span>Done</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Polished Empty State for Columns with 0 Tasks */}
                {colTasks.length === 0 && (
                  <div
                    style={{
                      padding: '32px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px dashed var(--notion-border-subtle)',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.01)',
                      color: 'var(--notion-text-dim)',
                      textAlign: 'center',
                      gap: '6px',
                      marginTop: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: col.lightBg,
                        color: col.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <col.icon size={15} />
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>
                      {col.emptyHint}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)' }}>
                      Drag tasks here to update stage
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. SHARE DIGEST MODAL (Preserved & Enhanced)                              */}
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
                <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--notion-text)' }}>
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
