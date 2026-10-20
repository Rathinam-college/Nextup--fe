import React, { useState, useEffect } from 'react';
import { Task, Department, User, DashboardStats } from '../types';
import { api } from '../services/api';
import {
  CheckCircle,
  Clock,
  Building,
  Users,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface GMDashboardProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenCreateStaff: () => void;
  onEditStaff: (user: User) => void;
  departments: Department[];
  tasks: Task[];
  onRefresh: () => void;
}

export const GMDashboard: React.FC<GMDashboardProps> = ({
  onSelectTask,
  onOpenCreateTask,
  onOpenCreateStaff,
  onEditStaff,
  departments,
  tasks,
  onRefresh,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'approvals' | 'departments' | 'staff'>('approvals');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error);
    api.getUsers().then(setStaffList).catch(console.error);
  }, [tasks]);

  const pendingApprovals = tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL');

  const filteredTasks = tasks.filter((t) => {
    if (selectedDeptFilter !== 'ALL' && t.department.toString() !== selectedDeptFilter) return false;
    if (selectedStatusFilter !== 'ALL' && t.status !== selectedStatusFilter) return false;
    if (searchQuery) {
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

  const handleQuickApprove = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await api.gmReview(task.id, 'APPROVE', 'Approved by General Manager sign-off');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove staff member ${user.full_name}?`)) return;
    try {
      await api.deleteUser(user.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCsv = () => {
    window.location.href = api.getCsvExportUrl();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <span className="badge badge-status-todo">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-status-in_progress">In Progress</span>;
      case 'PENDING_GM_APPROVAL':
        return <span className="badge badge-status-pending_gm_approval">Pending GM Review</span>;
      case 'CHANGES_REQUESTED':
        return <span className="badge badge-status-changes_requested">Changes Requested</span>;
      case 'CLOSED':
        return <span className="badge badge-status-closed">Closed & Verified</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <span className="badge badge-priority-low">Low</span>;
      case 'MEDIUM':
        return <span className="badge badge-priority-medium">Medium</span>;
      case 'HIGH':
        return <span className="badge badge-priority-high">High</span>;
      case 'URGENT':
        return <span className="badge badge-priority-urgent">🚨 Urgent</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive Welcome & KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fbbf24', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Awaiting GM Review
            </span>
            <AlertCircle size={20} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            {stats?.pending_gm_count || pendingApprovals.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tasks requiring executive closure sign-off
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#818cf8', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active In-Flight
            </span>
            <Clock size={20} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
            {(stats?.in_progress_count || 0) + (stats?.todo_count || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tasks across all company departments
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verified & Closed
            </span>
            <CheckCircle2 size={20} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {stats?.closed_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Signed off and archived
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#38bdf8', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Departments Managed
            </span>
            <Building size={20} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
            {departments.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {staffList.length} total team members
          </div>
        </div>
      </div>

      {/* GM Navigation Tabs & Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <AlertCircle size={15} />
            <span>GM Sign-Off Hub ({pendingApprovals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`btn ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Clock size={15} />
            <span>All Global Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Building size={15} />
            <span>Department Metrics ({departments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Users size={15} />
            <span>Global Staff CRUD ({staffList.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" title="Export all tasks to CSV">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
          <button onClick={onOpenCreateTask} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Create Task</span>
          </button>
          <button onClick={onOpenCreateStaff} className="btn btn-secondary btn-sm">
            <Plus size={15} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GM Approvals Hub */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fbbf24' }}>
                Executive Task Verification & Closure Hub
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                These tasks have been marked complete by staff and await your exclusive sign-off before official closure.
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 12px', opacity: 0.8 }} />
              <h4 style={{ color: '#f8fafc', marginBottom: '6px' }}>All Pending Approvals Cleared!</h4>
              <p style={{ fontSize: '0.85rem' }}>No tasks currently awaiting GM verification.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
              {pendingApprovals.map((task) => (
                <div
                  key={task.id}
                  className="glass-panel"
                  onClick={() => onSelectTask(task)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                      {task.department_name} ({task.department_code})
                    </span>
                    {getPriorityBadge(task.priority)}
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', color: '#f8fafc', lineHeight: 1.3 }}>
                    {task.title}
                  </h4>

                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px', maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.description || 'No description.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginBottom: '14px' }}>
                    <div>
                      Assignee: <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{task.assigned_to_name}</span>
                    </div>
                    <div>
                      Due: <span style={{ color: '#cbd5e1' }}>{task.due_date || 'None'}</span>
                    </div>
                  </div>

                  {/* 1-Click Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleQuickApprove(task, e)}
                      disabled={actionLoading}
                      className="btn btn-success btn-sm"
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={14} />
                      <span>Approve & Close</span>
                    </button>
                    <button
                      onClick={() => onSelectTask(task)}
                      className="btn btn-warning btn-sm"
                      style={{ flex: 1 }}
                    >
                      <RotateCcw size={14} />
                      <span>Review / Notes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: All Global Tasks */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search tasks, deliverables, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} style={{ color: 'var(--text-dim)' }} />
                <select
                  className="form-select"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id.toString()}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PENDING_GM_APPROVAL">Pending GM Approval</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="CLOSED">Closed & Verified</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Task</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Assignee</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Due Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>
                        {t.department_name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {t.assigned_to_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(t.status)}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                      {t.due_date || 'No deadline'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectTask(t); }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Department Metrics Overview */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {stats?.dept_stats?.map((d) => (
            <div key={d.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{d.name}</h3>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                    Code: {d.code}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                  <Users size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {d.members_count} Staff
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>{d.total}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Total Tasks</div>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>{d.pending_gm}</div>
                  <div style={{ fontSize: '0.7rem', color: '#fbbf24' }}>Awaiting GM</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{d.closed}</div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399' }}>Closed</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Completion Rate:</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>
                  {d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Global Staff CRUD */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Company Staff Directory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                As General Manager, you can manage personnel and appoint department managers globally.
              </p>
            </div>
            <button onClick={onOpenCreateStaff} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Username</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Job Title</th>
                  <th style={{ padding: '12px 16px' }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc' }}>
                      {user.full_name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>
                        {user.department_name || 'Global'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${user.role === 'GENERAL_MANAGER' ? 'badge-role-gm' : user.role === 'DEPT_MANAGER' ? 'badge-role-manager' : 'badge-role-staff'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {user.job_title || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onEditStaff(user)}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteStaff(user, e)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
