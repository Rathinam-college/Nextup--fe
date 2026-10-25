import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface NotionCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCreateTask?: () => void;
  canCreateTask?: boolean;
}

export const NotionCalendarView: React.FC<NotionCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateTask,
  canCreateTask,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compute calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  interface CalendarDay {
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }

  const calendarDays: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month leading days to complete the 35 or 42 grid slots
  const remainingSlots = (calendarDays.length <= 35 ? 35 : 42) - calendarDays.length;
  for (let day = 1; day <= remainingSlots; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Group tasks by due_date
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (task.due_date) {
      if (!acc[task.due_date]) acc[task.due_date] = [];
      acc[task.due_date].push(task);
    }
    return acc;
  }, {});

  const monthLabel = firstDayOfMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return '#8c8c8c';
      case 'IN_PROGRESS': return '#2383e2';
      case 'PENDING_GM_APPROVAL': return '#f59e0b';
      case 'CHANGES_REQUESTED': return '#ef4444';
      case 'CLOSED': return '#10b981';
      default: return '#8c8c8c';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>
      {/* Top Header: Month navigation & actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(99, 102, 241, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--notion-blue)',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
            }}>
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                {monthLabel}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px', background: 'var(--notion-hover)', padding: '4px', borderRadius: '10px', border: '1px solid var(--notion-border-subtle)' }}>
            <button
              onClick={handlePrevMonth}
              className="notion-btn"
              style={{ padding: '6px 9px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--notion-text)' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="notion-btn"
              style={{
                padding: '5px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                background: 'var(--notion-card)',
                color: 'var(--notion-text)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              Current Month
            </button>
            <button
              onClick={handleNextMonth}
              className="notion-btn"
              style={{ padding: '6px 9px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--notion-text)' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--notion-text-dim)',
            padding: '6px 12px',
            background: 'var(--notion-card)',
            borderRadius: '9999px',
            border: '1px solid var(--notion-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={13} style={{ color: 'var(--notion-blue)' }} />
            <span>Today: <strong>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
          </div>

          {(canCreateTask !== false && onOpenCreateTask) && (
            <button
              onClick={onOpenCreateTask}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Plus size={15} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--notion-border)',
          borderRadius: '16px',
          background: 'var(--notion-card)',
          boxShadow: 'var(--notion-shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Days of Week Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid var(--notion-border)',
            background: 'var(--notion-hover)',
            textAlign: 'center',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--notion-text-dim)',
            padding: '11px 0',
          }}
        >
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridAutoRows: 'minmax(96px, 1fr)',
            overflowY: 'auto',
          }}
        >
          {calendarDays.map((day, idx) => {
            const dayTasks = tasksByDate[day.dateStr] || [];

            return (
              <div
                key={idx}
                style={{
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--notion-border-subtle)',
                  borderBottom: '1px solid var(--notion-border-subtle)',
                  padding: '8px 9px',
                  background: day.isToday
                    ? 'rgba(37, 99, 235, 0.04)'
                    : day.isCurrentMonth
                    ? 'transparent'
                    : 'rgba(0, 0, 0, 0.04)',
                  opacity: day.isCurrentMonth ? 1 : 0.4,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '96px',
                  transition: 'background 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Day Number Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: day.isToday ? 800 : 600,
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: day.isToday ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                      color: day.isToday ? '#ffffff' : 'var(--notion-text)',
                      boxShadow: day.isToday ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                    }}
                  >
                    {day.dayNumber}
                  </span>

                  {dayTasks.length > 0 && (
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: 'var(--notion-blue)',
                      background: 'rgba(37, 99, 235, 0.09)',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                    }}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      style={{
                        padding: '4px 7px',
                        borderRadius: '6px',
                        background: 'var(--notion-item-bg)',
                        border: '1px solid var(--notion-border-subtle)',
                        borderLeft: `3px solid ${getStatusColor(task.status)}`,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflow: 'hidden',
                        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                      }}
                      title={`${task.title} (${task.status}) - Assigned to ${task.assigned_to_name || 'Unassigned'}`}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: getPriorityDot(task.priority),
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          color: 'var(--notion-text)',
                        }}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Legend */}
      <div style={{
        marginTop: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        padding: '10px 18px',
        background: 'var(--notion-card)',
        borderRadius: '12px',
        border: '1px solid var(--notion-border-subtle)',
        fontSize: '11.5px',
        color: 'var(--notion-text-dim)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8c8c8c' }} />
          <span>To Do</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
          <span>In Progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span>Pending GM Sign-off</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span>Changes Requested</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span>Closed / Verified</span>
        </div>
      </div>
    </div>
  );
};
