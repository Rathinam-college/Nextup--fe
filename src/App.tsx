import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Task, Department, User, NotificationItem, DispatchedEmail, ActivityLogItem } from './types';
import { api } from './services/api';
import { NotionSidebar } from './components/NotionSidebar';
import { NotionTopBar } from './components/NotionTopBar';
import { NotionBoardView } from './components/NotionBoardView';
import { NotionListView } from './components/NotionListView';
import { NotionCalendarView } from './components/NotionCalendarView';
import { NotionTableView } from './components/NotionTableView';
import { NotionApprovalsHub } from './components/NotionApprovalsHub';
import { NotionDepartmentsView } from './components/NotionDepartmentsView';
import { NotionStaffView } from './components/NotionStaffView';
import { NotionTaskModal } from './components/NotionTaskModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { StaffManagementModal } from './components/StaffManagementModal';
import { CreateDepartmentModal } from './components/CreateDepartmentModal';
import { NotificationPanel } from './components/NotificationPanel';
import { EmailLogsModal } from './components/EmailLogsModal';
import { ActivityLogModal } from './components/ActivityLogModal';
import { LoginPage } from './components/LoginPage';
import { NotionReportsView } from './components/NotionReportsView';
import { NotionSettingsView } from './components/NotionSettingsView';
import { NotionGMTodayView } from './components/NotionGMTodayView';
import { SelfDeskView } from './components/SelfDeskView';
import { RefreshCw, Bell, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { isUserAllowedToViewPage, ALL_APP_PAGES } from './utils/pagePermissions';
import {
  startHourlyReminderSchedule,
  stopHourlyReminderSchedule,
  startDaily9AMReminderSchedule,
  stopDaily9AMReminderSchedule,
  requestBrowserNotificationPermission,
  triggerTestWorkReminder,
} from './services/notifications';

export type ViewType = 'board' | 'list' | 'calendar' | 'table' | 'approvals' | 'staff' | 'departments' | 'report' | 'settings' | 'today' | 'self_desk';

export const getViewFromPath = (path: string): ViewType => {
  const parts = path.toLowerCase().split('/').filter(Boolean).filter(p => p !== 'nextup');
  const cleanPath = parts[0] || '';
  if (cleanPath === 'self' || cleanPath === 'self-desk' || cleanPath === 'personal' || cleanPath === 'notes' || cleanPath === 'my-tasks') return 'self_desk';
  if (cleanPath === 'today' || cleanPath === 'urgent' || cleanPath === 'gmtoday') return 'today';
  if (cleanPath === 'settings' || cleanPath === 'admin') return 'settings';
  if (cleanPath === 'report' || cleanPath === 'reports') return 'report';
  if (cleanPath === 'list' || cleanPath === 'lists') return 'list';
  if (cleanPath === 'calendar') return 'calendar';
  if (cleanPath === 'table' || cleanPath === 'tables' || cleanPath === 'matrix') return 'table';
  if (cleanPath === 'tasks' || cleanPath === 'task') return 'board';
  if (cleanPath === 'approvals' || cleanPath === 'approval') return 'approvals';
  if (cleanPath === 'departments' || cleanPath === 'department') return 'departments';
  if (cleanPath === 'staff' || cleanPath === 'users') return 'staff';
  return 'board';
};

export const getPathFromView = (view: ViewType): string => {
  const isNextup = window.location.pathname.startsWith('/nextup');
  const prefix = isNextup ? '/nextup' : '';
  if (view === 'self_desk') return `${prefix}/self-desk`;
  if (view === 'board') return `${prefix}/board`;
  if (view === 'list') return `${prefix}/list`;
  if (view === 'calendar') return `${prefix}/calendar`;
  if (view === 'table') return `${prefix}/table`;
  if (view === 'today') return `${prefix}/today`;
  return `${prefix}/${view}`;
};

const DashboardContent: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<DispatchedEmail[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  // Continuous 1-Hour Recurring Work Reminder scheduler & notification permission banner
  useEffect(() => {
    if (currentUser) {
      startHourlyReminderSchedule();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const timer = setTimeout(() => setShowNotifPrompt(true), 1200);
          return () => clearTimeout(timer);
        }
      }
    }
    return () => stopHourlyReminderSchedule();
  }, [currentUser?.id]);

  const handleEnableNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    setShowNotifPrompt(false);
    if (granted) {
      triggerTestWorkReminder();
    }
  };

  // Notion View & Filter State - bidirectional browser URL synchronization
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      return getViewFromPath(window.location.pathname);
    }
    return 'board';
  });

  const handleSelectView = useCallback((view: ViewType) => {
    setCurrentView(view);
    const targetPath = getPathFromView(view);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  }, []);

  // Listen to browser navigation back / forward buttons and sync clean URL
  useEffect(() => {
    const handlePopState = () => {
      const view = getViewFromPath(window.location.pathname);
      setCurrentView(view);
    };

    window.addEventListener('popstate', handlePopState);

    // If loaded at root '/' without path, normalize URL to /board
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({ view: 'board' }, '', '/board');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskModalInitialEdit, setTaskModalInitialEdit] = useState(false);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalInitialEdit(true);
  };
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultDeptId, setCreateTaskDefaultDeptId] = useState<number | null>(null);
  const [createTaskIsIssueMode, setCreateTaskIsIssueMode] = useState<boolean>(false);
  const [createTaskIsGmOwnTask, setCreateTaskIsGmOwnTask] = useState<boolean>(false);

  const handleOpenCreateTask = (deptId?: number, isIssue: boolean = false, isGmOwnTask: boolean = false) => {
    setCreateTaskDefaultDeptId(deptId || null);
    setCreateTaskIsIssueMode(isIssue);
    setCreateTaskIsGmOwnTask(isGmOwnTask);
    setIsCreateTaskOpen(true);
  };
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEmailLogsOpen, setIsEmailLogsOpen] = useState(false);
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [deptsData, tasksData, notifsData, staffData, statsData] = await Promise.all([
        api.getDepartments(),
        api.getTasks(),
        api.getNotifications(),
        api.getUsers(),
        api.getDashboardStats().catch(() => null),
      ]);

      setDepartments(deptsData);
      setTasks(tasksData);
      setNotifications(notifsData);
      setStaffList(staffData);
      setDashboardStats(statsData);

      // Auto-set department filter for department managers and staff
      if (currentUser.role === 'DEPT_MANAGER' || currentUser.role === 'STAFF') {
        if (currentUser.department) {
          setSelectedDeptId(currentUser.department);
        }
      }
    } catch (err) {
      console.error('Error loading workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleOpenEmailLogs = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      alert('Access restricted to System Administrators.');
      return;
    }
    try {
      const logs = await api.getEmailLogs();
      setEmailLogs(logs);
      setIsEmailLogsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenActivityLogs = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      alert('Access restricted to System Administrators.');
      return;
    }
    try {
      const logs = await api.getActivityLogs();
      setActivityLogs(logs);
      setIsActivityLogsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickApprove = async (task: Task) => {
    try {
      await api.gmReview(task.id, 'APPROVE', 'Verified & signed off by General Manager');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartTask = async (task: Task) => {
    try {
      await api.startWork(task.id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to start task work');
    }
  };

  const handleSubmitTask = async (task: Task) => {
    try {
      await api.submitForApproval(task.id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit task for approval');
    }
  };

  const handleDeleteStaff = async (user: User) => {
    if (!window.confirm(`Are you sure you want to remove staff member ${user.full_name}?`)) return;
    try {
      await api.deleteUser(user.id);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setIsCreateDeptOpen(true);
  };

  const handleDeleteDepartment = async (dept: Department) => {
    try {
      await api.deleteDepartment(dept.id);
      loadAllData();
    } catch (err: any) {
      alert(`Failed to delete department: ${err.message}`);
    }
  };

  const handleExportCsv = () => {
    window.location.href = api.getCsvExportUrl();
  };

  const handleSelectTaskById = (taskId: number) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) {
      setSelectedTask(found);
    } else {
      api.getTask(taskId).then(setSelectedTask).catch(console.error);
    }
  };

  const firstAllowedPage = useMemo(() => {
    if (!currentUser) return 'board' as ViewType;
    const found = ALL_APP_PAGES.find((p) => isUserAllowedToViewPage(currentUser, p.key));
    return (found ? found.key : 'board') as ViewType;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (!isUserAllowedToViewPage(currentUser, currentView)) {
        handleSelectView(firstAllowedPage);
      }
      if (currentUser.role === 'DEPT_MANAGER' || currentUser.role === 'STAFF') {
        if (currentUser.department) {
          setSelectedDeptId(currentUser.department);
        }
      }
    }
  }, [currentUser, currentView, firstAllowedPage, handleSelectView]);

  const isGM = currentUser?.role === 'GENERAL_MANAGER' || currentUser?.role === 'SUPER_ADMIN';

  // Departmental Data Isolation: non-GM users only see their own department
  const visibleDepartments = departments.filter((d) => {
    if (!isGM && currentUser?.department) {
      return d.id === currentUser.department;
    }
    return true;
  });

  // Filter tasks based on selected department and search query
  const filteredTasks = tasks.filter((t) => {
    // GM Own tasks must NEVER be shown to anyone except GM and Super Admin
    if (!isGM) {
      if (t.is_gm_own_task || t.department_code === 'GM') {
        return false;
      }
      const assignee = staffList.find((s) => s.id === t.assigned_to);
      if (assignee && (assignee.role === 'GENERAL_MANAGER' || assignee.role === 'SUPER_ADMIN')) {
        return false;
      }
    }
    if (!isGM && currentUser?.department && t.department !== currentUser.department) {
      return false;
    }
    if (selectedDeptId !== 'ALL' && t.department !== selectedDeptId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assigned_to_name.toLowerCase().includes(q) ||
        t.department_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredStaff = staffList.filter((s) => {
    if (!isGM && currentUser?.department && s.department !== currentUser.department) {
      return false;
    }
    if (selectedDeptId !== 'ALL' && s.department !== selectedDeptId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.full_name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingApprovalsCount = tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  const urgentTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((t) => {
      if (t.status === 'CLOSED') return false;
      const isDueToday = t.due_date && t.due_date.startsWith(today);
      const isOverdue = t.due_date && t.due_date < today;
      const isUrgentClose = t.status === 'PENDING_GM_APPROVAL';
      const isUrgentPriority = t.priority === 'URGENT';
      return isDueToday || isOverdue || isUrgentClose || isUrgentPriority;
    }).length;
  }, [tasks]);

  const getDeptTitle = () => {
    if (currentView === 'today') return 'GM Priority Desk — Today & Urgent to Close Tasks';
    if (currentView === 'approvals') return 'GM Approvals Hub';
    if (currentView === 'staff') return 'Staff Directory';
    if (currentView === 'departments') return 'Departments Overview';
    if (currentView === 'report') return 'Executive Reports & Analytics';
    if (currentView === 'settings') return 'System Settings & Super Admin Control Panel';
    if (selectedDeptId === 'ALL') return 'All Tasks Workspace';
    const dept = visibleDepartments.find((d) => d.id === selectedDeptId) || departments.find((d) => d.id === selectedDeptId);
    return dept ? `${dept.name} (${dept.code})` : (currentUser?.department_name ? `${currentUser.department_name} (${currentUser.department_code})` : 'Workspace');
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
        color: 'var(--notion-text)',
        background: 'var(--notion-bg)',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
          color: '#ffffff',
        }}>
          <RefreshCw className="animate-spin" size={24} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--notion-text)' }}>
            Rathinam Technical Campus
          </div>
          <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)', marginTop: '3px' }}>
            Initializing executive workspace & live services...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const canCreateTask = isGM;
  const canCreateStaff = isGM || currentUser.role === 'DEPT_MANAGER';
  const canCreateDepartment = isGM;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--notion-bg)' }}>
      {/* Notion Sidebar Navigation */}
      <NotionSidebar
        currentView={currentView}
        onSelectView={handleSelectView}
        selectedDeptId={selectedDeptId}
        onSelectDept={(deptId) => {
          setSelectedDeptId(deptId);
          if (currentView === 'approvals' || currentView === 'departments') {
            handleSelectView('board');
          }
        }}
        departments={visibleDepartments}
        pendingCount={pendingApprovalsCount}
        urgentTodayCount={urgentTodayCount}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmailLogs={handleOpenEmailLogs}
        onOpenActivityLogs={handleOpenActivityLogs}
        onExportCsv={handleExportCsv}
        onOpenCreateDepartment={() => {
          setEditingDepartment(null);
          setIsCreateDeptOpen(true);
        }}
      />

      {/* Main Notion Content Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <NotionTopBar
          currentView={currentView}
          onSelectView={handleSelectView}
          deptTitle={getDeptTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateTask={() => handleOpenCreateTask()}
          onOpenCreateStaff={() => {
            setEditingStaff(null);
            setIsStaffModalOpen(true);
          }}
          onOpenCreateDepartment={() => {
            setEditingDepartment(null);
            setIsCreateDeptOpen(true);
          }}
          canCreateTask={canCreateTask}
          canCreateStaff={canCreateStaff}
          canCreateDepartment={canCreateDepartment}
          onOpenCreateGmOwnTask={canCreateTask && isGM ? () => handleOpenCreateTask(undefined, false, true) : undefined}
          unreadNotifsCount={unreadNotifsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* Hourly Notification Prompt */}
        {showNotifPrompt && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '12.5px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--notion-text)' }}>
              <span>⏰</span>
              <span>Enable hourly notifications for your active tasks.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={handleEnableNotifications}
                className="notion-btn notion-btn-primary"
                style={{ fontSize: '11.5px', padding: '4px 12px', borderRadius: '7px', fontWeight: 600 }}
              >
                Enable
              </button>
              <button
                onClick={() => setShowNotifPrompt(false)}
                className="notion-btn notion-btn-bordered"
                style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '7px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <main style={{ flex: 1, minWidth: 0 }}>
          {!isUserAllowedToViewPage(currentUser, currentView) ? (
            <div
              style={{
                margin: '60px auto',
                maxWidth: '520px',
                padding: '40px 32px',
                background: 'var(--notion-card)',
                borderRadius: '16px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                <ShieldAlert size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '8px' }}>
                Page Access Restricted
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--notion-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
                You do not currently have permission to access the <strong>{getDeptTitle()}</strong> page.
                Page view permissions can be managed by an administrator or General Manager in the Personnel &amp; Staff Directory.
              </p>
              <button
                onClick={() => handleSelectView(firstAllowedPage)}
                className="notion-btn notion-btn-primary"
                style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 700, borderRadius: '9px' }}
              >
                Go to Accessible Workspace
              </button>
            </div>
          ) : (
            <>
              {currentView === 'board' && (
                <NotionBoardView
                  tasks={filteredTasks}
                  allTasks={tasks}
                  departments={visibleDepartments}
                  staffList={staffList}
                  selectedDeptId={selectedDeptId}
                  onSelectDept={setSelectedDeptId}
                  onSelectView={handleSelectView}
                  onSelectTask={setSelectedTask}
                  onOpenCreateTask={canCreateTask ? () => setIsCreateTaskOpen(true) : undefined}
                  onStartTask={handleStartTask}
                  onSubmitTask={handleSubmitTask}
                  onQuickApprove={handleQuickApprove}
                  currentUserRole={currentUser?.role}
                  currentUserId={currentUser?.id}
                  canCreateTask={canCreateTask}
                />
              )}

              {currentView === 'list' && (
                <NotionListView
                  tasks={filteredTasks}
                  onSelectTask={setSelectedTask}
                  onEditTask={handleEditTask}
                  onOpenCreateTask={canCreateTask ? () => setIsCreateTaskOpen(true) : undefined}
                  onStartTask={handleStartTask}
                  onSubmitTask={handleSubmitTask}
                  onQuickApprove={handleQuickApprove}
                  currentUserRole={currentUser?.role}
                  currentUserId={currentUser?.id}
                  canCreateTask={canCreateTask}
                />
              )}

              {currentView === 'calendar' && (
                <NotionCalendarView
                  tasks={filteredTasks}
                  onSelectTask={setSelectedTask}
                  onOpenCreateTask={canCreateTask ? () => setIsCreateTaskOpen(true) : undefined}
                  canCreateTask={canCreateTask}
                />
              )}

              {currentView === 'table' && (
                <NotionTableView
                  tasks={filteredTasks}
                  allTasks={tasks}
                  departments={visibleDepartments}
                  staffList={staffList}
                  selectedDeptId={selectedDeptId}
                  onSelectDept={setSelectedDeptId}
                  onSelectTask={setSelectedTask}
                  onEditTask={handleEditTask}
                  onOpenCreateTask={canCreateTask ? (deptId, isIssue) => handleOpenCreateTask(deptId, isIssue ?? true) : undefined}
                  canCreateTask={canCreateTask}
                  currentUserRole={currentUser?.role}
                  currentUserId={currentUser?.id}
                  onStartTask={handleStartTask}
                  onSubmitTask={handleSubmitTask}
                  onQuickApprove={handleQuickApprove}
                />
              )}

              {currentView === 'approvals' && (
                <NotionApprovalsHub
                  tasks={filteredTasks}
                  onSelectTask={setSelectedTask}
                  onQuickApprove={handleQuickApprove}
                />
              )}

              {currentView === 'departments' && (
                <NotionDepartmentsView
                  departments={visibleDepartments}
                  stats={dashboardStats}
                  onSelectDept={(id) => {
                    setSelectedDeptId(id);
                    handleSelectView('board');
                  }}
                  onOpenCreateDepartment={() => {
                    setEditingDepartment(null);
                    setIsCreateDeptOpen(true);
                  }}
                  onEditDepartment={handleEditDepartment}
                  onDeleteDepartment={handleDeleteDepartment}
                  onOpenCreateTaskForDept={canCreateTask ? (deptId, isIssue) => handleOpenCreateTask(deptId, isIssue ?? true) : undefined}
                  canManageDepartment={canCreateDepartment}
                  canCreateDepartment={canCreateDepartment}
                />
              )}

              {currentView === 'staff' && (
                <NotionStaffView
                  staffList={filteredStaff}
                  onOpenCreateStaff={() => {
                    setEditingStaff(null);
                    setIsStaffModalOpen(true);
                  }}
                  onEditStaff={(user) => {
                    setEditingStaff(user);
                    setIsStaffModalOpen(true);
                  }}
                  onDeleteStaff={handleDeleteStaff}
                  currentUserRole={currentUser.role}
                />
              )}

              {currentView === 'report' && (
                <NotionReportsView
                  tasks={tasks.filter((t) => {
                    if (!isGM && currentUser?.department && t.department !== currentUser.department) {
                      return false;
                    }
                    return true;
                  })}
                  departments={visibleDepartments}
                  stats={dashboardStats}
                  currentUserRole={currentUser.role}
                  onExportCsv={handleExportCsv}
                  onSelectTask={setSelectedTask}
                  staffList={staffList}
                  onOpenCreateTaskForDept={canCreateTask ? (deptId, isIssue) => handleOpenCreateTask(deptId, isIssue ?? true) : undefined}
                />
              )}

              {currentView === 'today' && isGM && (
                <NotionGMTodayView
                  tasks={tasks}
                  departments={visibleDepartments}
                  staffList={staffList}
                  onSelectTask={setSelectedTask}
                  onEditTask={handleEditTask}
                  onQuickApprove={handleQuickApprove}
                  onOpenCreateTask={(deptId, isIssue) => handleOpenCreateTask(deptId, isIssue ?? true)}
                  onRefresh={loadAllData}
                />
              )}

              {currentView === 'settings' && currentUser.role === 'SUPER_ADMIN' && (
                <NotionSettingsView
                  currentUserRole={currentUser.role}
                  departments={visibleDepartments}
                  onOpenCreateStaff={() => {
                    setEditingStaff(null);
                    setIsStaffModalOpen(true);
                  }}
                  onEditStaff={(user) => {
                    setEditingStaff(user);
                    setIsStaffModalOpen(true);
                  }}
                  onOpenEmailLogs={handleOpenEmailLogs}
                  onOpenActivityLogs={handleOpenActivityLogs}
                  onRefreshData={loadAllData}
                />
              )}

              {currentView === 'self_desk' && currentUser && (
                <SelfDeskView currentUser={currentUser} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Notion Task Side-Peek / Modal */}
      <NotionTaskModal
        task={selectedTask}
        initialEditMode={taskModalInitialEdit}
        onClose={() => {
          setSelectedTask(null);
          setTaskModalInitialEdit(false);
        }}
        onTaskUpdated={(updatedTask) => {
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
          loadAllData();
        }}
        currentUserRole={currentUser.role}
        departments={visibleDepartments}
      />

      {/* Create Task / Issue Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setCreateTaskDefaultDeptId(null);
          setCreateTaskIsIssueMode(false);
          setCreateTaskIsGmOwnTask(false);
        }}
        onCreated={loadAllData}
        departments={visibleDepartments}
        currentUserRole={currentUser.role}
        currentUserDeptId={currentUser.department}
        currentUserId={currentUser.id}
        initialDeptId={createTaskDefaultDeptId}
        initialIsIssue={createTaskIsIssueMode}
        initialIsGmOwnTask={createTaskIsGmOwnTask}
      />

      {/* Staff Management Modal */}
      <StaffManagementModal
        key={editingStaff ? `staff-${editingStaff.id}` : 'new-staff'}
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setEditingStaff(null);
        }}
        onSaved={loadAllData}
        departments={visibleDepartments}
        currentUserRole={currentUser.role}
        currentUserDeptId={currentUser.department}
        editingUser={editingStaff}
      />

      {/* Notifications Drawer */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={loadAllData}
        onSelectTask={handleSelectTaskById}
      />

      {/* Dispatched Email Logs Modal */}
      <EmailLogsModal
        isOpen={isEmailLogsOpen}
        onClose={() => setIsEmailLogsOpen(false)}
        emailLogs={emailLogs}
      />

      {/* Activity Logs Modal */}
      <ActivityLogModal
        isOpen={isActivityLogsOpen}
        onClose={() => setIsActivityLogsOpen(false)}
        activityLogs={activityLogs}
      />

      {/* Create / Edit Department Modal (GM & Super Admin) */}
      <CreateDepartmentModal
        isOpen={isCreateDeptOpen}
        onClose={() => {
          setIsCreateDeptOpen(false);
          setEditingDepartment(null);
        }}
        onCreated={loadAllData}
        editingDepartment={editingDepartment}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DashboardContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
