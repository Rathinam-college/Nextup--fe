import React, { useState, useEffect, useMemo } from 'react';
import { Task, Department, DashboardStats, Role, User } from '../types';
import { api } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Users,
  FileSpreadsheet,
  Layers,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
  Timer,
  CheckSquare,
  Filter,
  UserCheck,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';

/**
 * Calculates realistic enterprise working hours spent on a task.
 * - Same-day turnaround: exact elapsed hours (e.g. 2.5 hrs).
 * - Multi-day turnaround: estimated business workdays (5/7 ratio) * 7.5 hrs/day, capped at realistic sprint hours.
 * - Test/seed instant closure: reasonable baseline hours based on task priority.
 */
export const calculateTaskWorkingHours = (task: Task): number => {
  if (!task.created_at) return 2.0;

  const start = new Date(task.created_at).getTime();
  const end = task.closed_at
    ? new Date(task.closed_at).getTime()
    : new Date(task.updated_at || task.created_at).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    if (task.priority === 'URGENT') return 8.0;
    if (task.priority === 'HIGH') return 6.0;
    if (task.priority === 'MEDIUM') return 4.0;
    return 2.5;
  }

  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);

  // If closed within a very quick test window (< 30 minutes)
  if (diffHours < 0.5) {
    if (task.priority === 'URGENT') return 6.5;
    if (task.priority === 'HIGH') return 5.0;
    if (task.priority === 'MEDIUM') return 3.5;
    return 2.0;
  }

  // If completed within 12 hours
  if (diffHours <= 12) {
    return Math.round(diffHours * 10) / 10;
  }

  // Multi-day deliverables: estimated business workdays (5/7 ratio) * 7.5 hrs/day
  const days = diffHours / 24;
  const businessDays = Math.max(1, Math.round(days * (5 / 7)));
  const calculated = Math.min(businessDays * 7.5, 80);
  return Math.round(calculated * 10) / 10;
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface NotionReportsViewProps {
  tasks: Task[];
  departments: Department[];
  stats: DashboardStats | null;
  currentUserRole: Role;
  onExportCsv: () => void;
  onSelectTask?: (task: Task) => void;
  staffList?: User[];
  onOpenCreateTaskForDept?: (deptId: number, isIssue?: boolean) => void;
}

export const NotionReportsView: React.FC<NotionReportsViewProps> = ({
  tasks,
  departments,
  stats,
  currentUserRole,
  onExportCsv,
  onSelectTask,
  staffList,
  onOpenCreateTaskForDept,
}) => {
  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  // Navigation & Drilldown State
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loadedStaff, setLoadedStaff] = useState<User[]>(staffList || []);
  const [hoveredDeptId, setHoveredDeptId] = useState<number | null>(null);

  // Department Drilldown Filtering & Interaction State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITH_COMPLETED' | 'ACTIVE_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'COMPLETED_DESC' | 'HOURS_DESC' | 'RATE_DESC' | 'NAME_ASC'>('COMPLETED_DESC');
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<number>>(new Set());

  // Keep local staff in sync or load fallback from API
  useEffect(() => {
    if (staffList && staffList.length > 0) {
      setLoadedStaff(staffList);
    } else {
      api.getUsers().then(setLoadedStaff).catch(console.error);
    }
  }, [staffList]);

  // Bidirectional URL sync: allow /report?dept=CODE or back button navigation
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const deptCodeOrId = params.get('dept');
      if (deptCodeOrId && departments.length > 0) {
        const found = departments.find(
          (d) =>
            d.code.toLowerCase() === deptCodeOrId.toLowerCase() ||
            d.id.toString() === deptCodeOrId
        );
        setSelectedDepartment(found || null);
      } else {
        setSelectedDepartment(null);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [departments]);

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    const url = new URL(window.location.href);
    url.searchParams.set('dept', dept.code);
    window.history.pushState({ dept: dept.code }, '', url.toString());
  };

  const handleBackToOverview = () => {
    setSelectedDepartment(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('dept');
    window.history.pushState({}, '', url.toString());
  };

  const toggleExpandStaff = (userId: number) => {
    setExpandedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Overall counts for executive overview
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingGMTasks = tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
  const changesReqTasks = tasks.filter((t) => t.status === 'CHANGES_REQUESTED').length;
  const closedTasks = tasks.filter((t) => t.status === 'CLOSED').length;
  const completionRate = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

  // Priority counts
  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT').length;
  const highTasks = tasks.filter((t) => t.priority === 'HIGH').length;
  const mediumTasks = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowTasks = tasks.filter((t) => t.priority === 'LOW').length;

  // Recently verified tasks
  const recentlyClosed = tasks.filter((t) => t.status === 'CLOSED').slice(0, 5);

  // -------------------------------------------------------------
  // Department-Specific Calculations (when selectedDepartment !== null)
  // -------------------------------------------------------------
  const deptTasks = useMemo(() => {
    if (!selectedDepartment) return [];
    return tasks.filter((t) => t.department === selectedDepartment.id);
  }, [tasks, selectedDepartment]);

  const deptTotalTasks = deptTasks.length;
  const deptClosedTasks = deptTasks.filter((t) => t.status === 'CLOSED');
  const deptClosedCount = deptClosedTasks.length;
  const deptCompletionRate = deptTotalTasks > 0 ? Math.round((deptClosedCount / deptTotalTasks) * 100) : 0;
  const deptTotalHours = deptTasks.reduce((sum, t) => sum + calculateTaskWorkingHours(t), 0);
  const deptAvgHoursPerTicket = deptTotalTasks > 0 ? Math.round((deptTotalHours / deptTotalTasks) * 10) / 10 : 0;

  // Gather all staff belonging to this department OR assigned tasks in this department
  const departmentStaff = useMemo(() => {
    if (!selectedDepartment) return [];
    const directMembers = loadedStaff.filter((u) => u.department === selectedDepartment.id);
    const assignedUserIds = new Set(deptTasks.map((t) => t.assigned_to).filter((id): id is number => id !== null));
    const extraAssignees = loadedStaff.filter(
      (u) => assignedUserIds.has(u.id) && !directMembers.some((dm) => dm.id === u.id)
    );
    return [...directMembers, ...extraAssignees];
  }, [selectedDepartment, loadedStaff, deptTasks]);

  // Unassigned tasks in this department
  const unassignedTasks = useMemo(() => {
    return deptTasks.filter((t) => !t.assigned_to);
  }, [deptTasks]);

  // Compute staff metrics and apply search & filters
  const processedStaffList = useMemo(() => {
    if (!selectedDepartment) return [];

    let list = departmentStaff.map((user) => {
      const userTasks = deptTasks.filter((t) => t.assigned_to === user.id);
      const userClosed = userTasks.filter((t) => t.status === 'CLOSED');
      const userActive = userTasks.filter((t) => t.status !== 'CLOSED');
      const totalAssigned = userTasks.length;
      const completedCount = userClosed.length;
      const rate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

      const totalHours = userTasks.reduce((sum, t) => sum + calculateTaskWorkingHours(t), 0);
      const completedHours = userClosed.reduce((sum, t) => sum + calculateTaskWorkingHours(t), 0);
      const avgHours = completedCount > 0 ? Math.round((completedHours / completedCount) * 10) / 10 : 0;

      return {
        user,
        tasks: userTasks,
        completedTasks: userClosed,
        activeTasks: userActive,
        totalAssigned,
        completedCount,
        completionRate: rate,
        totalHours: Math.round(totalHours * 10) / 10,
        completedHours: Math.round(completedHours * 10) / 10,
        avgHours,
      };
    });

    // Text search filter
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.user.full_name?.toLowerCase().includes(q) ||
          item.user.username.toLowerCase().includes(q) ||
          item.user.email?.toLowerCase().includes(q) ||
          item.user.job_title?.toLowerCase().includes(q)
      );
    }

    // Status filter tabs
    if (statusFilter === 'WITH_COMPLETED') {
      list = list.filter((item) => item.completedCount > 0);
    } else if (statusFilter === 'ACTIVE_ONLY') {
      list = list.filter((item) => item.activeTasks.length > 0);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'COMPLETED_DESC') return b.completedCount - a.completedCount;
      if (sortBy === 'HOURS_DESC') return b.totalHours - a.totalHours;
      if (sortBy === 'RATE_DESC') return b.completionRate - a.completionRate;
      if (sortBy === 'NAME_ASC') {
        const nameA = a.user.full_name || a.user.username;
        const nameB = b.user.full_name || b.user.username;
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return list;
  }, [selectedDepartment, departmentStaff, deptTasks, staffSearchQuery, statusFilter, sortBy]);

  // Determine top performer in department (person with most completed tickets)
  const topPerformerId = useMemo(() => {
    if (processedStaffList.length === 0) return null;
    let max = 0;
    let topId: number | null = null;
    for (const item of processedStaffList) {
      if (item.completedCount > max) {
        max = item.completedCount;
        topId = item.user.id;
      }
    }
    return max > 0 ? topId : null;
  }, [processedStaffList]);

  // Export Department Staff CSV
  const handleExportDepartmentStaffCsv = () => {
    if (!selectedDepartment) return;

    const headers = [
      'Department Name',
      'Department Code',
      'Staff Member',
      'Username',
      'Email',
      'Role',
      'Job Title',
      'Total Assigned Tickets',
      'Completed & Verified Tickets',
      'Active / In Progress Tickets',
      'Completion Rate (%)',
      'Total Working Hours Logged (hrs)',
      'Avg Working Hours Per Ticket (hrs)',
    ];

    const rows = processedStaffList.map((item) => [
      selectedDepartment.name,
      selectedDepartment.code,
      item.user.full_name || item.user.username,
      item.user.username,
      item.user.email || '-',
      item.user.role,
      item.user.job_title || '-',
      item.totalAssigned,
      item.completedCount,
      item.activeTasks.length,
      `${item.completionRate}%`,
      item.totalHours.toFixed(1),
      item.avgHours > 0 ? item.avgHours.toFixed(1) : '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${selectedDepartment.code.toLowerCase()}_staff_performance_report.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for status badge style
  const renderStatusTag = (status: Task['status']) => {
    switch (status) {
      case 'CLOSED':
        return <span className="notion-tag tag-green">✓ Closed & Verified</span>;
      case 'PENDING_GM_APPROVAL':
        return <span className="notion-tag tag-yellow">⏳ Pending GM Approval</span>;
      case 'IN_PROGRESS':
        return <span className="notion-tag tag-blue">⚡ In Progress</span>;
      case 'CHANGES_REQUESTED':
        return <span className="notion-tag tag-red">⚠️ Changes Requested</span>;
      case 'TODO':
      default:
        return <span className="notion-tag tag-gray">○ To Do</span>;
    }
  };

  const renderPriorityTag = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="notion-tag tag-red">🔴 Urgent</span>;
      case 'HIGH':
        return <span className="notion-tag tag-orange">🟠 High</span>;
      case 'MEDIUM':
        return <span className="notion-tag tag-blue">🔵 Medium</span>;
      case 'LOW':
      default:
        return <span className="notion-tag tag-gray">⚪ Low</span>;
    }
  };

  // =========================================================================
  // VIEW 1: DEDICATED DEPARTMENT STAFF LIST & WORKING HOURS BREAKDOWN PAGE
  // =========================================================================
  if (selectedDepartment) {
    return (
      <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Breadcrumb & Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleBackToOverview}
              className="notion-btn notion-btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                color: 'var(--notion-text)',
                border: '1px solid var(--notion-border)',
                background: 'var(--notion-card)',
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Reports Overview</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--notion-text-muted)' }}>
              <span>Reports</span>
              <span>/</span>
              <span>Departments</span>
              <span>/</span>
              <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>{selectedDepartment.name}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenCreateTaskForDept && (
              <button
                type="button"
                onClick={() => onOpenCreateTaskForDept(selectedDepartment.id, true)}
                className="notion-btn notion-btn-bordered"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  color: '#e11d48',
                  borderColor: 'rgba(225, 29, 72, 0.4)',
                  background: 'rgba(225, 29, 72, 0.05)',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={14} />
                <span>+ Report Department Issue</span>
              </button>
            )}
            <button
              onClick={handleExportDepartmentStaffCsv}
              className="notion-btn notion-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
            >
              <Download size={14} />
              <span>Export Staff Hours CSV</span>
            </button>
          </div>
        </div>

        {/* Department Header Card */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--notion-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}
              >
                📁
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
                    {selectedDepartment.name}
                  </h1>
                  <span className="notion-tag tag-blue" style={{ fontSize: '12px', padding: '2px 8px', fontWeight: 600 }}>
                    {selectedDepartment.code}
                  </span>
                  {selectedDepartment.manager && (
                    <span className="notion-tag tag-purple" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={12} /> Manager: {selectedDepartment.manager.name}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', margin: '6px 0 0 0' }}>
                  {selectedDepartment.description || 'Departmental ticket deliverables, individual staff completion audits, and logged working hours breakdown.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="notion-tag tag-green" style={{ fontSize: '12px', padding: '4px 10px' }}>
                🟢 {deptCompletionRate}% Department Velocity
              </span>
            </div>
          </div>
        </div>

        {/* Department High-Level KPI Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              borderRadius: '6px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>Department Staff</span>
              <Users size={16} style={{ color: 'var(--notion-blue)' }} />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--notion-text)' }}>
              {departmentStaff.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
              Assigned team members
            </div>
          </div>

          <div
            style={{
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              borderRadius: '6px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>Completed & Verified</span>
              <CheckCircle2 size={16} style={{ color: 'var(--tag-green-text)' }} />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--tag-green-text)' }}>
              {deptClosedCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {deptTotalTasks}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
              {deptCompletionRate}% closure rate
            </div>
          </div>

          <div
            style={{
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              borderRadius: '6px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>Total Working Hours</span>
              <Timer size={16} style={{ color: 'var(--tag-purple-text)' }} />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--tag-purple-text)' }}>
              {deptTotalHours.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500 }}>hrs</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
              Cumulative time logged on deliverables
            </div>
          </div>

          <div
            style={{
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              borderRadius: '6px',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>Avg Turnaround / Ticket</span>
              <Clock size={16} style={{ color: 'var(--tag-orange-text)' }} />
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--tag-orange-text)' }}>
              {deptAvgHoursPerTicket.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500 }}>hrs</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
              Average duration per task
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '6px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--notion-text-dim)' }} />
            <input
              type="text"
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, or role..."
              className="notion-input"
              style={{
                width: '100%',
                paddingLeft: '32px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`notion-btn ${statusFilter === 'ALL' ? 'notion-btn-primary' : 'notion-btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              All Staff ({departmentStaff.length})
            </button>
            <button
              onClick={() => setStatusFilter('WITH_COMPLETED')}
              className={`notion-btn ${statusFilter === 'WITH_COMPLETED' ? 'notion-btn-primary' : 'notion-btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              With Completed Tickets
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE_ONLY')}
              className={`notion-btn ${statusFilter === 'ACTIVE_ONLY' ? 'notion-btn-primary' : 'notion-btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 10px' }}
            >
              With Active Tasks
            </button>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="notion-select"
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              <option value="COMPLETED_DESC">Most Completed Tickets</option>
              <option value="HOURS_DESC">Most Working Hours</option>
              <option value="RATE_DESC">Highest Completion %</option>
              <option value="NAME_ASC">Staff Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Staff Members Performance List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {processedStaffList.length === 0 ? (
            <div
              style={{
                background: 'var(--notion-card)',
                border: '1px solid var(--notion-border)',
                borderRadius: '6px',
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--notion-text-muted)',
              }}
            >
              <Users size={32} style={{ color: 'var(--notion-text-dim)', marginBottom: '10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '4px' }}>
                No staff members found matching criteria
              </div>
              <p style={{ fontSize: '12px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                {staffSearchQuery
                  ? 'Try adjusting your search query or reset filters to see all departmental personnel.'
                  : 'There are no active staff members assigned to this department yet.'}
              </p>
              {staffSearchQuery && (
                <button
                  onClick={() => {
                    setStaffSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  className="notion-btn notion-btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Clear Search & Filters
                </button>
              )}
            </div>
          ) : (
            processedStaffList.map((item) => {
              const isExpanded = expandedStaffIds.has(item.user.id);
              const isTop = item.user.id === topPerformerId;

              return (
                <div
                  key={item.user.id}
                  style={{
                    background: 'var(--notion-card)',
                    border: isTop ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid var(--notion-border)',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: isTop ? '0 2px 10px rgba(2, 132, 199, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Staff Info Header & Top Summary */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    {/* Person Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: isTop ? 'linear-gradient(135deg, #0284c7, #6366f1)' : 'var(--notion-item-bg)',
                          color: isTop ? '#ffffff' : 'var(--notion-text)',
                          border: '1px solid var(--notion-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '15px',
                          flexShrink: 0,
                        }}
                      >
                        {(item.user.first_name?.[0] || item.user.username[0] || 'U').toUpperCase()}
                        {(item.user.last_name?.[0] || '').toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--notion-text)' }}>
                            {item.user.full_name || item.user.username}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                            @{item.user.username}
                          </span>
                          {isTop && (
                            <span
                              className="notion-tag tag-green"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                              }}
                            >
                              <Award size={11} /> Top Deliverable Achiever
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>
                            {item.user.role === 'DEPT_MANAGER'
                              ? 'Department Manager'
                              : item.user.role === 'SUPER_ADMIN'
                              ? 'Super Admin'
                              : item.user.role === 'GENERAL_MANAGER'
                              ? 'General Manager'
                              : 'Staff Member'}
                          </span>
                          {item.user.job_title && (
                            <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                              • {item.user.job_title}
                            </span>
                          )}
                          {item.user.email && (
                            <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                              • {item.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Completed Tickets
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tag-green-text)', marginTop: '2px' }}>
                          {item.completedCount} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {item.totalAssigned}</span>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '28px', background: 'var(--notion-border)' }} />

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Working Hours
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tag-purple-text)', marginTop: '2px' }}>
                          {item.totalHours.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 500 }}>hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Sub-metrics Grid */}
                  <div
                    style={{
                      background: 'var(--notion-item-bg)',
                      border: '1px solid var(--notion-border-subtle)',
                      borderRadius: '6px',
                      padding: '12px 16px',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>
                        Completion Progress: {item.completionRate}%
                      </span>
                      <span style={{ color: 'var(--notion-text-muted)' }}>
                        {item.completedCount} verified closed • {item.activeTasks.length} in progress or review
                      </span>
                    </div>

                    <div
                      style={{
                        height: '7px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${item.completionRate}%`,
                          background: item.completionRate === 100
                            ? '#15803d'
                            : 'linear-gradient(90deg, #0284c7, #15803d)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        fontSize: '11px',
                        color: 'var(--notion-text-muted)',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--notion-text-dim)' }}>Avg Time / Ticket: </span>
                        <strong style={{ color: 'var(--notion-text)' }}>
                          {item.avgHours > 0 ? `${item.avgHours.toFixed(1)} hrs` : '-'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--notion-text-dim)' }}>Hours on Closed: </span>
                        <strong style={{ color: 'var(--tag-green-text)' }}>
                          {item.completedHours.toFixed(1)} hrs
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--notion-text-dim)' }}>Active Tickets: </span>
                        <strong style={{ color: item.activeTasks.length > 0 ? 'var(--tag-blue-text)' : 'inherit' }}>
                          {item.activeTasks.length} open
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Expand / Collapse Deliverables Accordion */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => toggleExpandStaff(item.user.id)}
                      className="notion-btn notion-btn-ghost"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--notion-blue)',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>
                        {isExpanded ? 'Hide' : 'Inspect'} All Assigned Deliverables ({item.tasks.length})
                      </span>
                    </button>

                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      Click deliverable to preview or verify
                    </span>
                  </div>

                  {/* Expanded Deliverables Table */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '12px',
                        borderTop: '1px solid var(--notion-border)',
                        paddingTop: '12px',
                      }}
                    >
                      {item.tasks.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--notion-text-dim)', fontSize: '12px' }}>
                          No tickets assigned to this team member in this department.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {item.tasks.map((task) => {
                            const taskHours = calculateTaskWorkingHours(task);
                            return (
                              <div
                                key={task.id}
                                onClick={() => onSelectTask && onSelectTask(task)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderRadius: '5px',
                                  background: 'var(--notion-item-bg)',
                                  border: '1px solid var(--notion-border-subtle)',
                                  cursor: onSelectTask ? 'pointer' : 'default',
                                  transition: 'all 0.15s ease',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                  if (onSelectTask) {
                                    e.currentTarget.style.background = 'var(--notion-hover)';
                                    e.currentTarget.style.borderColor = 'var(--notion-blue)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (onSelectTask) {
                                    e.currentTarget.style.background = 'var(--notion-item-bg)';
                                    e.currentTarget.style.borderColor = 'var(--notion-border-subtle)';
                                  }
                                }}
                              >
                                {/* Task Title and ID */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 240px' }}>
                                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--notion-text-dim)' }}>
                                    #{task.id}
                                  </span>
                                  <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                                      {task.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                                      Created {formatDate(task.created_at)}
                                      {task.closed_at ? ` • Closed ${formatDate(task.closed_at)}` : ''}
                                    </div>
                                  </div>
                                </div>

                                {/* Tags & Hours */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  {renderPriorityTag(task.priority)}
                                  {renderStatusTag(task.status)}

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: 'var(--tag-purple-text)',
                                      padding: '2px 8px',
                                      background: 'var(--tag-purple-bg)',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <Clock size={12} />
                                    <span>{taskHours.toFixed(1)} hrs</span>
                                  </div>

                                  {onSelectTask && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectTask(task);
                                      }}
                                      className="notion-btn notion-btn-ghost"
                                      style={{ padding: '3px 8px', fontSize: '11px' }}
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Unassigned Deliverables in this Department (if any) */}
          {unassignedTasks.length > 0 && (
            <div
              style={{
                background: 'var(--notion-card)',
                border: '1px dashed var(--notion-border)',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--tag-yellow-text)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
                    Unassigned Deliverables ({unassignedTasks.length})
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                  Awaiting staff allocation
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unassignedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--notion-item-bg)',
                      border: '1px solid var(--notion-border-subtle)',
                      cursor: onSelectTask ? 'pointer' : 'default',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--notion-text-dim)' }}>#{task.id}</span>
                      <span style={{ fontWeight: 500, color: 'var(--notion-text)' }}>{task.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderPriorityTag(task.priority)}
                      {renderStatusTag(task.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN EXECUTIVE REPORTS OVERVIEW (WITH CLICKABLE DEPARTMENT CARDS)
  // =========================================================================
  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--notion-blue)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
            }}>
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--notion-text)', margin: 0, letterSpacing: '-0.02em' }}>
                Executive Reports & Performance Analytics
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                Real-time departmental metrics, lifecycle velocity distribution, and GM verification audits.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onExportCsv}
          className="notion-btn notion-btn-primary"
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Download size={15} />
          <span>Export Official CSV Report</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '20px 22px',
            boxShadow: 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Total Deliverables</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} style={{ color: 'var(--notion-blue)' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{totalTasks}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '8px' }}>
            Active across {departments.length} operating unit{departments.length === 1 ? '' : 's'}
          </div>
        </div>

        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '20px 22px',
            boxShadow: 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Completion Velocity</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={17} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.03em', lineHeight: 1 }}>{completionRate}%</div>
          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '8px' }}>
            {closedTasks} of {totalTasks} verified & closed
          </div>
        </div>

        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '20px 22px',
            boxShadow: 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Awaiting GM Sign-Off</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={17} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em', lineHeight: 1 }}>{pendingGMTasks}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '8px' }}>
            Submitted for executive review
          </div>
        </div>

        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '20px 22px',
            boxShadow: 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>In Progress & Active</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={17} style={{ color: 'var(--notion-blue)' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--notion-blue)', letterSpacing: '-0.03em', lineHeight: 1 }}>{inProgressTasks}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '8px' }}>
            {changesReqTasks > 0 ? `${changesReqTasks} revisions requested` : 'Under active execution'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Department Breakdown & Priority Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Department Performance - Interactive Drilldown */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '6px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} style={{ color: 'var(--notion-blue)' }} />
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)', margin: 0 }}>
                  Department Task Breakdown
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                  Click any department card to open staff & hours details
                </span>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
              {departments.length} Unit{departments.length === 1 ? '' : 's'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {departments.map((dept) => {
              const currentDeptTasks = tasks.filter((t) => t.department === dept.id);
              const deptClosed = currentDeptTasks.filter((t) => t.status === 'CLOSED').length;
              const deptPending = currentDeptTasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
              const pct = currentDeptTasks.length > 0 ? Math.round((deptClosed / currentDeptTasks.length) * 100) : 0;
              const isHovered = hoveredDeptId === dept.id;
              const deptHours = currentDeptTasks.reduce((sum, t) => sum + calculateTaskWorkingHours(t), 0);
              const deptStaffMembers = loadedStaff.filter((u) => u.department === dept.id);

              return (
                <div
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept)}
                  onMouseEnter={() => setHoveredDeptId(dept.id)}
                  onMouseLeave={() => setHoveredDeptId(null)}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    background: isHovered ? 'var(--notion-hover)' : 'var(--notion-item-bg)',
                    border: isHovered ? '1px solid var(--notion-blue)' : '1px solid var(--notion-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isHovered ? '0 4px 12px rgba(2, 132, 199, 0.08)' : 'none',
                    transform: isHovered ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📁</span>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--notion-text)' }}>{dept.name}</span>
                      <span className="notion-tag" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {dept.code}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tag-green-text)' }}>
                        {pct}% Done
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--notion-blue)', fontWeight: 600 }}>→</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(0,0,0,0.12)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #0284c7, #15803d)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--notion-text-dim)', flexWrap: 'wrap', gap: '4px' }}>
                    <span>{deptStaffMembers.length} Staff</span>
                    <span>{currentDeptTasks.length} Tickets ({deptClosed} Closed)</span>
                    <span style={{ color: 'var(--tag-purple-text)', fontWeight: 600 }}>{deptHours.toFixed(1)} hrs</span>
                    {deptPending > 0 && <span style={{ color: 'var(--tag-yellow-text)' }}>{deptPending} Awaiting GM</span>}
                  </div>

                  {/* Visual Click CTA */}
                  <div
                    style={{
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--notion-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: 'var(--notion-blue)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> View Staff List, Completed Tickets & Hours
                    </span>
                    <span style={{ color: 'var(--notion-text-dim)', fontSize: '10px' }}>
                      Click to open deep dive
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Status Metrics */}
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '6px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={16} style={{ color: 'var(--tag-purple-text)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
              Priority Distribution & Urgency
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--tag-red-text)', fontWeight: 600 }}>🔴 Urgent ({urgentTasks})</span>
                <span style={{ color: 'var(--notion-text-dim)' }}>
                  {totalTasks > 0 ? Math.round((urgentTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--notion-item-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalTasks > 0 ? (urgentTasks / totalTasks) * 100 : 0}%`, background: 'var(--tag-red-text)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--tag-orange-text)', fontWeight: 600 }}>🟠 High ({highTasks})</span>
                <span style={{ color: 'var(--notion-text-dim)' }}>
                  {totalTasks > 0 ? Math.round((highTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--notion-item-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalTasks > 0 ? (highTasks / totalTasks) * 100 : 0}%`, background: 'var(--tag-orange-text)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--tag-blue-text)', fontWeight: 600 }}>🔵 Medium ({mediumTasks})</span>
                <span style={{ color: 'var(--notion-text-dim)' }}>
                  {totalTasks > 0 ? Math.round((mediumTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--notion-item-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalTasks > 0 ? (mediumTasks / totalTasks) * 100 : 0}%`, background: 'var(--tag-blue-text)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--notion-text-dim)', fontWeight: 600 }}>⚪ Low ({lowTasks})</span>
                <span style={{ color: 'var(--notion-text-dim)' }}>
                  {totalTasks > 0 ? Math.round((lowTasks / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--notion-item-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${totalTasks > 0 ? (lowTasks / totalTasks) * 100 : 0}%`, background: 'var(--notion-text-dim)' }} />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '5px',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border-subtle)',
              fontSize: '12px',
              lineHeight: 1.5,
              color: 'var(--notion-text-muted)',
            }}
          >
            💡 <strong style={{ color: 'var(--notion-text)' }}>Audit Rule:</strong> Tasks marked as Urgent or High are prioritized for immediate GM verification upon completion.
          </div>
        </div>
      </div>

      {/* Recently Closed Tasks Audit Table */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '6px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--tag-green-text)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
              Recent GM Verification & Closure Log
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
            Latest {recentlyClosed.length} approved deliverables
          </span>
        </div>

        {recentlyClosed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--notion-text-dim)', fontSize: '13px' }}>
            No closed deliverables in this view yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentlyClosed.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask && onSelectTask(t)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '4px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: onSelectTask ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => onSelectTask && (e.currentTarget.style.background = 'var(--notion-hover)')}
                onMouseLeave={(e) => onSelectTask && (e.currentTarget.style.background = 'var(--notion-item-bg)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--tag-green-text)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                      {t.title}
                    </div>
                    {t.gm_feedback_notes && (
                      <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                        Remarks: "{t.gm_feedback_notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="notion-tag tag-purple" style={{ fontSize: '10px' }}>
                    {t.department_name}
                  </span>
                  <span className="notion-tag tag-green" style={{ fontSize: '10px' }}>
                    Verified By {t.verified_by_name || 'GM'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
