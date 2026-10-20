import React from 'react';
import { DispatchedEmail } from '../types';
import { X, Mail } from 'lucide-react';

interface EmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailLogs: DispatchedEmail[];
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({
  isOpen,
  onClose,
  emailLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', borderRadius: '18px' }}>
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
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--notion-blue)',
            }}>
              <Mail size={17} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                Dispatched Email Alerts Audit Trail
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                System SMTP deliveries & notification dispatch history
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
          {emailLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--notion-text-dim)', fontSize: '13px' }}>
              <Mail size={32} style={{ opacity: 0.25, marginBottom: '10px', margin: '0 auto' }} />
              <div style={{ fontWeight: 600, color: 'var(--notion-text)' }}>No dispatched email logs yet.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Emails sent via SMTP notifications will appear here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--notion-card)',
                    border: '1px solid var(--notion-border-subtle)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="notion-tag tag-blue" style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                        {log.event_type}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--notion-text)' }}>
                        {log.subject}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', background: 'var(--notion-hover)', padding: '2px 8px', borderRadius: '6px' }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '10px' }}>
                    Recipient: <strong style={{ color: 'var(--notion-text)' }}>{log.recipient_name}</strong> &lt;{log.recipient_email}&gt;
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--notion-hover)',
                      border: '1px solid var(--notion-border-subtle)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--notion-text-muted)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                    }}
                  >
                    {log.body}
                  </div>
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
