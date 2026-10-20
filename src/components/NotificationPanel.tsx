import React, { useState } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { X, Bell, CheckCheck, Clock } from 'lucide-react';
import { triggerTestWorkReminder } from '../services/notifications';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onRefresh: () => void;
  onSelectTask?: (taskId: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onSelectTask,
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestReminder = async () => {
    try {
      setIsTesting(true);
      const res = await triggerTestWorkReminder();
      setTestMsg(res.message);
      onRefresh();
      setTimeout(() => setTestMsg(null), 4000);
    } catch (err: any) {
      alert(`Test error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notion-modal-overlay" onClick={onClose}>
      <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', borderRadius: '18px' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--notion-blue)',
            }}>
              <Bell size={16} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                System Notifications
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Direct task alerts & status dispatches
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="notion-btn notion-btn-bordered"
                style={{ fontSize: '11.5px', padding: '5px 10px', borderRadius: '8px', fontWeight: 600, gap: '5px' }}
                title="Mark all notifications as read"
              >
                <CheckCheck size={13} style={{ color: 'var(--notion-blue)' }} />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="notion-btn"
              style={{ padding: '6px', borderRadius: '8px', color: 'var(--notion-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Daily 9:00 AM Morning Work Reminder Banner */}
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderBottom: '1px solid var(--notion-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ fontSize: '18px' }}>☀️</span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--notion-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Daily 9:00 AM Work Reminder
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                }}>
                  09:00 AM DAILY
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                Alerts every morning to update your daily work reports & deliverables
              </div>
            </div>
          </div>
          <button
            onClick={handleTestReminder}
            disabled={isTesting}
            className="notion-btn notion-btn-bordered"
            style={{
              fontSize: '11px',
              padding: '5px 11px',
              borderRadius: '7px',
              fontWeight: 700,
              background: 'var(--notion-card)',
              color: 'var(--notion-blue)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              flexShrink: 0,
            }}
          >
            {isTesting ? 'Sending...' : 'Test 9 AM Alert'}
          </button>
        </div>

        {testMsg && (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '11.5px',
            color: '#10b981',
            fontWeight: 600,
          }}>
            ✓ {testMsg}
          </div>
        )}

        {/* List Body */}
        <div style={{ padding: '16px 20px', maxHeight: '62vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--notion-text-dim)', fontSize: '13px' }}>
              <Bell size={32} style={{ opacity: 0.25, marginBottom: '10px', margin: '0 auto' }} />
              <div style={{ fontWeight: 600, color: 'var(--notion-text)' }}>All caught up!</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>No unread alerts or notifications.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (n.task && onSelectTask) {
                      onSelectTask(n.task);
                      onClose();
                    }
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: n.is_read ? 'var(--notion-card)' : 'rgba(37, 99, 235, 0.06)',
                    border: n.is_read ? '1px solid var(--notion-border-subtle)' : '1px solid rgba(37, 99, 235, 0.25)',
                    cursor: n.task ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    boxShadow: n.is_read ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.borderColor = 'var(--notion-blue)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = n.is_read ? 'var(--notion-border-subtle)' : 'rgba(37, 99, 235, 0.25)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!n.is_read && (
                        <span style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: 'var(--notion-blue)',
                          boxShadow: '0 0 8px rgba(37, 99, 235, 0.7)',
                        }} />
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>{n.title}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--notion-text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--notion-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--notion-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
            <span style={{ color: '#10b981' }}>🛡️</span>
            <span>3-Month Session Active (90 Days No Logout)</span>
          </div>
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
