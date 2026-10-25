import React, { useState } from 'react';
import { Task, TaskStatus, Role } from '../types';
import { Plus, Calendar, Clock, User, CheckCircle2, AlertCircle, ChevronRight, Filter, Play, Send, RotateCcw, CheckSquare, Edit } from 'lucide-react';

interface NotionListViewProps {
  tasks: Task[];
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

  const filteredTasks = tasks.filter((t) => {
    if (onlyMyTasks && currentUserId && t.assigned_to !== currentUserId) {
      return false;
    }
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

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

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Top filter pills and My Tasks toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* My Action Tasks Quick Toggle */}
          <button
            type="button"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className="notion-btn"
            style={{
              fontSize: '12.5px',
              padding: '6px 14px',
              background: onlyMyTasks ? 'var(--notion-blue)' : 'var(--notion-card)',
              color: onlyMyTasks ? '#ffffff' : 'var(--notion-text)',
              fontWeight: 700,
              border: onlyMyTasks ? '1px solid var(--notion-blue)' : '1px solid var(--notion-border)',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: onlyMyTasks ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'var(--notion-shadow-sm)',
            }}
            title="Toggle to view only tasks assigned to me"
          >
            <CheckSquare size={14} />
            <span>Assigned to Me ({tasks.filter((t) => t.assigned_to === currentUserId).length})</span>
          </button>

          <div style={{ width: '1px', height: '22px', background: 'var(--notion-border)', margin: '0 4px' }} />

          {[
            { id: 'ALL', label: `All (${tasks.length})` },
            { id: 'TODO', label: `To Do (${tasks.filter((t) => t.status === 'TODO').length})` },
            { id: 'IN_PROGRESS', label: `In Progress (${tasks.filter((t) => t.status === 'IN_PROGRESS').length})` },
            { id: 'PENDING_GM_APPROVAL', label: `In Review (${tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length})` },
            { id: 'CHANGES_REQUESTED', label: `Changes (${tasks.filter((t) => t.status === 'CHANGES_REQUESTED').length})` },
            { id: 'CLOSED', label: `Completed (${tasks.filter((t) => t.status === 'CLOSED').length})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className="notion-btn"
              style={{
                fontSize: '12px',
                padding: '5px 12px',
                background: statusFilter === pill.id ? 'var(--notion-item-bg)' : 'transparent',
                color: statusFilter === pill.id ? 'var(--notion-blue)' : 'var(--notion-text-muted)',
                fontWeight: statusFilter === pill.id ? 700 : 500,
                border: statusFilter === pill.id ? '1px solid var(--notion-border)' : '1px solid transparent',
                borderRadius: '8px',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {(canCreateTask !== false && onOpenCreateTask) && (
          <button
            onClick={onOpenCreateTask}
            className="notion-btn notion-btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', gap: '6px', fontWeight: 700 }}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
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
        {filteredTasks.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            <p style={{ margin: 0, fontSize: '13px' }}>No tasks in this view.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
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
                  {task.assigned_to ? (
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
                  ) : (
                    <span className="notion-tag tag-gray" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      Unassigned
                    </span>
                  )}
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
