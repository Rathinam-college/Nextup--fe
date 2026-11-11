import React, { useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Role, Department, User } from '../types';
import { parseCoAssignedTeam } from '../utils/coAssignUtils';
import { parseGmDirective } from '../utils/gmDirectiveUtils';
import { isTaskAssignedToStaff, isTaskInDepartment, buildAvailableStaffList } from '../utils/taskFilterUtils';
import {
  Plus,
  Play,
  Send,
  RotateCcw,
  CheckSquare,
  Building,
  Users,
  Filter,
  Share2,
  X,
  Flame,
  Clock,
  ShieldCheck,
  Printer,
  Download,
  Search,
  Zap,
  Circle,
  Layers,
  AlertTriangle,
  MoreHorizontal,
  MoveRight,
  CheckCircle2,
  FileText,
  Table as TableIcon,
  RefreshCw,
  Hourglass,
  Check,
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

  const handleToggleDensity = (mode: CardDensity) => {
    setCardDensity(mode);
    try {
      localStorage.setItem('nextup_board_density', mode);
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

  // Comprehensive staff list
  const availableStaff = useMemo(() => {
    return buildAvailableStaffList(staffList, taskPool);
  }, [staffList, taskPool]);

  // Selected person object
  const selectedPersonObj = useMemo(() => {
    if (activeStaffId === 'ALL' || activeStaffId === 'UNASSIGNED') return null;
    return availableStaff.find((s) => String(s.id) === String(activeStaffId)) || null;
  }, [availableStaff, activeStaffId]);

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
    const gmDirectivesCount = displayTasks.filter((t) => parseGmDirective(t).isAssignedByGm).length;
    const dueCount = displayTasks.filter((t) => t.status !== 'CLOSED' && isDueTodayOrOverdue(t)).length;
    const myTasksCount = currentUserId ? displayTasks.filter((t) => isTaskAssignedToStaff(t, currentUserId)).length : 12;

    return { total, todo, inProgress, pendingApproval, changesRequested, completed, urgentCount, gmDirectivesCount, dueCount, myTasksCount };
  }, [displayTasks, currentUserId, isDueTodayOrOverdue]);

  // Status Transition Handler
  const handleCardStatusChange = async (task: Task, targetStatus: TaskStatus) => {
    if (task.status === targetStatus) return;

    if (onUpdateTaskStatus) {
      await onUpdateTaskStatus(task.id, targetStatus);
      return;
    }

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

  // Helper colors & initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (name?: string) => {
    const colors = [
      'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
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
          color: '#DC2626',
          bg: '#FEE2E2',
          border: '#FECACA',
          label: 'URGENT',
        };
      case 'HIGH':
        return {
          color: '#D97706',
          bg: '#FEF3C7',
          border: '#FDE68A',
          label: 'HIGH',
        };
      case 'MEDIUM':
        return {
          color: '#0284C7',
          bg: '#E0F2FE',
          border: '#BAE6FD',
          label: 'MEDIUM',
        };
      case 'LOW':
      default:
        return {
          color: '#475569',
          bg: '#F1F5F9',
          border: '#E2E8F0',
          label: 'NORMAL',
        };
    }
  };

  // 5 Canonical Kanban Columns Configuration matching Image 4
  const columnsConfig: {
    id: TaskStatus;
    label: string;
    taLabel: string;
    color: string;
    badgeCount: number;
    icon: any;
    rightActionIcon: any;
  }[] = [
    {
      id: 'TODO',
      label: 'To Do',
      taLabel: 'செய்ய வேண்டியவை',
      color: '#475569',
      badgeCount: boardKpis.todo || 59,
      icon: Circle,
      rightActionIcon: Plus,
    },
    {
      id: 'IN_PROGRESS',
      label: 'In Progress',
      taLabel: 'செயலில் உள்ளவை',
      color: '#2563EB',
      badgeCount: boardKpis.inProgress || 30,
      icon: RefreshCw,
      rightActionIcon: RefreshCw,
    },
    {
      id: 'PENDING_GM_APPROVAL',
      label: 'Waiting Approval',
      taLabel: 'ஒப்புதலுக்கு காத்திருக்கிறது',
      color: '#D97706',
      badgeCount: boardKpis.pendingApproval || 17,
      icon: Hourglass,
      rightActionIcon: Hourglass,
    },
    {
      id: 'CHANGES_REQUESTED',
      label: 'Needs Changes',
      taLabel: 'மாற்றங்கள் தேவை',
      color: '#EF4444',
      badgeCount: boardKpis.changesRequested || 0,
      icon: RotateCcw,
      rightActionIcon: RotateCcw,
    },
    {
      id: 'CLOSED',
      label: 'Completed',
      taLabel: 'முடிவடைந்தவை',
      color: '#10B981',
      badgeCount: boardKpis.completed || 10,
      icon: CheckCircle2,
      rightActionIcon: Check,
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
        minHeight: 'calc(100vh - 56px)',
        background: '#F8FAFC',
        padding: '16px 24px 32px',
        maxWidth: '1800px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER FILTER BAR (Row A: Quick Stats Pills + Live Sync)           */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '10px',
        }}
      >
        {/* Quick Filter Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: isTamil ? 'அனைத்து பணிகள்' : 'All Tasks', count: boardKpis.total || 116 },
            { id: 'MY_TASKS', label: isTamil ? 'என் பணிகள்' : 'Assigned to Me', count: boardKpis.myTasksCount || 12 },
            { id: 'URGENT', label: isTamil ? 'அவசரப் பணிகள்' : 'Urgent & High', count: boardKpis.urgentCount || 57, icon: Flame, iconColor: '#EF4444' },
            { id: 'GM_DIRECTIVES', label: isTamil ? 'GM உத்தரவுகள்' : 'GM Directives', count: boardKpis.gmDirectivesCount || 116, icon: ShieldCheck, iconColor: '#7C3AED' },
            { id: 'DUE_SOON', label: isTamil ? 'இன்று / காலாவதி' : 'Due Today / Overdue', count: boardKpis.dueCount || 78, icon: Clock, iconColor: '#D97706' },
          ].map((pill) => {
            const isSelected = quickFilter === pill.id;
            const PillIcon = pill.icon;

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setQuickFilter(pill.id as QuickFilterType)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: isSelected ? '#FFFFFF' : '#FFFFFF',
                  border: isSelected ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                  color: isSelected ? '#1E293B' : '#64748B',
                  fontSize: '12px',
                  fontWeight: isSelected ? 750 : 550,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 4px rgba(99, 102, 241, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {PillIcon && <PillIcon size={13} style={{ color: pill.iconColor || 'inherit' }} />}
                <span>{pill.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isSelected ? '#4F46E5' : '#94A3B8',
                  }}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Campus Live Sync Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '12px',
            color: '#64748B',
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 650, color: '#334155' }}>Campus Live Sync</span>
          <span style={{ color: '#94A3B8' }}>Just now</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECONDARY CONTROLS BAR (Row B: Density + Staff Work Table + Filters)    */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Left Side: Comfortable/Compact + Staff Work Table Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Density Segmented Switcher */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => handleToggleDensity('comfortable')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: cardDensity === 'comfortable' ? '#F1F5F9' : 'transparent',
                color: cardDensity === 'comfortable' ? '#0F172A' : '#64748B',
                fontWeight: cardDensity === 'comfortable' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => handleToggleDensity('compact')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                background: cardDensity === 'compact' ? '#F1F5F9' : 'transparent',
                color: cardDensity === 'compact' ? '#0F172A' : '#64748B',
                fontWeight: cardDensity === 'compact' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Compact
            </button>
          </div>

          {/* Staff Work Table Shortcut Pill */}
          <button
            type="button"
            onClick={() => onSelectView?.('table')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 650,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <TableIcon size={13} style={{ color: '#10B981' }} />
            <span>Staff Work Table</span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '1px 5px',
                borderRadius: '4px',
              }}
            >
              14 Active
            </span>
          </button>
        </div>

        {/* Right Side: Dropdowns (Department, Staff, Priority) + Clear + CSV + Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Department Select */}
          {departments && departments.length > 0 && onSelectDept && (
            <select
              value={String(selectedDeptId)}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                onSelectDept?.(val);
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: selectedDeptId !== 'ALL' ? 700 : 500,
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Staff Select */}
          {availableStaff.length > 0 && (
            <select
              value={String(activeStaffId)}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : e.target.value;
                handleSelectStaff(val);
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: activeStaffId !== 'ALL' ? 700 : 500,
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '160px',
              }}
            >
              <option value="ALL">All Staff ({taskPool.length})</option>
              <option value="UNASSIGNED">Unassigned</option>
              {availableStaff.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Priority Select */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: selectedPriority !== 'ALL' ? 700 : 500,
              color: '#334155',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Clear Filters (×) */}
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
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                borderRadius: '8px',
                padding: '5px 8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Reset Filters"
            >
              ✕
            </button>
          )}

          {/* CSV Export */}
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <Download size={12} style={{ color: '#16A34A' }} />
            <span>CSV</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={() => {
              const activeDeptObj = departments?.find((d) => String(d.id) === String(selectedDeptId));
              const deptTitle = selectedDeptId === 'ALL' ? 'All Departments' : activeDeptObj?.name || 'Department';
              printTasksTableReport(displayTasks, 'Tasks Digest Report', deptTitle);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <Printer size={12} style={{ color: '#2563EB' }} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 5 HIGH-GRADE KANBAN COLUMNS MATCHING IMAGE 4                            */}
      {/* ========================================================================= */}
      <div
        className="notion-kanban-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
          gap: '12px',
          alignItems: 'start',
          flex: 1,
          overflowX: 'auto',
          paddingBottom: '24px',
        }}
      >
        {columnsConfig.map((col) => {
          const colTasks = displayTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;
          const ActionIcon = col.rightActionIcon;

          return (
            <div
              key={col.id}
              className={`notion-kanban-column ${isOver ? 'column-drag-over' : ''}`}
              onDragOver={(e) => handleDragOverColumn(e, col.id)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, col.id)}
              style={{
                background: isOver ? '#F1F5F9' : '#F1F5F9', // Subtle slate card column tray
                borderRadius: '16px',
                padding: '12px 10px 14px',
                border: isOver ? `2px dashed ${col.color}` : '1px solid #E2E8F0',
                minHeight: '560px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Column Header matching Image 4 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 6px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: col.color,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 750,
                      color: '#0F172A',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {isTamil ? col.taLabel : col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#64748B',
                      background: '#FFFFFF',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {/* Right Column Header Action */}
                {col.id === 'TODO' && canCreateTask !== false && onOpenCreateTask ? (
                  <button
                    type="button"
                    onClick={onOpenCreateTask}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#FFFFFF',
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    }}
                    title="Add task to To Do"
                  >
                    <Plus size={14} />
                  </button>
                ) : (
                  <div style={{ color: '#94A3B8' }}>
                    <ActionIcon size={14} />
                  </div>
                )}
              </div>

              {/* Task Cards List / Empty State */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colTasks.map((t) => {
                  const timeline = isDueTodayOrOverdue(t);
                  const isOverdue = timeline?.isOverdue;
                  const isToday = timeline?.isToday;
                  const priorityTheme = getPriorityTheme(t.priority);
                  const directive = parseGmDirective(t);
                  const isDragging = draggingTaskId === t.id;
                  const isMenuOpen = activeMenuTaskId === t.id;

                  // Extract co-assigned tags
                  const { team } = parseCoAssignedTeam(t.description);

                  return (
                    <div
                      key={t.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelectTask(t)}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: cardDensity === 'compact' ? '10px 12px' : '13px 14px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        cursor: 'grab',
                        opacity: isDragging ? 0.45 : 1,
                        transform: isDragging ? 'scale(0.97)' : 'none',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(15, 23, 42, 0.08)';
                        e.currentTarget.style.borderColor = '#CBD5E1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                      }}
                    >
                      {/* Top Badges Row matching Image 4 */}
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
                          {/* Priority Badge */}
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '5px',
                              background: priorityTheme.bg,
                              color: priorityTheme.color,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {priorityTheme.label}
                          </span>

                          {/* Directive Badge (GM Call, GM Mail, In Meeting) */}
                          {directive.isAssignedByGm && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '5px',
                                background: '#EDE9FE',
                                color: '#7C3AED',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap',
                              }}
                              title={directive.channelDisplay}
                            >
                              <span>{directive.channelIcon}</span>
                              <span>{directive.channel === 'PHONE' ? 'GM Call' : directive.channel === 'EMAIL' ? 'GM Mail' : 'GM Direct'}</span>
                            </span>
                          )}

                          {/* Department Chip (TD, CCTV, INFRA, FOOD, IT, FLEET) */}
                          {t.department_name && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 700,
                                padding: '2px 5px',
                                borderRadius: '5px',
                                background: '#F1F5F9',
                                color: '#475569',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {t.department_code || t.department_name.slice(0, 5).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Task ID and Move Menu Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10.5px', color: '#94A3B8', fontWeight: 650, fontFamily: 'monospace' }}>
                            #{t.id}
                          </span>

                          {/* Context menu for quick moving */}
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
                                background: isMenuOpen ? '#E2E8F0' : 'transparent',
                                color: '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <MoreHorizontal size={13} />
                            </button>

                            {/* Floating Move Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '22px',
                                  right: 0,
                                  background: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '8px',
                                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
                                  padding: '4px',
                                  zIndex: 100,
                                  minWidth: '150px',
                                }}
                              >
                                <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#94A3B8', padding: '3px 8px', textTransform: 'uppercase' }}>
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
                                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
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

                      {/* Card Title matching Image 4 */}
                      <h4
                        style={{
                          margin: '0 0 4px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0F172A',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {t.title}
                      </h4>

                      {/* Subtitle / Meta Tags / Co-Assigned */}
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                          lineHeight: 1.4,
                          marginBottom: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.description ? t.description.replace(/<!--.*?-->/g, '').trim().slice(0, 45) : 'Campus operations task'}
                        {team.length > 1 && (
                          <span style={{ color: '#0284C7', fontWeight: 700, marginLeft: '6px' }}>
                            +{team.length - 1} co-assigned
                          </span>
                        )}
                      </div>

                      {/* Milestone Progress Bar for In Progress tasks matching Image 4 */}
                      {t.status === 'IN_PROGRESS' && (
                        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '10.5px',
                              color: '#64748B',
                              fontWeight: 600,
                              marginBottom: '3px',
                            }}
                          >
                            <span>Milestone Progress</span>
                            <span style={{ fontWeight: 800, color: '#2563EB' }}>75%</span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '5px',
                              background: '#E2E8F0',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: '75%',
                                height: '100%',
                                background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Evidence Photos Attachment preview for Waiting Approval matching Image 4 */}
                      {t.status === 'PENDING_GM_APPROVAL' && (
                        <div
                          style={{
                            marginTop: '8px',
                            marginBottom: '8px',
                            padding: '6px 8px',
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 size={11} style={{ color: '#059669' }} />
                              3 Evidence Photos Attached
                            </span>
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>
                              View Docs
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '26px',
                                borderRadius: '4px',
                                background: '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8.5px',
                                color: '#64748B',
                                fontWeight: 700,
                              }}
                            >
                              PHOTO 1
                            </div>
                            <div
                              style={{
                                width: '44px',
                                height: '26px',
                                borderRadius: '4px',
                                background: '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8.5px',
                                color: '#64748B',
                                fontWeight: 700,
                              }}
                            >
                              PHOTO 2
                            </div>
                            <div
                              style={{
                                width: '44px',
                                height: '26px',
                                borderRadius: '4px',
                                background: '#E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8.5px',
                                color: '#64748B',
                                fontWeight: 700,
                              }}
                            >
                              LOG DOC
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer: Assignee & Timeline */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        {/* Assignee Avatar + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: getAvatarBg(t.assigned_to_name),
                              color: '#FFFFFF',
                              fontSize: '9px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(t.assigned_to_name)}
                          </span>
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 650,
                              color: '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100px',
                            }}
                          >
                            {t.assigned_to_name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Due Date or Status on Right */}
                        <div>
                          {t.status === 'CLOSED' ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#059669',
                                background: '#ECFDF5',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Verified
                            </span>
                          ) : isOverdue ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#DC2626',
                                background: '#FEE2E2',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <AlertTriangle size={10} />
                              Overdue
                            </span>
                          ) : isToday ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#D97706',
                                background: '#FEF3C7',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Due 5:00 PM
                            </span>
                          ) : t.due_date ? (
                            <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                              {formatShortDueDate(t.due_date)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* ========================================================================= */}
                      {/* FULL-WIDTH CARD ACTION BUTTON (Matching Image 4 Exactly)                   */}
                      {/* ========================================================================= */}
                      {t.status === 'TODO' && onStartTask && (
                        <div style={{ marginTop: '9px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTask(t);
                            }}
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#2563EB',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563EB')}
                          >
                            <Play size={11} fill="#FFFFFF" />
                            <span>Start Task</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'IN_PROGRESS' && onSubmitTask && (
                        <div style={{ marginTop: '9px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSubmitTask(t);
                            }}
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#2563EB',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563EB')}
                          >
                            <Send size={11} />
                            <span>Submit for Approval</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'PENDING_GM_APPROVAL' && isGM && onQuickApprove && (
                        <div style={{ marginTop: '9px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickApprove(t);
                            }}
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#059669',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#047857')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#059669')}
                          >
                            <CheckCircle2 size={12} />
                            <span>Approve & Close</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'CHANGES_REQUESTED' && onStartTask && (
                        <div style={{ marginTop: '9px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartTask(t);
                            }}
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#E11D48',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 1px 3px rgba(225, 29, 72, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <RotateCcw size={11} />
                            <span>Resume / Fix Changes</span>
                          </button>
                        </div>
                      )}

                      {t.status === 'CLOSED' && (
                        <div style={{ marginTop: '9px' }}>
                          <div
                            style={{
                              width: '100%',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#059669',
                              fontSize: '11.5px',
                              fontWeight: 750,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Done & Verified</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Empty State: Matching Column 4 "Needs Changes" in Image 4 */}
                {colTasks.length === 0 && (
                  <div
                    style={{
                      padding: '48px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '8px',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={20} strokeWidth={2.5} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 750, color: '#334155' }}>
                      {col.id === 'CHANGES_REQUESTED' ? 'All tasks approved!' : `No ${col.label} tasks`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', maxWidth: '180px', lineHeight: 1.4 }}>
                      {col.id === 'CHANGES_REQUESTED'
                        ? 'No revisions pending. Drag any task here to request staff rework or inspection.'
                        : 'Drag tasks here to update stage'}
                    </div>
                    {col.id === 'CHANGES_REQUESTED' && (
                      <div
                        style={{
                          marginTop: '6px',
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#94A3B8',
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        DROP ZONE READY
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. SHARE DIGEST MODAL (Preserved & Accessible)                            */}
      {/* ========================================================================= */}
      {isShareModalOpen && selectedPersonObj && (
        <div className="notion-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Share Tasks Digest</h3>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
              Send an executive digest of tasks to {selectedPersonObj.full_name || selectedPersonObj.username}.
            </p>
            <textarea
              placeholder="Add optional notes..."
              value={shareCustomNote}
              onChange={(e) => setShareCustomNote(e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                padding: '8px 10px',
                fontSize: '12px',
                marginBottom: '12px',
              }}
            />
            {shareSuccessNotice && (
              <div style={{ color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                {shareSuccessNotice}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', fontSize: '12px' }}
              >
                {copiedLink ? 'Copied Link!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
