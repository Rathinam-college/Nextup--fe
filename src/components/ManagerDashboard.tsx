import React, { useState, useEffect } from 'react';
import { Task, User, Department, TaskStatus } from '../types';
import { api } from '../services/api';
import {
  Kanban,
  Users,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface ManagerDashboardProps {
  onSelectTask: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenCreateStaff: () => void;
  onEditStaff: (user: User) => void;
  tasks: Task[];
  currentUser: User;
  onRefresh: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onSelectTask,
  onOpenCreateTask,
  onOpenCreateStaff,
  onEditStaff,
  tasks,
  currentUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'staff'>('kanban');
  const [deptStaff, setDeptStaff] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser.department) {
      api.getUsers({ department: currentUser.department })
        .then(setDeptStaff)
        .catch(console.error);
    }
  }, [currentUser.department, tasks]);

  const handleDeleteStaff = async (user: User) => {
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

  const columns: { id: TaskStatus; label: string; color: string; badgeClass: string }[] = [
    { id: 'TODO', label: 'To Do', color: '#94a3b8', badgeClass: 'badge-status-todo' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: '#818cf8', badgeClass: 'badge-status-in_progress' },
    { id: 'PENDING_GM_APPROVAL', label: 'Pending GM Review', color: '#fbbf24', badgeClass: 'badge-status-pending_gm_approval' },
    { id: 'CHANGES_REQUESTED', label: 'Changes Requested', color: '#f87171', badgeClass: 'badge-status-changes_requested' },
    { id: 'CLOSED', label: 'Closed & Verified', color: '#34d399', badgeClass: 'badge-status-closed' },
  ];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Department Header & Controls */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                {currentUser.department_name} Management Hub
              </h2>
              <span className="badge badge-role-manager">
                {currentUser.department_code} Operations
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Strict Isolation Active: Viewing and managing personnel & tasks strictly within {currentUser.department_name}.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" title="Export department tasks to CSV">
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button onClick={onOpenCreateStaff} className="btn btn-secondary btn-sm">
              <Plus size={15} />
              <span>Add Department Staff</span>
            </button>
            <button onClick={onOpenCreateTask} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Assign New Task</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`btn ${activeTab === 'kanban' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Kanban size={15} />
            <span>Task Kanban Board ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            <Users size={15} />
            <span>Department Staff ({deptStaff.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          alignItems: 'start'
        }}>
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '9999px', color: 'var(--text-muted)' }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: col.id === 'PENDING_GM_APPROVAL'
                            ? '1px solid rgba(245, 158, 11, 0.4)'
                            : col.id === 'CHANGES_REQUESTED'
                            ? '1px solid rgba(239, 68, 68, 0.4)'
                            : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                            #{t.id}
                          </span>
                          {getPriorityBadge(t.priority)}
                        </div>

                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', lineHeight: 1.3 }}>
                          {t.title}
                        </div>

                        {t.gm_feedback_notes && (
                          <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                            GM note: "{t.gm_feedback_notes}"
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                          <span style={{ color: '#94a3b8' }}>{t.assigned_to_name}</span>
                          <span>{t.due_date || 'No due date'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DEPARTMENT STAFF LIST */}
      {activeTab === 'staff' && (
        <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Staff Members in {currentUser.department_name}
            </h3>
            <button onClick={onOpenCreateStaff} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Add Staff</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Username</th>
                <th style={{ padding: '12px 16px' }}>Job Title</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deptStaff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc' }}>
                    {staff.full_name}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {staff.username}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                    {staff.job_title || 'Staff Member'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${staff.role === 'DEPT_MANAGER' ? 'badge-role-manager' : 'badge-role-staff'}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                    {staff.email}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {staff.role === 'STAFF' && (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onEditStaff(staff)}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
