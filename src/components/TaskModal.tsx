import React, { useState } from 'react';
import { Task, Role } from '../types';
import { api } from '../services/api';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Send,
  User,
  Building,
  Calendar,
  MessageSquare,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onTaskUpdated: () => void;
  currentUserRole?: Role;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onTaskUpdated,
  currentUserRole,
}) => {
  const [commentText, setCommentText] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!task) return null;

  const isGM = currentUserRole === 'GENERAL_MANAGER' || currentUserRole === 'SUPER_ADMIN';

  const handleStartWork = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.startWork(task.id);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.submitForApproval(task.id);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGmReview = async (action: 'APPROVE' | 'REQUEST_CHANGES') => {
    if (action === 'REQUEST_CHANGES' && !gmNotes.trim()) {
      setError('Please provide feedback notes explaining what changes are required.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.gmReview(task.id, action, gmNotes);
      onTaskUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setLoading(true);
      setError(null);
      await api.addComment(task.id, commentText);
      setCommentText('');
      onTaskUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        return <span className="badge badge-priority-low">Low Priority</span>;
      case 'MEDIUM':
        return <span className="badge badge-priority-medium">Medium Priority</span>;
      case 'HIGH':
        return <span className="badge badge-priority-high">High Priority</span>;
      case 'URGENT':
        return <span className="badge badge-priority-urgent">🚨 Urgent Priority</span>;
      default:
        return <span className="badge">{priority}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              TASK #{task.id}
            </span>
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.3 }}>
            {task.title}
          </h2>

          {/* Metadata Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            padding: '14px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Building size={16} style={{ color: '#818cf8' }} />
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Department</div>
                <div style={{ fontWeight: 600 }}>{task.department_name} ({task.department_code})</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <User size={16} style={{ color: '#38bdf8' }} />
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Assigned To</div>
                <div style={{ fontWeight: 600 }}>{task.assigned_to_name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Calendar size={16} style={{ color: '#fbbf24' }} />
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Due Date</div>
                <div style={{ fontWeight: 600 }}>{task.due_date || 'No deadline'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Sparkles size={16} style={{ color: '#34d399' }} />
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Creator</div>
                <div style={{ fontWeight: 600 }}>{task.created_by_name}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Task Description
            </h4>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {task.description || 'No description provided.'}
            </div>
          </div>

          {/* GM Feedback Notes Callout if present */}
          {task.gm_feedback_notes && (
            <div style={{
              padding: '16px',
              borderRadius: '10px',
              background: task.status === 'CLOSED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
              border: task.status === 'CLOSED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.35)',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: task.status === 'CLOSED' ? '#34d399' : '#fbbf24',
                marginBottom: '6px'
              }}>
                <Sparkles size={16} />
                <span>
                  {task.status === 'CLOSED' ? 'GM Verification Remarks' : 'GM Requested Changes & Feedback'}
                </span>
                {task.verified_by_name && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (by {task.verified_by_name})
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#f1f5f9' }}>
                "{task.gm_feedback_notes}"
              </p>
            </div>
          )}

          {/* GM Sign-Off Action Hub */}
          {isGM && task.status === 'PENDING_GM_APPROVAL' && (
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(99, 102, 241, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={20} style={{ color: '#fbbf24' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24' }}>
                  GM Exclusive Verification & Sign-Off
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                As General Manager, you hold exclusive authorization to review task deliverables, request modifications, or approve and permanently close the task.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Review Notes / Feedback</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter approval comments or specific revision requests..."
                  value={gmNotes}
                  onChange={(e) => setGmNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleGmReview('APPROVE')}
                  disabled={loading}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                >
                  <CheckCircle size={16} />
                  <span>Verify, Approve & Close Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGmReview('REQUEST_CHANGES')}
                  disabled={loading}
                  className="btn btn-warning"
                  style={{ flex: 1 }}
                >
                  <RotateCcw size={16} />
                  <span>Request Changes</span>
                </button>
              </div>
            </div>
          )}

          {/* Staff Workflow Actions (Start Work / Submit for Approval) */}
          {(!isGM || task.status !== 'PENDING_GM_APPROVAL') && task.status !== 'CLOSED' && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              {task.status === 'TODO' && (
                <button
                  type="button"
                  onClick={handleStartWork}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Play size={16} />
                  <span>Start Work (Move to In Progress)</span>
                </button>
              )}

              {(task.status === 'IN_PROGRESS' || task.status === 'CHANGES_REQUESTED') && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={loading}
                  className="btn btn-warning"
                  style={{ flex: 1 }}
                >
                  <CheckCircle size={16} />
                  <span>Submit for GM Verification</span>
                </button>
              )}
            </div>
          )}

          {/* Comments and Notes Conversation Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={18} style={{ color: '#818cf8' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Discussion & Activity Notes ({task.comments?.length || 0})
              </h4>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '220px',
              overflowY: 'auto',
              marginBottom: '14px',
              paddingRight: '6px'
            }}>
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f8fafc' }}>
                          {c.author_name}
                        </span>
                        <span className={`badge ${c.author_role === 'GENERAL_MANAGER' ? 'badge-role-gm' : c.author_role === 'DEPT_MANAGER' ? 'badge-role-manager' : 'badge-role-staff'}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                          {c.author_role}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {c.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No comments yet on this task.
                </div>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Write a note or update... (alert dispatched automatically)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button type="submit" disabled={loading || !commentText.trim()} className="btn btn-secondary">
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
