import React from 'react';
import { ActivityLogItem } from '../types';
import { X, History } from 'lucide-react';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityLogs: ActivityLogItem[];
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  activityLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px', borderRadius: '18px' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}>
              <History size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                System Activity Audit Trail
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Immutable event stream & user action history
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="notion-btn"
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--notion-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px', maxHeight: '65vh', overflowY: 'auto' }}>
          {activityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--notion-text-dim)', fontSize: '13px' }}>
              <History size={32} style={{ opacity: 0.25, marginBottom: '10px', margin: '0 auto' }} />
              <div style={{ fontWeight: 600, color: 'var(--notion-text)' }}>No activity records yet.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>System events and user edits will be logged here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--notion-card)',
                    border: '1px solid var(--notion-border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <span className="notion-tag tag-purple" style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>
                        {log.user_name}
                      </span>
                      {log.department_name && (
                        <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', background: 'var(--notion-hover)', padding: '1px 7px', borderRadius: '4px' }}>
                          {log.department_name}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', lineHeight: 1.45 }}>
                      {log.details}
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', whiteSpace: 'nowrap', background: 'var(--notion-hover)', padding: '2px 7px', borderRadius: '6px' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--notion-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--notion-hover)',
          }}
        >
          <button
            onClick={onClose}
            className="notion-btn notion-btn-bordered"
            style={{ borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
