import React, { useState, useMemo } from 'react';
import { Task, Department, User, Role } from '../types';
import { parseCoAssignedTeam } from '../utils/coAssignUtils';
import {
  Building,
  User as UserIcon,
  Users,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  CheckSquare,
  ArrowRight,
  Filter,
  Layers,
  Table as TableIcon,
  List,
  LayoutGrid,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Share2,
  Copy,
  Check,
  X,
  Mail,
  Edit,
  Play,
  Send,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Sparkles,
  RefreshCw,
  Briefcase,
  AlertCircle,
  Calendar,
  Zap,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface NotionTableViewProps {
  tasks: Task[];
  allTasks?: Task[];
  departments: Department[];
  staffList: User[];
  selectedDeptId: number | 'ALL';
  onSelectDept: (deptId: number | 'ALL') => void;
  onSelectTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onOpenCreateTask?: (deptId?: number, isIssue?: boolean) => void;
  canCreateTask?: boolean;
  currentUserRole?: Role;
  currentUserId?: number;
  onStartTask?: (task: Task) => void;
  onSubmitTask?: (task: Task) => void;
  onQuickApprove?: (task: Task) => void;
}

type ViewMode = 'matrix' | 'cards' | 'flat';
type WorkloadFilter = 'ALL' | 'ACTIVE_ONLY' | 'HEAVY' | 'URGENT' | 'AVAILABLE';
type SortField = 'id' | 'title' | 'department' | 'status' | 'priority' | 'assignee' | 'due_date';
type SortDirection = 'asc' | 'desc';

export const NotionTableView: React.FC<NotionTableViewProps> = ({
  tasks,
  allTasks,
  departments,
  staffList,
  selectedDeptId,
  onSelectDept,
  onSelectTask,
  onEditTask,
  onOpenCreateTask,
  canCreateTask,
  currentUserRole,
  currentUserId,
  onStartTask,
  onSubmitTask,
  onQuickApprove,
}) => {
  const { t, isTamil } = useLanguage();

  // Source tasks pool (prefer allTasks if present)
  const sourceTasks = allTasks && allTasks.length > 0 ? allTasks : tasks;

  // View modes: 'matrix' (Staff Workload Matrix), 'cards' (Staff Cards), 'flat' (Interactive Data Table)
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');

  // Search input across staff & task content
  const [searchQuery, setSearchQuery] = useState('');

  // Workload status filter
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>('ALL');

  // Priority filter for task filtering
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Department cards expanded vs compact horizontal bar
  const [showDeptDetails, setShowDeptDetails] = useState(false);

  // Today's date normalized
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Sorting state for Data Table mode
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination for Data Table mode
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Share Work Modal state
  const [shareTargetStaff, setShareTargetStaff] = useState<User | null>(null);
  const [shareCustomNote, setShareCustomNote] = useState('');
  const [sendingShare, setSendingShare] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Active department object
  const activeDepartment = useMemo(() => {
    if (selectedDeptId === 'ALL') return null;
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Tasks scoped to the selected department
  const departmentScopedTasks = useMemo(() => {
    if (selectedDeptId === 'ALL') return sourceTasks;
    return sourceTasks.filter((t) => t.department === selectedDeptId);
  }, [sourceTasks, selectedDeptId]);

  // KPI Overview Metrics for current context
  const kpiMetrics = useMemo(() => {
    const total = departmentScopedTasks.length;
    const open = departmentScopedTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED').length;
    const inProgress = departmentScopedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const pendingReview = departmentScopedTasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
    const closed = departmentScopedTasks.filter((t) => t.status === 'CLOSED').length;
    const urgent = departmentScopedTasks.filter((t) => {
      const isUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';
      const isOverdue = t.due_date && t.due_date < todayStr && t.status !== 'CLOSED';
      return isUrgent || isOverdue;
    }).length;
    const activeStaff = staffList.filter((s) => {
      if (s.is_active === false) return false;
      if (selectedDeptId === 'ALL') return true;
      return s.department === selectedDeptId;
    }).length;

    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, open, inProgress, pendingReview, closed, urgent, activeStaff, completionRate };
  }, [departmentScopedTasks, staffList, selectedDeptId, todayStr]);

  // Department statistics breakdown
  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const deptTasks = sourceTasks.filter((t) => t.department === dept.id);
      const openCount = deptTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED').length;
      const inProcessCount = deptTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL').length;
      const completedCount = deptTasks.filter((t) => t.status === 'CLOSED').length;
      const staffInDept = staffList.filter((s) => s.department === dept.id && s.is_active !== false);

      return {
        dept,
        totalTasks: deptTasks.length,
        openCount,
        inProcessCount,
        completedCount,
        staffCount: staffInDept.length,
      };
    });
  }, [departments, sourceTasks, staffList]);

  // Staff list filtered by department and search query
  const filteredStaffList = useMemo(() => {
    let list = staffList.filter((s) => s.is_active !== false);
    if (selectedDeptId !== 'ALL') {
      list = list.filter((s) => s.department === selectedDeptId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => {
        const matchesStaff =
          s.full_name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.job_title && s.job_title.toLowerCase().includes(q)) ||
          (s.department_name && s.department_name.toLowerCase().includes(q));

        if (matchesStaff) return true;

        // Also check if any task assigned to this staff matches the query
        const userTasks = departmentScopedTasks.filter((t) => t.assigned_to === s.id);
        return userTasks.some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.id.toString() === q.replace('#', '') ||
            (t.description && t.description.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [staffList, selectedDeptId, searchQuery, departmentScopedTasks]);

  // Precompute staff workload status before applying the active workload filter
  const allStaffWorkloadRows = useMemo(() => {
    return filteredStaffList.map((staff) => {
      let userTasks = departmentScopedTasks.filter((t) => t.assigned_to === staff.id);

      // Apply priority filter if set
      if (priorityFilter !== 'ALL') {
        userTasks = userTasks.filter((t) => t.priority === priorityFilter);
      }

      // If search query is present, highlight/filter tasks matching it
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const staffMatchesDirectly =
          staff.full_name.toLowerCase().includes(q) ||
          staff.username.toLowerCase().includes(q) ||
          staff.email.toLowerCase().includes(q);

        if (!staffMatchesDirectly) {
          userTasks = userTasks.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.id.toString() === q.replace('#', '') ||
              (t.description && t.description.toLowerCase().includes(q))
          );
        }
      }

      const openTasks = userTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED');
      const inProcessTasks = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');
      const completedTasks = userTasks.filter((t) => t.status === 'CLOSED');

      const totalTasks = userTasks.length;
      const activeCount = openTasks.length + inProcessTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

      // Workload status classification
      let workloadLevel: 'available' | 'balanced' | 'busy' | 'overloaded' = 'available';
      if (activeCount >= 8) workloadLevel = 'overloaded';
      else if (activeCount >= 4) workloadLevel = 'busy';
      else if (activeCount >= 1) workloadLevel = 'balanced';

      const hasUrgent = userTasks.some((t) => {
        if (t.status === 'CLOSED') return false;
        return t.priority === 'URGENT' || t.priority === 'HIGH' || (t.due_date && t.due_date < todayStr);
      });

      return {
        staff,
        userTasks,
        openTasks,
        inProcessTasks,
        completedTasks,
        totalTasks,
        activeCount,
        completionRate,
        workloadLevel,
        hasUrgent,
      };
    });
  }, [filteredStaffList, departmentScopedTasks, priorityFilter, searchQuery, todayStr]);

  // Dynamic workload category counts for the filter cards
  const workloadCounts = useMemo(() => {
    let all = allStaffWorkloadRows.length;
    let active = 0;
    let heavy = 0;
    let urgent = 0;
    let available = 0;

    allStaffWorkloadRows.forEach((r) => {
      if (r.activeCount > 0) active++;
      if (r.activeCount >= 4) heavy++;
      if (r.activeCount === 0) available++;
      if (r.hasUrgent) urgent++;
    });

    return { all, active, heavy, urgent, available };
  }, [allStaffWorkloadRows]);

  // Final filtered staff matrix data according to the selected workload tab
  const staffMatrixData = useMemo(() => {
    if (workloadFilter === 'ACTIVE_ONLY') {
      return allStaffWorkloadRows.filter((r) => r.activeCount > 0);
    }
    if (workloadFilter === 'HEAVY') {
      return allStaffWorkloadRows.filter((r) => r.activeCount >= 4);
    }
    if (workloadFilter === 'URGENT') {
      return allStaffWorkloadRows.filter((r) => r.hasUrgent);
    }
    if (workloadFilter === 'AVAILABLE') {
      return allStaffWorkloadRows.filter((r) => r.activeCount === 0);
    }
    return allStaffWorkloadRows;
  }, [allStaffWorkloadRows, workloadFilter]);

  // Unassigned tasks in current scope
  const unassignedTasks = useMemo(() => {
    let unassigned = departmentScopedTasks.filter((t) => !t.assigned_to);

    if (priorityFilter !== 'ALL') {
      unassigned = unassigned.filter((t) => t.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      unassigned = unassigned.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toString() === q.replace('#', '') ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return {
      open: unassigned.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED'),
      inProcess: unassigned.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL'),
      completed: unassigned.filter((t) => t.status === 'CLOSED'),
      total: unassigned.length,
    };
  }, [departmentScopedTasks, priorityFilter, searchQuery]);

  // Flat tasks data (for Data Table mode) with sorting & filtering
  const sortedAndFilteredFlatTasks = useMemo(() => {
    let list = [...departmentScopedTasks];

    // Priority filter
    if (priorityFilter !== 'ALL') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Workload filter applied to flat list
    if (workloadFilter === 'ACTIVE_ONLY') {
      list = list.filter((t) => t.status !== 'CLOSED');
    } else if (workloadFilter === 'URGENT') {
      list = list.filter((t) => {
        if (t.status === 'CLOSED') return false;
        return t.priority === 'URGENT' || t.priority === 'HIGH' || (t.due_date && t.due_date < todayStr);
      });
    } else if (workloadFilter === 'HEAVY') {
      const heavyStaffIds = new Set(
        allStaffWorkloadRows.filter((r) => r.activeCount >= 4).map((r) => r.staff.id)
      );
      list = list.filter((t) => t.assigned_to && heavyStaffIds.has(t.assigned_to));
    } else if (workloadFilter === 'AVAILABLE') {
      const availableStaffIds = new Set(
        allStaffWorkloadRows.filter((r) => r.activeCount === 0).map((r) => r.staff.id)
      );
      list = list.filter((t) => !t.assigned_to || availableStaffIds.has(t.assigned_to));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toString() === q.replace('#', '') ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(q)) ||
          (t.department_name && t.department_name.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortField) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'title':
          aVal = (a.title || '').toLowerCase();
          bVal = (b.title || '').toLowerCase();
          break;
        case 'department':
          aVal = (a.department_name || '').toLowerCase();
          bVal = (b.department_name || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'priority': {
          const priWeights: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          aVal = priWeights[a.priority] || 0;
          bVal = priWeights[b.priority] || 0;
          break;
        }
        case 'assignee':
          aVal = (a.assigned_to_name || 'zzz').toLowerCase();
          bVal = (b.assigned_to_name || 'zzz').toLowerCase();
          break;
        case 'due_date':
          aVal = a.due_date || '9999-99-99';
          bVal = b.due_date || '9999-99-99';
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [departmentScopedTasks, priorityFilter, searchQuery, sortField, sortDirection]);

  // Paginated tasks for Data Table mode
  const paginatedFlatTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFilteredFlatTasks.slice(start, start + pageSize);
  }, [sortedAndFilteredFlatTasks, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedAndFilteredFlatTasks.length / pageSize) || 1;

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Client-side CSV Export
  const handleExportCsv = () => {
    const headers = ['ID', 'Title', 'Department', 'Status', 'Priority', 'Assigned To', 'Due Date', 'Verified By'];
    const rows = sortedAndFilteredFlatTasks.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.department_name || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${(t.assigned_to_name || 'Unassigned').replace(/"/g, '""')}"`,
      t.due_date || '',
      `"${(t.verified_by_name || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const deptTag = activeDepartment ? activeDepartment.code : 'ALL';
    link.setAttribute('download', `NextUp_Workload_Table_${deptTag}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share Work Modal Helpers
  const shareTargetTasks = useMemo(() => {
    if (!shareTargetStaff) return { urgent: [], inProcess: [] };
    const userTasks = sourceTasks.filter((t) => t.assigned_to === shareTargetStaff.id && t.status !== 'CLOSED');
    const urgent = userTasks.filter((t) => {
      const isUrgentPri = t.priority === 'URGENT' || t.priority === 'HIGH';
      const isDueSoon = t.due_date && t.due_date <= todayStr;
      const isAwaitingReview = t.status === 'PENDING_GM_APPROVAL';
      return isUrgentPri || isDueSoon || isAwaitingReview;
    });
    const inProcess = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');
    return { urgent, inProcess };
  }, [shareTargetStaff, sourceTasks, todayStr]);

  const generateShareSummaryTextForStaff = (staff: User) => {
    let text = `Work Allocation & Task Digest for ${staff.full_name || staff.username}\n`;
    text += `Staff: ${staff.full_name || staff.username} (${staff.email || 'No email'})\n`;
    if (staff.department_name) text += `Department: ${staff.department_name}\n`;
    text += `Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
    text += `----------------------------------------\n\n`;

    if (shareTargetTasks.urgent.length > 0) {
      text += `🚨 URGENT / ATTENTION DELIVERABLES (${shareTargetTasks.urgent.length}):\n`;
      shareTargetTasks.urgent.forEach((t, idx) => {
        text += `${idx + 1}. [${t.priority}] #${t.id}: ${t.title} (Due: ${t.due_date || 'No date'})\n`;
      });
      text += `\n`;
    }

    if (shareTargetTasks.inProcess.length > 0) {
      text += `⚡ IN-PROGRESS DELIVERABLES (${shareTargetTasks.inProcess.length}):\n`;
      shareTargetTasks.inProcess.forEach((t, idx) => {
        text += `${idx + 1}. #${t.id}: ${t.title} (${t.status === 'PENDING_GM_APPROVAL' ? 'Pending Review' : 'In Progress'})\n`;
      });
      text += `\n`;
    }

    if (shareTargetTasks.urgent.length === 0 && shareTargetTasks.inProcess.length === 0) {
      text += `No pending urgent or in-progress tasks. All work up-to-date!\n\n`;
    }

    text += `----------------------------------------\n`;
    text += `Workspace Link: ${typeof window !== 'undefined' ? window.location.href : ''}\n`;
    return text;
  };

  const handleCopySummary = () => {
    if (!shareTargetStaff) return;
    const text = generateShareSummaryTextForStaff(shareTargetStaff);
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
    if (!shareTargetStaff) return;
    const targetTask =
      shareTargetTasks.urgent[0] ||
      shareTargetTasks.inProcess[0] ||
      sourceTasks.find((t) => t.assigned_to === shareTargetStaff.id);

    if (!targetTask) {
      alert('No tasks found to dispatch');
      return;
    }

    try {
      setSendingShare(true);
      const notePrefix = shareCustomNote.trim() ? `${shareCustomNote.trim()}\n\n` : '';
      const summaryText = generateShareSummaryTextForStaff(shareTargetStaff);
      const fullMessage = `${notePrefix}${summaryText}`;

      await api.pushMessageToAssignee(targetTask.id, {
        message: fullMessage,
        send_email: true,
        send_in_app: true,
        is_urgent: true,
      });

      setShareSuccessNotice(
        `✓ Tasks successfully dispatched via official email digest to ${shareTargetStaff.full_name || shareTargetStaff.username} (${shareTargetStaff.email})!`
      );
      setTimeout(() => {
        setShareTargetStaff(null);
        setShareSuccessNotice(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch tasks');
    } finally {
      setSendingShare(false);
    }
  };

  // Helper Badge Renderers
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return (
          <span
            className="notion-tag tag-red"
            style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          >
            <Flame size={10} style={{ color: '#ef4444' }} />
            <span>{t('priority_urgent')}</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="notion-tag tag-orange" style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 600 }}>
            {t('priority_high')}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="notion-tag tag-blue" style={{ fontSize: '10px', padding: '1px 6px', fontWeight: 600 }}>
            {t('priority_medium')}
          </span>
        );
      case 'LOW':
        return (
          <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
            {t('priority_low')}
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <span className="notion-tag tag-gray" style={{ fontSize: '10.5px' }}>{t('status_todo')}</span>;
      case 'IN_PROGRESS':
        return (
          <span
            className="notion-tag tag-blue"
            style={{ fontSize: '10.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
            {t('status_in_progress')}
          </span>
        );
      case 'PENDING_GM_APPROVAL':
        return (
          <span
            className="notion-tag tag-yellow"
            style={{ fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Clock size={11} />
            {t('status_pending_gm_approval')}
          </span>
        );
      case 'CHANGES_REQUESTED':
        return <span className="notion-tag tag-red" style={{ fontSize: '10.5px', fontWeight: 700 }}>{t('status_changes_requested')}</span>;
      case 'CLOSED':
        return (
          <span
            className="notion-tag tag-green"
            style={{ fontSize: '10.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <CheckCircle2 size={11} />
            {t('status_closed')}
          </span>
        );
      default:
        return <span className="notion-tag tag-gray">{status}</span>;
    }
  };

  const getRoleTag = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="notion-tag tag-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Super Admin</span>;
      case 'GENERAL_MANAGER':
        return <span className="notion-tag tag-red" style={{ fontSize: '9.5px', padding: '1px 5px' }}>General Manager</span>;
      case 'DEPT_MANAGER':
        return <span className="notion-tag tag-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Manager</span>;
      case 'STAFF':
      default:
        return <span className="notion-tag tag-gray" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Staff</span>;
    }
  };

  const getWorkloadLevelBadge = (level: 'available' | 'balanced' | 'busy' | 'overloaded', count: number) => {
    switch (level) {
      case 'overloaded':
        return (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Flame size={10} />
            Heavy ({count})
          </span>
        );
      case 'busy':
        return (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Busy ({count})
          </span>
        );
      case 'balanced':
        return (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Balanced ({count})
          </span>
        );
      case 'available':
      default:
        return (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Available
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1680px', margin: '0 auto' }}>
      {/* =========================================================================
          1. COMMAND CENTER HEADER BAR
          ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              flexShrink: 0,
            }}
          >
            <TableIcon size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  color: 'var(--notion-text)',
                }}
              >
                {t('staffMatrix')}
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                }}
              >
                {activeDepartment ? activeDepartment.name : 'All Departments'}
              </span>
            </div>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--notion-text-muted)',
                margin: '2px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              Unified workload balance, deliverable distribution, and live execution status.
            </p>
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border)',
              borderRadius: '10px',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: viewMode === 'matrix' ? 'var(--notion-card)' : 'transparent',
                color: viewMode === 'matrix' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewMode === 'matrix' ? 700 : 500,
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'matrix' ? 'var(--notion-shadow-sm)' : 'none',
              }}
              title="Staff × Status Matrix Grid"
            >
              <TableIcon size={14} style={{ color: viewMode === 'matrix' ? '#10b981' : 'inherit' }} />
              <span>Workload Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: viewMode === 'cards' ? 'var(--notion-card)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewMode === 'cards' ? 700 : 500,
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'cards' ? 'var(--notion-shadow-sm)' : 'none',
              }}
              title="Staff Workload Card Grid"
            >
              <LayoutGrid size={14} style={{ color: viewMode === 'cards' ? '#6366f1' : 'inherit' }} />
              <span>Staff Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: viewMode === 'flat' ? 'var(--notion-card)' : 'transparent',
                color: viewMode === 'flat' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewMode === 'flat' ? 700 : 500,
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: viewMode === 'flat' ? 'var(--notion-shadow-sm)' : 'none',
              }}
              title="Enterprise Data Table"
            >
              <List size={14} style={{ color: viewMode === 'flat' ? '#0284c7' : 'inherit' }} />
              <span>Data Table</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="notion-btn notion-btn-bordered"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
            title="Export filtered records to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* New Task Button */}
          {canCreateTask && onOpenCreateTask && (
            <button
              type="button"
              onClick={() => onOpenCreateTask(selectedDeptId === 'ALL' ? undefined : selectedDeptId)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Plus size={15} />
              <span>{t('createTaskButton')}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. KPI SUMMARY METRICS STRIP (Live High-Level Overview)
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {/* Metric 1: Total Deliverables */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: 'var(--notion-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Tasks
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--notion-text)', marginTop: '2px' }}>
              {kpiMetrics.total}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
              Across {kpiMetrics.activeStaff} staff members
            </div>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(79, 70, 229, 0.1)',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Briefcase size={18} />
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: 'var(--notion-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              In Progress
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
              {kpiMetrics.inProgress}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
              Actively under execution
            </div>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={18} />
          </div>
        </div>

        {/* Metric 3: Pending Review */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: 'var(--notion-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Review
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              {kpiMetrics.pendingReview}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
              Awaiting GM sign-off
            </div>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={18} />
          </div>
        </div>

        {/* Metric 4: Urgent & Overdue */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: 'var(--notion-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Urgent / Overdue
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
              {kpiMetrics.urgent}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
              Requires priority action
            </div>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={18} />
          </div>
        </div>

        {/* Metric 5: Completed */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: 'var(--notion-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {kpiMetrics.closed}
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
              {kpiMetrics.completionRate}% completion rate
            </div>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. COMPACT & RESPONSIVE DEPARTMENT SELECTOR BAR
          ========================================================================= */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--notion-text)' }}>
              Departments
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowDeptDetails((prev) => !prev)}
            className="notion-btn"
            style={{
              fontSize: '11.5px',
              padding: '3px 8px',
              color: 'var(--notion-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{showDeptDetails ? 'Compact Bar' : 'View All Dept Cards'}</span>
            {showDeptDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Compact Horizontal Scrollable Segmented Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin',
          }}
        >
          {/* ALL DEPARTMENTS CHIP */}
          <button
            type="button"
            onClick={() => onSelectDept('ALL')}
            className="notion-btn"
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: selectedDeptId === 'ALL' ? '1.5px solid #0284c7' : '1px solid var(--notion-border)',
              background: selectedDeptId === 'ALL' ? 'rgba(2, 132, 199, 0.12)' : 'var(--notion-item-bg)',
              color: selectedDeptId === 'ALL' ? '#0284c7' : 'var(--notion-text)',
              fontWeight: selectedDeptId === 'ALL' ? 700 : 500,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <span>All Departments</span>
            <span
              style={{
                fontSize: '10.5px',
                padding: '1px 6px',
                borderRadius: '999px',
                background: selectedDeptId === 'ALL' ? '#0284c7' : 'var(--notion-border)',
                color: selectedDeptId === 'ALL' ? '#ffffff' : 'var(--notion-text-muted)',
                fontWeight: 700,
              }}
            >
              {sourceTasks.length}
            </span>
          </button>

          {/* INDIVIDUAL DEPARTMENT CHIPS */}
          {departmentStats.map((item) => {
            const isSelected = selectedDeptId === item.dept.id;
            return (
              <button
                key={item.dept.id}
                type="button"
                onClick={() => onSelectDept(item.dept.id)}
                className="notion-btn"
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--notion-border)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--notion-item-bg)',
                  color: isSelected ? '#6366f1' : 'var(--notion-text)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.8 }}>
                  {item.dept.code}
                </span>
                <span>{item.dept.name}</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isSelected ? '#6366f1' : 'var(--notion-border)',
                    color: isSelected ? '#ffffff' : 'var(--notion-text-muted)',
                    fontWeight: 700,
                  }}
                >
                  {item.totalTasks}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional Expanded Department Summary Grid */}
        {showDeptDetails && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '10px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--notion-border-subtle)',
            }}
          >
            {departmentStats.map((item) => {
              const isSelected = selectedDeptId === item.dept.id;
              const rate = item.totalTasks > 0 ? Math.round((item.completedCount / item.totalTasks) * 100) : 0;
              return (
                <div
                  key={item.dept.id}
                  onClick={() => onSelectDept(item.dept.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--notion-border)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--notion-item-bg)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span className="notion-tag tag-purple" style={{ fontSize: '9.5px', fontWeight: 700 }}>
                        {item.dept.code}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--notion-text)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.dept.name}
                      </span>
                    </div>
                    <span className="notion-tag tag-blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {item.totalTasks}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    <span>{item.staffCount} staff</span>
                    <span>•</span>
                    <span style={{ color: '#0284c7' }}>{item.inProcessCount} active</span>
                    <span>•</span>
                    <span style={{ color: '#10b981' }}>{item.completedCount} done</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '4px', background: 'var(--notion-border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${rate}%`, height: '100%', background: '#10b981' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          4. WORKLOAD DISTRIBUTION & FILTER CONTROL CENTER
          ========================================================================= */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        {/* Top Header Row: Title, Summary & Global Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(2, 132, 199, 0.15))',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Activity size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                  Team Workload &amp; Capacity Monitor
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--notion-item-bg)',
                    color: 'var(--notion-text-muted)',
                    border: '1px solid var(--notion-border)',
                  }}
                >
                  {staffMatrixData.length} of {filteredStaffList.length} staff showing
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                Instant capacity tracking · Select a workload profile below to filter
              </div>
            </div>
          </div>

          {/* Quick Search & Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: 'var(--notion-input-bg)',
                border: '1px solid var(--notion-border)',
                width: '260px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <Search size={14} style={{ color: 'var(--notion-text-dim)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search staff, role, #task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--notion-text)',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--notion-text-dim)',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {(searchQuery || workloadFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setWorkloadFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="notion-btn notion-btn-bordered"
                style={{
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  gap: '5px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.06)',
                  fontWeight: 700,
                }}
                title="Reset all search and filters"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* WORKLOAD CAPACITY CARDS (The 5 Interactive State Tabs) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '10px',
            marginBottom: '14px',
          }}
        >
          {/* TAB 1: ALL STAFF */}
          <button
            type="button"
            onClick={() => setWorkloadFilter('ALL')}
            style={{
              padding: '10px 14px',
              borderRadius: '11px',
              border: workloadFilter === 'ALL'
                ? '2px solid #6366f1'
                : '1px solid var(--notion-border)',
              background: workloadFilter === 'ALL'
                ? 'rgba(99, 102, 241, 0.1)'
                : 'var(--notion-item-bg)',
              color: workloadFilter === 'ALL' ? '#6366f1' : 'var(--notion-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              boxShadow: workloadFilter === 'ALL' ? '0 3px 10px rgba(99, 102, 241, 0.2)' : 'none',
              transform: workloadFilter === 'ALL' ? 'translateY(-1px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: workloadFilter === 'ALL' ? '#6366f1' : 'rgba(99, 102, 241, 0.12)',
                  color: workloadFilter === 'ALL' ? '#ffffff' : '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Users size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.2 }}>
                  All Staff
                </div>
                <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                  Entire directory
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: workloadFilter === 'ALL' ? '#6366f1' : 'var(--notion-border)',
                color: workloadFilter === 'ALL' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {workloadCounts.all}
            </span>
          </button>

          {/* TAB 2: ACTIVE WORK */}
          <button
            type="button"
            onClick={() => setWorkloadFilter('ACTIVE_ONLY')}
            style={{
              padding: '10px 14px',
              borderRadius: '11px',
              border: workloadFilter === 'ACTIVE_ONLY'
                ? '2px solid #0284c7'
                : '1px solid var(--notion-border)',
              background: workloadFilter === 'ACTIVE_ONLY'
                ? 'rgba(2, 132, 199, 0.12)'
                : 'var(--notion-item-bg)',
              color: workloadFilter === 'ACTIVE_ONLY' ? '#0284c7' : 'var(--notion-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              boxShadow: workloadFilter === 'ACTIVE_ONLY' ? '0 3px 10px rgba(2, 132, 199, 0.2)' : 'none',
              transform: workloadFilter === 'ACTIVE_ONLY' ? 'translateY(-1px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: workloadFilter === 'ACTIVE_ONLY' ? '#0284c7' : 'rgba(2, 132, 199, 0.12)',
                  color: workloadFilter === 'ACTIVE_ONLY' ? '#ffffff' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Zap size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.2 }}>
                  Active Work
                </div>
                <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                  Has ongoing tasks
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: workloadFilter === 'ACTIVE_ONLY' ? '#0284c7' : 'var(--notion-border)',
                color: workloadFilter === 'ACTIVE_ONLY' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {workloadCounts.active}
            </span>
          </button>

          {/* TAB 3: HEAVY LOAD (4+ TASKS) */}
          <button
            type="button"
            onClick={() => setWorkloadFilter('HEAVY')}
            style={{
              padding: '10px 14px',
              borderRadius: '11px',
              border: workloadFilter === 'HEAVY'
                ? '2px solid #ea580c'
                : '1px solid var(--notion-border)',
              background: workloadFilter === 'HEAVY'
                ? 'rgba(234, 88, 12, 0.12)'
                : 'var(--notion-item-bg)',
              color: workloadFilter === 'HEAVY' ? '#ea580c' : 'var(--notion-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              boxShadow: workloadFilter === 'HEAVY' ? '0 3px 10px rgba(234, 88, 12, 0.22)' : 'none',
              transform: workloadFilter === 'HEAVY' ? 'translateY(-1px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: workloadFilter === 'HEAVY' ? '#ea580c' : 'rgba(234, 88, 12, 0.14)',
                  color: workloadFilter === 'HEAVY' ? '#ffffff' : '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Flame size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.2 }}>
                  Heavy Load
                </div>
                <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                  4+ active deliverables
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: workloadFilter === 'HEAVY' ? '#ea580c' : 'var(--notion-border)',
                color: workloadFilter === 'HEAVY' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {workloadCounts.heavy}
            </span>
          </button>

          {/* TAB 4: URGENT / ATTENTION */}
          <button
            type="button"
            onClick={() => setWorkloadFilter('URGENT')}
            style={{
              padding: '10px 14px',
              borderRadius: '11px',
              border: workloadFilter === 'URGENT'
                ? '2px solid #ef4444'
                : '1px solid var(--notion-border)',
              background: workloadFilter === 'URGENT'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'var(--notion-item-bg)',
              color: workloadFilter === 'URGENT' ? '#ef4444' : 'var(--notion-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              boxShadow: workloadFilter === 'URGENT' ? '0 3px 10px rgba(239, 68, 68, 0.22)' : 'none',
              transform: workloadFilter === 'URGENT' ? 'translateY(-1px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: workloadFilter === 'URGENT' ? '#ef4444' : 'rgba(239, 68, 68, 0.14)',
                  color: workloadFilter === 'URGENT' ? '#ffffff' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <AlertTriangle size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.2 }}>
                  Attention
                </div>
                <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                  Urgent or overdue
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: workloadFilter === 'URGENT' ? '#ef4444' : 'var(--notion-border)',
                color: workloadFilter === 'URGENT' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {workloadCounts.urgent}
            </span>
          </button>

          {/* TAB 5: AVAILABLE CAPACITY */}
          <button
            type="button"
            onClick={() => setWorkloadFilter('AVAILABLE')}
            style={{
              padding: '10px 14px',
              borderRadius: '11px',
              border: workloadFilter === 'AVAILABLE'
                ? '2px solid #10b981'
                : '1px solid var(--notion-border)',
              background: workloadFilter === 'AVAILABLE'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'var(--notion-item-bg)',
              color: workloadFilter === 'AVAILABLE' ? '#10b981' : 'var(--notion-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              boxShadow: workloadFilter === 'AVAILABLE' ? '0 3px 10px rgba(16, 185, 129, 0.22)' : 'none',
              transform: workloadFilter === 'AVAILABLE' ? 'translateY(-1px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: workloadFilter === 'AVAILABLE' ? '#10b981' : 'rgba(16, 185, 129, 0.14)',
                  color: workloadFilter === 'AVAILABLE' ? '#ffffff' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckCircle2 size={15} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, lineHeight: 1.2 }}>
                  Available
                </div>
                <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                  Ready for new tasks
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                background: workloadFilter === 'AVAILABLE' ? '#10b981' : 'var(--notion-border)',
                color: workloadFilter === 'AVAILABLE' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {workloadCounts.available}
            </span>
          </button>
        </div>

        {/* Bottom Row: Task Priority Filter Chips Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--notion-border-subtle)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Filter by Task Priority:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'All Priorities', icon: null },
                { key: 'URGENT', label: 'Urgent', icon: <Flame size={12} style={{ color: '#ef4444' }} /> },
                { key: 'HIGH', label: 'High', icon: <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316' }} /> },
                { key: 'MEDIUM', label: 'Medium', icon: <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0284c7' }} /> },
                { key: 'LOW', label: 'Low', icon: <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8' }} /> },
              ].map((p) => {
                const isSelected = priorityFilter === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriorityFilter(p.key)}
                    style={{
                      fontSize: '11.5px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: isSelected ? '1.5px solid #6366f1' : '1px solid var(--notion-border)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--notion-item-bg)',
                      color: isSelected ? '#6366f1' : 'var(--notion-text-muted)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
            Showing <strong>{staffMatrixData.length}</strong> active profiles matching filters
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. MAIN VIEW CONTAINER: MATRIX GRID vs STAFF CARDS vs DATA TABLE
          ========================================================================= */}
      {viewMode === 'matrix' && (
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--notion-shadow)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12.5px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--notion-item-bg)',
                    borderBottom: '2px solid var(--notion-border)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <th style={{ padding: '14px 18px', width: '22%', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserIcon size={15} style={{ color: '#6366f1' }} />
                      <span>{t('staffMember')}</span>
                    </div>
                  </th>
                  <th style={{ padding: '14px 18px', width: '25%', minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} style={{ color: '#64748b' }} />
                      <span>{t('openTasks')}</span>
                    </div>
                  </th>
                  <th style={{ padding: '14px 18px', width: '25%', minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={15} style={{ color: '#0284c7' }} />
                      <span>{t('inProgressTasks')} &amp; Review</span>
                    </div>
                  </th>
                  <th style={{ padding: '14px 18px', width: '18%', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                      <span>{t('completedTasks')}</span>
                    </div>
                  </th>
                  <th style={{ padding: '14px 18px', width: '10%', minWidth: '120px', textAlign: 'center' }}>
                    <span>Workload &amp; Rate</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Users size={34} style={{ color: 'var(--notion-text-dim)' }} />
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--notion-text)' }}>
                          {t('noStaffFound')}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)' }}>
                          No staff match the selected filters or search query. Try clearing the search or changing the department.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffMatrixData.map((row) => (
                    <tr
                      key={row.staff.id}
                      style={{
                        borderBottom: '1px solid var(--notion-border-subtle)',
                        verticalAlign: 'top',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* COLUMN 1: STAFF MEMBER CARD */}
                      <td style={{ padding: '16px 18px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                            }}
                          >
                            {(row.staff.full_name || row.staff.username || '?').charAt(0).toUpperCase()}
                          </div>

                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontWeight: 700, color: 'var(--notion-text)', fontSize: '13.5px', lineHeight: 1.2 }}>
                              {row.staff.full_name || row.staff.username}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                              {row.staff.email}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {getRoleTag(row.staff.role)}
                              {row.staff.department_name && (
                                <span className="notion-tag tag-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                                  {row.staff.department_name}
                                </span>
                              )}
                              {getWorkloadLevelBadge(row.workloadLevel, row.activeCount)}
                            </div>

                            {/* Staff Action Buttons: Share Work + Add Task */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareTargetStaff(row.staff);
                                  setShareCustomNote('');
                                  setShareSuccessNotice(null);
                                }}
                                className="notion-btn notion-btn-bordered"
                                style={{
                                  fontSize: '10.5px',
                                  padding: '3px 8px',
                                  gap: '4px',
                                  color: '#0284c7',
                                  borderColor: 'rgba(2, 132, 199, 0.3)',
                                  borderRadius: '6px',
                                  background: 'rgba(2, 132, 199, 0.05)',
                                  fontWeight: 600,
                                }}
                                title={`Send work summary & digest to ${row.staff.full_name || row.staff.username}`}
                              >
                                <Share2 size={11} />
                                <span>Share Work</span>
                              </button>

                              {canCreateTask && onOpenCreateTask && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenCreateTask(row.staff.department || undefined);
                                  }}
                                  className="notion-btn notion-btn-bordered"
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '3px 8px',
                                    gap: '3px',
                                    borderRadius: '6px',
                                    color: 'var(--notion-text-muted)',
                                  }}
                                  title={`Assign new task to ${row.staff.full_name || row.staff.username}`}
                                >
                                  <Plus size={11} />
                                  <span>Assign</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 2: OPEN / TO DO TASKS */}
                      <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-gray"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            {row.openTasks.length} Open
                          </span>
                        </div>

                        {row.openTasks.length === 0 ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                            — No open tasks
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              maxHeight: '340px',
                              overflowY: 'auto',
                              paddingRight: '4px',
                            }}
                          >
                            {row.openTasks.map((task) => {
                              const isOverdue = task.due_date && task.due_date < todayStr;
                              const isDueToday = task.due_date && task.due_date === todayStr;

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => onSelectTask(task)}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: 'var(--notion-item-bg)',
                                    border: isOverdue
                                      ? '1px solid rgba(239, 68, 68, 0.4)'
                                      : '1px solid var(--notion-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: 'var(--notion-shadow-sm)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#0284c7';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isOverdue
                                      ? 'rgba(239, 68, 68, 0.4)'
                                      : 'var(--notion-border)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                  title={`Inspect #${task.id}: ${task.title}`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      #{task.id}: {task.title}
                                    </span>
                                    {getPriorityBadge(task.priority)}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '10.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {task.status === 'CHANGES_REQUESTED' && (
                                        <span className="notion-tag tag-red" style={{ fontSize: '9px', padding: '0 4px', fontWeight: 700 }}>
                                          Changes Needed
                                        </span>
                                      )}
                                      {task.due_date && (
                                        <span
                                          style={{
                                            color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--notion-text-dim)',
                                            fontWeight: isOverdue || isDueToday ? 700 : 400,
                                          }}
                                        >
                                          {isOverdue ? '⚠️ Overdue ' : isDueToday ? '📅 Today ' : 'Due '}
                                          {task.due_date}
                                        </span>
                                      )}
                                    </div>

                                    {/* Quick Start Action */}
                                    {onStartTask && (currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN' || currentUserId === task.assigned_to) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onStartTask(task);
                                        }}
                                        className="notion-btn"
                                        style={{
                                          fontSize: '9.5px',
                                          padding: '1px 5px',
                                          borderRadius: '4px',
                                          background: 'rgba(2, 132, 199, 0.1)',
                                          color: '#0284c7',
                                          fontWeight: 600,
                                        }}
                                        title="Start working on this task"
                                      >
                                        <Play size={9} />
                                        <span>Start</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 3: IN PROGRESS & PENDING REVIEW */}
                      <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-blue"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            {row.inProcessTasks.length} Active
                          </span>
                        </div>

                        {row.inProcessTasks.length === 0 ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                            — No active work
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              maxHeight: '340px',
                              overflowY: 'auto',
                              paddingRight: '4px',
                            }}
                          >
                            {row.inProcessTasks.map((task) => {
                              const isReview = task.status === 'PENDING_GM_APPROVAL';
                              const isOverdue = task.due_date && task.due_date < todayStr;
                              const isDueToday = task.due_date && task.due_date === todayStr;

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => onSelectTask(task)}
                                  style={{
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    background: isReview ? 'rgba(245, 158, 11, 0.08)' : 'rgba(2, 132, 199, 0.06)',
                                    border: isReview ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(2, 132, 199, 0.25)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: 'var(--notion-shadow-sm)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = isReview ? '#d97706' : '#0284c7';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isReview
                                      ? 'rgba(245, 158, 11, 0.35)'
                                      : 'rgba(2, 132, 199, 0.25)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                  title={`Inspect #${task.id}: ${task.title}`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      #{task.id}: {task.title}
                                    </span>
                                    {getPriorityBadge(task.priority)}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '10.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {isReview ? (
                                        <span className="notion-tag tag-yellow" style={{ fontSize: '9px', padding: '0 5px', fontWeight: 700 }}>
                                          Awaiting Review
                                        </span>
                                      ) : (
                                        <span className="notion-tag tag-blue" style={{ fontSize: '9px', padding: '0 5px' }}>
                                          In Progress
                                        </span>
                                      )}
                                      {task.due_date && (
                                        <span
                                          style={{
                                            color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--notion-text-dim)',
                                            fontWeight: isOverdue || isDueToday ? 700 : 400,
                                          }}
                                        >
                                          {isOverdue ? '⚠️ Overdue ' : ''}{task.due_date}
                                        </span>
                                      )}
                                    </div>

                                    {/* Action button: Quick Approve or Submit */}
                                    {isReview && onQuickApprove && (currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN') && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onQuickApprove(task);
                                        }}
                                        className="notion-btn"
                                        style={{
                                          fontSize: '9.5px',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          background: '#10b981',
                                          color: '#ffffff',
                                          fontWeight: 700,
                                        }}
                                        title="Quick approve deliverable"
                                      >
                                        <Check size={9} />
                                        <span>Approve</span>
                                      </button>
                                    )}

                                    {!isReview && onSubmitTask && (currentUserId === task.assigned_to || currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN') && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSubmitTask(task);
                                        }}
                                        className="notion-btn"
                                        style={{
                                          fontSize: '9.5px',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          background: 'rgba(2, 132, 199, 0.1)',
                                          color: '#0284c7',
                                          fontWeight: 600,
                                        }}
                                        title="Submit task for approval"
                                      >
                                        <Send size={9} />
                                        <span>Submit</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 4: COMPLETED DELIVERABLES */}
                      <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-green"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            {row.completedTasks.length} Completed
                          </span>
                        </div>

                        {row.completedTasks.length === 0 ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                            — None completed yet
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              maxHeight: '340px',
                              overflowY: 'auto',
                              paddingRight: '4px',
                            }}
                          >
                            {row.completedTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => onSelectTask(task)}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.05)',
                                  border: '1px solid rgba(16, 185, 129, 0.18)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '6px',
                                  transition: 'all 0.12s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.18)')}
                                title={`Inspect completed #${task.id}: ${task.title}`}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                  <span
                                    style={{
                                      fontSize: '11.5px',
                                      color: 'var(--notion-text-dim)',
                                      textDecoration: 'line-through',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    #{task.id}: {task.title}
                                  </span>
                                </div>
                                <span className="notion-tag tag-green" style={{ fontSize: '8.5px', padding: '0 4px', flexShrink: 0 }}>
                                  Done
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 5: WORKLOAD RATE & METRICS */}
                      <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: 'var(--notion-text)',
                            }}
                          >
                            {row.totalTasks}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                            total tasks
                          </span>

                          {/* Stacked Progress Bar */}
                          {row.totalTasks > 0 ? (
                            <div style={{ width: '100%', maxWidth: '90px', marginTop: '4px' }}>
                              <div
                                style={{
                                  height: '6px',
                                  background: 'var(--notion-border)',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${(row.completedTasks.length / row.totalTasks) * 100}%`,
                                    background: '#10b981',
                                  }}
                                  title={`${row.completedTasks.length} Completed`}
                                />
                                <div
                                  style={{
                                    width: `${(row.inProcessTasks.length / row.totalTasks) * 100}%`,
                                    background: '#0284c7',
                                  }}
                                  title={`${row.inProcessTasks.length} In Progress`}
                                />
                                <div
                                  style={{
                                    width: `${(row.openTasks.length / row.totalTasks) * 100}%`,
                                    background: '#94a3b8',
                                  }}
                                  title={`${row.openTasks.length} Open`}
                                />
                              </div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                                {row.completionRate}% Done
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>0%</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {/* SPECIAL ROW: UNASSIGNED TASKS IN DEPARTMENT */}
                {unassignedTasks.total > 0 && (
                  <tr
                    style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      borderTop: '2px dashed rgba(245, 158, 11, 0.3)',
                      verticalAlign: 'top',
                    }}
                  >
                    <td style={{ padding: '16px 18px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertTriangle size={18} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#d97706', fontSize: '13px' }}>
                            Unassigned Tasks
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                            Requires personnel allocation
                          </div>
                          <span
                            className="notion-tag tag-yellow"
                            style={{ fontSize: '9.5px', marginTop: '6px', display: 'inline-block', fontWeight: 700 }}
                          >
                            {unassignedTasks.total} unassigned
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Unassigned Open */}
                    <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                        {unassignedTasks.open.length} Open
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {unassignedTasks.open.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'var(--notion-card)',
                              border: '1px solid var(--notion-border)',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unassigned In Process */}
                    <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                        {unassignedTasks.inProcess.length} Active
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {unassignedTasks.inProcess.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'var(--notion-card)',
                              border: '1px solid var(--notion-border)',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unassigned Completed */}
                    <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                        {unassignedTasks.completed.length} Completed
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {unassignedTasks.completed.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'var(--notion-card)',
                              border: '1px solid var(--notion-border)',
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              textDecoration: 'line-through',
                              color: 'var(--notion-text-dim)',
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unassigned Total */}
                    <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#d97706' }}>
                        {unassignedTasks.total}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: STAFF WORKLOAD CARDS
          ========================================================================= */}
      {viewMode === 'cards' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {staffMatrixData.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px 20px',
                textAlign: 'center',
                background: 'var(--notion-card)',
                borderRadius: '12px',
                border: '1px solid var(--notion-border)',
                color: 'var(--notion-text-muted)',
              }}
            >
              <Users size={36} style={{ color: 'var(--notion-text-dim)', marginBottom: '8px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {t('noStaffFound')}
              </div>
            </div>
          ) : (
            staffMatrixData.map((row) => (
              <div
                key={row.staff.id}
                style={{
                  background: 'var(--notion-card)',
                  border: '1px solid var(--notion-border)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  boxShadow: 'var(--notion-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--notion-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--notion-shadow-sm)';
                }}
              >
                {/* Header: Avatar, Name, Role */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0,
                        }}
                      >
                        {(row.staff.full_name || row.staff.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-text)' }}>
                          {row.staff.full_name || row.staff.username}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                          {row.staff.job_title || row.staff.role_display}
                        </div>
                      </div>
                    </div>
                    {getWorkloadLevelBadge(row.workloadLevel, row.activeCount)}
                  </div>

                  {/* Department & Role Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {getRoleTag(row.staff.role)}
                    {row.staff.department_name && (
                      <span className="notion-tag tag-purple" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                        {row.staff.department_name}
                      </span>
                    )}
                    {row.hasUrgent && (
                      <span className="notion-tag tag-red" style={{ fontSize: '9.5px', padding: '1px 6px', fontWeight: 700 }}>
                        <Flame size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        Urgent Needs
                      </span>
                    )}
                  </div>

                  {/* Task Metrics Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '10px 12px',
                      background: 'var(--notion-item-bg)',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>OPEN</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', marginTop: '2px' }}>
                        {row.openTasks.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>ACTIVE</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                        {row.inProcessTasks.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>DONE</div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                        {row.completedTasks.length}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--notion-text-muted)' }}>Progress Rate</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{row.completionRate}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--notion-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.completionRate}%`, height: '100%', background: '#10b981' }} />
                    </div>
                  </div>

                  {/* Top Urgent or Active Deliverable Preview */}
                  {row.userTasks.length > 0 && (
                    <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--notion-text-dim)', fontSize: '10.5px', marginBottom: '4px' }}>
                        LATEST DELIVERABLE:
                      </div>
                      <div
                        onClick={() => onSelectTask(row.userTasks[0])}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'var(--notion-card)',
                          border: '1px solid var(--notion-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--notion-text)' }}>
                          #{row.userTasks[0].id}: {row.userTasks[0].title}
                        </span>
                        {getPriorityBadge(row.userTasks[0].priority)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--notion-border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShareTargetStaff(row.staff);
                      setShareCustomNote('');
                      setShareSuccessNotice(null);
                    }}
                    className="notion-btn notion-btn-bordered"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      fontSize: '11.5px',
                      padding: '6px',
                      borderRadius: '7px',
                      color: '#0284c7',
                      fontWeight: 600,
                    }}
                  >
                    <Share2 size={12} />
                    <span>Share Work</span>
                  </button>

                  {canCreateTask && onOpenCreateTask && (
                    <button
                      type="button"
                      onClick={() => onOpenCreateTask(row.staff.department || undefined)}
                      className="notion-btn"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '7px',
                        fontSize: '11.5px',
                        background: 'var(--notion-item-bg)',
                        color: 'var(--notion-text)',
                      }}
                      title="Assign task"
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: ENTERPRISE DATA TABLE (Interactive, Sortable, Paginated)
          ========================================================================= */}
      {viewMode === 'flat' && (
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--notion-shadow)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--notion-item-bg)',
                    borderBottom: '2px solid var(--notion-border)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <th
                    onClick={() => handleSort('id')}
                    style={{ padding: '12px 14px', width: '8%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>#ID</span>
                      {sortField === 'id' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('title')}
                    style={{ padding: '12px 14px', width: '32%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('taskTitle')}</span>
                      {sortField === 'title' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('department')}
                    style={{ padding: '12px 14px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('department')}</span>
                      {sortField === 'department' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('status')}
                    style={{ padding: '12px 14px', width: '14%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('status')}</span>
                      {sortField === 'status' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('priority')}
                    style={{ padding: '12px 14px', width: '10%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('priority')}</span>
                      {sortField === 'priority' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('assignee')}
                    style={{ padding: '12px 14px', width: '13%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('assignedTo')}</span>
                      {sortField === 'assignee' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('due_date')}
                    style={{ padding: '12px 14px', width: '10%', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{t('dueDate')}</span>
                      {sortField === 'due_date' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>

                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span>{t('actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedFlatTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                      No tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedFlatTasks.map((task) => {
                    const isOverdue = task.due_date && task.due_date < todayStr && task.status !== 'CLOSED';
                    const isDueToday = task.due_date && task.due_date === todayStr && task.status !== 'CLOSED';

                    return (
                      <tr
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        style={{
                          borderBottom: '1px solid var(--notion-border-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.12s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--notion-text-dim)', fontSize: '12px' }}>
                          #{task.id}
                        </td>

                        <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{task.title}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <span className="notion-tag tag-purple" style={{ fontSize: '10.5px' }}>
                            {task.department_name}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          {getStatusBadge(task.status)}
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          {getPriorityBadge(task.priority)}
                        </td>

                        <td style={{ padding: '12px 14px', color: 'var(--notion-text-muted)' }}>
                          {(() => {
                            const { team } = parseCoAssignedTeam(task.description);
                            if (team.length > 1) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                                        color: '#fff',
                                        fontSize: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {(team[0].staffName || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: 600, color: 'var(--notion-text)', fontSize: '12px' }}>
                                      {team[0].staffName}
                                    </span>
                                    <span
                                      className="notion-tag tag-blue"
                                      style={{ fontSize: '10px', padding: '1px 5px', fontWeight: 600, cursor: 'default' }}
                                      title={team.map((m) => `${m.staffName} (${m.deptName})`).join(', ')}
                                    >
                                      +{team.length - 1} more
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', paddingLeft: '25px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {team.map((m) => m.staffName).join(', ')}
                                  </div>
                                </div>
                              );
                            }

                            if (task.assigned_to) {
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #0284c7, #6366f1)',
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
                                  <span style={{ fontWeight: 600, color: 'var(--notion-text)', fontSize: '12px' }}>
                                    {task.assigned_to_name}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                                Unassigned
                              </span>
                            );
                          })()}
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                          {task.due_date ? (
                            <span
                              style={{
                                color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--notion-text-muted)',
                                fontWeight: isOverdue || isDueToday ? 700 : 400,
                              }}
                            >
                              {task.due_date}
                              {isOverdue && ' (Overdue)'}
                              {isDueToday && ' (Today)'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--notion-text-dim)' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {(currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN') && onEditTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(task);
                                }}
                                className="notion-btn notion-btn-bordered"
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  color: '#0284c7',
                                  borderColor: 'rgba(2, 132, 199, 0.4)',
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  fontWeight: 600,
                                  borderRadius: '6px',
                                }}
                                title="Edit task"
                              >
                                <Edit size={11} />
                                <span>Edit</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTask(task);
                              }}
                              className="notion-btn notion-btn-bordered"
                              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}
                              title="View details"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--notion-border)',
              background: 'var(--notion-item-bg)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
              Showing{' '}
              <strong>
                {sortedAndFilteredFlatTasks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{' '}
              to{' '}
              <strong>
                {Math.min(currentPage * pageSize, sortedAndFilteredFlatTasks.length)}
              </strong>{' '}
              of <strong>{sortedAndFilteredFlatTasks.length}</strong> tasks
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--notion-text-muted)' }}>
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '5px',
                    background: 'var(--notion-card)',
                    border: '1px solid var(--notion-border)',
                    color: 'var(--notion-text)',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="notion-btn"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    opacity: currentPage <= 1 ? 0.4 : 1,
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span style={{ fontSize: '12px', fontWeight: 600, padding: '0 6px', color: 'var(--notion-text)' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="notion-btn"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    opacity: currentPage >= totalPages ? 0.4 : 1,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. SHARE WORK MODAL FOR STAFF IN TABLE
          ========================================================================= */}
      {shareTargetStaff && (
        <div className="notion-modal-overlay" onClick={() => setShareTargetStaff(null)}>
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%', borderRadius: '16px', overflow: 'hidden' }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--notion-border-subtle)',
                background: 'var(--notion-item-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(2, 132, 199, 0.1)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Share2 size={16} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)' }}>
                  Share Work with {shareTargetStaff.full_name || shareTargetStaff.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShareTargetStaff(null)}
                className="notion-btn"
                style={{ padding: '4px 6px', color: 'var(--notion-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px 24px', overflowY: 'auto', maxHeight: '76vh' }}>
              {/* Target info card */}
              <div
                style={{
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
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
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {(shareTargetStaff.full_name || shareTargetStaff.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--notion-text)' }}>
                    {shareTargetStaff.full_name || shareTargetStaff.username} ({shareTargetStaff.email})
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                    {shareTargetStaff.department_name ? `${shareTargetStaff.department_name} • ` : ''}
                    {shareTargetTasks.urgent.length} urgent deliverables &amp; {shareTargetTasks.inProcess.length} in-process deliverables
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
                    marginBottom: '16px',
                    fontSize: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{shareSuccessNotice}</span>
                </div>
              )}

              {/* Optional Custom Note input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '6px' }}>
                  Executive Instructions or Priority Note (Optional):
                </label>
                <textarea
                  className="notion-textarea"
                  rows={2}
                  placeholder={`Hi ${shareTargetStaff.full_name?.split(' ')[0] || shareTargetStaff.username}, please review and complete these deliverables today...`}
                  value={shareCustomNote}
                  onChange={(e) => setShareCustomNote(e.target.value)}
                  style={{ fontSize: '12px', borderRadius: '8px' }}
                />
              </div>

              {/* Preview of Work Digest */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>
                    Deliverables Included in Digest:
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    {shareTargetTasks.urgent.length + shareTargetTasks.inProcess.length} deliverables
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--notion-item-bg)',
                    border: '1px solid var(--notion-border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    fontSize: '11.5px',
                    color: 'var(--notion-text)',
                    lineHeight: 1.5,
                  }}
                >
                  {shareTargetTasks.urgent.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={12} />
                        <span>Urgent Deliverables ({shareTargetTasks.urgent.length}):</span>
                      </div>
                      {shareTargetTasks.urgent.map((t, idx) => (
                        <div key={t.id} style={{ paddingLeft: '8px', color: 'var(--notion-text)' }}>
                          {idx + 1}. [#{t.id}] {t.title} (Due: {t.due_date || 'No date'})
                        </div>
                      ))}
                    </div>
                  )}

                  {shareTargetTasks.inProcess.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 800, color: '#0284c7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>In Progress Deliverables ({shareTargetTasks.inProcess.length}):</span>
                      </div>
                      {shareTargetTasks.inProcess.map((t, idx) => (
                        <div key={t.id} style={{ paddingLeft: '8px', color: 'var(--notion-text)' }}>
                          {idx + 1}. [#{t.id}] {t.title} ({t.status === 'PENDING_GM_APPROVAL' ? 'Pending Review' : 'In Progress'})
                        </div>
                      ))}
                    </div>
                  )}

                  {shareTargetTasks.urgent.length === 0 && shareTargetTasks.inProcess.length === 0 && (
                    <div style={{ color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>
                      No pending urgent or in-progress tasks.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleDispatchShareEmail}
                  disabled={sendingShare}
                  className="notion-btn notion-btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                    borderRadius: '8px',
                  }}
                >
                  <Mail size={16} />
                  <span>
                    {sendingShare
                      ? 'Dispatching Official Email...'
                      : `Send Digest Email to ${shareTargetStaff.email}`}
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
                      fontWeight: 600,
                      borderRadius: '8px',
                      color: copiedSummary ? '#10b981' : 'var(--notion-text)',
                      borderColor: copiedSummary ? '#10b981' : 'var(--notion-border)',
                    }}
                  >
                    {copiedSummary ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedSummary ? 'Copied Summary!' : 'Copy Summary (WhatsApp/Slack)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="notion-btn notion-btn-bordered"
                    style={{
                      justifyContent: 'center',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      color: copiedLink ? '#10b981' : 'var(--notion-text)',
                      borderColor: copiedLink ? '#10b981' : 'var(--notion-border)',
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Direct Link'}</span>
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
