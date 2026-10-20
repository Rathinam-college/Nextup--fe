import React, { useState, useMemo } from 'react';
import { Task, Department, User, Role } from '../types';
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
  ShieldCheck,
  ChevronDown,
  Eye,
  Share2,
  Copy,
  Check,
  X,
  Mail,
} from 'lucide-react';
import { api } from '../services/api';

interface NotionTableViewProps {
  tasks: Task[];
  allTasks?: Task[];
  departments: Department[];
  staffList: User[];
  selectedDeptId: number | 'ALL';
  onSelectDept: (deptId: number | 'ALL') => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateTask?: (deptId?: number, isIssue?: boolean) => void;
  canCreateTask?: boolean;
  currentUserRole?: Role;
  currentUserId?: number;
  onStartTask?: (task: Task) => void;
  onSubmitTask?: (task: Task) => void;
  onQuickApprove?: (task: Task) => void;
}

export const NotionTableView: React.FC<NotionTableViewProps> = ({
  tasks,
  allTasks,
  departments,
  staffList,
  selectedDeptId,
  onSelectDept,
  onSelectTask,
  onOpenCreateTask,
  canCreateTask,
  currentUserRole,
  currentUserId,
  onStartTask,
  onSubmitTask,
  onQuickApprove,
}) => {
  // Use allTasks if provided, fallback to tasks
  const sourceTasks = allTasks && allTasks.length > 0 ? allTasks : tasks;

  // View Mode: 'matrix' (Department -> Staff -> Open / In Process / Completed Table) vs 'flat' (Classic Task Rows)
  const [viewMode, setViewMode] = useState<'matrix' | 'flat'>('matrix');

  // Staff search inside the department
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Staff status filter: 'ALL' | 'ACTIVE_ONLY' | 'HAS_OPEN' | 'HAS_IN_PROGRESS'
  const [staffFilter, setStaffFilter] = useState<'ALL' | 'ACTIVE_ONLY' | 'HAS_OPEN' | 'HAS_IN_PROGRESS'>('ALL');

  // Today's date normalized
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Share Modal State
  const [shareTargetStaff, setShareTargetStaff] = useState<User | null>(null);
  const [shareCustomNote, setShareCustomNote] = useState('');
  const [sendingShare, setSendingShare] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

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
    let text = `📋 Rathinam TaskTracker - Work Allocation for ${staff.full_name || staff.username}\n`;
    text += `👤 Staff: ${staff.full_name || staff.username} (${staff.email || 'No email'})\n`;
    if (staff.department_name) text += `🏢 Department: ${staff.department_name}\n`;
    text += `📅 Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (shareTargetTasks.urgent.length > 0) {
      text += `🚨 URGENT WORK (${shareTargetTasks.urgent.length} tasks):\n`;
      shareTargetTasks.urgent.forEach((t, idx) => {
        text += `${idx + 1}. [${t.priority}] #${t.id}: ${t.title} (Due: ${t.due_date || 'No date'})\n`;
      });
      text += `\n`;
    }

    if (shareTargetTasks.inProcess.length > 0) {
      text += `🔵 IN PROCESS WORK (${shareTargetTasks.inProcess.length} tasks):\n`;
      shareTargetTasks.inProcess.forEach((t, idx) => {
        text += `${idx + 1}. #${t.id}: ${t.title} (${t.status === 'PENDING_GM_APPROVAL' ? 'Pending Review' : 'In Progress'})\n`;
      });
      text += `\n`;
    }

    if (shareTargetTasks.urgent.length === 0 && shareTargetTasks.inProcess.length === 0) {
      text += `✓ No pending urgent or in-process tasks.\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
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
    const targetTask = shareTargetTasks.urgent[0] || shareTargetTasks.inProcess[0] || sourceTasks.find((t) => t.assigned_to === shareTargetStaff.id);
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

  // Department object if a specific department is chosen
  const activeDepartment = useMemo(() => {
    if (selectedDeptId === 'ALL') return null;
    return departments.find((d) => d.id === selectedDeptId) || null;
  }, [departments, selectedDeptId]);

  // Compute departmental high-level statistics
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

  // Total summary across all departments
  const totalSummary = useMemo(() => {
    const openCount = sourceTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED').length;
    const inProcessCount = sourceTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL').length;
    const completedCount = sourceTasks.filter((t) => t.status === 'CLOSED').length;
    return {
      totalTasks: sourceTasks.length,
      openCount,
      inProcessCount,
      completedCount,
      totalStaff: staffList.filter((s) => s.is_active !== false).length,
    };
  }, [sourceTasks, staffList]);

  // Filter staff belonging to the selected department
  const departmentStaff = useMemo(() => {
    let list = staffList.filter((s) => s.is_active !== false);
    if (selectedDeptId !== 'ALL') {
      list = list.filter((s) => s.department === selectedDeptId);
    }

    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.job_title && s.job_title.toLowerCase().includes(q))
      );
    }

    return list;
  }, [staffList, selectedDeptId, staffSearchQuery]);

  // Group tasks by staff member for the matrix table
  const staffMatrixData = useMemo(() => {
    const deptTaskPool = selectedDeptId === 'ALL'
      ? sourceTasks
      : sourceTasks.filter((t) => t.department === selectedDeptId);

    const rows = departmentStaff.map((staff) => {
      const userTasks = deptTaskPool.filter((t) => t.assigned_to === staff.id);

      // Open tasks: TODO or CHANGES_REQUESTED
      const openTasks = userTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED');

      // In Process ("in preces") tasks: IN_PROGRESS or PENDING_GM_APPROVAL
      const inProcessTasks = userTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');

      // Completed ("comple t") tasks: CLOSED
      const completedTasks = userTasks.filter((t) => t.status === 'CLOSED');

      const totalTasks = userTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

      return {
        staff,
        userTasks,
        openTasks,
        inProcessTasks,
        completedTasks,
        totalTasks,
        completionRate,
      };
    });

    // Apply secondary filter: ACTIVE_ONLY, HAS_OPEN, HAS_IN_PROGRESS
    if (staffFilter === 'ACTIVE_ONLY') {
      return rows.filter((r) => r.openTasks.length > 0 || r.inProcessTasks.length > 0);
    }
    if (staffFilter === 'HAS_OPEN') {
      return rows.filter((r) => r.openTasks.length > 0);
    }
    if (staffFilter === 'HAS_IN_PROGRESS') {
      return rows.filter((r) => r.inProcessTasks.length > 0);
    }

    return rows;
  }, [departmentStaff, sourceTasks, selectedDeptId, staffFilter]);

  // Unassigned tasks within the department
  const unassignedTasks = useMemo(() => {
    const deptTaskPool = selectedDeptId === 'ALL'
      ? sourceTasks
      : sourceTasks.filter((t) => t.department === selectedDeptId);

    const unassigned = deptTaskPool.filter((t) => !t.assigned_to);
    return {
      open: unassigned.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED'),
      inProcess: unassigned.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL'),
      completed: unassigned.filter((t) => t.status === 'CLOSED'),
      total: unassigned.length,
    };
  }, [sourceTasks, selectedDeptId]);

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="notion-tag tag-red" style={{ fontSize: '10px', padding: '1px 5px' }}>Urgent</span>;
      case 'HIGH':
        return <span className="notion-tag tag-orange" style={{ fontSize: '10px', padding: '1px 5px' }}>High</span>;
      case 'MEDIUM':
        return <span className="notion-tag tag-blue" style={{ fontSize: '10px', padding: '1px 5px' }}>Med</span>;
      case 'LOW':
        return <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 5px' }}>Low</span>;
      default:
        return null;
    }
  };

  const getRoleTag = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="notion-tag tag-purple" style={{ fontSize: '10px' }}>Super Admin</span>;
      case 'GENERAL_MANAGER':
        return <span className="notion-tag tag-red" style={{ fontSize: '10px' }}>General Manager</span>;
      case 'DEPT_MANAGER':
        return <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>Dept Manager</span>;
      case 'STAFF':
      default:
        return <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>Staff</span>;
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Header & View Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                margin: 0,
                color: 'var(--notion-text)',
              }}
            >
              Department Staff Status Matrix
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: 'var(--notion-text-muted)' }}>
            Institutional workload distribution. Select a department to inspect each staff member's Open, In Progress, and Completed task matrix.
          </p>
        </div>

        {/* View Mode Toggle: Matrix Table vs Flat Tasks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border)',
              borderRadius: '10px',
              padding: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className="notion-btn"
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                background: viewMode === 'matrix' ? 'var(--notion-card)' : 'transparent',
                color: viewMode === 'matrix' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewMode === 'matrix' ? 700 : 500,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: viewMode === 'matrix' ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              <TableIcon size={14} style={{ color: viewMode === 'matrix' ? '#10b981' : 'inherit' }} />
              <span>Staff Status Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className="notion-btn"
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                background: viewMode === 'flat' ? 'var(--notion-card)' : 'transparent',
                color: viewMode === 'flat' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewMode === 'flat' ? 700 : 500,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: viewMode === 'flat' ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              <List size={14} style={{ color: viewMode === 'flat' ? '#4f46e5' : 'inherit' }} />
              <span>Flat Task Records</span>
            </button>
          </div>

          {canCreateTask && onOpenCreateTask && (
            <button
              onClick={() => onOpenCreateTask(selectedDeptId === 'ALL' ? undefined : selectedDeptId)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12.5px',
                padding: '7px 16px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontWeight: 700,
              }}
            >
              <Plus size={15} />
              <span>+ Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: FIRST DEPARTMENT FILTER ("given asfirst deprt") */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: 'var(--notion-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} style={{ color: '#0284c7' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--notion-text)' }}>
              1. First Select Department Filter
            </span>
            <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
              (Click a department to view its assigned staff & workload)
            </span>
          </div>

          {/* Quick Stats Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span className="notion-tag tag-gray" style={{ fontWeight: 600 }}>
              👥 {totalSummary.totalStaff} Total Staff
            </span>
            <span className="notion-tag tag-blue" style={{ fontWeight: 600 }}>
              📋 {totalSummary.totalTasks} Tasks ({totalSummary.openCount} Open, {totalSummary.inProcessCount} In Progress, {totalSummary.completedCount} Closed)
            </span>
          </div>
        </div>

        {/* Department Selection Cards / Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '10px',
          }}
        >
          {/* ALL DEPARTMENTS TILE */}
          <div
            onClick={() => onSelectDept('ALL')}
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              border: selectedDeptId === 'ALL'
                ? '2px solid #0284c7'
                : '1px solid var(--notion-border)',
              background: selectedDeptId === 'ALL'
                ? 'rgba(2, 132, 199, 0.08)'
                : 'var(--notion-item-bg)',
              transition: 'all 0.15s ease',
              boxShadow: selectedDeptId === 'ALL' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: 'var(--notion-text)' }}>
                <span>🏢</span>
                <span>All Departments</span>
              </div>
              <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 700 }}>
                {totalSummary.totalTasks}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
              <span>👥 {totalSummary.totalStaff} staff</span>
              <span>•</span>
              <span style={{ color: '#64748b' }}>⚪ {totalSummary.openCount}</span>
              <span style={{ color: '#0284c7' }}>🔵 {totalSummary.inProcessCount}</span>
              <span style={{ color: '#10b981' }}>🟢 {totalSummary.completedCount}</span>
            </div>
          </div>

          {/* INDIVIDUAL DEPARTMENT TILES */}
          {departmentStats.map((item) => {
            const isSelected = selectedDeptId === item.dept.id;
            return (
              <div
                key={item.dept.id}
                onClick={() => onSelectDept(item.dept.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isSelected
                    ? '2px solid #6366f1'
                    : '1px solid var(--notion-border)',
                  background: isSelected
                    ? 'rgba(99, 102, 241, 0.08)'
                    : 'var(--notion-item-bg)',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span className="notion-tag tag-purple" style={{ fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
                      {item.dept.code}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--notion-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.dept.name}
                    >
                      {item.dept.name}
                    </span>
                  </div>
                  <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {item.totalTasks}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                  <span>👥 {item.staffCount}</span>
                  <span>•</span>
                  <span style={{ color: '#64748b' }}>⚪ {item.openCount}</span>
                  <span style={{ color: '#0284c7' }}>🔵 {item.inProcessCount}</span>
                  <span style={{ color: '#10b981' }}>🟢 {item.completedCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: INSIDE DEPARTMENT - SHOW THAT STAFF & STATUS CONTROLS ("in side of the deprot show that staff") */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '8px',
          padding: '10px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Users size={16} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
            Staff in {activeDepartment ? `${activeDepartment.name} (${activeDepartment.code})` : 'All Departments'}
          </span>
          <span className="notion-tag tag-gray" style={{ fontSize: '11px' }}>
            {departmentStaff.length} staff member{departmentStaff.length === 1 ? '' : 's'}
          </span>

          {/* Secondary Quick Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <button
              type="button"
              onClick={() => setStaffFilter('ALL')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: staffFilter === 'ALL' ? 'var(--notion-hover)' : 'transparent',
                fontWeight: staffFilter === 'ALL' ? 600 : 400,
                color: staffFilter === 'ALL' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              }}
            >
              All Staff
            </button>
            <button
              type="button"
              onClick={() => setStaffFilter('ACTIVE_ONLY')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: staffFilter === 'ACTIVE_ONLY' ? 'var(--notion-hover)' : 'transparent',
                fontWeight: staffFilter === 'ACTIVE_ONLY' ? 600 : 400,
                color: staffFilter === 'ACTIVE_ONLY' ? '#0284c7' : 'var(--notion-text-muted)',
              }}
            >
              Has Active Tasks
            </button>
            <button
              type="button"
              onClick={() => setStaffFilter('HAS_OPEN')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: staffFilter === 'HAS_OPEN' ? 'var(--notion-hover)' : 'transparent',
                fontWeight: staffFilter === 'HAS_OPEN' ? 600 : 400,
                color: staffFilter === 'HAS_OPEN' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              }}
            >
              ⚪ Has Open
            </button>
            <button
              type="button"
              onClick={() => setStaffFilter('HAS_IN_PROGRESS')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: staffFilter === 'HAS_IN_PROGRESS' ? 'var(--notion-hover)' : 'transparent',
                fontWeight: staffFilter === 'HAS_IN_PROGRESS' ? 600 : 400,
                color: staffFilter === 'HAS_IN_PROGRESS' ? '#0284c7' : 'var(--notion-text-muted)',
              }}
            >
              🔵 Has In Process
            </button>
          </div>
        </div>

        {/* Search Staff Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '5px',
            background: 'var(--notion-input-bg)',
            border: '1px solid var(--notion-border)',
            width: '240px',
          }}
        >
          <Search size={13} style={{ color: 'var(--notion-text-dim)' }} />
          <input
            type="text"
            placeholder="Search staff in department..."
            value={staffSearchQuery}
            onChange={(e) => setStaffSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--notion-text)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* STEP 3: THE TABLE - OPEN, IN PROCESS, COMPLETED ("that satff open and in preces and comple t like tabel make that") */}
      {viewMode === 'matrix' ? (
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '10px',
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
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--notion-item-bg)',
                    borderBottom: '2px solid var(--notion-border)',
                    color: 'var(--notion-text-dim)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '22%', minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={14} />
                      <span>👤 Staff Member (Assignee)</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px', width: '25%', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#64748b' }}>⚪</span>
                      <span>Open Tasks (To Do / Requested)</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px', width: '25%', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#0284c7' }}>🔵</span>
                      <span>In Process ("in preces" / In Progress)</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px', width: '20%', minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#10b981' }}>🟢</span>
                      <span>Completed ("comple t" / Verified)</span>
                    </div>
                  </th>
                  <th style={{ padding: '12px 16px', width: '8%', minWidth: '100px', textAlign: 'center' }}>
                    <span>📊 Total</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Users size={28} style={{ color: 'var(--notion-text-dim)' }} />
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          No staff members found matching criteria
                        </div>
                        <div style={{ fontSize: '12px' }}>
                          Try clearing the search query or changing the department filter above.
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
                      {/* COLUMN 1: STAFF MEMBER INFO */}
                      <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                            }}
                          >
                            {(row.staff.full_name || row.staff.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: 'var(--notion-text)', fontSize: '13px', lineHeight: 1.2 }}>
                              {row.staff.full_name || row.staff.username}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                              {row.staff.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                              {getRoleTag(row.staff.role)}
                              {row.staff.department_name && (
                                <span className="notion-tag tag-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  {row.staff.department_name}
                                </span>
                              )}
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
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  gap: '4px',
                                  color: '#0284c7',
                                  borderColor: 'rgba(2, 132, 199, 0.3)',
                                  borderRadius: '4px',
                                  background: 'rgba(2, 132, 199, 0.05)',
                                }}
                                title={`Share urgent & in-process deliverables with ${row.staff.full_name || row.staff.username}`}
                              >
                                <Share2 size={10} />
                                <span>Share Work</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 2: OPEN TASKS ("open") */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-gray"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            ⚪ {row.openTasks.length} Open
                          </span>
                        </div>

                        {row.openTasks.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                            — No open tasks
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {row.openTasks.map((task) => {
                              const isOverdue = task.due_date && task.due_date < todayStr;
                              const isDueToday = task.due_date && task.due_date === todayStr;

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => onSelectTask(task)}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    background: 'var(--notion-item-bg)',
                                    border: '1px solid var(--notion-border-subtle)',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#94a3b8';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--notion-border-subtle)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                  title={`Click to inspect task #${task.id}: ${task.title}`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        #{task.id}: {task.title}
                                      </span>
                                    </div>
                                    {getPriorityBadge(task.priority)}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                                    {task.status === 'CHANGES_REQUESTED' && (
                                      <span className="notion-tag tag-red" style={{ fontSize: '9px', padding: '0 4px' }}>
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
                                        📅 {task.due_date} {isOverdue ? '(Overdue)' : isDueToday ? '(Today)' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 3: IN PROCESS ("in preces") */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-blue"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            🔵 {row.inProcessTasks.length} In Process
                          </span>
                        </div>

                        {row.inProcessTasks.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                            — No active work
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {row.inProcessTasks.map((task) => {
                              const isReview = task.status === 'PENDING_GM_APPROVAL';
                              const isOverdue = task.due_date && task.due_date < todayStr;
                              const isDueToday = task.due_date && task.due_date === todayStr;

                              return (
                                <div
                                  key={task.id}
                                  onClick={() => onSelectTask(task)}
                                  style={{
                                    padding: '6px 8px',
                                    borderRadius: '5px',
                                    background: isReview ? 'rgba(234, 179, 8, 0.08)' : 'rgba(2, 132, 199, 0.06)',
                                    border: isReview ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(2, 132, 199, 0.25)',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = isReview ? '#eab308' : '#0284c7';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = isReview ? 'rgba(234, 179, 8, 0.3)' : 'rgba(2, 132, 199, 0.25)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                  title={`Click to inspect task #${task.id}: ${task.title}`}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        #{task.id}: {task.title}
                                      </span>
                                    </div>
                                    {getPriorityBadge(task.priority)}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                                    {isReview ? (
                                      <span className="notion-tag tag-yellow" style={{ fontSize: '9px', padding: '0 4px', fontWeight: 700 }}>
                                        ⏳ Awaiting Signoff
                                      </span>
                                    ) : (
                                      <span className="notion-tag tag-blue" style={{ fontSize: '9px', padding: '0 4px' }}>
                                        ▶ In Progress
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span
                                        style={{
                                          color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--notion-text-dim)',
                                          fontWeight: isOverdue || isDueToday ? 700 : 400,
                                        }}
                                      >
                                        📅 {task.due_date} {isOverdue ? '(Overdue)' : isDueToday ? '(Today)' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 4: COMPLETED ("comple t") */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <span
                            className="notion-tag tag-green"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                            }}
                          >
                            🟢 {row.completedTasks.length} Completed
                          </span>
                        </div>

                        {row.completedTasks.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                            — None closed yet
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {row.completedTasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => onSelectTask(task)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '5px',
                                  background: 'rgba(16, 185, 129, 0.06)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '6px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)')}
                                title={`Click to inspect closed task #${task.id}: ${task.title}`}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--notion-text-dim)',
                                      textDecoration: 'line-through',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    #{task.id}: {task.title}
                                  </span>
                                </div>
                                <span className="notion-tag tag-green" style={{ fontSize: '8px', padding: '0 4px', flexShrink: 0 }}>
                                  ✓ Signed
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 5: TOTAL & COMPLETION RATE */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: 'var(--notion-text)',
                            }}
                          >
                            {row.totalTasks}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)' }}>
                            deliverables
                          </span>

                          {/* Mini Progress Bar */}
                          {row.totalTasks > 0 ? (
                            <div style={{ width: '100%', maxWidth: '80px', marginTop: '2px' }}>
                              <div
                                style={{
                                  height: '5px',
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
                                  title={`${row.inProcessTasks.length} In Process`}
                                />
                                <div
                                  style={{
                                    width: `${(row.openTasks.length / row.totalTasks) * 100}%`,
                                    background: '#94a3b8',
                                  }}
                                  title={`${row.openTasks.length} Open`}
                                />
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginTop: '2px' }}>
                                {row.completionRate}%
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)' }}>0%</span>
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
                      background: 'rgba(234, 179, 8, 0.04)',
                      borderTop: '2px dashed var(--notion-border)',
                      verticalAlign: 'top',
                    }}
                  >
                    <td style={{ padding: '14px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: 700, color: '#d97706', fontSize: '12px' }}>
                            Unassigned Tasks
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                            Needs staff assignee in {activeDepartment ? activeDepartment.name : 'Departments'}
                          </div>
                          <span className="notion-tag tag-yellow" style={{ fontSize: '9px', marginTop: '4px', display: 'inline-block' }}>
                            {unassignedTasks.total} unassigned
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Unassigned Open */}
                    <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                        ⚪ {unassignedTasks.open.length} Open
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {unassignedTasks.open.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: 'var(--notion-item-bg)',
                              border: '1px solid var(--notion-border-subtle)',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unassigned In Process */}
                    <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', marginBottom: '6px' }}>
                        🔵 {unassignedTasks.inProcess.length} In Process
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {unassignedTasks.inProcess.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: 'var(--notion-item-bg)',
                              border: '1px solid var(--notion-border-subtle)',
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unassigned Completed */}
                    <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', marginBottom: '6px' }}>
                        🟢 {unassignedTasks.completed.length} Completed
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {unassignedTasks.completed.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => onSelectTask(t)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: 'var(--notion-item-bg)',
                              border: '1px solid var(--notion-border-subtle)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textDecoration: 'line-through',
                            }}
                          >
                            #{t.id}: {t.title}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Unassigned */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#d97706' }}>
                        {unassignedTasks.total}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FLAT TASK RECORDS TABLE (Traditional Notion Table) */
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '10px',
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
                    color: 'var(--notion-text-dim)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '10px 14px', width: '30%' }}>📄 Task Name</th>
                  <th style={{ padding: '10px 14px' }}>🏢 Department</th>
                  <th style={{ padding: '10px 14px' }}>🔵 Status</th>
                  <th style={{ padding: '10px 14px' }}>⚡ Priority</th>
                  <th style={{ padding: '10px 14px' }}>👤 Assignee</th>
                  <th style={{ padding: '10px 14px' }}>📅 Due Date</th>
                  <th style={{ padding: '10px 14px' }}>🛡️ Verified By</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    style={{
                      borderBottom: '1px solid var(--notion-border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--notion-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📄</span>
                        <span>{task.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="notion-tag tag-purple">{task.department_name}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {task.status === 'TODO' && <span className="notion-tag tag-gray">To Do</span>}
                      {task.status === 'IN_PROGRESS' && <span className="notion-tag tag-blue">In Progress</span>}
                      {task.status === 'PENDING_GM_APPROVAL' && <span className="notion-tag tag-yellow">Pending Review</span>}
                      {task.status === 'CHANGES_REQUESTED' && <span className="notion-tag tag-red">Changes Needed</span>}
                      {task.status === 'CLOSED' && <span className="notion-tag tag-green">Closed & Verified</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{getPriorityBadge(task.priority)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--notion-text-muted)' }}>
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
                          <span style={{ fontWeight: 500, color: 'var(--notion-text)' }}>
                            {task.assigned_to_name}
                          </span>
                        </div>
                      ) : (
                        <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--notion-text-dim)', fontSize: '12px' }}>
                      {task.due_date || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--notion-text-muted)', fontSize: '12px' }}>
                      {task.verified_by_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Share Tasks Modal for Staff in Table */}
      {shareTargetStaff && (
        <div className="notion-modal-overlay" onClick={() => setShareTargetStaff(null)}>
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
                  Share Work with {shareTargetStaff.full_name || shareTargetStaff.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShareTargetStaff(null)}
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
                  {(shareTargetStaff.full_name || shareTargetStaff.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                    {shareTargetStaff.full_name || shareTargetStaff.username} ({shareTargetStaff.email})
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                    {shareTargetStaff.department_name ? `${shareTargetStaff.department_name} • ` : ''}
                    {shareTargetTasks.urgent.length} urgent deliverables & {shareTargetTasks.inProcess.length} in-process deliverables
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
                  placeholder={`Hi ${shareTargetStaff.full_name?.split(' ')[0] || shareTargetStaff.username}, please review and complete these deliverables today...`}
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
                    {shareTargetTasks.urgent.length + shareTargetTasks.inProcess.length} deliverables
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
                  {shareTargetTasks.urgent.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                        🚨 Urgent Work ({shareTargetTasks.urgent.length}):
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
                      <div style={{ fontWeight: 700, color: '#0284c7', marginBottom: '4px' }}>
                        🔵 In Process Work ({shareTargetTasks.inProcess.length}):
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
                      : `📧 Send Official Digest Email to ${shareTargetStaff.email}`}
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
