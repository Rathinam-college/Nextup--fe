import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus, Role, User as UserType, Department } from '../types';
import { parseCoAssignedTeam } from '../utils/coAssignUtils';
import { isTaskAssignedToStaff, isTaskInDepartment, buildAvailableStaffList } from '../utils/taskFilterUtils';
import {
  Plus,
  Calendar,
  Clock,
  User,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
  Play,
  Send,
  RotateCcw,
  CheckSquare,
  Edit,
  Search,
  X,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface NotionListViewProps {
  tasks: Task[];
  allTasks?: Task[];
  staffList?: UserType[];
  departments?: Department[];
  selectedDeptId?: number | 'ALL';
  onSelectDept?: (deptId: number | 'ALL') => void;
  selectedStaffId?: string | number | 'ALL';
  onSelectStaff?: (staffId: string | number | 'ALL') => void;
  onSelectTask: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onOpenCreateTask?: () => void;
  onStartTask?: (task: Task) => void;
  onSubmitTask?: (task: Task) => void;
  onQuickApprove?: (task: Task) => void;
  currentUserRole?: Role;
  currentUserId?: number;
  canCreateTask?: boolean;
}

export const NotionListView: React.FC<NotionListViewProps> = ({
  tasks,
  allTasks,
  staffList,
  departments,
  selectedDeptId,
  onSelectDept,
  selectedStaffId: selectedStaffIdProp,
  onSelectStaff: onSelectStaffProp,
  onSelectTask,
  onEditTask,
  onOpenCreateTask,
  onStartTask,
  onSubmitTask,
  onQuickApprove,
  currentUserRole,
  currentUserId,
  canCreateTask,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);
  const [internalStaffId, setInternalStaffId] = useState<string | number | 'ALL'>('ALL');
  const activeStaffId = selectedStaffIdProp !== undefined ? selectedStaffIdProp : internalStaffId;

  const handleSelectStaff = (id: string | number | 'ALL') => {
    setInternalStaffId(id);
    if (onSelectStaffProp) {
      onSelectStaffProp(id);
    }
  };

  const [deptFilter, setDeptFilter] = useState<number | 'ALL'>(selectedDeptId || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep department filter synced if selectedDeptId changes externally
  useEffect(() => {
    if (selectedDeptId !== undefined) {
      setDeptFilter(selectedDeptId);
    }
  }, [selectedDeptId]);

  // Keep internal staff filter synced if selectedStaffIdProp changes externally
  useEffect(() => {
    if (selectedStaffIdProp !== undefined) {
      setInternalStaffId(selectedStaffIdProp);
    }
  }, [selectedStaffIdProp]);

  // Use the full pool of tasks when available
  const sourceTasks = allTasks && allTasks.length > 0 ? allTasks : tasks;

  // Extract all available staff members from staffList and tasks (including co-assigned team members)
  const availableStaff = useMemo(() => {
    return buildAvailableStaffList(staffList, sourceTasks);
  }, [staffList, sourceTasks]);

  // 0. Live count of tasks assigned/co-assigned to the logged-in user
  const myTasksCount = useMemo(() => {
    if (!currentUserId) return 0;
    return sourceTasks.filter((t) => isTaskAssignedToStaff(t, currentUserId)).length;
  }, [sourceTasks, currentUserId]);

  // Department options with live task counts across all tasks
  const departmentOptions = useMemo(() => {
    const map = new Map<string, { id: number | string; name: string; code?: string; taskCount: number }>();
    if (departments && departments.length > 0) {
      departments.forEach((d) => {
        map.set(String(d.id), {
          id: d.id,
          name: d.name,
          code: d.code,
          taskCount: 0,
        });
      });
    }
    sourceTasks.forEach((t) => {
      if (t.department && !map.has(String(t.department))) {
        map.set(String(t.department), {
          id: t.department,
          name: t.department_name || `Dept #${t.department}`,
          code: t.department_code,
          taskCount: 0,
        });
      }
      const { team } = parseCoAssignedTeam(t.description);
      team.forEach((m) => {
        if (m.departmentId && !map.has(String(m.departmentId))) {
          map.set(String(m.departmentId), {
            id: m.departmentId,
            name: m.deptName || `Dept #${m.departmentId}`,
            code: m.deptCode,
            taskCount: 0,
          });
        }
      });
    });

    const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';
    const visibleSource = sourceTasks.filter((t) => {
      if (!isGM) {
        if (t.is_gm_own_task || t.department_code === 'GM') return false;
        const assignee = staffList?.find((s) => s.id === t.assigned_to);
        if (assignee && (assignee.role === 'GENERAL_MANAGER' || assignee.role === 'SUPER_ADMIN')) {
          return false;
        }
      }
      return true;
    });

    return Array.from(map.values())
      .map((d) => {
        const count = visibleSource.filter((t) => {
          if (String(t.department) === String(d.id) || Number(t.department) === Number(d.id)) return true;
          const { team } = parseCoAssignedTeam(t.description);
          return team.some((m) => {
            if (String(m.departmentId) === String(d.id) || Number(m.departmentId) === Number(d.id)) return true;
            if (m.deptName && m.deptName.toLowerCase() === d.name.toLowerCase()) return true;
            return false;
          });
        }).length;
        return { ...d, taskCount: count };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, sourceTasks, currentUserRole, staffList]);

  // 1. Base scoped tasks: filtered by Dept, Staff, Assigned to Me, and Search Query (everything EXCEPT status)
  const baseScopedTasks = useMemo(() => {
    const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

    return sourceTasks.filter((t) => {
      // GM personal task privacy
      if (!isGM) {
        if (t.is_gm_own_task || t.department_code === 'GM') return false;
        const assignee = staffList?.find((s) => s.id === t.assigned_to);
        if (assignee && (assignee.role === 'GENERAL_MANAGER' || assignee.role === 'SUPER_ADMIN')) {
          return false;
        }
      }

      // Department filter
      if (deptFilter !== 'ALL') {
        const selectedDeptObj = departmentOptions.find((d) => String(d.id) === String(deptFilter));
        if (!isTaskInDepartment(t, deptFilter, selectedDeptObj?.name)) {
          return false;
        }
      }

      // Staff filter: STRICT! If staff is selected, only that staff member's tasks are kept!
      if (activeStaffId !== 'ALL') {
        const selectedObj = availableStaff.find((s) => String(s.id) === String(activeStaffId));
        if (!isTaskAssignedToStaff(t, activeStaffId, selectedObj)) {
          return false;
        }
      }

      // Assigned to Me quick toggle
      if (onlyMyTasks && currentUserId) {
        if (!isTaskAssignedToStaff(t, currentUserId)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const assigneeMatch = (t.assigned_to_name || '').toLowerCase().includes(q);
        const deptMatch = (t.department_name || t.department_code || '').toLowerCase().includes(q);
        const { team } = parseCoAssignedTeam(t.description);
        const coAssigneeMatch = team.some(
          (m) => m.staffName.toLowerCase().includes(q) || (m.deptName && m.deptName.toLowerCase().includes(q))
        );
        if (!titleMatch && !descMatch && !assigneeMatch && !deptMatch && !coAssigneeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [sourceTasks, currentUserRole, deptFilter, activeStaffId, onlyMyTasks, currentUserId, searchQuery, staffList, availableStaff, departmentOptions]);

  // 2. Dynamic status counts computed strictly from the scoped tasks!
  const statusCounts = useMemo(() => {
    return {
      ALL: baseScopedTasks.length,
      TODO: baseScopedTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: baseScopedTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      PENDING_GM_APPROVAL: baseScopedTasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length,
      CHANGES_REQUESTED: baseScopedTasks.filter((t) => t.status === 'CHANGES_REQUESTED').length,
      CLOSED: baseScopedTasks.filter((t) => t.status === 'CLOSED').length,
    };
  }, [baseScopedTasks]);

  // 3. Final tasks displayed on screen (filtered by active status tab)
  const finalTasks = useMemo(() => {
    if (statusFilter === 'ALL') return baseScopedTasks;
    return baseScopedTasks.filter((t) => t.status === statusFilter);
  }, [baseScopedTasks, statusFilter]);

  const hasActiveFilters = onlyMyTasks || deptFilter !== 'ALL' || activeStaffId !== 'ALL' || Boolean(searchQuery.trim());

  const getStatusTag = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <span className="notion-tag tag-gray">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="notion-tag tag-blue">In Progress</span>;
      case 'PENDING_GM_APPROVAL':
        return <span className="notion-tag tag-yellow">In Review</span>;
      case 'CHANGES_REQUESTED':
        return <span className="notion-tag tag-red">Changes Requested</span>;
      case 'CLOSED':
        return <span className="notion-tag tag-green">Completed</span>;
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

  const getTimelineTag = (dueStr: string | null) => {
    if (!dueStr) return null;
    const target = new Date(dueStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return <span className="notion-tag tag-red" style={{ fontSize: '11px' }}>Overdue ({Math.abs(diffDays)}d)</span>;
    }
    if (diffDays === 0) {
      return <span className="notion-tag tag-yellow" style={{ fontSize: '11px' }}>Due Today</span>;
    }
    if (diffDays === 1) {
      return <span className="notion-tag tag-orange" style={{ fontSize: '11px' }}>Due Tomorrow</span>;
    }
    return <span className="notion-tag tag-blue" style={{ fontSize: '11px' }}>{diffDays}d left</span>;
  };

  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  const handleResetFilters = () => {
    setOnlyMyTasks(false);
    setDeptFilter('ALL');
    if (onSelectDept) onSelectDept('ALL');
    handleSelectStaff('ALL');
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Modern High-End Filter & Navigation Bar */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          marginBottom: '18px',
          overflow: 'hidden',
        }}
      >
        {/* ROW 1: Controls, Filters & Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--notion-border-subtle)',
          }}
        >
          {/* Left Filter Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 1. "Assigned to Me" Quick Toggle */}
            <button
              type="button"
              onClick={() => setOnlyMyTasks(!onlyMyTasks)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: onlyMyTasks
                  ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)'
                  : 'var(--notion-card)',
                color: onlyMyTasks ? '#ffffff' : 'var(--notion-text)',
                border: onlyMyTasks ? '1px solid transparent' : '1px solid var(--notion-border)',
                boxShadow: onlyMyTasks ? '0 2px 8px rgba(79, 70, 229, 0.32)' : 'var(--notion-shadow-sm)',
              }}
              title="Toggle to view only tasks assigned to you"
            >
              <CheckSquare size={14} style={{ color: onlyMyTasks ? '#ffffff' : 'var(--notion-blue)' }} />
              <span>Assigned to Me</span>
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  background: onlyMyTasks ? 'rgba(255, 255, 255, 0.28)' : 'rgba(35, 131, 226, 0.12)',
                  color: onlyMyTasks ? '#ffffff' : 'var(--notion-blue)',
                  marginLeft: '2px',
                }}
              >
                {myTasksCount}
              </span>
            </button>

            {/* 2. Department Selector Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: deptFilter !== 'ALL' ? 'rgba(124, 58, 237, 0.09)' : 'var(--notion-card)',
                border: deptFilter !== 'ALL' ? '1.5px solid #8b5cf6' : '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <Building size={13} style={{ color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)' }}>
                Dept:
              </span>
              <select
                value={String(deptFilter)}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setDeptFilter(val);
                  if (onSelectDept) onSelectDept(val);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: deptFilter !== 'ALL' ? 700 : 500,
                  color: deptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text)',
                  cursor: 'pointer',
                  maxWidth: '175px',
                }}
              >
                <option value="ALL">All Departments ({sourceTasks.length})</option>
                {departmentOptions.map((d) => (
                  <option key={String(d.id)} value={String(d.id)}>
                    {d.name} ({d.taskCount})
                  </option>
                ))}
              </select>
              {deptFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setDeptFilter('ALL');
                    if (onSelectDept) onSelectDept('ALL');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7c3aed',
                    fontSize: '11px',
                    padding: '0 2px',
                    fontWeight: 700,
                  }}
                  title="Reset to All Departments"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 3. Staff Member Selector Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: activeStaffId !== 'ALL' ? 'rgba(35, 131, 226, 0.09)' : 'var(--notion-card)',
                border: activeStaffId !== 'ALL' ? '1.5px solid var(--notion-blue)' : '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <User size={13} style={{ color: activeStaffId !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: activeStaffId !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)' }}>
                Staff:
              </span>
              <select
                value={String(activeStaffId)}
                onChange={(e) => handleSelectStaff(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  fontWeight: activeStaffId !== 'ALL' ? 700 : 500,
                  color: activeStaffId !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text)',
                  cursor: 'pointer',
                  maxWidth: '185px',
                }}
              >
                <option value="ALL">All Staff ({sourceTasks.length})</option>
                <option value="UNASSIGNED">
                  Unassigned Queue ({sourceTasks.filter(t => !t.assigned_to && parseCoAssignedTeam(t.description).team.length === 0).length})
                </option>
                {availableStaff.map((s) => {
                  const staffCount = sourceTasks.filter((t) => {
                    if (deptFilter !== 'ALL') {
                      const deptObj = departmentOptions.find((d) => String(d.id) === String(deptFilter));
                      if (!isTaskInDepartment(t, deptFilter, deptObj?.name)) {
                        return false;
                      }
                    }
                    return isTaskAssignedToStaff(t, s.id, s);
                  }).length;
                  return (
                    <option key={String(s.id)} value={String(s.id)}>
                      {s.name} {s.dept ? `[${s.dept}]` : ''} ({staffCount})
                    </option>
                  );
                })}
              </select>
              {activeStaffId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleSelectStaff('ALL')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--notion-blue)',
                    fontSize: '11px',
                    padding: '0 2px',
                    fontWeight: 700,
                  }}
                  title="Reset to All Staff"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 4. Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Reset all active filters"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right Group: Search + New Task */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--notion-item-bg)',
                border: '1px solid var(--notion-border)',
                borderRadius: '8px',
                width: '210px',
              }}
            >
              <Search size={13} style={{ color: 'var(--notion-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  width: '100%',
                  color: 'var(--notion-text)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            {(canCreateTask !== false && onOpenCreateTask) && (
              <button
                onClick={onOpenCreateTask}
                className="notion-btn notion-btn-primary"
                style={{
                  fontSize: '12px',
                  padding: '7px 15px',
                  borderRadius: '8px',
                  gap: '6px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(35, 131, 226, 0.25)',
                }}
              >
                <Plus size={14} />
                <span>New Task</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Status Metric Tabs (Accurate Dynamic Counts Based on Active Filters) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'rgba(248, 250, 252, 0.6)',
            overflowX: 'auto',
            borderBottom: hasActiveFilters ? '1px dashed var(--notion-border-subtle)' : 'none',
          }}
        >
          {[
            { id: 'ALL', label: 'All Tasks', count: statusCounts.ALL, dotColor: '#6366f1', activeBg: 'rgba(99, 102, 241, 0.12)', activeColor: '#4f46e5' },
            { id: 'TODO', label: 'To Do', count: statusCounts.TODO, dotColor: '#64748b', activeBg: 'rgba(100, 116, 139, 0.15)', activeColor: '#334155' },
            { id: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS, dotColor: '#3b82f6', activeBg: 'rgba(59, 130, 246, 0.14)', activeColor: '#2563eb' },
            { id: 'PENDING_GM_APPROVAL', label: 'In Review', count: statusCounts.PENDING_GM_APPROVAL, dotColor: '#f59e0b', activeBg: 'rgba(245, 158, 11, 0.14)', activeColor: '#d97706' },
            { id: 'CHANGES_REQUESTED', label: 'Changes', count: statusCounts.CHANGES_REQUESTED, dotColor: '#ef4444', activeBg: 'rgba(239, 68, 68, 0.14)', activeColor: '#dc2626' },
            { id: 'CLOSED', label: 'Completed', count: statusCounts.CLOSED, dotColor: '#10b981', activeBg: 'rgba(16, 185, 129, 0.14)', activeColor: '#059669' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: isActive ? `1.5px solid ${tab.activeColor}` : '1px solid transparent',
                  background: isActive ? tab.activeBg : 'transparent',
                  color: isActive ? tab.activeColor : 'var(--notion-text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: tab.dotColor,
                    display: 'inline-block',
                  }}
                />
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: isActive ? tab.activeColor : 'rgba(0, 0, 0, 0.06)',
                    color: isActive ? '#ffffff' : 'var(--notion-text-muted)',
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ROW 3: Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              fontSize: '11.5px',
              background: 'var(--notion-item-bg)',
              color: 'var(--notion-text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 600 }}>Active Scope:</span>

            {onlyMyTasks && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(79, 70, 229, 0.12)',
                  color: '#4f46e5',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Assigned to Me
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setOnlyMyTasks(false)} />
              </span>
            )}

            {deptFilter !== 'ALL' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(124, 58, 237, 0.12)',
                  color: '#7c3aed',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Dept: {departmentOptions.find((d) => String(d.id) === String(deptFilter))?.name || deptFilter}
                <X
                  size={11}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setDeptFilter('ALL');
                    if (onSelectDept) onSelectDept('ALL');
                  }}
                />
              </span>
            )}

            {activeStaffId !== 'ALL' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(35, 131, 226, 0.12)',
                  color: 'var(--notion-blue)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Staff:{' '}
                {activeStaffId === 'UNASSIGNED'
                  ? 'Unassigned Queue'
                  : availableStaff.find((s) => String(s.id) === String(activeStaffId))?.name || activeStaffId}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => handleSelectStaff('ALL')} />
              </span>
            )}

            {searchQuery.trim() && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: 'rgba(0, 0, 0, 0.08)',
                  color: 'var(--notion-text)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Filter: "{searchQuery.trim()}"
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              </span>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
              Showing {finalTasks.length} of {baseScopedTasks.length} tasks
            </span>
          </div>
        )}
      </div>

      {/* List Container */}
      <div
        style={{
          border: '1px solid var(--notion-border)',
          borderRadius: '12px',
          background: 'var(--notion-card)',
          overflow: 'hidden',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        {finalTasks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            <Filter size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: 600 }}>No tasks in this view</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="notion-btn notion-btn-bordered"
                style={{ fontSize: '11.5px', padding: '4px 10px', marginTop: '6px' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          finalTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 16px',
                borderBottom: '1px solid var(--notion-border-subtle)',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
                gap: '16px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Left: Title & Department */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--notion-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.title}
                    </span>
                    {task.department_code && (
                      <span className="notion-tag tag-purple" style={{ flexShrink: 0, fontSize: '10.5px' }}>
                        {task.department_code}
                      </span>
                    )}
                    {task.attachment_image && (
                      <span className="notion-tag tag-blue" style={{ flexShrink: 0, fontSize: '10px', padding: '1px 5px' }}>
                        Image
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--notion-text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '450px',
                      }}
                    >
                      {task.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Meta Tags, Action Buttons & Assignee */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                {getStatusTag(task.status)}
                {getPriorityTag(task.priority)}

                {/* Timeline Countdown Tag */}
                {task.due_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {getTimelineTag(task.due_date)}
                  </div>
                )}

                {/* Assignee Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '110px' }}>
                  {(() => {
                    const { team } = parseCoAssignedTeam(task.description);
                    if (team.length > 1) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                              flexShrink: 0,
                            }}
                          >
                            {(team[0].staffName || '?').charAt(0).toUpperCase()}
                          </span>
                          <span
                            style={{ fontSize: '12px', color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}
                            title={team.map((m) => `${m.staffName} (${m.deptName})`).join(', ')}
                          >
                            {team.map((m) => m.staffName).join(', ')}
                          </span>
                        </div>
                      );
                    }
                    if (task.assigned_to) {
                      return (
                        <>
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
                              flexShrink: 0,
                            }}
                          >
                            {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.assigned_to_name}
                          </span>
                        </>
                      );
                    }
                    return (
                      <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        Unassigned
                      </span>
                    );
                  })()}
                </div>

                {/* Inline 1-Click Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {task.status === 'TODO' && onStartTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTask(task);
                      }}
                      className="notion-btn notion-btn-bordered"
                      style={{ fontSize: '11px', padding: '3px 8px', color: '#0284c7' }}
                      title="Start work on this task"
                    >
                      <Play size={11} />
                      <span>Start</span>
                    </button>
                  )}

                  {task.status === 'IN_PROGRESS' && onSubmitTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSubmitTask(task);
                      }}
                      className="notion-btn notion-btn-bordered"
                      style={{ fontSize: '11px', padding: '3px 8px', color: '#38bdf8' }}
                      title="Submit for GM approval"
                    >
                      <Send size={11} />
                      <span>Submit</span>
                    </button>
                  )}

                  {task.status === 'CHANGES_REQUESTED' && onStartTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartTask(task);
                      }}
                      className="notion-btn notion-btn-bordered"
                      style={{ fontSize: '11px', padding: '3px 8px', color: '#e03e3e' }}
                      title="Resume work with requested revisions"
                    >
                      <RotateCcw size={11} />
                      <span>Resume</span>
                    </button>
                  )}

                  {task.status === 'PENDING_GM_APPROVAL' && isGM && onQuickApprove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickApprove(task);
                      }}
                      className="notion-btn notion-btn-primary"
                      style={{ fontSize: '11px', padding: '3px 8px', background: '#16a34a' }}
                      title="Sign off & verify this task"
                    >
                      <CheckCircle2 size={11} />
                      <span>Approve</span>
                    </button>
                  )}
                  {(currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditTask) {
                          onEditTask(task);
                        } else {
                          onSelectTask(task);
                        }
                      }}
                      className="notion-btn notion-btn-bordered"
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        color: 'var(--notion-accent, #2383e2)',
                        borderColor: 'rgba(35, 131, 226, 0.4)',
                        background: 'rgba(35, 131, 226, 0.08)',
                        fontWeight: 600,
                      }}
                      title="Edit task specifications, priority, assignee, status, due date"
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
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    title="View task details and full attachments"
                  >
                    Details
                  </button>
                </div>

                <ChevronRight size={14} style={{ color: 'var(--notion-text-dim)' }} />
              </div>
            </div>
          ))
        )}

        {/* Quick Add Row at Bottom */}
        {(canCreateTask !== false && onOpenCreateTask) && (
          <div
            onClick={onOpenCreateTask}
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--notion-text-dim)',
              cursor: 'pointer',
              borderTop: '1px solid var(--notion-border-subtle)',
            }}
          >
            <Plus size={13} />
            <span>New page</span>
          </div>
        )}
      </div>
    </div>
  );
};
