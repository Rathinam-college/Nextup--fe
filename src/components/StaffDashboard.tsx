import React, { useState } from 'react';
import { Task, User } from '../types';
import { api } from '../services/api';
import {
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  Calendar,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface StaffDashboardProps {
  onSelectTask: (task: Task) => void;
  tasks: Task[];
  currentUser: User;
  onRefresh: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onSelectTask,
  tasks,
  currentUser,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REVISIONS' | 'CLOSED'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter tasks assigned to current staff member
  const myTasks = tasks.filter((t) => t.assigned_to === currentUser.id);

  const displayedTasks = myTasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status === 'TODO' || t.status === 'IN_PROGRESS';
    if (filter === 'PENDING') return t.status === 'PENDING_GM_APPROVAL';
    if (filter === 'REVISIONS') return t.status === 'CHANGES_REQUESTED';
    if (filter === 'CLOSED') return t.status === 'CLOSED';
    return true;
  });

  const handleStartWork = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await api.startWork(task.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await api.submitForApproval(task.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TODO':
        return <span className="badge badge-status-todo">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-status-in_progress">In Progress</span>;
      case 'PENDING_GM_APPROVAL':
        return <span className="badge badge-status-pending_gm_approval">Pending GM Approval</span>;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Staff Header */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                My Assigned Tasks
              </h2>
              <span className="badge badge-role-staff">
                {currentUser.department_name} ({currentUser.department_code})
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Welcome back, {currentUser.full_name}. Update task progress and submit completed work for executive GM verification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('ALL')}
              className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              All ({myTasks.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`btn ${filter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              Active ({myTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`btn ${filter === 'PENDING' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              Awaiting GM ({myTasks.filter(t => t.status === 'PENDING_GM_APPROVAL').length})
            </button>
            <button
              onClick={() => setFilter('REVISIONS')}
              className={`btn ${filter === 'REVISIONS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              Revisions ({myTasks.filter(t => t.status === 'CHANGES_REQUESTED').length})
            </button>
            <button
              onClick={() => setFilter('CLOSED')}
              className={`btn ${filter === 'CLOSED' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              Verified ({myTasks.filter(t => t.status === 'CLOSED').length})
            </button>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {displayedTasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          <CheckCircle2 size={48} style={{ color: '#6366f1', margin: '0 auto 12px', opacity: 0.6 }} />
          <h4 style={{ color: '#f8fafc', marginBottom: '6px' }}>No Tasks Found</h4>
          <p style={{ fontSize: '0.85rem' }}>No tasks matching this filter criteria are assigned to you.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {displayedTasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel"
              onClick={() => onSelectTask(task)}
              style={{
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                border: task.status === 'CHANGES_REQUESTED'
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : task.status === 'PENDING_GM_APPROVAL'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                    TASK #{task.id}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status)}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', lineHeight: 1.3 }}>
                  {task.title}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5, maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.description || 'No description provided.'}
                </p>

                {/* GM Feedback Notes Highlight if Changes Requested */}
                {task.status === 'CHANGES_REQUESTED' && task.gm_feedback_notes && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '14px',
                    fontSize: '0.8rem',
                    color: '#f87171'
                  }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <AlertTriangle size={14} />
                      <span>GM Requested Revisions:</span>
                    </div>
                    <div>"{task.gm_feedback_notes}"</div>
                  </div>
                )}

                {/* Verified Remarks if Closed */}
                {task.status === 'CLOSED' && task.gm_feedback_notes && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    marginBottom: '14px',
                    fontSize: '0.8rem',
                    color: '#34d399'
                  }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <CheckCircle size={14} />
                      <span>GM Verification Remarks:</span>
                    </div>
                    <div>"{task.gm_feedback_notes}"</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>Due: {task.due_date || 'No deadline'}</span>
                  </div>
                  <div>
                    {task.comments?.length ? `${task.comments.length} notes` : 'No notes'}
                  </div>
                </div>

                {/* Staff Actions */}
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  {task.status === 'TODO' && (
                    <button
                      onClick={(e) => handleStartWork(task, e)}
                      disabled={actionLoading}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      <Play size={14} />
                      <span>Start Work</span>
                    </button>
                  )}

                  {(task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED') && (
                    <button
                      onClick={(e) => handleSubmitForApproval(task, e)}
                      disabled={actionLoading}
                      className="btn btn-warning btn-sm"
                      style={{ flex: 1 }}
                    >
                      <CheckCircle size={14} />
                      <span>Submit for GM Approval</span>
                    </button>
                  )}

                  <button
                    onClick={() => onSelectTask(task)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={14} />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
