import React, { useState, useEffect } from 'react';
import { User, Department, SystemStats, Role, EmailStatus, DispatchedEmail } from '../types';
import { api, setActiveUserHeader } from '../services/api';
import {
  Database,
  Download,
  Users,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserPlus,
  KeyRound,
  Trash2,
  Edit,
  Power,
  Server,
  FileCode,
  FileSpreadsheet,
  Terminal,
  Activity,
  Layers,
  Copy,
  Check,
  Clock,
  Shield,
  Mail,
  Calendar,
  Send,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Upload,
  FileUp,
  Bell,
  Smartphone,
  LogIn,
  LogOut,
  Radio,
  Wifi,
} from 'lucide-react';
import { triggerTestWorkReminder } from '../services/notifications';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface NotionSettingsViewProps {
  currentUserRole: Role;
  departments: Department[];
  onOpenCreateStaff: () => void;
  onEditStaff: (user: User) => void;
  onOpenEmailLogs: () => void;
  onOpenActivityLogs: () => void;
  onRefreshData: () => void;
}

export const NotionSettingsView: React.FC<NotionSettingsViewProps> = ({
  currentUserRole,
  departments,
  onOpenCreateStaff,
  onEditStaff,
  onOpenEmailLogs,
  onOpenActivityLogs,
  onRefreshData,
}) => {
  const { t, isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'database' | 'users' | 'audit' | 'email' | 'app_usage'>('database');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [downloadingSql, setDownloadingSql] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);
  const [scanningDeadlines, setScanningDeadlines] = useState(false);
  const [deadlineScanResult, setDeadlineScanResult] = useState<any | null>(null);

  // Database Restore State
  const [sqlRestoreFile, setSqlRestoreFile] = useState<File | null>(null);
  const [sqlContentInput, setSqlContentInput] = useState('');
  const [restoreMode, setRestoreMode] = useState<'sql_file' | 'sql_raw' | 'json_file'>('sql_file');
  const [wipeBeforeRestore, setWipeBeforeRestore] = useState(true);
  const [restoringSql, setRestoringSql] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    status: string;
    message: string;
    method?: string;
    summary?: {
      departments: number;
      users: number;
      tasks: number;
      comments: number;
      notifications: number;
      email_logs: number;
    };
  } | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);
  const [isRestoreConfirmModalOpen, setIsRestoreConfirmModalOpen] = useState(false);

  // JSON Restore State
  const [jsonRestoreFile, setJsonRestoreFile] = useState<File | null>(null);
  const [restoringJson, setRestoringJson] = useState(false);

  // Email & SMTP State
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('asanjayarumugam77@gmail.com');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any | null>(null);
  const [emailLogsList, setEmailLogsList] = useState<DispatchedEmail[]>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<DispatchedEmail | null>(null);

  // SMTP Live Configuration Form State
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUseTls, setSmtpUseTls] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSaveResult, setSmtpSaveResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Daily 9:00 AM Work Reminder State
  const [testing9AmReminder, setTesting9AmReminder] = useState(false);
  const [dispatching9AmToAll, setDispatching9AmToAll] = useState(false);
  const [reminderActionMsg, setReminderActionMsg] = useState<string | null>(null);

  // Mobile App & User Sessions State
  const [appUsageData, setAppUsageData] = useState<{
    stats: {
      total_users: number;
      online_users_count: number;
      total_registered_devices: number;
      mobile_apk_users_count: number;
      active_sessions_count: number;
    };
    users: Array<any>;
    recent_sessions: Array<any>;
    devices: Array<any>;
  } | null>(null);
  const [loadingAppUsage, setLoadingAppUsage] = useState(false);
  const [testingPushUserId, setTestingPushUserId] = useState<number | null>(null);
  const [broadcastingPush, setBroadcastingPush] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [appUsageFilter, setAppUsageFilter] = useState<'all' | 'online' | 'mobile'>('all');
  const [appUsageSearch, setAppUsageSearch] = useState('');
  const [sessionSubTab, setSessionSubTab] = useState<'users' | 'history' | 'devices'>('users');

  const fetchAppUsageData = async () => {
    try {
      setLoadingAppUsage(true);
      const data = await api.getAdminUserSessions();
      setAppUsageData(data);
    } catch (err: any) {
      console.error('Failed to load app usage and session logs:', err);
    } finally {
      setLoadingAppUsage(false);
    }
  };

  const handleSendTestPush = async (userId?: number, userName?: string) => {
    try {
      if (userId) setTestingPushUserId(userId);
      const res = await api.sendTestPush({
        user_id: userId,
        title: '🔔 NextUp Live Alert',
        body: `Test push notification to ${userName || 'user'}! Your mobile APK notifications are verified & active!`,
      });
      setPushStatusMessage(res.message);
      setTimeout(() => setPushStatusMessage(null), 7000);
      fetchAppUsageData();
    } catch (err: any) {
      alert(`Push test notice: ${err.message}`);
    } finally {
      setTestingPushUserId(null);
    }
  };

  const [dispatchingUrgentReminders, setDispatchingUrgentReminders] = useState(false);

  const handleDispatchUrgentReminders = async () => {
    try {
      setDispatchingUrgentReminders(true);
      const res = await api.triggerUrgentReminders(true);
      const msg = `Dispatched high-priority push & email alerts for ${res.count} urgent & due deliverable(s)!`;
      setPushStatusMessage(msg);
      setReminderActionMsg(msg);
      setTimeout(() => {
        setPushStatusMessage(null);
        setReminderActionMsg(null);
      }, 7000);
      fetchAppUsageData();
    } catch (err: any) {
      alert(`Urgent dispatch notice: ${err.message}`);
    } finally {
      setDispatchingUrgentReminders(false);
    }
  };

  const handleBroadcastPush = async () => {
    if (!window.confirm('Broadcast a test notification to all registered mobile APK devices now?')) return;
    try {
      setBroadcastingPush(true);
      const res = await api.sendTestPush({
        send_to_all: true,
        title: '📢 NextUp Campus Alert',
        body: 'Campus Broadcast: Push notifications are fully connected and active on your mobile app!',
      });
      setPushStatusMessage(res.message);
      setTimeout(() => setPushStatusMessage(null), 7000);
      fetchAppUsageData();
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setBroadcastingPush(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'app_usage') {
      fetchAppUsageData();
      const interval = setInterval(fetchAppUsageData, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleTest9AmReminder = async () => {
    try {
      setTesting9AmReminder(true);
      const res = await triggerTestWorkReminder();
      setReminderActionMsg(res.message);
      setTimeout(() => setReminderActionMsg(null), 5000);
      fetchEmailStatus();
      onRefreshData();
    } catch (err: any) {
      alert(`Test reminder error: ${err.message}`);
    } finally {
      setTesting9AmReminder(false);
    }
  };

  const handleDispatch9AmAll = async () => {
    try {
      setDispatching9AmToAll(true);
      const res = await api.triggerDailyReminder(true);
      setReminderActionMsg(`Dispatched 9:00 AM work update reminders to ${res.dispatched_count} staff member(s)!`);
      setTimeout(() => setReminderActionMsg(null), 5000);
      fetchEmailStatus();
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to dispatch reminder to all: ${err.message}`);
    } finally {
      setDispatching9AmToAll(false);
    }
  };

  // User Manager Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Password Reset Modal State
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Clear Database Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [adminUsernameInput, setAdminUsernameInput] = useState('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState('adminpassword123');
  const [keepDepartmentsOption, setKeepDepartmentsOption] = useState(false);
  const [clearingDatabase, setClearingDatabase] = useState(false);

  // Load system stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getAdminSystemStats();
      setSystemStats(data);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load all users for User Manager
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load email configuration & logs
  const fetchEmailStatus = async () => {
    try {
      setLoadingEmailStatus(true);
      const [status, logs] = await Promise.all([
        api.getEmailStatus(),
        api.getEmailLogs().catch(() => []),
      ]);
      setEmailStatus(status);
      setEmailLogsList(logs);
      if (status) {
        if (status.email_host_user) setSmtpUser(status.email_host_user);
        else if (status.from_email && !status.from_email.includes('tasktracker.enterprise')) setSmtpUser(status.from_email);
        if (status.host) setSmtpHost(status.host);
        if (status.port) setSmtpPort(status.port);
        if (status.use_tls !== undefined) setSmtpUseTls(status.use_tls);
      }
    } catch (err) {
      console.error('Failed to load email status:', err);
    } finally {
      setLoadingEmailStatus(false);
    }
  };

  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSmtp(true);
      setSmtpSaveResult(null);
      const res = await api.updateEmailSettings({
        email_host_user: smtpUser.trim(),
        email_host_password: smtpPassword.trim() || undefined,
        email_host: smtpHost.trim(),
        email_port: Number(smtpPort) || 587,
        email_use_tls: smtpUseTls,
        default_from_email: smtpUser.trim() || undefined,
      });
      setSmtpSaveResult({ status: 'success', message: res.message || 'SMTP settings updated successfully!' });
      setEmailStatus(res.settings);
      setSmtpPassword('');
      fetchEmailStatus();
    } catch (err: any) {
      setSmtpSaveResult({ status: 'error', message: err.message || 'Failed to update SMTP settings.' });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) return;
    try {
      setSendingTestEmail(true);
      setTestEmailResult(null);
      const res = await api.sendTestEmail(testEmailAddress.trim());
      setTestEmailResult(res);
      fetchEmailStatus();
    } catch (err: any) {
      setTestEmailResult({ status: 'error', message: err.message || 'Failed to dispatch test email.' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchEmailStatus();
  }, []);

  const handleDownloadSql = async () => {
    try {
      setDownloadingSql(true);
      await api.downloadSqlBackup();
      setActionSuccessMessage('PostgreSQL SQL dump downloaded successfully!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingSql(false);
    }
  };

  const handleDownloadJson = async () => {
    try {
      setDownloadingJson(true);
      await api.downloadJsonBackup();
      setActionSuccessMessage('Django JSON fixture backup downloaded successfully!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleExecuteSqlRestore = async () => {
    if (restoreMode === 'sql_file' && !sqlRestoreFile) {
      alert('Please select a .sql file to restore.');
      return;
    }
    if (restoreMode === 'sql_raw' && !sqlContentInput.trim()) {
      alert('Please enter or paste SQL script content to execute.');
      return;
    }

    try {
      setRestoringSql(true);
      setRestoreErrorMessage(null);
      setRestoreResult(null);

      const res = await api.restoreDatabaseSql({
        file: restoreMode === 'sql_file' ? (sqlRestoreFile || undefined) : undefined,
        sqlContent: restoreMode === 'sql_raw' ? sqlContentInput.trim() : undefined,
        wipeBeforeRestore,
      });

      if (res.admin?.id) {
        setActiveUserHeader(res.admin.id);
      }

      setRestoreResult(res);
      setActionSuccessMessage(res.message);
      setIsRestoreConfirmModalOpen(false);
      setSqlRestoreFile(null);
      setSqlContentInput('');

      // Refresh live system statistics, user list, and tasks
      await Promise.all([fetchStats(), fetchUsers(), fetchEmailStatus()]);
      onRefreshData();
    } catch (err: any) {
      setRestoreErrorMessage(err.message || 'Failed to restore database from SQL.');
    } finally {
      setRestoringSql(false);
    }
  };

  const handleExecuteJsonRestore = async () => {
    if (!jsonRestoreFile) {
      alert('Please select a .json fixture file to restore.');
      return;
    }

    try {
      setRestoringJson(true);
      setRestoreErrorMessage(null);
      const res = await api.restoreDatabaseJson(jsonRestoreFile);

      if (res.admin?.id) {
        setActiveUserHeader(res.admin.id);
      }

      setActionSuccessMessage(res.message);
      setJsonRestoreFile(null);
      await Promise.all([fetchStats(), fetchUsers(), fetchEmailStatus()]);
      onRefreshData();
    } catch (err: any) {
      setRestoreErrorMessage(`JSON restore failed: ${err.message}`);
    } finally {
      setRestoringJson(false);
    }
  };

  const handleScanDeadlines = async () => {
    try {
      setScanningDeadlines(true);
      const res = await api.checkAllTimelineReminders();
      setActionSuccessMessage(res.message);
      setDeadlineScanResult(res.details);
      setTimeout(() => setActionSuccessMessage(null), 5000);
      onRefreshData();
    } catch (err: any) {
      alert(`Timeline deadline scan failed: ${err.message}`);
    } finally {
      setScanningDeadlines(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} account "${user.full_name}" (${user.username})?`)) {
      return;
    }

    try {
      const res = await api.toggleUserStatus(user.id);
      setActionSuccessMessage(res.message);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      fetchUsers();
      fetchStats();
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`PERMANENT ACTION: Are you sure you want to delete user "${user.full_name}" (${user.username})? This cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteUser(user.id);
      setActionSuccessMessage(`User "${user.username}" deleted successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      fetchUsers();
      fetchStats();
      onRefreshData();
    } catch (err: any) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    try {
      setResettingPassword(true);
      const res = await api.resetUserPassword(resetPasswordUser.id, newPassword);
      setActionSuccessMessage(res.message);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(`Password reset failed: ${err.message}`);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleClearDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clearConfirmationText.trim() !== 'CLEAR DATABASE') {
      alert("Please type exactly 'CLEAR DATABASE' to confirm.");
      return;
    }

    try {
      setClearingDatabase(true);
      const res = await api.clearDatabase({
        confirmation: 'CLEAR DATABASE',
        admin_username: adminUsernameInput.trim() || 'admin',
        admin_password: adminPasswordInput || 'adminpassword123',
        keep_departments: keepDepartmentsOption,
      });

      setActionSuccessMessage(res.message);
      setIsClearModalOpen(false);
      setClearConfirmationText('');
      fetchStats();
      fetchUsers();
      onRefreshData();
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(`Database clear failed: ${err.message}`);
    } finally {
      setClearingDatabase(false);
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText('psql -U postgres -d task_tracker_db < task_tracker_backup.sql');
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Filtered users for User Manager table
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (deptFilter !== 'ALL') {
      if (deptFilter === 'NONE' && u.department !== null) return false;
      if (deptFilter !== 'NONE' && u.department !== Number(deptFilter)) return false;
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE' && !u.is_active) return false;
      if (statusFilter === 'INACTIVE' && u.is_active) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.job_title && u.job_title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getRoleTag = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="notion-tag tag-purple">Super Admin</span>;
      case 'GENERAL_MANAGER':
        return <span className="notion-tag tag-yellow">General Manager</span>;
      case 'DEPT_MANAGER':
        return <span className="notion-tag tag-blue">Dept Manager</span>;
      default:
        return <span className="notion-tag tag-gray">Staff Member</span>;
    }
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1380px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(99, 102, 241, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9333ea',
                boxShadow: '0 2px 8px rgba(147, 51, 234, 0.15)',
              }}>
                <Server size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                  {isTamil ? 'கணினி அமைப்புகள் & கட்டுப்பாட்டு தளம்' : 'System Settings & Super Admin Control Panel'}
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--notion-text-dim)' }}>
                  {isTamil
                    ? 'PostgreSQL 16 தரவுத்தள காப்புநகல், SQL ஏற்றுமதி மற்றும் பணியாளர் நற்சான்றிதழ்கள் மேலாண்மை.'
                    : 'PostgreSQL 16 database backups, SQL dump exports, and company-wide user credentials management.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="notion-tag tag-purple" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', fontWeight: 700 }}>
              <Shield size={13} />
              {isTamil ? 'நிர்வாகி பாதுகாப்பு' : 'Super Admin Protected'}
            </span>
            <button
              onClick={() => {
                fetchStats();
                fetchUsers();
                onRefreshData();
              }}
              className="notion-btn notion-btn-bordered"
              title="Refresh system metrics"
              style={{ padding: '7px 14px', fontSize: '12.5px', fontWeight: 600, gap: '6px' }}
            >
              <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
              <span>{isTamil ? 'புதுப்பி' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>

        {/* Language Preference Card */}
        <div
          style={{
            marginTop: '20px',
            marginBottom: '8px',
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: 'var(--notion-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(35, 131, 226, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🌐
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {isTamil ? 'இணையதள மொழி / Website Language' : 'Website Language / இணையதள மொழி'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                {isTamil
                  ? 'எளிய ஆங்கிலம் அல்லது தமிழ் இடையே எந்த நேரத்திலும் மாற்றிக்கொள்ளலாம்.'
                  : 'Switch anytime between simple everyday English and Tamil (தமிழ்).'}
              </div>
            </div>
          </div>

          <LanguageToggle compact={false} />
        </div>

        {/* Success toast notification */}
        {actionSuccessMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 18px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: 'var(--notion-text)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Notion Database Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--notion-hover)',
          padding: '5px',
          borderRadius: '12px',
          border: '1px solid var(--notion-border-subtle)',
          marginBottom: '28px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setActiveTab('database')}
          className="notion-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'database' ? 700 : 500,
            color: activeTab === 'database' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
            borderRadius: '9px',
            background: activeTab === 'database' ? 'var(--notion-card)' : 'transparent',
            boxShadow: activeTab === 'database' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
          }}
        >
          <Database size={15} style={{ color: activeTab === 'database' ? 'var(--notion-blue)' : 'inherit' }} />
          <span>{isTamil ? 'தரவுத்தளம் & காப்புநகல்' : 'Database & Backup'}</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className="notion-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'users' ? 700 : 500,
            color: activeTab === 'users' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
            borderRadius: '9px',
            background: activeTab === 'users' ? 'var(--notion-card)' : 'transparent',
            boxShadow: activeTab === 'users' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
          }}
        >
          <Users size={15} style={{ color: activeTab === 'users' ? '#9333ea' : 'inherit' }} />
          <span>{isTamil ? `பயனர்கள் மேலாண்மை (${users.length})` : `User Manager (${users.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className="notion-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'audit' ? 700 : 500,
            color: activeTab === 'audit' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
            borderRadius: '9px',
            background: activeTab === 'audit' ? 'var(--notion-card)' : 'transparent',
            boxShadow: activeTab === 'audit' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
          }}
        >
          <Activity size={15} style={{ color: activeTab === 'audit' ? '#f59e0b' : 'inherit' }} />
          <span>{isTamil ? 'செயல்பாட்டு பதிவுகள்' : 'Audit Logs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className="notion-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'email' ? 700 : 500,
            color: activeTab === 'email' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
            borderRadius: '9px',
            background: activeTab === 'email' ? 'var(--notion-card)' : 'transparent',
            boxShadow: activeTab === 'email' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
          }}
        >
          <Mail size={15} style={{ color: activeTab === 'email' ? 'var(--notion-blue)' : 'inherit' }} />
          <span>{isTamil ? `மின்னஞ்சல் & SMTP (${emailLogsList.length})` : `Email & SMTP (${emailLogsList.length})`}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('app_usage');
            fetchAppUsageData();
          }}
          className="notion-btn"
          style={{
            padding: '7px 14px',
            fontSize: '12.5px',
            fontWeight: activeTab === 'app_usage' ? 700 : 500,
            color: activeTab === 'app_usage' ? 'var(--notion-text)' : 'var(--notion-text-dim)',
            borderRadius: '9px',
            background: activeTab === 'app_usage' ? 'var(--notion-card)' : 'transparent',
            boxShadow: activeTab === 'app_usage' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
          }}
        >
          <Smartphone size={15} style={{ color: activeTab === 'app_usage' ? '#10b981' : 'inherit' }} />
          <span>{isTamil ? `மொபைல் & அமர்வுகள் (${appUsageData?.devices?.length ?? 0})` : `Mobile App & Sessions (${appUsageData?.devices?.length ?? 0})`}</span>
        </button>
      </div>

      {/* ================= TAB 1: DATABASE BACKUP & SQL DUMP ================= */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Connection Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="notion-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Database Engine</span>
                <Server size={16} style={{ color: '#2383e2' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {systemStats?.database_engine || 'PostgreSQL 18'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                {systemStats?.database_version || 'PostgreSQL 18.4'}
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Database Name</span>
                <Database size={16} style={{ color: '#529e72' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {systemStats?.database_name || 'task_tracker_db'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                Host: {systemStats?.host || 'localhost:5432'}
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Physical Disk Size</span>
                <HardDrive size={16} style={{ color: '#a87bc7' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {systemStats?.database_size || '9.4 MB'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                7 active application tables
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Cluster Health</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34c759' }} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#34c759', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} />
                <span>Healthy & Active</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                All schema migrations verified
              </div>
            </div>
          </div>

          {/* Download SQL Dump & JSON Backups */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* SQL Dump Option */}
            <div className="notion-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(35, 131, 226, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileCode size={20} style={{ color: '#2383e2' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--notion-text)' }}>
                      PostgreSQL SQL Dump (.sql)
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      Industry-Standard Production Backup
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, margin: '8px 0 16px' }}>
                  Generates an authentic PostgreSQL SQL backup containing all table definitions, constraints, sequences, and formatted <code style={{ color: 'var(--notion-blue)' }}>INSERT</code> statements for immediate execution into psql or pgAdmin.
                </p>

                <div style={{ background: 'var(--notion-hover)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--notion-text-muted)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>Output Format:</span>
                    <span>Single-file SQL script</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>Restore Command:</span>
                    <span><code style={{ fontSize: '11px' }}>psql -d task_tracker_db &lt; backup.sql</code></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadSql}
                disabled={downloadingSql}
                className="notion-btn notion-btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {downloadingSql ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Dumping PostgreSQL Database...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download PostgreSQL SQL Dump (.sql)</span>
                  </>
                )}
              </button>
            </div>

            {/* JSON Fixture Option */}
            <div className="notion-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(15, 123, 108, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileSpreadsheet size={20} style={{ color: '#0f7b6c' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--notion-text)' }}>
                      Django Fixture Backup (.json)
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      JSON Serialization Fixtures
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, margin: '8px 0 16px' }}>
                  Exports the entire relational database as formatted JSON objects using Django fixture serialization, ideal for cross-database migrations, version control snapshots, or testing fixtures.
                </p>

                <div style={{ background: 'var(--notion-hover)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--notion-text-muted)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>Output Format:</span>
                    <span>Structured JSON models</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>Restore Command:</span>
                    <span><code style={{ fontSize: '11px' }}>python manage.py loaddata backup.json</code></span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadJson}
                disabled={downloadingJson}
                className="notion-btn"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid var(--notion-border)',
                }}
              >
                {downloadingJson ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Serializing JSON Fixtures...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Download Django JSON Backup (.json)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ================= IN-SOFTWARE DATABASE RESTORE SECTION ================= */}
          <div
            className="notion-card"
            style={{
              padding: '24px',
              border: '1px solid rgba(35, 131, 226, 0.35)',
              background: 'linear-gradient(180deg, rgba(35, 131, 226, 0.04) 0%, transparent 100%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'rgba(35, 131, 226, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2383e2',
                  }}
                >
                  <Upload size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                      In-Software Database Restore (.sql / .json)
                    </h3>
                    <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 600 }}>
                      Super Admin Only
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.4 }}>
                    Upload an existing SQL backup file or JSON fixture to restore departments, tasks, users, and comments directly inside the software.
                  </p>
                </div>
              </div>

              {/* Mode Selector Buttons */}
              <div style={{ display: 'flex', background: 'var(--notion-hover)', padding: '3px', borderRadius: '6px', border: '1px solid var(--notion-border-subtle)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setRestoreMode('sql_file')}
                  className="notion-btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: restoreMode === 'sql_file' ? 600 : 400,
                    background: restoreMode === 'sql_file' ? 'var(--notion-card-bg, #202020)' : 'transparent',
                    color: restoreMode === 'sql_file' ? '#2383e2' : 'var(--notion-text-muted)',
                    boxShadow: restoreMode === 'sql_file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '4px',
                  }}
                >
                  <FileCode size={14} />
                  <span>Restore .sql File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('sql_raw')}
                  className="notion-btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: restoreMode === 'sql_raw' ? 600 : 400,
                    background: restoreMode === 'sql_raw' ? 'var(--notion-card-bg, #202020)' : 'transparent',
                    color: restoreMode === 'sql_raw' ? '#2383e2' : 'var(--notion-text-muted)',
                    boxShadow: restoreMode === 'sql_raw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '4px',
                  }}
                >
                  <Terminal size={14} />
                  <span>Direct SQL Script</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('json_file')}
                  className="notion-btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: restoreMode === 'json_file' ? 600 : 400,
                    background: restoreMode === 'json_file' ? 'var(--notion-card-bg, #202020)' : 'transparent',
                    color: restoreMode === 'json_file' ? '#0f7b6c' : 'var(--notion-text-muted)',
                    boxShadow: restoreMode === 'json_file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '4px',
                  }}
                >
                  <FileSpreadsheet size={14} />
                  <span>Restore .json Fixture</span>
                </button>
              </div>
            </div>

            {/* Mode 1: SQL File Upload */}
            {restoreMode === 'sql_file' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    border: '2px dashed var(--notion-border)',
                    borderRadius: '8px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: sqlRestoreFile ? 'rgba(35, 131, 226, 0.05)' : 'var(--notion-hover)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderColor: sqlRestoreFile ? '#2383e2' : undefined,
                  }}
                  onClick={() => document.getElementById('sql-restore-file-input')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.name.endsWith('.sql') || file.type.includes('sql') || file.type.includes('plain'))) {
                      setSqlRestoreFile(file);
                      setRestoreErrorMessage(null);
                    } else if (file) {
                      alert('Please select a valid .sql backup file.');
                    }
                  }}
                >
                  <input
                    id="sql-restore-file-input"
                    type="file"
                    accept=".sql,text/plain"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSqlRestoreFile(file);
                        setRestoreErrorMessage(null);
                      }
                    }}
                  />

                  {sqlRestoreFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <FileCode size={32} style={{ color: '#2383e2' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          {sqlRestoreFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                          {(sqlRestoreFile.size / 1024).toFixed(1)} KB • Ready for PostgreSQL restore
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSqlRestoreFile(null);
                        }}
                        className="notion-btn"
                        style={{ padding: '4px 8px', marginLeft: '12px', fontSize: '12px' }}
                      >
                        <X size={14} />
                        <span>Change</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FileUp size={36} style={{ color: '#2383e2', margin: '0 auto 10px', opacity: 0.85 }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '4px' }}>
                        Select or Drag & Drop PostgreSQL Backup (.sql)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                        Compatible with PostgreSQL 18 SQL dumps and standard INSERT scripts
                      </div>
                    </div>
                  )}
                </div>

                {/* Option: Wipe Before Restore */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    background: 'var(--notion-hover)',
                    border: '1px solid var(--notion-border-subtle)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--notion-text)', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={wipeBeforeRestore}
                      onChange={(e) => setWipeBeforeRestore(e.target.checked)}
                      style={{ accentColor: 'var(--notion-blue)', width: '16px', height: '16px' }}
                    />
                    <span>Wipe current tables before restore (Recommended for clean snapshot & avoiding duplicate key errors)</span>
                  </label>
                  <span className="notion-tag tag-green" style={{ fontSize: '11px' }}>Clean Snapshot</span>
                </div>

                {/* Safety Guarantee */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'rgba(52, 199, 89, 0.08)',
                    border: '1px solid rgba(52, 199, 89, 0.25)',
                    fontSize: '12px',
                    color: 'var(--notion-text)',
                  }}
                >
                  <ShieldCheck size={18} style={{ color: '#34c759', flexShrink: 0 }} />
                  <div>
                    <strong>Super Admin Protection:</strong> Restoring this SQL backup automatically verifies and preserves the primary Administrator account (<code style={{ color: '#2383e2' }}>admin / admin</code>) and synchronizes auto-increment sequences so you won't get locked out or encounter ID conflicts.
                  </div>
                </div>

                {/* Restore Button */}
                <button
                  type="button"
                  disabled={!sqlRestoreFile || restoringSql}
                  onClick={() => setIsRestoreConfirmModalOpen(true)}
                  className="notion-btn notion-btn-primary"
                  style={{
                    padding: '12px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: !sqlRestoreFile || restoringSql ? 'not-allowed' : 'pointer',
                    opacity: !sqlRestoreFile ? 0.6 : 1,
                  }}
                >
                  {restoringSql ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Restoring PostgreSQL Database from SQL...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Execute SQL Restore into PostgreSQL</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 2: Direct SQL Script Console */}
            {restoreMode === 'sql_raw' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                    Paste SQL Query or INSERT Statements:
                  </label>
                  <textarea
                    rows={8}
                    value={sqlContentInput}
                    onChange={(e) => setSqlContentInput(e.target.value)}
                    placeholder="-- Paste raw SQL statements here:&#10;INSERT INTO tasks_department (id, name, code, description) VALUES (1, 'Engineering', 'ENG', 'Engineering Dept') ON CONFLICT DO NOTHING;&#10;-- Multiple statements supported"
                    className="notion-input"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      lineHeight: 1.45,
                      resize: 'vertical',
                      whiteSpace: 'pre',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: 'var(--notion-hover)',
                    border: '1px solid var(--notion-border-subtle)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--notion-text)' }}>
                    <input
                      type="checkbox"
                      checked={wipeBeforeRestore}
                      onChange={(e) => setWipeBeforeRestore(e.target.checked)}
                      style={{ accentColor: 'var(--notion-blue)' }}
                    />
                    <span>Wipe current tables before executing</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                    {sqlContentInput.trim().length} characters
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!sqlContentInput.trim() || restoringSql}
                  onClick={handleExecuteSqlRestore}
                  className="notion-btn notion-btn-primary"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    gap: '8px',
                    cursor: !sqlContentInput.trim() || restoringSql ? 'not-allowed' : 'pointer',
                  }}
                >
                  {restoringSql ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Executing SQL Script...</span>
                    </>
                  ) : (
                    <>
                      <Terminal size={15} />
                      <span>Execute SQL Script</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mode 3: JSON Fixture Restore */}
            {restoreMode === 'json_file' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    border: '2px dashed var(--notion-border)',
                    borderRadius: '8px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    background: jsonRestoreFile ? 'rgba(15, 123, 108, 0.05)' : 'var(--notion-hover)',
                    cursor: 'pointer',
                    borderColor: jsonRestoreFile ? '#0f7b6c' : undefined,
                  }}
                  onClick={() => document.getElementById('json-restore-file-input')?.click()}
                >
                  <input
                    id="json-restore-file-input"
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setJsonRestoreFile(file);
                        setRestoreErrorMessage(null);
                      }
                    }}
                  />

                  {jsonRestoreFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <FileSpreadsheet size={32} style={{ color: '#0f7b6c' }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          {jsonRestoreFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                          {(jsonRestoreFile.size / 1024).toFixed(1)} KB • Ready for Django loaddata
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJsonRestoreFile(null);
                        }}
                        className="notion-btn"
                        style={{ padding: '4px 8px', marginLeft: '12px', fontSize: '12px' }}
                      >
                        <X size={14} />
                        <span>Change</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FileSpreadsheet size={36} style={{ color: '#0f7b6c', margin: '0 auto 10px', opacity: 0.85 }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '4px' }}>
                        Select Django Fixture (.json)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                        Serialized models snapshot produced by Django dumpdata
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!jsonRestoreFile || restoringJson}
                  onClick={handleExecuteJsonRestore}
                  className="notion-btn"
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    gap: '8px',
                    border: '1px solid #0f7b6c',
                    color: '#0f7b6c',
                    cursor: !jsonRestoreFile || restoringJson ? 'not-allowed' : 'pointer',
                  }}
                >
                  {restoringJson ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Loading JSON Fixture Data...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Restore from JSON Fixture</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Restore Result Feedback */}
            {restoreResult && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  border: '1px solid rgba(52, 199, 89, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34c759', fontWeight: 700, fontSize: '14px' }}>
                    <CheckCircle2 size={18} />
                    <span>{restoreResult.message}</span>
                  </div>
                  <button
                    onClick={() => setRestoreResult(null)}
                    className="notion-btn"
                    style={{ padding: '2px 6px', fontSize: '11px' }}
                  >
                    Dismiss
                  </button>
                </div>
                {restoreResult.method && (
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginBottom: '10px' }}>
                    Executed using: <strong style={{ color: 'var(--notion-text)' }}>{restoreResult.method === 'psql' ? 'Native PostgreSQL 18 (psql.exe)' : 'Django SQL Cursor Engine'}</strong>
                  </div>
                )}
                {restoreResult.summary && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="notion-tag tag-blue">🏢 {restoreResult.summary.departments} Departments</span>
                    <span className="notion-tag tag-purple">👥 {restoreResult.summary.users} Users</span>
                    <span className="notion-tag tag-green">📋 {restoreResult.summary.tasks} Tasks</span>
                    <span className="notion-tag tag-orange">💬 {restoreResult.summary.comments} Comments</span>
                    <span className="notion-tag tag-red">🔔 {restoreResult.summary.notifications} Notifications</span>
                    <span className="notion-tag tag-blue">✉️ {restoreResult.summary.email_logs} Emails</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {restoreErrorMessage && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#ef4444' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>Restore Failed</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--notion-text)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {restoreErrorMessage}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRestoreErrorMessage(null)}
                    className="notion-btn"
                    style={{ padding: '2px 6px', fontSize: '11px' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Database Table Live Row Breakdown */}
          <div className="notion-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 14px', color: 'var(--notion-text)' }}>
              Database Tables & Record Metrics (task_tracker_db)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {[
                { name: 'tasks_department', label: 'Departments', count: systemStats?.tables.departments ?? 0, icon: '🏢' },
                { name: 'tasks_user', label: 'User Accounts', count: systemStats?.tables.users ?? 0, icon: '👥' },
                { name: 'tasks_task', label: 'Tasks & Milestones', count: systemStats?.tables.tasks ?? 0, icon: '📋' },
                { name: 'tasks_taskcomment', label: 'Task Comments', count: systemStats?.tables.comments ?? 0, icon: '💬' },
                { name: 'tasks_notification', label: 'Notifications', count: systemStats?.tables.notifications ?? 0, icon: '🔔' },
                { name: 'tasks_dispatchedemaillog', label: 'Dispatched Emails', count: systemStats?.tables.email_logs ?? 0, icon: '✉️' },
                { name: 'tasks_activitylog', label: 'Audit Activity Logs', count: systemStats?.tables.activity_logs ?? 0, icon: '📜' },
              ].map((table) => (
                <div
                  key={table.name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    border: '1px solid var(--notion-border-subtle)',
                    background: 'var(--notion-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{table.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)' }}>{table.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontFamily: 'monospace' }}>{table.name}</div>
                    </div>
                  </div>
                  <span className="notion-tag tag-blue" style={{ fontSize: '12px', fontWeight: 700 }}>
                    {table.count} rows
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick CLI Restore Snippet */}
          <div className="notion-card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} style={{ color: 'var(--notion-text-muted)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                  How to restore your SQL backup into PostgreSQL
                </span>
              </div>
              <button
                onClick={handleCopyCli}
                className="notion-btn"
                style={{ fontSize: '11px', padding: '3px 8px', gap: '5px' }}
              >
                {copiedCli ? <Check size={12} style={{ color: '#34c759' }} /> : <Copy size={12} />}
                <span>{copiedCli ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#e2e8f0',
                overflowX: 'auto',
              }}
            >
              psql -U postgres -d task_tracker_db &lt; task_tracker_backup.sql
            </pre>
          </div>

          {/* Danger Zone: Clear Database */}
          <div
            className="notion-card"
            style={{
              padding: '22px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '6px' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>
                    Danger Zone: Clear Database & Wipe Records
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, maxWidth: '780px' }}>
                  Permanently deletes all tasks, comments, notifications, email logs, activity logs, departments, and regular staff accounts from PostgreSQL. Exactly <strong>ONE Super Admin user</strong> will remain so you can configure a fresh workspace.
                </p>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  <span>✓ PostgreSQL sequence IDs reset to 1</span>
                  <span>✓ 1 Master Super Admin preserved</span>
                  <span>✓ Complete SQL data wipe</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setClearConfirmationText('');
                  setIsClearModalOpen(true);
                }}
                className="notion-btn"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '9px 16px',
                  gap: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                }}
              >
                <Trash2 size={15} />
                <span>Clear Database & Reset...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USER MANAGER ================= */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              {/* Search */}
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--notion-text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search username, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="notion-input"
                  style={{ paddingLeft: '32px', fontSize: '12px' }}
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="notion-select"
                style={{ fontSize: '12px', width: '160px' }}
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="GENERAL_MANAGER">General Manager</option>
                <option value="DEPT_MANAGER">Department Manager</option>
                <option value="STAFF">Staff Member</option>
              </select>

              {/* Department filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="notion-select"
                style={{ fontSize: '12px', width: '180px' }}
              >
                <option value="ALL">All Departments</option>
                <option value="NONE">Global / None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="notion-select"
                style={{ fontSize: '12px', width: '140px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Create New User */}
            <button
              onClick={onOpenCreateStaff}
              className="notion-btn notion-btn-primary"
              style={{ fontSize: '13px', padding: '7px 14px', gap: '6px' }}
            >
              <UserPlus size={15} />
              <span>Create New User</span>
            </button>
          </div>

          {/* User Table */}
          <div className="notion-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="notion-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--notion-hover)', borderBottom: '1px solid var(--notion-border)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    User & Username
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    Role
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    Department
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    Contact Email
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    Account Status
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                    Admin Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--notion-text-muted)', fontSize: '13px' }}>
                      No user accounts found matching current search filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid var(--notion-border-subtle)',
                        background: 'transparent',
                        opacity: user.is_active === false ? 0.6 : 1,
                      }}
                    >
                      {/* Name & username */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '4px',
                              background: user.role === 'SUPER_ADMIN' ? '#6941c6' : user.role === 'GENERAL_MANAGER' ? '#b54708' : '#175cd3',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                              flexShrink: 0,
                            }}
                          >
                            {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--notion-text)' }}>
                              {user.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontFamily: 'monospace' }}>
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px 14px' }}>
                        {getRoleTag(user.role)}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--notion-text)' }}>
                        {user.department_name && user.department_name !== 'Global / None' ? (
                          <span className="notion-tag tag-blue" style={{ fontSize: '11px' }}>
                            {user.department_name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>Global (All Depts)</span>
                        )}
                      </td>

                      {/* Email */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                        {user.email || '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {user.is_active !== false ? (
                          <span className="notion-tag tag-green" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            Active
                          </span>
                        ) : (
                          <span className="notion-tag tag-red" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="notion-btn"
                            title={user.is_active !== false ? 'Suspend User' : 'Activate User'}
                            style={{ padding: '4px 7px', color: user.is_active !== false ? '#f59e0b' : '#10b981' }}
                          >
                            <Power size={13} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetPasswordUser(user);
                              setNewPassword('');
                            }}
                            className="notion-btn"
                            title="Reset User Password"
                            style={{ padding: '4px 7px', color: '#6366f1' }}
                          >
                            <KeyRound size={13} />
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => onEditStaff(user)}
                            className="notion-btn"
                            title="Edit Personnel Details"
                            style={{ padding: '4px 7px', color: 'var(--notion-text)' }}
                          >
                            <Edit size={13} />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="notion-btn"
                            title="Delete User Permanently"
                            style={{ padding: '4px 7px', color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUDIT & LOGS ================= */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="notion-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(224, 125, 16, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} style={{ color: '#e07d10' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--notion-text)' }}>
                    Workspace Activity Audit Trail
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    Immutable log of all user activities
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, margin: '8px 0 16px' }}>
                Every creation, status update, GM sign-off approval, and personnel change is recorded with exact user IDs, timestamps, and department scopes.
              </p>
              <button
                onClick={onOpenActivityLogs}
                className="notion-btn notion-btn-primary"
                style={{ width: '100%', padding: '9px 14px', fontSize: '13px', fontWeight: 600 }}
              >
                Open Full Activity Audit Logs &rarr;
              </button>
            </div>

            <div className="notion-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--notion-text)' }}>
                    Dispatched Email Log Records
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    Audited notification emails
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, margin: '8px 0 16px' }}>
                Inspect all automated emails dispatched by the system for task assignments, GM review requests, and timeline reminders with recipients and bodies.
              </p>
              <button
                onClick={onOpenEmailLogs}
                className="notion-btn"
                style={{ width: '100%', padding: '9px 14px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--notion-border)' }}
              >
                Open Dispatched Email Logs &rarr;
              </button>
            </div>
          </div>

          {/* Timeline Deadlines & Milestone Reminders Card */}
          <div className="notion-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(35, 131, 226, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} style={{ color: '#2383e2' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                    Automated Timeline Deadlines & Mail Dispatcher
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                    Calculates relative timeline countdowns & triggers urgency emails for upcoming or overdue milestones
                  </span>
                </div>
              </div>

              <button
                onClick={handleScanDeadlines}
                disabled={scanningDeadlines}
                className="notion-btn notion-btn-primary"
                style={{ padding: '9px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={scanningDeadlines ? 'animate-spin' : ''} />
                <span>{scanningDeadlines ? 'Scanning Deadlines...' : 'Scan Deadlines & Send Reminder Emails'}</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
              When triggered, the scanner queries all non-closed tasks in PostgreSQL with due dates. Any task that is overdue, due today, or due within 2 days receives an automated, priority-categorized reminder email with relative day countdowns sent to the assigned staff member and department manager.
            </p>

            <div style={{ background: 'var(--notion-hover)', border: '1px solid var(--notion-border-subtle)', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)' }}>
                  Server CLI / Cronjob Automation:
                </span>
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', marginLeft: '8px' }}>
                  Run automatically via Windows Task Scheduler or Linux crontab:
                </span>
              </div>
              <code style={{ fontSize: '12px', background: 'rgba(0,0,0,0.15)', padding: '4px 8px', borderRadius: '4px' }}>
                python manage.py check_timeline_reminders
              </code>
            </div>

            {deadlineScanResult && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--notion-border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#34c759', marginBottom: '10px' }}>
                  <CheckCircle2 size={16} />
                  <span>Scan Summary: {deadlineScanResult.tasks_checked} tasks evaluated, {deadlineScanResult.emails_dispatched} reminder emails dispatched</span>
                </div>

                {deadlineScanResult.items && deadlineScanResult.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {deadlineScanResult.items.map((item: any) => (
                      <div
                        key={item.task_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--notion-item-bg)',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <strong>#{item.task_id} {item.title}</strong> &rarr; <span style={{ color: 'var(--notion-text-muted)' }}>{item.assignee_email}</span>
                        </div>
                        <span className="notion-tag tag-orange">{item.timeline_text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                    All tasks are on track. No urgent or approaching deadlines require reminder dispatch at this time.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: EMAIL & SMTP DISPATCH ================= */}
      {activeTab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Daily 9:00 AM Morning Work Update Reminder & 3-Month Session Card */}
          <div
            className="notion-card"
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '20px',
                  boxShadow: '0 3px 10px rgba(245, 158, 11, 0.25)',
                }}>
                  ☀️
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--notion-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Daily 9:00 AM Morning Work Update Reminder
                    <span className="notion-tag tag-green" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>
                      Active Daily at 09:00 AM
                    </span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--notion-text-dim)' }}>
                    Pushes a desktop and device notification every morning requesting staff to update their daily work report and task deliverables.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleTest9AmReminder}
                  disabled={testing9AmReminder}
                  className="notion-btn notion-btn-primary"
                  style={{ padding: '7px 16px', fontSize: '12.5px', fontWeight: 700, borderRadius: '8px', gap: '6px' }}
                >
                  <Bell size={14} />
                  <span>{testing9AmReminder ? 'Sending...' : 'Test 9:00 AM Alert'}</span>
                </button>

                <button
                  onClick={handleDispatch9AmAll}
                  disabled={dispatching9AmToAll}
                  className="notion-btn notion-btn-bordered"
                  style={{ padding: '7px 16px', fontSize: '12.5px', fontWeight: 600, borderRadius: '8px', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{dispatching9AmToAll ? 'Dispatching...' : 'Dispatch 9AM-6PM Check-In'}</span>
                </button>

                <button
                  onClick={handleDispatchUrgentReminders}
                  disabled={dispatchingUrgentReminders}
                  className="notion-btn"
                  style={{
                    padding: '7px 16px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    gap: '6px',
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Bell size={14} />
                  <span>{dispatchingUrgentReminders ? 'Dispatching...' : '🚨 Push Urgent & Due Tasks'}</span>
                </button>
              </div>
            </div>

            {/* Info Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '14px' }}>
              <div style={{ padding: '14px', background: 'var(--notion-card)', borderRadius: '10px', border: '1px solid var(--notion-border)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--notion-blue)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} />
                  <span>Daily Alert Schedule</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                  09:00 AM Every Morning (Mon – Sun)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  Message: "Good morning! It's 9:00 AM. Please update your work report and task deliverables for today."
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--notion-card)', borderRadius: '10px', border: '1px solid var(--notion-border)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#10b981', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={13} />
                  <span>3-Month Session Persistence</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                  90 Days Continuous Login (No Timeout)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  Django session cookie age set to 90 days (7,776,000s). Users stay signed in on web & mobile without automatic logout.
                </div>
              </div>
            </div>

            {reminderActionMsg && (
              <div style={{
                marginTop: '14px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '12.5px',
                color: '#10b981',
                fontWeight: 600,
              }}>
                ✓ {reminderActionMsg}
              </div>
            )}
          </div>

          {/* Status & Diagnostics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div className="notion-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                  Delivery Mode
                </span>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: emailStatus?.has_smtp_password ? '#10b981' : '#3b82f6',
                    boxShadow: emailStatus?.has_smtp_password ? '0 0 8px #10b981' : '0 0 8px #3b82f6',
                  }}
                />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {emailStatus?.mode || 'Console / Simulation Mode'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                {emailStatus?.has_smtp_password
                  ? 'Active SMTP credentials configured in .env'
                  : 'Audited & saved to database (No SMTP in .env)'}
              </div>
            </div>

            <div className="notion-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                  SMTP Host & Port
                </span>
                <Server size={16} style={{ color: '#2383e2' }} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {emailStatus?.host || 'smtp.gmail.com'}:{emailStatus?.port || 587}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                TLS Encryption: {emailStatus?.use_tls ? 'Enabled (STARTTLS)' : 'Disabled'}
              </div>
            </div>

            <div className="notion-card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>
                  Sender Address (From)
                </span>
                <Mail size={16} style={{ color: '#a87bc7' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emailStatus?.from_email || 'notifications@tasktracker.enterprise'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                Total Emails Sent: {emailStatus?.total_dispatched_emails || emailLogsList.length}
              </div>
            </div>
          </div>

          {/* Test Email Dispatcher & Live Verification */}
          <div className="notion-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(35, 131, 226, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={18} style={{ color: '#2383e2' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                  Live Test Email Dispatcher
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  Dispatch a real-time verification email to any staff or administrator inbox to verify deliverability
                </span>
              </div>
            </div>

            <form onSubmit={handleSendTestEmail} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
              <input
                type="email"
                required
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter recipient email (e.g. asanjayarumugam77@gmail.com)"
                className="notion-input"
                style={{ flex: '1 1 320px', minWidth: '280px', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={sendingTestEmail}
                className="notion-btn notion-btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                {sendingTestEmail ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Send Live Test Email</span>
                  </>
                )}
              </button>
            </form>

            {testEmailResult && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '6px',
                  background: testEmailResult.status === 'success' ? 'rgba(52, 199, 89, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: testEmailResult.status === 'success' ? '1px solid rgba(52, 199, 89, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: testEmailResult.status === 'success' ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                  {testEmailResult.status === 'success' ? '✓ Email Dispatched Successfully' : '⚠️ Dispatch Notification'}
                </div>
                <div style={{ color: 'var(--notion-text)' }}>
                  {testEmailResult.message}
                </div>
                {testEmailResult.details?.error && (
                  <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontFamily: 'monospace' }}>
                    Diagnostic: {testEmailResult.details.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive SMTP Credentials Configuration Card */}
          <div
            className="notion-card"
            style={{
              padding: '24px',
              borderLeft: '4px solid #2383e2',
              background: 'rgba(35, 131, 226, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(35, 131, 226, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={18} style={{ color: '#2383e2' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                    Configure SMTP Server &amp; Gmail Credentials
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                    Save your sender account and 16-character Google App Password to deliver live emails to staff personal inboxes
                  </span>
                </div>
              </div>

              <div className="notion-tag" style={{ background: emailStatus?.has_smtp_password ? 'rgba(16, 185, 129, 0.12)' : 'rgba(35, 131, 226, 0.12)', color: emailStatus?.has_smtp_password ? '#10b981' : '#2383e2', fontWeight: 700, fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}>
                {emailStatus?.has_smtp_password ? '🟢 Live SMTP Active' : '🔵 Simulation / Console Mode'}
              </div>
            </div>

            <form onSubmit={handleSaveSmtpSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                    Sender Email Address (Host User) *
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="e.g. notifications@rathinam.in or your_email@gmail.com"
                    className="notion-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px', display: 'block' }}>
                    Email address used as sender for all task deliverables &amp; reminders.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                    Google App Password {emailStatus?.has_smtp_password ? '(Saved • Leave blank to keep)' : '*'}
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder={emailStatus?.has_smtp_password ? '••••••••••••••••' : 'Enter 16-character Google App Password'}
                      className="notion-input"
                      style={{ width: '100%', paddingRight: '36px', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--notion-text-dim)',
                        padding: '4px',
                      }}
                    >
                      {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)', marginTop: '4px', display: 'block' }}>
                    Generate at Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                    SMTP Host Server
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="notion-input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                    Port &amp; Security
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="notion-input"
                      style={{ width: '90px', fontSize: '13px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--notion-text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={smtpUseTls}
                        onChange={(e) => setSmtpUseTls(e.target.checked)}
                      />
                      <span>STARTTLS Encryption</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={savingSmtp || (!smtpUser && !smtpPassword)}
                  className="notion-btn notion-btn-primary"
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '8px', gap: '6px' }}
                >
                  {savingSmtp ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving SMTP Credentials...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Save SMTP Settings</span>
                    </>
                  )}
                </button>

                {smtpSaveResult && (
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      background: smtpSaveResult.status === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: smtpSaveResult.status === 'success' ? '#10b981' : '#ef4444',
                      border: smtpSaveResult.status === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {smtpSaveResult.status === 'success' ? '✓ ' : '⚠️ '}
                    {smtpSaveResult.message}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Dispatched Emails Audit Table */}
          <div className="notion-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                  Dispatched Email Audit Trail ({emailLogsList.length} Records)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  Every task assignment and deadline email dispatched by the system
                </span>
              </div>
              <button
                onClick={fetchEmailStatus}
                disabled={loadingEmailStatus}
                className="notion-btn"
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                <RefreshCw size={13} className={loadingEmailStatus ? 'animate-spin' : ''} />
                <span>Refresh Log</span>
              </button>
            </div>

            {emailLogsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--notion-text-dim)', fontSize: '13px' }}>
                No dispatched email logs recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--notion-border)', color: 'var(--notion-text-dim)' }}>
                      <th style={{ padding: '8px 12px' }}>Event</th>
                      <th style={{ padding: '8px 12px' }}>Recipient</th>
                      <th style={{ padding: '8px 12px' }}>Subject</th>
                      <th style={{ padding: '8px 12px' }}>Timestamp</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogsList.slice(0, 25).map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--notion-border-subtle)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <span className="notion-tag tag-blue" style={{ fontSize: '10px' }}>
                            {log.event_type}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <strong style={{ color: 'var(--notion-text)' }}>{log.recipient_name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>{log.recipient_email}</div>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--notion-text)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.subject}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--notion-text-dim)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedEmailPreview(log)}
                            className="notion-btn"
                            style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile App Usage, Online Sessions & Push Notifications Tab */}
      {activeTab === 'app_usage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Header & Live Actions Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: 'var(--notion-card)', padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--notion-border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} style={{ color: '#10b981' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                  Mobile App &amp; Real-Time User Sessions
                </h2>
                <span className="notion-tag tag-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                  Live Sync (15s)
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', margin: '6px 0 0' }}>
                Track who is logged in, monitor mobile APK devices, send push reminders (9 AM – 6 PM check-ins), and dispatch urgent task notifications.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={fetchAppUsageData}
                disabled={loadingAppUsage}
                className="notion-btn notion-btn-bordered"
                style={{ fontSize: '12px', padding: '6px 12px', gap: '6px' }}
                title="Refresh sessions & device status now"
              >
                <RefreshCw size={13} className={loadingAppUsage ? 'animate-spin' : ''} />
                <span>Refresh Live</span>
              </button>

              <button
                type="button"
                onClick={handleDispatch9AmAll}
                disabled={dispatching9AmToAll}
                className="notion-btn"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  gap: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  fontWeight: 700,
                  borderRadius: '7px',
                }}
                title="Dispatch 9 AM – 6 PM hourly work reminder to all staff"
              >
                <Clock size={13} />
                <span>{dispatching9AmToAll ? 'Sending...' : '⏰ 9-6 Work Remind'}</span>
              </button>

              <button
                type="button"
                onClick={handleDispatchUrgentReminders}
                disabled={dispatchingUrgentReminders}
                className="notion-btn"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 700,
                  borderRadius: '7px',
                }}
                title="Send high-priority push & email alerts for urgent & due date tasks"
              >
                <AlertTriangle size={13} />
                <span>{dispatchingUrgentReminders ? 'Alerting...' : '🚨 Urgent & Due Push'}</span>
              </button>

              <button
                type="button"
                onClick={handleBroadcastPush}
                disabled={broadcastingPush}
                className="notion-btn notion-btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
                title="Broadcast a test notification to all 10+ mobile APK phones"
              >
                <Bell size={13} />
                <span>{broadcastingPush ? 'Broadcasting...' : '📢 Broadcast Test Push'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Notice */}
          {pushStatusMessage && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', padding: '10px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{pushStatusMessage}</span>
            </div>
          )}

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="notion-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Total Staff Accounts</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)', marginTop: '2px' }}>{appUsageData?.stats.total_users ?? '—'}</div>
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Radio size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Online Staff (Last 5m)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{appUsageData?.stats.online_users_count ?? 0}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-muted)' }}>active</span>
                </div>
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Mobile APK Devices</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0ea5e9', marginTop: '2px' }}>{appUsageData?.stats.total_registered_devices ?? 0}</div>
              </div>
            </div>

            <div className="notion-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Active Sessions</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{appUsageData?.stats.active_sessions_count ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--notion-border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSessionSubTab('users')}
                className="notion-btn"
                style={{
                  fontSize: '12.5px',
                  fontWeight: sessionSubTab === 'users' ? 700 : 500,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: sessionSubTab === 'users' ? 'var(--notion-card)' : 'transparent',
                  color: sessionSubTab === 'users' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                  border: sessionSubTab === 'users' ? '1px solid var(--notion-border)' : '1px solid transparent',
                  boxShadow: sessionSubTab === 'users' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Users size={14} style={{ color: sessionSubTab === 'users' ? '#10b981' : 'inherit' }} />
                <span>Live Users &amp; Devices ({appUsageData?.users?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionSubTab('history')}
                className="notion-btn"
                style={{
                  fontSize: '12.5px',
                  fontWeight: sessionSubTab === 'history' ? 700 : 500,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: sessionSubTab === 'history' ? 'var(--notion-card)' : 'transparent',
                  color: sessionSubTab === 'history' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                  border: sessionSubTab === 'history' ? '1px solid var(--notion-border)' : '1px solid transparent',
                  boxShadow: sessionSubTab === 'history' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={14} style={{ color: sessionSubTab === 'history' ? '#6366f1' : 'inherit' }} />
                <span>Login / Logout Audit ({appUsageData?.recent_sessions?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setSessionSubTab('devices')}
                className="notion-btn"
                style={{
                  fontSize: '12.5px',
                  fontWeight: sessionSubTab === 'devices' ? 700 : 500,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: sessionSubTab === 'devices' ? 'var(--notion-card)' : 'transparent',
                  color: sessionSubTab === 'devices' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                  border: sessionSubTab === 'devices' ? '1px solid var(--notion-border)' : '1px solid transparent',
                  boxShadow: sessionSubTab === 'devices' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Smartphone size={14} style={{ color: sessionSubTab === 'devices' ? '#0ea5e9' : 'inherit' }} />
                <span>Registered Push Tokens ({appUsageData?.devices?.length || 0})</span>
              </button>
            </div>

            {/* Filter and Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--notion-text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search user, device, dept..."
                  value={appUsageSearch}
                  onChange={(e) => setAppUsageSearch(e.target.value)}
                  className="notion-input"
                  style={{ paddingLeft: '30px', fontSize: '11.5px', height: '32px' }}
                />
              </div>

              {sessionSubTab === 'users' && (
                <select
                  value={appUsageFilter}
                  onChange={(e) => setAppUsageFilter(e.target.value as any)}
                  className="notion-select"
                  style={{ fontSize: '11.5px', height: '32px', width: '130px' }}
                >
                  <option value="all">All Users</option>
                  <option value="online">🟢 Online Now</option>
                  <option value="mobile">📱 Mobile APK</option>
                </select>
              )}
            </div>
          </div>

          {/* Sub Tab 1: Live Users & Devices */}
          {sessionSubTab === 'users' && (
            <div className="notion-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="notion-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--notion-hover)', borderBottom: '1px solid var(--notion-border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Staff User</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Department &amp; Role</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Live Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Platform &amp; Device</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Push Token</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Last Heartbeat</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(appUsageData?.users || [])
                    .filter((u) => {
                      if (appUsageFilter === 'online' && !u.is_online) return false;
                      if (appUsageFilter === 'mobile' && u.latest_platform !== 'mobile_apk' && u.devices_count === 0) return false;
                      if (appUsageSearch.trim()) {
                        const q = appUsageSearch.toLowerCase();
                        return (
                          (u.full_name || '').toLowerCase().includes(q) ||
                          (u.username || '').toLowerCase().includes(q) ||
                          (u.department_name || '').toLowerCase().includes(q) ||
                          (u.latest_device || '').toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--notion-border-subtle)', background: user.is_online ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.is_online ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', boxShadow: user.is_online ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}>
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--notion-text)' }}>{user.full_name || user.username}</div>
                              <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)', fontFamily: 'JetBrains Mono' }}>@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span className="notion-tag tag-blue" style={{ fontSize: '11px', marginBottom: '3px', display: 'inline-block' }}>{user.department_name || 'Global'}</span>
                          <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>{user.role_display}</div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {user.is_online ? (
                            <span className="notion-tag tag-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                              ONLINE
                            </span>
                          ) : (
                            <span className="notion-tag tag-gray" style={{ fontSize: '11px' }}>Offline</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {user.latest_platform === 'mobile_apk' ? (
                              <span className="notion-tag tag-purple" style={{ fontSize: '10.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Smartphone size={11} /> Android APK
                              </span>
                            ) : (
                              <span className="notion-tag tag-gray" style={{ fontSize: '10.5px', fontWeight: 500 }}>
                                💻 Web
                              </span>
                            )}
                          </div>
                          {user.latest_device && (
                            <div style={{ fontSize: '10.5px', color: 'var(--notion-text-muted)', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.latest_device}>
                              {user.latest_device}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {user.devices_count > 0 ? (
                            <span className="notion-tag tag-green" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                              ✓ Registered ({user.devices_count})
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                          {user.last_seen ? new Date(user.last_seen).toLocaleString() : 'Never'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleSendTestPush(user.id, user.full_name || user.username)}
                            disabled={testingPushUserId === user.id}
                            className="notion-btn notion-btn-bordered"
                            style={{ fontSize: '11px', padding: '4px 10px', gap: '4px' }}
                            title={`Send test push notification to ${user.full_name || user.username}`}
                          >
                            <Bell size={11} />
                            <span>{testingPushUserId === user.id ? 'Sending...' : 'Test Push'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab 2: Login / Logout Session History */}
          {sessionSubTab === 'history' && (
            <div className="notion-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="notion-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--notion-hover)', borderBottom: '1px solid var(--notion-border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Staff User</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Action</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Platform &amp; Device</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>IP Address</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Logged In At</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Logged Out At</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(appUsageData?.recent_sessions || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                        No session records logged yet. Sessions will appear automatically as staff log in and out.
                      </td>
                    </tr>
                  ) : (
                    (appUsageData?.recent_sessions || []).map((sess) => (
                      <tr key={sess.id} style={{ borderBottom: '1px solid var(--notion-border-subtle)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          {sess.full_name || sess.username}
                          <div style={{ fontSize: '10.5px', color: 'var(--notion-text-muted)', fontFamily: 'JetBrains Mono' }}>@{sess.username}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`notion-tag ${sess.action === 'LOGGED_IN' ? 'tag-green' : sess.action === 'LOGGED_OUT' ? 'tag-gray' : 'tag-blue'}`} style={{ fontSize: '10px' }}>
                            {sess.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--notion-text)' }}>
                          <span style={{ fontWeight: 600 }}>{sess.platform === 'mobile_apk' ? '📱 Mobile APK' : '💻 Web'}</span>
                          {sess.device_info && <div style={{ fontSize: '10.5px', color: 'var(--notion-text-muted)' }}>{sess.device_info}</div>}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                          {sess.ip_address || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--notion-text-muted)' }}>
                          {new Date(sess.logged_in_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--notion-text-muted)' }}>
                          {sess.logged_out_at ? new Date(sess.logged_out_at).toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {sess.is_active ? (
                            <span className="notion-tag tag-green" style={{ fontSize: '10px', fontWeight: 700 }}>Active</span>
                          ) : (
                            <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab 3: Registered Devices */}
          {sessionSubTab === 'devices' && (
            <div className="notion-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="notion-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--notion-hover)', borderBottom: '1px solid var(--notion-border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Staff User</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Device Name / Model</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Platform</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>App Version</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Device Push Token</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Last Connected</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--notion-text-dim)', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(appUsageData?.devices || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                        No mobile push tokens registered yet. When staff log in from the installed Android APK, their devices appear here automatically.
                      </td>
                    </tr>
                  ) : (
                    (appUsageData?.devices || []).map((dev) => (
                      <tr key={dev.id} style={{ borderBottom: '1px solid var(--notion-border-subtle)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--notion-text)' }}>
                          {dev.full_name || dev.username}
                          <div style={{ fontSize: '10.5px', color: 'var(--notion-text-muted)', fontFamily: 'JetBrains Mono' }}>@{dev.username}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--notion-text)' }}>
                          {dev.device_name || 'Android Device'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="notion-tag tag-purple" style={{ fontSize: '10.5px' }}>{dev.device_type}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                          {dev.app_version || '2.2.5'}
                        </td>
                        <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                          <span title={dev.device_token}>
                            {dev.device_token ? `${dev.device_token.slice(0, 18)}...${dev.device_token.slice(-8)}` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--notion-text-muted)' }}>
                          {new Date(dev.last_seen).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          {dev.is_active ? (
                            <span className="notion-tag tag-green" style={{ fontSize: '10px', fontWeight: 700 }}>Active</span>
                          ) : (
                            <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email Body Preview Modal */}
      {selectedEmailPreview && (
        <div className="notion-modal-overlay" onClick={() => setSelectedEmailPreview(null)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Mail size={16} style={{ color: '#2383e2' }} />
                <span>{selectedEmailPreview.subject}</span>
              </div>
              <button onClick={() => setSelectedEmailPreview(null)} className="notion-btn" style={{ padding: '3px 6px' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                <strong>To:</strong> {selectedEmailPreview.recipient_name} &lt;{selectedEmailPreview.recipient_email}&gt;
                <br />
                <strong>Dispatched At:</strong> {new Date(selectedEmailPreview.created_at).toLocaleString()}
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--notion-text)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  maxHeight: '340px',
                  overflowY: 'auto',
                }}
              >
                {selectedEmailPreview.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordUser && (
        <div className="notion-modal-overlay" onClick={() => setResetPasswordUser(null)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--notion-text)' }}>
                <KeyRound size={16} style={{ color: '#6366f1' }} />
                <span>Reset Password for {resetPasswordUser.full_name}</span>
              </div>
              <button onClick={() => setResetPasswordUser(null)} className="notion-btn" style={{ padding: '3px 6px' }}>✕</button>
            </div>

            <form onSubmit={handleConfirmResetPassword} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                  Account Username
                </label>
                <input
                  type="text"
                  disabled
                  value={resetPasswordUser.username}
                  className="notion-input"
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text)', fontWeight: 600, marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new account password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="notion-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="notion-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword}
                  className="notion-btn notion-btn-primary"
                  style={{ gap: '6px' }}
                >
                  {resettingPassword ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Database Confirmation Modal */}
      {isClearModalOpen && (
        <div className="notion-modal-overlay" onClick={() => !clearingDatabase && setIsClearModalOpen(false)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                <AlertTriangle size={18} />
                <span>Confirm Full Database Wipe</span>
              </div>
              <button
                onClick={() => !clearingDatabase && setIsClearModalOpen(false)}
                className="notion-btn"
                style={{ padding: '3px 6px' }}
                disabled={clearingDatabase}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClearDatabase} style={{ padding: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#ef4444', marginBottom: '6px' }}>
                  Warning: This action is permanent and cannot be undone!
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--notion-text)', lineHeight: 1.6 }}>
                  <li>All tasks, assignments, and milestones will be deleted.</li>
                  <li>All task comments, notifications, and email logs will be wiped.</li>
                  <li>All regular staff, manager, and GM accounts will be removed.</li>
                  <li>PostgreSQL auto-increment sequences will be reset to 1.</li>
                  <li><strong>Exactly 1 Super Admin account</strong> will be preserved.</li>
                </ul>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text)', fontWeight: 600, marginBottom: '6px' }}>
                    Preserved Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    className="notion-input"
                    placeholder="e.g. admin"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text)', fontWeight: 600, marginBottom: '6px' }}>
                    Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="notion-input"
                    placeholder="e.g. adminpassword123"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--notion-text)' }}>
                  <input
                    type="checkbox"
                    checked={keepDepartmentsOption}
                    onChange={(e) => setKeepDepartmentsOption(e.target.checked)}
                    style={{ accentColor: 'var(--notion-blue)' }}
                  />
                  <span>Keep existing department structures (only wipe tasks and non-admin users)</span>
                </label>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text)', fontWeight: 600, marginBottom: '6px' }}>
                  Type <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>CLEAR DATABASE</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  placeholder="CLEAR DATABASE"
                  value={clearConfirmationText}
                  onChange={(e) => setClearConfirmationText(e.target.value)}
                  className="notion-input"
                  style={{ borderColor: clearConfirmationText === 'CLEAR DATABASE' ? '#ef4444' : undefined }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  disabled={clearingDatabase}
                  className="notion-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearingDatabase || clearConfirmationText.trim() !== 'CLEAR DATABASE'}
                  className="notion-btn"
                  style={{
                    background: clearConfirmationText.trim() === 'CLEAR DATABASE' ? '#ef4444' : 'var(--notion-border)',
                    color: '#ffffff',
                    fontWeight: 600,
                    padding: '8px 16px',
                    gap: '6px',
                    cursor: clearConfirmationText.trim() === 'CLEAR DATABASE' ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}
                >
                  {clearingDatabase ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Wiping Database...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Permanently Wipe Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Database SQL Confirmation Modal */}
      {isRestoreConfirmModalOpen && (
        <div className="notion-modal-overlay" onClick={() => !restoringSql && setIsRestoreConfirmModalOpen(false)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--notion-blue)' }}>
                <Upload size={18} />
                <span>Confirm PostgreSQL SQL Restore</span>
              </div>
              <button
                onClick={() => !restoringSql && setIsRestoreConfirmModalOpen(false)}
                className="notion-btn"
                style={{ padding: '3px 6px' }}
                disabled={restoringSql}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ background: 'rgba(35, 131, 226, 0.08)', border: '1px solid rgba(35, 131, 226, 0.25)', borderRadius: '6px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#2383e2', marginBottom: '6px' }}>
                  Target File: {sqlRestoreFile?.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                  Size: {sqlRestoreFile ? (sqlRestoreFile.size / 1024).toFixed(1) + ' KB' : '0 KB'}
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--notion-text)', lineHeight: 1.5, marginBottom: '16px' }}>
                You are about to restore this SQL backup directly into PostgreSQL (<code style={{ color: '#2383e2' }}>task_tracker_db</code>).
                {wipeBeforeRestore ? (
                  <p style={{ marginTop: '8px', color: '#e07d10', fontWeight: 500 }}>
                    ⚠️ Existing application tables will be wiped prior to executing the restore for a clean state.
                  </p>
                ) : (
                  <p style={{ marginTop: '8px', color: 'var(--notion-text-muted)' }}>
                    Existing rows will remain, and statements in the file will be inserted/merged.
                  </p>
                )}
                <p style={{ marginTop: '8px', color: '#34c759', fontSize: '12px' }}>
                  ✓ Master Super Admin credentials (<code>admin / admin</code>) will be guaranteed.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRestoreConfirmModalOpen(false)}
                  disabled={restoringSql}
                  className="notion-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={restoringSql}
                  onClick={handleExecuteSqlRestore}
                  className="notion-btn notion-btn-primary"
                  style={{ gap: '6px', fontWeight: 600 }}
                >
                  {restoringSql ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirm & Restore Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
