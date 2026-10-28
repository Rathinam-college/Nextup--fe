import React, { useState, useEffect, useMemo } from 'react';
import { SelfTask, SelfNote, User } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  CheckSquare,
  StickyNote,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Trash2,
  Edit,
  Pin,
  PinOff,
  RefreshCw,
  Lock,
  Tag,
  Check,
  X,
  FileText,
  LayoutGrid,
  Table as TableIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flag,
  Lightbulb,
  Users,
  Briefcase,
  ListChecks,
  Bell,
  BellRing,
} from 'lucide-react';
import { notifyNoteReminder, requestBrowserNotificationPermission } from '../services/notifications';

interface SelfDeskViewProps {
  currentUser: User;
}

export const SelfDeskView: React.FC<SelfDeskViewProps> = ({ currentUser }) => {
  const { t, isTamil } = useLanguage();
  // Active desk tab: 'tasks' | 'notes'
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');

  // Notes view format: 'table' | 'cards' | 'calendar'
  const [notesViewFormat, setNotesViewFormat] = useState<'table' | 'cards' | 'calendar'>('table');
  const [noteCalendarDate, setNoteCalendarDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Loading & error state
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [tasks, setTasks] = useState<SelfTask[]>([]);
  const [notes, setNotes] = useState<SelfNote[]>([]);

  // Task search & filter
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'URGENT'>('ALL');

  // Note search & category filter
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategory, setNoteCategory] = useState<string>('ALL');

  // Inline Quick Add Task state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState('');
  const [addingQuickTask, setAddingQuickTask] = useState(false);

  // Task Modal (Create & Edit)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SelfTask | null>(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskFormStatus, setTaskFormStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('TODO');
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Note Modal (Create & Edit)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SelfNote | null>(null);
  const [noteFormTitle, setNoteFormTitle] = useState('');
  const [noteFormContent, setNoteFormContent] = useState('');
  const [noteFormCategory, setNoteFormCategory] = useState<'GENERAL' | 'WORK' | 'MEETING' | 'IDEA' | 'CHECKLIST'>('WORK');
  const [noteFormColor, setNoteFormColor] = useState('#4f46e5');
  const [noteFormPinned, setNoteFormPinned] = useState(false);
  const [noteFormReminderEnabled, setNoteFormReminderEnabled] = useState(false);
  const [noteFormReminderDate, setNoteFormReminderDate] = useState('');
  const [noteFormReminderTime, setNoteFormReminderTime] = useState('09:30');
  const [noteFormReminderSent, setNoteFormReminderSent] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  // Today normalized
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick date presets for task form
  const handleSetQuickDueDate = (type: 'today' | 'tomorrow' | 'nextWeek' | 'clear') => {
    if (type === 'clear') {
      setTaskFormDueDate('');
      return;
    }
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    else if (type === 'nextWeek') d.setDate(d.getDate() + 7);
    setTaskFormDueDate(d.toISOString().split('T')[0]);
  };

  // Quick text formatting helpers for note form
  const handleInsertNoteSnippet = (snippet: string) => {
    setNoteFormContent((prev) => (prev ? `${prev}\n${snippet}` : snippet));
  };

  // Fetch Self Tasks
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const data = await api.getSelfTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load self tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Fetch Self Notes
  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const data = await api.getSelfNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load self notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Periodic check for due note reminders & automatic notifications
  const checkNoteReminders = async () => {
    try {
      const res = await api.checkSelfNoteReminders();
      if (res && res.triggered_count > 0 && Array.isArray(res.triggered_notes)) {
        res.triggered_notes.forEach((tn) => {
          notifyNoteReminder(tn.title, tn.content);
        });
        fetchNotes();
      }
    } catch (err) {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchNotes();
    checkNoteReminders();
    const interval = setInterval(checkNoteReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // Task Handlers
  // -------------------------------------------------------------
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    try {
      setAddingQuickTask(true);
      const created = await api.createSelfTask({
        title: quickTaskTitle.trim(),
        priority: quickTaskPriority,
        due_date: quickTaskDueDate || null,
        status: 'TODO',
      });
      setTasks((prev) => [created, ...prev]);
      setQuickTaskTitle('');
      setQuickTaskDueDate('');
    } catch (err) {
      console.error('Failed to add quick task:', err);
      alert('Could not create task. Please try again.');
    } finally {
      setAddingQuickTask(false);
    }
  };

  const handleToggleCompleteTask = async (task: SelfTask) => {
    try {
      // Optimistic update
      const updated = await api.toggleCompleteSelfTask(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this personal task?')) return;
    try {
      await api.deleteSelfTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Could not delete task. Please try again.');
    }
  };

  const handleOpenEditTask = (task: SelfTask) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormDesc(task.description || '');
    setTaskFormPriority(task.priority);
    setTaskFormStatus(task.status);
    setTaskFormDueDate(task.due_date || '');
    setIsTaskModalOpen(true);
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormDesc('');
    setTaskFormPriority('MEDIUM');
    setTaskFormStatus('TODO');
    setTaskFormDueDate('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) return;

    try {
      setSavingTask(true);
      const payload: Partial<SelfTask> = {
        title: taskFormTitle.trim(),
        description: taskFormDesc.trim(),
        priority: taskFormPriority,
        status: taskFormStatus,
        is_completed: taskFormStatus === 'COMPLETED',
        due_date: taskFormDueDate || null,
      };

      if (editingTask) {
        const updated = await api.updateSelfTask(editingTask.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const created = await api.createSelfTask(payload);
        setTasks((prev) => [created, ...prev]);
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      alert('Could not save task. Please try again.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleInlineChangePriority = async (task: SelfTask, newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => {
    try {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: newPriority } : t)));
      await api.updateSelfTask(task.id, { priority: newPriority });
    } catch (err) {
      console.error('Failed to change priority:', err);
      fetchTasks();
    }
  };

  const handleInlineChangeStatus = async (task: SelfTask, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const isCompleted = newStatus === 'COMPLETED';
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus, is_completed: isCompleted } : t))
      );
      await api.updateSelfTask(task.id, { status: newStatus, is_completed: isCompleted });
    } catch (err) {
      console.error('Failed to change status:', err);
      fetchTasks();
    }
  };

  // -------------------------------------------------------------
  // Note Handlers
  // -------------------------------------------------------------
  const handleTogglePinNote = async (note: SelfNote) => {
    try {
      const updated = await api.togglePinSelfNote(note.id);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      fetchNotes();
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this personal note?')) return;
    try {
      await api.deleteSelfNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Could not delete note. Please try again.');
    }
  };

  const handleOpenEditNote = (note: SelfNote) => {
    setEditingNote(note);
    setNoteFormTitle(note.title);
    setNoteFormContent(note.content || '');
    setNoteFormCategory(note.category);
    setNoteFormColor(note.color || '#4f46e5');
    setNoteFormPinned(note.is_pinned);
    setNoteFormReminderEnabled(!!note.reminder_enabled);
    setNoteFormReminderDate(note.reminder_date || '');
    setNoteFormReminderTime(note.reminder_time ? note.reminder_time.slice(0, 5) : '09:30');
    setNoteFormReminderSent(!!note.is_reminder_sent);
    setIsNoteModalOpen(true);
  };

  const handleOpenCreateNote = (presetDate?: string) => {
    setEditingNote(null);
    setNoteFormTitle('');
    setNoteFormContent('');
    setNoteFormCategory('WORK');
    setNoteFormColor('#4f46e5');
    setNoteFormPinned(false);
    setNoteFormReminderEnabled(!!presetDate);
    setNoteFormReminderDate(presetDate || todayStr);
    setNoteFormReminderTime('09:30');
    setNoteFormReminderSent(false);
    setIsNoteModalOpen(true);
  };

  const handleSaveNoteModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormTitle.trim()) return;

    try {
      setSavingNote(true);
      const payload: Partial<SelfNote> = {
        title: noteFormTitle.trim(),
        content: noteFormContent.trim(),
        category: noteFormCategory,
        color: noteFormColor,
        is_pinned: noteFormPinned,
        reminder_enabled: noteFormReminderEnabled,
        reminder_date: noteFormReminderEnabled && noteFormReminderDate ? noteFormReminderDate : null,
        reminder_time: noteFormReminderEnabled && noteFormReminderTime ? noteFormReminderTime : null,
      };

      if (noteFormReminderEnabled) {
        requestBrowserNotificationPermission().catch(() => {});
      }

      if (editingNote) {
        const updated = await api.updateSelfNote(editingNote.id, payload);
        setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)));
      } else {
        const created = await api.createSelfNote(payload);
        setNotes((prev) => [created, ...prev]);
      }
      setIsNoteModalOpen(false);
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Could not save note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendImmediateReminder = async (note: SelfNote) => {
    try {
      setSendingReminderId(note.id);
      await requestBrowserNotificationPermission();
      await api.sendSelfNoteReminder(note.id);
      notifyNoteReminder(note.title, note.content);
      setReminderToast(`🔔 Reminder dispatched for "${note.title}"! Notification sent to your device.`);
      setTimeout(() => setReminderToast(null), 4500);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, is_reminder_sent: true } : n)));
    } catch (err) {
      console.error('Failed to send immediate reminder:', err);
      alert('Could not send reminder notification. Please check permissions.');
    } finally {
      setSendingReminderId(null);
    }
  };

  // -------------------------------------------------------------
  // Filtered Data
  // -------------------------------------------------------------
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      // Filter status
      if (taskFilter === 'PENDING') return !t.is_completed;
      if (taskFilter === 'COMPLETED') return t.is_completed;
      if (taskFilter === 'URGENT') return t.priority === 'URGENT' || t.priority === 'HIGH';
      return true;
    });
  }, [tasks, taskSearch, taskFilter]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        // Search
        if (noteSearch.trim()) {
          const q = noteSearch.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content?.toLowerCase().includes(q);
          if (!matchTitle && !matchContent) return false;
        }
        // Filter category
        if (noteCategory !== 'ALL' && n.category !== noteCategory) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned notes first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [notes, noteSearch, noteCategory]);

  // Calendar days grid computation for Notes Calendar View
  const calendarDays = useMemo(() => {
    const yr = noteCalendarDate.getFullYear();
    const mo = noteCalendarDate.getMonth();
    const firstDay = new Date(yr, mo, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const daysInPrevMonth = new Date(yr, mo, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prev month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(yr, mo - 1, dNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month leading days to complete 35 or 42 grid slots
    const remainingSlots = (days.length <= 35 ? 35 : 42) - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(yr, mo + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [noteCalendarDate, todayStr]);

  // Group notes by reminder_date (or created_at date as fallback)
  const notesByDate = useMemo(() => {
    const map: Record<string, SelfNote[]> = {};
    filteredNotes.forEach((note) => {
      let targetDate = note.reminder_date;
      if (!targetDate && note.created_at) {
        targetDate = note.created_at.split('T')[0];
      }
      if (targetDate) {
        if (!map[targetDate]) map[targetDate] = [];
        map[targetDate].push(note);
      }
    });
    return map;
  }, [filteredNotes]);

  // Task metrics
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length;
  const completedTasksCount = tasks.filter((t) => t.is_completed).length;
  const totalNotesCount = notes.length;
  const pinnedNotesCount = notes.filter((n) => n.is_pinned).length;

  const colorPresets = [
    { label: 'Indigo', hex: '#4f46e5' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Rose', hex: '#f43f5e' },
    { label: 'Sky', hex: '#0284c7' },
    { label: 'Purple', hex: '#8b5cf6' },
  ];

  return (
    <div
      style={{
        padding: '24px 32px',
        maxWidth: '1440px',
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--notion-bg)',
      }}
    >
      {/* Reminder Notification Banner */}
      {reminderToast && (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(79, 70, 229, 0.15))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: 'var(--notion-text)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <BellRing size={16} />
            </div>
            <span>{reminderToast}</span>
          </div>
          <button
            onClick={() => setReminderToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--notion-text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Banner / Personal Desk Header */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '16px',
          padding: '22px 28px',
          marginBottom: '24px',
          boxShadow: 'var(--notion-shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.35)',
              flexShrink: 0,
            }}
          >
            <CheckSquare size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--notion-text)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {t('myPrivateDeskTitle')}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '20px',
                  background: 'rgba(79, 70, 229, 0.08)',
                  color: '#4f46e5',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                }}
              >
                <Lock size={11} />
                {t('strictlyPrivate')}
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--notion-text-muted)',
                margin: '4px 0 0 0',
              }}
            >
              {isTamil
                ? `${currentUser.full_name} அவர்களுக்கான சொந்த பணிகள் மற்றும் குறிப்புகள். நீங்கள் மட்டுமே பார்க்க முடியும்.`
                : `Private personal tasks and notes for ${currentUser.full_name}. Only you can view or edit these records.`}
            </p>
          </div>
        </div>

        {/* Quick Stats Strip & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border-subtle)',
              padding: '6px 14px',
              borderRadius: '12px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#4f46e5' }}>{pendingTasksCount}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>{isTamil ? 'செயலில் உள்ளவை' : 'Active Tasks'}</div>
            </div>
            <div style={{ width: '1px', height: '22px', background: 'var(--notion-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>{completedTasksCount}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>{isTamil ? 'முடிந்தது' : 'Done'}</div>
            </div>
            <div style={{ width: '1px', height: '22px', background: 'var(--notion-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#8b5cf6' }}>{totalNotesCount}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>{isTamil ? 'குறிப்புகள்' : 'Notes'}</div>
            </div>
          </div>

          <button
            onClick={() => {
              fetchTasks();
              fetchNotes();
            }}
            className="notion-btn notion-btn-bordered"
            title="Refresh Personal Desk"
            style={{ padding: '8px 12px', borderRadius: '10px' }}
          >
            <RefreshCw size={14} className={loadingTasks || loadingNotes ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Tab Switcher (My Self Tasks vs My Self Notes) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--notion-border)',
          marginBottom: '20px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Tasks Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'tasks' ? 700 : 500,
              color: activeTab === 'tasks' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tasks' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckSquare size={16} style={{ color: activeTab === 'tasks' ? '#4f46e5' : 'inherit' }} />
            <span>{t('myTasksTab')}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '12px',
                background: activeTab === 'tasks' ? 'rgba(79, 70, 229, 0.12)' : 'var(--notion-item-bg)',
                color: activeTab === 'tasks' ? '#4f46e5' : 'var(--notion-text-dim)',
              }}
            >
              {pendingTasksCount}
            </span>
          </button>

          {/* Notes Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: activeTab === 'notes' ? 700 : 500,
              color: activeTab === 'notes' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'notes' ? '2.5px solid #8b5cf6' : '2.5px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
          >
            <StickyNote size={16} style={{ color: activeTab === 'notes' ? '#8b5cf6' : 'inherit' }} />
            <span>{t('myNotesTab')}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '12px',
                background: activeTab === 'notes' ? 'rgba(139, 92, 246, 0.12)' : 'var(--notion-item-bg)',
                color: activeTab === 'notes' ? '#8b5cf6' : 'var(--notion-text-dim)',
              }}
            >
              {totalNotesCount}
            </span>
          </button>
        </div>

        {/* Tab Right Action (New Task or New Note Modal trigger) */}
        <div>
          {activeTab === 'tasks' ? (
            <button
              onClick={handleOpenCreateTask}
              className="notion-btn notion-btn-primary"
              style={{ padding: '7px 16px', borderRadius: '10px', gap: '6px' }}
            >
              <Plus size={15} />
              <span>{t('addTaskBtn')}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Toggle Table vs Cards view for Notes */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--notion-item-bg)',
                  padding: '3px',
                  borderRadius: '9px',
                  border: '1px solid var(--notion-border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setNotesViewFormat('table')}
                  style={{
                    background: notesViewFormat === 'table' ? 'var(--notion-card)' : 'transparent',
                    border: notesViewFormat === 'table' ? '1px solid var(--notion-border)' : '1px solid transparent',
                    color: notesViewFormat === 'table' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Table View"
                >
                  <TableIcon size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesViewFormat('cards')}
                  style={{
                    background: notesViewFormat === 'cards' ? 'var(--notion-card)' : 'transparent',
                    border: notesViewFormat === 'cards' ? '1px solid var(--notion-border)' : '1px solid transparent',
                    color: notesViewFormat === 'cards' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Card Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotesViewFormat('calendar')}
                  style={{
                    background: notesViewFormat === 'calendar' ? 'var(--notion-card)' : 'transparent',
                    border: notesViewFormat === 'calendar' ? '1px solid var(--notion-border)' : '1px solid transparent',
                    color: notesViewFormat === 'calendar' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  title="Notes Calendar View"
                >
                  <Calendar size={13} style={{ color: notesViewFormat === 'calendar' ? '#8b5cf6' : 'inherit' }} />
                  <span>Calendar</span>
                </button>
              </div>

              <button
                onClick={() => handleOpenCreateNote(selectedCalendarDate || undefined)}
                className="notion-btn"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '10px',
                  gap: '6px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                }}
              >
                <Plus size={15} />
                <span>{t('addNoteBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY SELF TASKS                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick-add row inline bar (Modern Linear-style Quick Capture) */}
          <form
            onSubmit={handleQuickAddTask}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--notion-card)',
              border: '1px solid rgba(79, 70, 229, 0.25)',
              borderRadius: '14px',
              padding: '10px 18px',
              boxShadow: '0 4px 20px -2px rgba(79, 70, 229, 0.08)',
              flexWrap: 'wrap',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(99, 102, 241, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5',
                  flexShrink: 0,
                }}
              >
                <Plus size={16} />
              </div>
              <input
                type="text"
                placeholder={t('quickAddPlaceholder')}
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '13.5px',
                  color: 'var(--notion-text)',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              />
            </div>

            {/* Quick Priority */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                value={quickTaskPriority}
                onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--notion-border)',
                  background: 'var(--notion-input-bg)',
                  color: quickTaskPriority === 'URGENT' ? '#ef4444' : quickTaskPriority === 'HIGH' ? '#f97316' : 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent ⚡</option>
              </select>
            </div>

            {/* Quick Due Date */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                value={quickTaskDueDate}
                onChange={(e) => setQuickTaskDueDate(e.target.value)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--notion-border)',
                  background: 'var(--notion-input-bg)',
                  color: 'var(--notion-text)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
                title="Due date (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={addingQuickTask || !quickTaskTitle.trim()}
              className="notion-btn"
              style={{
                padding: '7px 18px',
                borderRadius: '9px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#ffffff',
                border: 'none',
                opacity: quickTaskTitle.trim() ? 1 : 0.6,
                boxShadow: quickTaskTitle.trim() ? '0 2px 10px rgba(79, 70, 229, 0.35)' : 'none',
                cursor: quickTaskTitle.trim() ? 'pointer' : 'default',
              }}
            >
              {addingQuickTask ? 'Adding...' : '+ Add'}
            </button>
          </form>

          {/* Filter & Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--notion-item-bg)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              {(
                [
                  { id: 'ALL', label: `All (${totalTasksCount})` },
                  { id: 'PENDING', label: `Pending (${pendingTasksCount})` },
                  { id: 'COMPLETED', label: `Completed (${completedTasksCount})` },
                  { id: 'URGENT', label: 'High / Urgent' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTaskFilter(f.id)}
                  style={{
                    background: taskFilter === f.id ? 'var(--notion-card)' : 'transparent',
                    border: taskFilter === f.id ? '1px solid var(--notion-border)' : '1px solid transparent',
                    color: taskFilter === f.id ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: taskFilter === f.id ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: taskFilter === f.id ? 'var(--notion-shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'var(--notion-input-bg)',
                border: '1px solid var(--notion-border)',
                width: '240px',
              }}
            >
              <Search size={14} style={{ color: 'var(--notion-text-dim)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search self tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12.5px',
                  color: 'var(--notion-text)',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* DEDICATED SELF TASKS TABLE */}
          <div
            style={{
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--notion-shadow-sm)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--notion-item-bg)',
                      borderBottom: '1px solid var(--notion-border)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--notion-text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ width: '48px', padding: '12px 14px', textAlign: 'center' }}>Done</th>
                    <th style={{ padding: '12px 16px' }}>Task Title &amp; Memo</th>
                    <th style={{ width: '130px', padding: '12px 14px' }}>Priority</th>
                    <th style={{ width: '140px', padding: '12px 14px' }}>Status</th>
                    <th style={{ width: '140px', padding: '12px 14px' }}>Due Date</th>
                    <th style={{ width: '110px', padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTasks ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--notion-text-dim)' }}>
                        <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                        <div>Loading personal tasks...</div>
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--notion-text-dim)' }}>
                        <CheckSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--notion-text)' }}>
                          No personal tasks found
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          {taskSearch || taskFilter !== 'ALL'
                            ? 'Try clearing the search or filter.'
                            : 'Add your first personal task using the bar above.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t) => {
                      const isOverdue = t.due_date && t.due_date < todayStr && !t.is_completed;
                      const isDueToday = t.due_date === todayStr && !t.is_completed;

                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid var(--notion-border-subtle)',
                            background: t.is_completed ? 'rgba(0,0,0,0.015)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = t.is_completed ? 'rgba(0,0,0,0.015)' : 'transparent')
                          }
                        >
                          {/* Done Checkbox Column */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleCompleteTask(t)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: t.is_completed ? '#10b981' : 'var(--notion-text-dim)',
                                transition: 'transform 0.15s ease, color 0.15s ease',
                              }}
                              title={t.is_completed ? 'Mark pending' : 'Mark completed'}
                            >
                              {t.is_completed ? (
                                <CheckCircle2 size={19} style={{ fill: 'rgba(16, 185, 129, 0.15)' }} />
                              ) : (
                                <Circle size={19} />
                              )}
                            </button>
                          </td>

                          {/* Title & Description Column */}
                          <td style={{ padding: '12px 16px' }}>
                            <div
                              onClick={() => handleOpenEditTask(t)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: t.is_completed ? 500 : 700,
                                color: t.is_completed ? 'var(--notion-text-dim)' : 'var(--notion-text)',
                                textDecoration: t.is_completed ? 'line-through' : 'none',
                                fontSize: '13.5px',
                                lineHeight: 1.3,
                              }}
                            >
                              {t.title}
                            </div>
                            {t.description && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--notion-text-muted)',
                                  marginTop: '3px',
                                  lineHeight: 1.4,
                                  whiteSpace: 'pre-wrap',
                                  maxHeight: '42px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {t.description}
                              </div>
                            )}
                          </td>

                          {/* Priority Column */}
                          <td style={{ padding: '12px 14px' }}>
                            <select
                              value={t.priority}
                              onChange={(e) => handleInlineChangePriority(t, e.target.value as any)}
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                border: '1px solid var(--notion-border)',
                                cursor: 'pointer',
                                background:
                                  t.priority === 'URGENT'
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : t.priority === 'HIGH'
                                    ? 'rgba(249, 115, 22, 0.12)'
                                    : t.priority === 'MEDIUM'
                                    ? 'rgba(59, 130, 246, 0.12)'
                                    : 'rgba(148, 163, 184, 0.12)',
                                color:
                                  t.priority === 'URGENT'
                                    ? '#ef4444'
                                    : t.priority === 'HIGH'
                                    ? '#ea580c'
                                    : t.priority === 'MEDIUM'
                                    ? '#2563eb'
                                    : '#64748b',
                              }}
                            >
                              <option value="LOW">Low</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HIGH">High</option>
                              <option value="URGENT">⚡ Urgent</option>
                            </select>
                          </td>

                          {/* Status Column */}
                          <td style={{ padding: '12px 14px' }}>
                            <select
                              value={t.status}
                              onChange={(e) => handleInlineChangeStatus(t, e.target.value as any)}
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                border: '1px solid var(--notion-border)',
                                background: 'var(--notion-input-bg)',
                                color:
                                  t.status === 'COMPLETED'
                                    ? '#10b981'
                                    : t.status === 'IN_PROGRESS'
                                    ? '#3b82f6'
                                    : 'var(--notion-text)',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </td>

                          {/* Due Date Column */}
                          <td style={{ padding: '12px 14px' }}>
                            {t.due_date ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  color: isOverdue ? '#ef4444' : isDueToday ? '#ea580c' : 'var(--notion-text-muted)',
                                }}
                              >
                                {isOverdue && <AlertTriangle size={12} style={{ color: '#ef4444' }} />}
                                {isDueToday && <Flame size={12} style={{ color: '#ea580c' }} />}
                                {!isOverdue && !isDueToday && <Calendar size={12} />}
                                <span>{t.due_date}</span>
                                {isOverdue && (
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      background: '#fee2e2',
                                      color: '#b91c1c',
                                    }}
                                  >
                                    Overdue
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>—</span>
                            )}
                          </td>

                          {/* Action Buttons Column */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTask(t)}
                                className="notion-btn notion-btn-bordered"
                                style={{ padding: '4px 7px', borderRadius: '6px' }}
                                title="Edit Task"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                className="notion-btn notion-btn-bordered"
                                style={{ padding: '4px 7px', borderRadius: '6px', color: '#ef4444' }}
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--notion-border)',
                background: 'var(--notion-item-bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11.5px',
                color: 'var(--notion-text-dim)',
              }}
            >
              <span>Showing {filteredTasks.length} personal tasks</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} />
                Encrypted &amp; Isolated to User #{currentUser.id}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY SELF NOTES                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Notes Filters & Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Category pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--notion-item-bg)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              {[
                { id: 'ALL', label: `All Notes (${totalNotesCount})` },
                { id: 'WORK', label: 'Work' },
                { id: 'MEETING', label: 'Meetings' },
                { id: 'IDEA', label: 'Ideas' },
                { id: 'CHECKLIST', label: 'Checklists' },
                { id: 'GENERAL', label: 'General' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNoteCategory(c.id)}
                  style={{
                    background: noteCategory === c.id ? 'var(--notion-card)' : 'transparent',
                    border: noteCategory === c.id ? '1px solid var(--notion-border)' : '1px solid transparent',
                    color: noteCategory === c.id ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: noteCategory === c.id ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: noteCategory === c.id ? 'var(--notion-shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Note search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: 'var(--notion-input-bg)',
                border: '1px solid var(--notion-border)',
                width: '240px',
              }}
            >
              <Search size={14} style={{ color: 'var(--notion-text-dim)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search self notes..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12.5px',
                  color: 'var(--notion-text)',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* TABLE FORMAT FOR NOTES */}
          {notesViewFormat === 'table' ? (
            <div
              style={{
                background: 'var(--notion-card)',
                border: '1px solid var(--notion-border)',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'var(--notion-item-bg)',
                        borderBottom: '1px solid var(--notion-border)',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--notion-text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <th style={{ width: '44px', padding: '12px 12px', textAlign: 'center' }}>Pin</th>
                      <th style={{ width: '110px', padding: '12px 12px' }}>Category</th>
                      <th style={{ padding: '12px 16px' }}>Note Title &amp; Content Snippet</th>
                      <th style={{ width: '190px', padding: '12px 12px' }}>Calendar &amp; Reminder</th>
                      <th style={{ width: '120px', padding: '12px 12px' }}>Last Updated</th>
                      <th style={{ width: '110px', padding: '12px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingNotes ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--notion-text-dim)' }}>
                          <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                          <div>Loading personal notes...</div>
                        </td>
                      </tr>
                    ) : filteredNotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--notion-text-dim)' }}>
                          <StickyNote size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--notion-text)' }}>
                            No notes found
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            {noteSearch || noteCategory !== 'ALL'
                              ? 'Try adjusting your search query or category.'
                              : 'Create your first personal note or memo with "+ New Note".'}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredNotes.map((n) => (
                        <tr
                          key={n.id}
                          style={{
                            borderBottom: '1px solid var(--notion-border-subtle)',
                            background: n.is_pinned ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = n.is_pinned ? 'rgba(245, 158, 11, 0.04)' : 'transparent')
                          }
                        >
                          {/* Pin Toggle Column */}
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePinNote(n)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                color: n.is_pinned ? '#f59e0b' : 'var(--notion-text-dim)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title={n.is_pinned ? 'Unpin note' : 'Pin to top'}
                            >
                              <Pin
                                size={15}
                                style={{
                                  transform: n.is_pinned ? 'rotate(-45deg)' : 'none',
                                  fill: n.is_pinned ? '#f59e0b' : 'none',
                                }}
                              />
                            </button>
                          </td>

                          {/* Category Badge Column */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: `${n.color || '#4f46e5'}18`,
                                color: n.color || '#4f46e5',
                                border: `1px solid ${n.color || '#4f46e5'}33`,
                              }}
                            >
                              {n.category_display || n.category}
                            </span>
                          </td>

                          {/* Title & Content Preview */}
                          <td style={{ padding: '12px 16px' }}>
                            <div
                              onClick={() => handleOpenEditNote(n)}
                              style={{
                                cursor: 'pointer',
                                fontWeight: 700,
                                color: 'var(--notion-text)',
                                fontSize: '13.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{n.title}</span>
                              {n.is_pinned && (
                                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 800 }}>📌 PINNED</span>
                              )}
                            </div>
                            {n.content && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--notion-text-muted)',
                                  marginTop: '3px',
                                  lineHeight: 1.4,
                                  maxHeight: '38px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {n.content}
                              </div>
                            )}
                          </td>

                          {/* Calendar & Reminder Schedule Column */}
                          <td style={{ padding: '12px 12px', fontSize: '12px' }}>
                            {n.reminder_date ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '8px',
                                    background: n.is_reminder_sent ? 'var(--notion-item-bg)' : 'rgba(139, 92, 246, 0.12)',
                                    border: `1px solid ${n.is_reminder_sent ? 'var(--notion-border)' : 'rgba(139, 92, 246, 0.3)'}`,
                                    color: n.is_reminder_sent ? 'var(--notion-text-muted)' : '#8b5cf6',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                  }}
                                  title={n.is_reminder_sent ? 'Reminder previously sent' : 'Reminder alert active'}
                                >
                                  <Bell size={11} style={{ color: n.is_reminder_sent ? 'inherit' : '#8b5cf6' }} />
                                  <span>{n.reminder_date}{n.reminder_time ? ` • ${n.reminder_time.slice(0, 5)}` : ''}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSendImmediateReminder(n)}
                                  disabled={sendingReminderId === n.id}
                                  className="notion-btn notion-btn-bordered"
                                  style={{ padding: '3px 6px', borderRadius: '6px', color: '#8b5cf6' }}
                                  title="Send notification alert now"
                                >
                                  <BellRing size={12} className={sendingReminderId === n.id ? 'animate-spin' : ''} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(n)}
                                style={{
                                  background: 'transparent',
                                  border: '1px dashed var(--notion-border)',
                                  borderRadius: '7px',
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  color: 'var(--notion-text-dim)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Calendar size={11} />
                                <span>+ Schedule</span>
                              </button>
                            )}
                          </td>

                          {/* Updated Date */}
                          <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditNote(n)}
                                className="notion-btn notion-btn-bordered"
                                style={{ padding: '4px 7px', borderRadius: '6px' }}
                                title="Open & Edit Note"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(n.id)}
                                className="notion-btn notion-btn-bordered"
                                style={{ padding: '4px 7px', borderRadius: '6px', color: '#ef4444' }}
                                title="Delete Note"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Note Table Footer */}
              <div
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--notion-border)',
                  background: 'var(--notion-item-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  color: 'var(--notion-text-dim)',
                }}
              >
                <span>Showing {filteredNotes.length} notes</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={11} />
                  Private Personal Desk
                </span>
              </div>
            </div>
          ) : notesViewFormat === 'cards' ? (
            /* CARDS FORMAT FOR NOTES */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredNotes.map((n) => (
                <div
                  key={n.id}
                  style={{
                    background: 'var(--notion-card)',
                    border: n.is_pinned ? '1.5px solid #f59e0b' : '1px solid var(--notion-border)',
                    borderRadius: '14px',
                    padding: '18px',
                    boxShadow: 'var(--notion-shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '170px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <div>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: `${n.color || '#4f46e5'}18`,
                          color: n.color || '#4f46e5',
                          border: `1px solid ${n.color || '#4f46e5'}33`,
                        }}
                      >
                        {n.category_display || n.category}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleTogglePinNote(n)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: n.is_pinned ? '#f59e0b' : 'var(--notion-text-dim)',
                            padding: '3px',
                          }}
                          title={n.is_pinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin size={14} style={{ fill: n.is_pinned ? '#f59e0b' : 'none' }} />
                        </button>
                      </div>
                    </div>

                    {/* Card Title */}
                    <div
                      onClick={() => handleOpenEditNote(n)}
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--notion-text)',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                        marginBottom: '8px',
                      }}
                    >
                      {n.title}
                    </div>

                    {/* Content Preview */}
                    <div
                      onClick={() => handleOpenEditNote(n)}
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--notion-text-muted)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        cursor: 'pointer',
                        maxHeight: '84px',
                        overflow: 'hidden',
                      }}
                    >
                      {n.content || <em style={{ color: 'var(--notion-text-dim)' }}>Empty note</em>}
                    </div>

                    {/* Scheduled Reminder Badge on Card */}
                    {n.reminder_date && (
                      <div
                        style={{
                          marginTop: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          background: n.is_reminder_sent ? 'var(--notion-item-bg)' : 'rgba(139, 92, 246, 0.1)',
                          border: `1px solid ${n.is_reminder_sent ? 'var(--notion-border)' : 'rgba(139, 92, 246, 0.3)'}`,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: n.is_reminder_sent ? 'var(--notion-text-muted)' : '#8b5cf6',
                          width: 'fit-content',
                        }}
                      >
                        <Bell size={11} />
                        <span>📅 {n.reminder_date}{n.reminder_time ? ` at ${n.reminder_time.slice(0, 5)}` : ''}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendImmediateReminder(n);
                          }}
                          disabled={sendingReminderId === n.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '0 2px',
                            color: '#8b5cf6',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Notify me now"
                        >
                          <BellRing size={11} className={sendingReminderId === n.id ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--notion-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--notion-text-dim)',
                    }}
                  >
                    <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditNote(n)}
                        className="notion-btn notion-btn-bordered"
                        style={{ padding: '3px 6px', borderRadius: '5px' }}
                      >
                        <Edit size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(n.id)}
                        className="notion-btn notion-btn-bordered"
                        style={{ padding: '3px 6px', borderRadius: '5px', color: '#ef4444' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ========================================================================= */
            /* CALENDAR VIEW FOR PERSONAL NOTES                                          */
            /* ========================================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Calendar Header Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '16px 20px',
                  background: 'var(--notion-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--notion-border)',
                  boxShadow: 'var(--notion-shadow-sm)',
                }}
              >
                {/* Month navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setNoteCalendarDate(new Date(noteCalendarDate.getFullYear(), noteCalendarDate.getMonth() - 1, 1))
                      }
                      className="notion-btn notion-btn-bordered"
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Previous Month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteCalendarDate(new Date())}
                      className="notion-btn notion-btn-bordered"
                      style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNoteCalendarDate(new Date(noteCalendarDate.getFullYear(), noteCalendarDate.getMonth() + 1, 1))
                      }
                      className="notion-btn notion-btn-bordered"
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Next Month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--notion-text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {noteCalendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </h3>
                </div>

                {/* Info Pills & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--notion-text-dim)',
                      padding: '5px 12px',
                      borderRadius: '9px',
                      background: 'var(--notion-item-bg)',
                      border: '1px solid var(--notion-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Calendar size={13} style={{ color: '#8b5cf6' }} />
                    <span>{filteredNotes.filter((n) => n.reminder_date).length} Notes Scheduled</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateNote(selectedCalendarDate || todayStr)}
                    className="notion-btn"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '9px',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    <Plus size={14} />
                    <span>Schedule Note for {selectedCalendarDate || 'Today'}</span>
                  </button>
                </div>
              </div>

              {/* Calendar Month Grid */}
              <div
                style={{
                  background: 'var(--notion-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--notion-border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--notion-shadow-sm)',
                }}
              >
                {/* Weekday Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    background: 'var(--notion-item-bg)',
                    borderBottom: '1px solid var(--notion-border)',
                  }}
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      style={{
                        padding: '10px 8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--notion-text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid Days */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    minHeight: '520px',
                  }}
                >
                  {calendarDays.map((day, idx) => {
                    const isSelected = selectedCalendarDate === day.dateStr;
                    const dayNotes = notesByDate[day.dateStr] || [];
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCalendarDate(day.dateStr)}
                        style={{
                          minHeight: '105px',
                          padding: '8px',
                          borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--notion-border-subtle)' : 'none',
                          borderBottom: idx < calendarDays.length - 7 ? '1px solid var(--notion-border-subtle)' : 'none',
                          background: isSelected
                            ? 'rgba(139, 92, 246, 0.08)'
                            : day.isToday
                            ? 'rgba(59, 130, 246, 0.04)'
                            : !day.isCurrentMonth
                            ? 'var(--notion-item-bg)'
                            : 'transparent',
                          opacity: day.isCurrentMonth ? 1 : 0.45,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--notion-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = day.isToday
                              ? 'rgba(59, 130, 246, 0.04)'
                              : !day.isCurrentMonth
                              ? 'var(--notion-item-bg)'
                              : 'transparent';
                          }
                        }}
                      >
                        {/* Day Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: day.isToday ? 800 : 600,
                              background: day.isToday ? '#2563eb' : isSelected ? '#8b5cf6' : 'transparent',
                              color: day.isToday || isSelected ? '#ffffff' : 'var(--notion-text)',
                            }}
                          >
                            {day.dayNumber}
                          </span>

                          {/* Quick Add Note on Hover */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreateNote(day.dateStr);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '5px',
                              color: 'var(--notion-text-dim)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`Add note on ${day.dateStr}`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Day Notes Pill List */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            marginTop: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          {dayNotes.slice(0, 3).map((dn) => (
                            <div
                              key={dn.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditNote(dn);
                              }}
                              style={{
                                padding: '3px 6px',
                                borderRadius: '6px',
                                background: dn.color ? `${dn.color}20` : 'rgba(139, 92, 246, 0.15)',
                                borderLeft: `3px solid ${dn.color || '#8b5cf6'}`,
                                fontSize: '11px',
                                fontWeight: 700,
                                color: 'var(--notion-text)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                              title={dn.title}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {dn.is_pinned ? '📌 ' : ''}
                                {dn.title}
                              </span>
                              {dn.reminder_time && (
                                <span style={{ fontSize: '9px', opacity: 0.8, color: '#8b5cf6', flexShrink: 0 }}>
                                  {dn.reminder_time.slice(0, 5)}
                                </span>
                              )}
                            </div>
                          ))}

                          {dayNotes.length > 3 && (
                            <div style={{ fontSize: '10px', color: 'var(--notion-text-dim)', fontWeight: 700, paddingLeft: '4px' }}>
                              +{dayNotes.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Drawer or Quick Actions */}
              {selectedCalendarDate && (
                <div
                  style={{
                    background: 'var(--notion-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--notion-border)',
                    padding: '18px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--notion-text)' }}>
                        Notes scheduled for{' '}
                        {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#8b5cf6',
                        }}
                      >
                        {(notesByDate[selectedCalendarDate] || []).length} Notes
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenCreateNote(selectedCalendarDate)}
                        className="notion-btn"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Plus size={13} />
                        <span>Add Note</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDate(null)}
                        className="notion-btn notion-btn-bordered"
                        style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '11.5px' }}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Notes on this day */}
                  {(notesByDate[selectedCalendarDate] || []).length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: 'var(--notion-text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                      No notes scheduled for this date. Click "+ Add Note" to schedule ideas, checklist, or reminders.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                      {(notesByDate[selectedCalendarDate] || []).map((dn) => (
                        <div
                          key={dn.id}
                          onClick={() => handleOpenEditNote(dn)}
                          style={{
                            background: 'var(--notion-item-bg)',
                            border: dn.is_pinned ? '1.5px solid #f59e0b' : '1px solid var(--notion-border)',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '10.5px', fontWeight: 800, color: dn.color || '#8b5cf6' }}>
                                {dn.category}
                              </span>
                              {dn.is_pinned && <span style={{ fontSize: '10px', color: '#f59e0b' }}>📌 PINNED</span>}
                            </div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--notion-text)', marginTop: '4px' }}>
                              {dn.title}
                            </div>
                            {dn.content && (
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--notion-text-muted)',
                                  marginTop: '2px',
                                  maxHeight: '36px',
                                  overflow: 'hidden',
                                }}
                              >
                                {dn.content}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderTop: '1px solid var(--notion-border-subtle)',
                              paddingTop: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#8b5cf6',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Bell size={11} />
                              {dn.reminder_time ? dn.reminder_time.slice(0, 5) : 'Reminder set'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendImmediateReminder(dn);
                              }}
                              disabled={sendingReminderId === dn.id}
                              className="notion-btn notion-btn-bordered"
                              style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#8b5cf6' }}
                              title="Notify Now"
                            >
                              <BellRing size={11} className={sendingReminderId === dn.id ? 'animate-spin' : ''} />
                              <span style={{ marginLeft: '4px' }}>Alert Me</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PERSONAL TASK (Linear / Notion Executive Style)       */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsTaskModalOpen(false)}
          style={{
            backdropFilter: 'blur(8px)',
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            className="notion-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--notion-border)',
                background: 'linear-gradient(180deg, var(--notion-item-bg) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 6px 16px -2px rgba(79, 70, 229, 0.4)',
                  }}
                >
                  <CheckSquare size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                      {editingTask ? 'Edit Personal Task' : 'New Personal Task'}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '12px',
                        background: 'rgba(79, 70, 229, 0.1)',
                        color: '#4f46e5',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                      }}
                    >
                      <Lock size={10} />
                      PRIVATE
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                    Only you can view and track this personal task
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--notion-text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTaskModal} style={{ padding: '22px 24px' }}>
              {/* Task Title */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  TASK TITLE <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="What needs to be done? e.g. Prepare monthly executive briefing"
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '11px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: 'var(--notion-shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  DESCRIPTION &amp; CONTEXT <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Add notes, key links, or action items..."
                  value={taskFormDesc}
                  onChange={(e) => setTaskFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '11px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Priority Chips */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  PRIORITY LEVEL
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'URGENT', label: 'Urgent', icon: Flame, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
                    { id: 'HIGH', label: 'High', icon: Flag, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
                    { id: 'MEDIUM', label: 'Medium', icon: Clock, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
                    { id: 'LOW', label: 'Low', icon: Circle, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
                  ].map((p) => {
                    const isSelected = taskFormPriority === p.id;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTaskFormPriority(p.id as any)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 6px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${p.color}` : '1px solid var(--notion-border)',
                          background: isSelected ? p.bg : 'var(--notion-input-bg)',
                          color: isSelected ? p.color : 'var(--notion-text-muted)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          transform: isSelected ? 'scale(1.02)' : 'none',
                        }}
                      >
                        <Icon size={13} style={{ color: p.color }} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Chips */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  INITIAL STATUS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'TODO', label: 'To Do', icon: Circle, color: '#64748b' },
                    { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: '#3b82f6' },
                    { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: '#10b981' },
                  ].map((s) => {
                    const isSelected = taskFormStatus === s.id;
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTaskFormStatus(s.id as any)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 8px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${s.color}` : '1px solid var(--notion-border)',
                          background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'var(--notion-input-bg)',
                          color: isSelected ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={13} style={{ color: s.color }} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Due Date with Quick Presets */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '0.02em' }}>
                    TARGET DUE DATE
                  </label>
                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {[
                      { label: 'Today', action: 'today' },
                      { label: 'Tomorrow', action: 'tomorrow' },
                      { label: '+1 Week', action: 'nextWeek' },
                      { label: 'Clear', action: 'clear' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSetQuickDueDate(preset.action as any)}
                        style={{
                          fontSize: '10.5px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          border: '1px solid var(--notion-border-subtle)',
                          background: 'var(--notion-item-bg)',
                          color: 'var(--notion-text-muted)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    borderRadius: '11px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                  }}
                >
                  <Calendar size={15} style={{ color: '#4f46e5' }} />
                  <input
                    type="date"
                    value={taskFormDueDate}
                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--notion-text)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--notion-border)',
                  paddingTop: '18px',
                  marginTop: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                  <Lock size={12} />
                  <span>Private task visible only to you</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="notion-btn notion-btn-bordered"
                    style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTask || !taskFormTitle.trim()}
                    className="notion-btn"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{savingTask ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PERSONAL NOTE (Notion / Apple Studio Style)           */}
      {/* ========================================================================= */}
      {isNoteModalOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsNoteModalOpen(false)}
          style={{
            backdropFilter: 'blur(8px)',
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            className="notion-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '100%',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              position: 'relative',
            }}
          >
            {/* Dynamic Accent Color Strip across the top */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: noteFormColor || '#8b5cf6',
                boxShadow: `0 0 12px ${noteFormColor || '#8b5cf6'}`,
                transition: 'background 0.3s ease',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--notion-border)',
                background: 'linear-gradient(180deg, var(--notion-item-bg) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: `linear-gradient(135deg, ${noteFormColor} 0%, #a855f7 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: `0 6px 16px -2px ${noteFormColor}50`,
                  }}
                >
                  <StickyNote size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                      {editingNote ? 'Edit Personal Note' : 'New Personal Note'}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '12px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: '#8b5cf6',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <Lock size={10} />
                      PRIVATE NOTE
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                    Capture ideas, meeting minutes, thoughts, or checklists
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--notion-text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNoteModal} style={{ padding: '22px 24px' }}>
              {/* Note Title */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  NOTE TITLE <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Weekly Executive Review • Key Takeaways"
                  value={noteFormTitle}
                  onChange={(e) => setNoteFormTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '11px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: 'var(--notion-shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>

              {/* Category Selector Chips */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                  CATEGORY
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'WORK', label: 'Work', icon: Briefcase, color: '#4f46e5' },
                    { id: 'MEETING', label: 'Meetings', icon: Users, color: '#0284c7' },
                    { id: 'IDEA', label: 'Ideas', icon: Lightbulb, color: '#f59e0b' },
                    { id: 'CHECKLIST', label: 'Checklist', icon: ListChecks, color: '#10b981' },
                    { id: 'GENERAL', label: 'General', icon: FileText, color: '#8b5cf6' },
                  ].map((cat) => {
                    const isSelected = noteFormCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNoteFormCategory(cat.id as any)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          padding: '8px 4px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--notion-border)',
                          background: isSelected ? `${cat.color}15` : 'var(--notion-input-bg)',
                          color: isSelected ? cat.color : 'var(--notion-text-muted)',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={13} style={{ color: cat.color }} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatches & Pin Toggle Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '18px',
                  alignItems: 'center',
                }}
              >
                {/* Accent Color Palette */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                    ACCENT COLOR
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                    {colorPresets.map((c) => {
                      const isSelected = noteFormColor === c.hex;
                      return (
                        <div
                          key={c.hex}
                          onClick={() => setNoteFormColor(c.hex)}
                          title={c.label}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: c.hex,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isSelected ? '2.5px solid var(--notion-text)' : '2px solid transparent',
                            transform: isSelected ? 'scale(1.2)' : 'none',
                            boxShadow: isSelected ? `0 0 10px ${c.hex}80` : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pin to Top Card */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '7px', letterSpacing: '0.02em' }}>
                    PIN PRIORITY
                  </label>
                  <div
                    onClick={() => setNoteFormPinned(!noteFormPinned)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: noteFormPinned ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--notion-border)',
                      background: noteFormPinned ? 'rgba(245, 158, 11, 0.08)' : 'var(--notion-input-bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Pin size={14} style={{ color: noteFormPinned ? '#f59e0b' : 'var(--notion-text-dim)', transform: 'rotate(45deg)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: noteFormPinned ? '#f59e0b' : 'var(--notion-text)' }}>
                        {noteFormPinned ? 'Pinned to Top' : 'Not Pinned'}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '34px',
                        height: '18px',
                        borderRadius: '9px',
                        background: noteFormPinned ? '#f59e0b' : 'var(--notion-border)',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: noteFormPinned ? '18px' : '2px',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar Date & Notification Reminder Section */}
              <div
                style={{
                  marginBottom: '18px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: noteFormReminderEnabled ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--notion-border)',
                  background: noteFormReminderEnabled ? 'rgba(139, 92, 246, 0.05)' : 'var(--notion-item-bg)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: noteFormReminderEnabled ? '12px' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        background: noteFormReminderEnabled ? '#8b5cf6' : 'var(--notion-input-bg)',
                        color: noteFormReminderEnabled ? '#ffffff' : 'var(--notion-text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bell size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--notion-text)' }}>
                        Calendar Schedule &amp; Notification Reminder
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                        Pin to calendar dates and send push &amp; desktop alerts
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    onClick={() => {
                      const next = !noteFormReminderEnabled;
                      setNoteFormReminderEnabled(next);
                      if (next && !noteFormReminderDate) {
                        setNoteFormReminderDate(todayStr);
                      }
                      if (next) {
                        requestBrowserNotificationPermission().catch(() => {});
                      }
                    }}
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '10px',
                      background: noteFormReminderEnabled ? '#8b5cf6' : 'var(--notion-border)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: noteFormReminderEnabled ? '18px' : '2px',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {noteFormReminderEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--notion-border-subtle)' }}>
                    {/* Date Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>Quick:</span>
                      {[
                        { label: 'Today', days: 0 },
                        { label: 'Tomorrow', days: 1 },
                        { label: 'In 3 Days', days: 3 },
                        { label: 'Next Week', days: 7 },
                      ].map((preset) => {
                        const d = new Date();
                        d.setDate(d.getDate() + preset.days);
                        const dStr = d.toISOString().split('T')[0];
                        const isSelected = noteFormReminderDate === dStr;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setNoteFormReminderDate(dStr)}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--notion-border-subtle)',
                              background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--notion-input-bg)',
                              color: isSelected ? '#8b5cf6' : 'var(--notion-text-muted)',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 700 : 500,
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      {/* Reminder Date Picker */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', marginBottom: '4px' }}>
                          SCHEDULE DATE
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '9px',
                            border: '1px solid var(--notion-border)',
                            background: 'var(--notion-input-bg)',
                          }}
                        >
                          <Calendar size={14} style={{ color: '#8b5cf6' }} />
                          <input
                            type="date"
                            value={noteFormReminderDate}
                            onChange={(e) => setNoteFormReminderDate(e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--notion-text)',
                              fontSize: '12.5px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                      </div>

                      {/* Reminder Time Picker */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', marginBottom: '4px' }}>
                          ALERT TIME
                        </label>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '9px',
                            border: '1px solid var(--notion-border)',
                            background: 'var(--notion-input-bg)',
                          }}
                        >
                          <Clock size={14} style={{ color: '#8b5cf6' }} />
                          <input
                            type="time"
                            value={noteFormReminderTime}
                            onChange={(e) => setNoteFormReminderTime(e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--notion-text)',
                              fontSize: '12.5px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Immediate Dispatch Button if editing */}
                    {editingNote && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: noteFormReminderSent ? '#10b981' : 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {noteFormReminderSent ? '✓ Reminder previously sent' : 'Reminder pending trigger'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSendImmediateReminder(editingNote)}
                          disabled={sendingReminderId === editingNote.id}
                          className="notion-btn notion-btn-bordered"
                          style={{
                            fontSize: '11.5px',
                            padding: '4px 10px',
                            borderRadius: '7px',
                            color: '#8b5cf6',
                            borderColor: 'rgba(139, 92, 246, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <BellRing size={12} className={sendingReminderId === editingNote.id ? 'animate-spin' : ''} />
                          <span>{sendingReminderId === editingNote.id ? 'Sending...' : 'Test / Send Alert Now'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Note Content with Writing Toolbar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '0.02em' }}>
                    NOTE CONTENT
                  </label>
                  {/* Quick Format Snippets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleInsertNoteSnippet('[ ] Checklist item')}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--notion-border-subtle)',
                        background: 'var(--notion-item-bg)',
                        color: 'var(--notion-text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      + [ ] Checkbox
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertNoteSnippet('• Bullet point')}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--notion-border-subtle)',
                        background: 'var(--notion-item-bg)',
                        color: 'var(--notion-text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      + • Bullet
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertNoteSnippet(`📅 ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}: `)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--notion-border-subtle)',
                        background: 'var(--notion-item-bg)',
                        color: 'var(--notion-text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      + 📅 Timestamp
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  placeholder="Type your notes, meeting minutes, key decisions, or brainstorms here..."
                  value={noteFormContent}
                  onChange={(e) => setNoteFormContent(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '11px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    boxShadow: 'var(--notion-shadow-sm)',
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--notion-border)',
                  paddingTop: '18px',
                }}
              >
                <div style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                  {noteFormContent ? `${noteFormContent.trim().split(/\s+/).filter(Boolean).length} words • ${noteFormContent.length} chars` : '0 words'}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="notion-btn notion-btn-bordered"
                    style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote || !noteFormTitle.trim()}
                    className="notion-btn"
                    style={{
                      padding: '9px 24px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${noteFormColor} 0%, #7c3aed 100%)`,
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: `0 4px 14px ${noteFormColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{savingNote ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
