import React from 'react';
import { Task } from '../types';
import { ShieldCheck, CheckCircle, RotateCcw, Calendar, CheckCircle2, ArrowRight, User } from 'lucide-react';

interface NotionApprovalsHubProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickApprove: (task: Task) => void;
}

export const NotionApprovalsHub: React.FC<NotionApprovalsHubProps> = ({
  tasks,
  onSelectTask,
  onQuickApprove,
}) => {
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL');

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.025em' }}>
                GM Task Verification &amp; Closure Hub
              </h1>
              <span
                className="notion-tag tag-yellow"
                style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px' }}
              >
                {pendingTasks.length} Awaiting GM Sign-Off
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--notion-text-muted)', margin: '4px 0 0' }}>
              Department staff completed these deliverables. Review work quality and approve for official institutional closure.
            </p>
          </div>
        </div>
      </div>

      {pendingTasks.length === 0 ? (
        <div
          className="notion-callout"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '16px',
            boxShadow: 'var(--notion-shadow-sm)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '4px 0 0', color: 'var(--notion-text)' }}>
            All Pending Approvals Cleared
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', margin: 0, maxWidth: '460px', lineHeight: 1.5 }}>
            No tasks are currently waiting for General Manager verification. New completions will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              style={{
                background: 'var(--notion-card)',
                border: '1.5px solid rgba(234, 179, 8, 0.45)',
                borderRadius: '16px',
                padding: '20px 22px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 16px rgba(234, 179, 8, 0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 179, 8, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(234, 179, 8, 0.12)';
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #10b981)' }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="notion-tag tag-purple" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                    {task.department_name} ({task.department_code})
                  </span>
                  <span className="notion-tag tag-yellow" style={{ fontSize: '11px', fontWeight: 700 }}>
                    ⏳ Awaiting GM Close
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--notion-text)',
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  #{task.id}: {task.title}
                </h3>

                <p
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--notion-text-muted)',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {task.description || 'No description provided.'}
                </p>

                {/* Metadata card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11.5px',
                    color: 'var(--notion-text-dim)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--notion-item-bg)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5, #38bdf8)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--notion-text)' }}>
                      {task.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>

                  {task.due_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>Due: {task.due_date}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onQuickApprove(task)}
                  className="notion-btn notion-btn-success"
                  style={{
                    flex: 1.3,
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Verify &amp; Close</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="notion-btn notion-btn-bordered"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Review / Notes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
