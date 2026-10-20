import React, { useState, useMemo, useEffect } from 'react';
import { Task, Department, User, Role } from '../types';
import { api } from '../services/api';
import {
  Flame,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  User as UserIcon,
  Users,
  Search,
  Building,
  ArrowRight,
  Eye,
  Mail,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  X,
  Send,
  Share2,
  Copy,
  Check,
  Table as TableIcon,
  LayoutGrid,
  MessageCircle,
  Phone,
} from 'lucide-react';
import {
  formatWhatsAppPhone,
  formatWhatsAppUrgentTasksMessage,
  formatWhatsAppSingleTaskMessage,
  openWhatsApp,
} from '../utils/whatsapp';
import rathinamLogo from '../image/image.png';

interface NotionGMTodayViewProps {
  tasks: Task[];
  departments: Department[];
  staffList: User[];
  onSelectTask: (task: Task) => void;
  onQuickApprove: (task: Task) => void;
  onOpenCreateTask?: (deptId?: number, isIssue?: boolean) => void;
  onRefresh?: () => void;
}

export const NotionGMTodayView: React.FC<NotionGMTodayViewProps> = ({
  tasks,
  departments,
  staffList,
  onSelectTask,
  onQuickApprove,
  onOpenCreateTask,
  onRefresh,
}) => {
  // Step 1: Department Filter State with URL query sync ("first selected the department")
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'ALL'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const deptParam = params.get('dept');
      if (deptParam && deptParam !== 'ALL') {
        const parsed = Number(deptParam);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 'ALL';
  });

  // Step 2: Person Name Filter State with URL query sync ("filter by the person name")
  const [selectedPersonId, setSelectedPersonId] = useState<number | 'ALL'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const personParam = params.get('person');
      if (personParam && personParam !== 'ALL') {
        const parsed = Number(personParam);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 'ALL';
  });
  const [personSearchQuery, setPersonSearchQuery] = useState('');

  // Step 3: Priority / Category Tab ("today task and urgent to close ... urgent tasks")
  const [priorityTab, setPriorityTab] = useState<'ALL' | 'DUE_TODAY' | 'AWAITING_CLOSE' | 'URGENT_PRIORITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Share Tasks & Digest State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCustomNote, setShareCustomNote] = useState('');
  const [sendingShare, setSendingShare] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Direct Quick Push Message State
  const [pushModalTask, setPushModalTask] = useState<Task | null>(null);
  const [pushMessageText, setPushMessageText] = useState('');
  const [sendingPush, setSendingPush] = useState(false);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);

  // WhatsApp Share State
  const [whatsAppModalTarget, setWhatsAppModalTarget] = useState<{
    user: User | { id: number; full_name: string; phone?: string; email?: string; username: string; role?: string; department_name?: string };
    tasks: Task[];
  } | null>(null);
  const [whatsAppPhoneInput, setWhatsAppPhoneInput] = useState('');
  const [savingWhatsAppPhone, setSavingWhatsAppPhone] = useState(false);
  const [whatsAppSuccessNotice, setWhatsAppSuccessNotice] = useState<string | null>(null);

  // Synchronize department & person filters to URL parameters for bookmarking & sharing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (selectedDeptId === 'ALL') {
        params.delete('dept');
      } else {
        params.set('dept', selectedDeptId.toString());
      }
      if (selectedPersonId === 'ALL') {
        params.delete('person');
      } else {
        params.set('person', selectedPersonId.toString());
      }
      const newQuery = params.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [selectedDeptId, selectedPersonId]);

  // Today's date normalized to YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter staff based on selected department
  const filteredStaffList = useMemo(() => {
    let list = staffList.filter((u) => u.is_active !== false);
    if (selectedDeptId !== 'ALL') {
      list = list.filter((u) => u.department === selectedDeptId);
    }
    if (personSearchQuery.trim()) {
      const q = personSearchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [staffList, selectedDeptId, personSearchQuery]);

  // Determine if a task is due today or overdue
  const isDueTodayOrOverdue = (task: Task): { isToday: boolean; isOverdue: boolean; label: string; tagClass: string } | null => {
    if (!task.due_date) return null;
    const target = new Date(task.due_date + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { isToday: false, isOverdue: true, label: `🚨 Overdue by ${Math.abs(diffDays)}d`, tagClass: 'tag-red' };
    }
    if (diffDays === 0) {
      return { isToday: true, isOverdue: false, label: '⚠️ Due Today', tagClass: 'tag-yellow' };
    }
    if (diffDays === 1) {
      return { isToday: false, isOverdue: false, label: '⏰ Due Tomorrow', tagClass: 'tag-orange' };
    }
    return { isToday: false, isOverdue: false, label: `📅 ${diffDays}d left`, tagClass: 'tag-blue' };
  };

  // Base list of candidate urgent & executive priority tasks (excluding closed unless filtered)
  const candidateTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Department isolation / selection filter
      if (selectedDeptId !== 'ALL' && t.department !== selectedDeptId) {
        return false;
      }

      // 2. Person name / assignee filter
      if (selectedPersonId !== 'ALL' && t.assigned_to !== selectedPersonId) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesAssignee = t.assigned_to_name?.toLowerCase().includes(q);
        const matchesDept = t.department_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAssignee && !matchesDept) return false;
      }

      return true;
    });
  }, [tasks, selectedDeptId, selectedPersonId, searchQuery]);

  // Overall metric counters
  const metrics = useMemo(() => {
    let dueToday = 0;
    let overdue = 0;
    let awaitingClose = 0;
    let urgentPriority = 0;

    for (const t of tasks) {
      if (t.status === 'CLOSED') continue;
      const timeline = isDueTodayOrOverdue(t);
      if (timeline?.isToday) dueToday++;
      if (timeline?.isOverdue) overdue++;
      if (t.status === 'PENDING_GM_APPROVAL') awaitingClose++;
      if (t.priority === 'URGENT') urgentPriority++;
    }

    return { dueToday, overdue, awaitingClose, urgentPriority };
  }, [tasks]);

  // Segment tasks into priority tab buckets
  const displayedTasks = useMemo(() => {
    return candidateTasks.filter((t) => {
      if (t.status === 'CLOSED') return false;

      const timeline = isDueTodayOrOverdue(t);
      const isAwaitingClose = t.status === 'PENDING_GM_APPROVAL';
      const isUrgentPri = t.priority === 'URGENT';
      const isHighPri = t.priority === 'HIGH';
      const isDueSoon = timeline?.isToday || timeline?.isOverdue;

      if (priorityTab === 'DUE_TODAY') {
        return isDueSoon;
      }
      if (priorityTab === 'AWAITING_CLOSE') {
        return isAwaitingClose;
      }
      if (priorityTab === 'URGENT_PRIORITY') {
        return isUrgentPri || isHighPri;
      }

      // 'ALL': If user selected a specific department or person, show all active tasks in that scope!
      if (selectedDeptId !== 'ALL' || selectedPersonId !== 'ALL') {
        return true;
      }

      // Global 'ALL': Any task that is Due Today, Overdue, Awaiting GM Close, or Urgent/High priority
      return isDueSoon || isAwaitingClose || isUrgentPri || isHighPri || t.status === 'IN_PROGRESS';
    });
  }, [candidateTasks, priorityTab, selectedDeptId, selectedPersonId]);

  // Real-time department statistics and task counts
  const totalActiveTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'CLOSED').length,
    [tasks]
  );

  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const deptTasks = tasks.filter((t) => t.department === dept.id && t.status !== 'CLOSED');
      const urgentCount = deptTasks.filter((t) => {
        const tl = isDueTodayOrOverdue(t);
        return tl?.isToday || tl?.isOverdue || t.priority === 'URGENT' || t.priority === 'HIGH';
      }).length;
      const dueTodayCount = deptTasks.filter((t) => {
        const tl = isDueTodayOrOverdue(t);
        return tl?.isToday || tl?.isOverdue;
      }).length;
      const awaitingCloseCount = deptTasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
      const staffInDept = staffList.filter((s) => s.department === dept.id && s.is_active !== false);

      return {
        department: dept,
        totalActive: deptTasks.length,
        urgentCount,
        dueTodayCount,
        awaitingCloseCount,
        staffCount: staffInDept.length,
      };
    });
  }, [departments, tasks, staffList]);

  // Share summary text generator (markdown/plain text suitable for WhatsApp, Slack, Teams, Email)
  const generateShareSummaryText = () => {
    let text = `📋 Rathinam TaskTracker - Executive Task Allocation\n`;
    if (activeStaffObj) {
      text += `👤 Assigned Staff: ${activeStaffObj.full_name || activeStaffObj.username} (${activeStaffObj.email || 'No email'})\n`;
    }
    if (activeDepartmentObj) {
      text += `🏢 Department: ${activeDepartmentObj.name} (${activeDepartmentObj.code})\n`;
    }
    text += `📅 Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (displayedTasks.length === 0) {
      text += `No pending tasks for this filter.\n`;
    } else {
      displayedTasks.forEach((t, idx) => {
        const timeline = isDueTodayOrOverdue(t);
        const priBadge = t.priority === 'URGENT' ? '🚨 [URGENT]' : t.priority === 'HIGH' ? '⚡ [HIGH]' : '📌';
        text += `${idx + 1}. ${priBadge} #${t.id}: ${t.title}\n`;
        text += `   • Status: ${t.status.replace(/_/g, ' ')}\n`;
        text += `   • Due: ${t.due_date ? t.due_date : 'No deadline'} ${timeline ? `(${timeline.label})` : ''}\n`;
        if (t.description) {
          text += `   • Specs: ${t.description.slice(0, 100)}${t.description.length > 100 ? '...' : ''}\n`;
        }
        text += `\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Direct Link: ${typeof window !== 'undefined' ? window.location.href : ''}\n`;
    return text;
  };

  const handleCopySummary = () => {
    const text = generateShareSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleCopyDirectLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDispatchShareEmail = async () => {
    if (!activeStaffObj) return;
    const staffTasks = displayedTasks.filter((t) => t.assigned_to === activeStaffObj.id);
    const targetTask = staffTasks[0] || displayedTasks[0];
    if (!targetTask) return;

    try {
      setSendingShare(true);
      const notePrefix = shareCustomNote.trim() ? `${shareCustomNote.trim()}\n\n` : '';
      const summaryList = staffTasks
        .map((t, idx) => `${idx + 1}. [${t.priority}] #${t.id}: ${t.title} (Due: ${t.due_date || 'No date'})`)
        .join('\n');
      const fullMessage = `${notePrefix}📋 Executive Task Allocation (${staffTasks.length} active tasks):\n${summaryList}`;

      await api.pushMessageToAssignee(targetTask.id, {
        message: fullMessage,
        send_email: true,
        send_in_app: true,
        is_urgent: true,
      });

      setShareSuccessNotice(
        `✓ Task digest successfully dispatched to ${activeStaffObj.full_name || activeStaffObj.username} (${activeStaffObj.email})!`
      );
      setTimeout(() => {
        setIsShareModalOpen(false);
        setShareSuccessNotice(null);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch task digest');
    } finally {
      setSendingShare(false);
    }
  };

  // Quick push message dispatch handler
  const handleSendPushMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushModalTask || !pushMessageText.trim()) return;

    try {
      setSendingPush(true);
      await api.pushMessageToAssignee(pushModalTask.id, {
        message: pushMessageText.trim(),
        send_email: true,
        send_in_app: true,
        is_urgent: true,
      });
      setPushSuccess(`Direct priority message dispatched to ${pushModalTask.assigned_to_name}!`);
      setPushMessageText('');
      setTimeout(() => {
        setPushModalTask(null);
        setPushSuccess(null);
        onRefresh?.();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch message');
    } finally {
      setSendingPush(false);
    }
  };

  // Group urgent/high-priority/overdue tasks by assigned staff member for direct WhatsApp dispatch
  const urgentStaffGroups = useMemo(() => {
    const candidateUrgentTasks = tasks.filter((t) => {
      if (t.status === 'CLOSED') return false;
      if (selectedDeptId !== 'ALL' && t.department !== selectedDeptId) return false;
      if (selectedPersonId !== 'ALL' && t.assigned_to !== selectedPersonId) return false;

      const timeline = isDueTodayOrOverdue(t);
      const isUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';
      const isDueSoon = timeline?.isToday || timeline?.isOverdue;
      const isAwaitingClose = t.status === 'PENDING_GM_APPROVAL';

      return isUrgent || isDueSoon || isAwaitingClose;
    });

    const map = new Map<
      string,
      {
        user: { id: number; full_name: string; username: string; email?: string; phone?: string; department_name?: string; role?: string };
        tasks: Task[];
        urgentCount: number;
        overdueCount: number;
        dueTodayCount: number;
        awaitingCloseCount: number;
      }
    >();

    candidateUrgentTasks.forEach((t) => {
      const key = t.assigned_to ? `user-${t.assigned_to}` : `unassigned-${t.department || 0}`;
      let group = map.get(key);

      if (!group) {
        const matchedUser = t.assigned_to ? staffList.find((s) => s.id === t.assigned_to) : null;
        const userObj = matchedUser
          ? {
              id: matchedUser.id,
              full_name: matchedUser.full_name || matchedUser.username,
              username: matchedUser.username,
              email: matchedUser.email,
              phone: matchedUser.phone || t.assigned_to_phone || '',
              department_name: matchedUser.department_name || t.department_name,
              role: matchedUser.role,
            }
          : {
              id: t.assigned_to || 0,
              full_name: t.assigned_to_name || 'Unassigned Staff',
              username: t.assigned_to_name || 'Unassigned',
              email: t.assigned_to_email || '',
              phone: t.assigned_to_phone || '',
              department_name: t.department_name || 'General',
              role: 'STAFF',
            };

        group = {
          user: userObj,
          tasks: [],
          urgentCount: 0,
          overdueCount: 0,
          dueTodayCount: 0,
          awaitingCloseCount: 0,
        };
        map.set(key, group);
      }

      group.tasks.push(t);
      if (t.priority === 'URGENT' || t.priority === 'HIGH') group.urgentCount++;
      const timeline = isDueTodayOrOverdue(t);
      if (timeline?.isOverdue) group.overdueCount++;
      if (timeline?.isToday) group.dueTodayCount++;
      if (t.status === 'PENDING_GM_APPROVAL') group.awaitingCloseCount++;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.urgentCount + b.overdueCount - (a.urgentCount + a.overdueCount)
    );
  }, [tasks, staffList, selectedDeptId, selectedPersonId]);

  // Handler: Open WhatsApp with urgent task list for a staff member
  const handleOpenWhatsAppForStaff = (group: {
    user: { id: number; full_name: string; username: string; email?: string; phone?: string; department_name?: string; role?: string };
    tasks: Task[];
  }) => {
    const matchedStaff = group.user.id ? staffList.find((s) => s.id === group.user.id) : null;
    const staffName = matchedStaff?.full_name || matchedStaff?.username || group.user.full_name || group.user.username;
    const rawPhone = matchedStaff?.phone || group.user.phone || (group.tasks[0]?.assigned_to_phone) || '';

    if (rawPhone && formatWhatsAppPhone(rawPhone)) {
      const msg = formatWhatsAppUrgentTasksMessage(staffName, group.tasks);
      openWhatsApp(rawPhone, msg);
    } else {
      setWhatsAppModalTarget({ user: group.user, tasks: group.tasks });
      setWhatsAppPhoneInput('');
    }
  };

  // Handler: Open WhatsApp for a single urgent task
  const handleOpenWhatsAppForSingleTask = (task: Task) => {
    const staffName = task.assigned_to_name || 'Staff Member';
    const matchedStaff = task.assigned_to ? staffList.find((s) => s.id === task.assigned_to) : null;
    const rawPhone = task.assigned_to_phone || matchedStaff?.phone || '';

    if (rawPhone && formatWhatsAppPhone(rawPhone)) {
      const msg = formatWhatsAppSingleTaskMessage(staffName, task);
      openWhatsApp(rawPhone, msg);
    } else {
      const fallbackUser = matchedStaff || {
        id: task.assigned_to || 0,
        full_name: staffName,
        username: staffName,
        phone: '',
        email: task.assigned_to_email,
        department_name: task.department_name,
      };
      setWhatsAppModalTarget({ user: fallbackUser, tasks: [task] });
      setWhatsAppPhoneInput('');
    }
  };

  // Handler: Confirm and dispatch WhatsApp message with inputted phone
  const handleConfirmWhatsAppSend = async () => {
    if (!whatsAppModalTarget) return;
    const rawInput = whatsAppPhoneInput.trim();
    const cleaned = formatWhatsAppPhone(rawInput);
    if (!cleaned) {
      alert('Please enter a valid 10-digit mobile number for WhatsApp (e.g. 9876543210).');
      return;
    }

    const staffName = whatsAppModalTarget.user.full_name || whatsAppModalTarget.user.username;
    const isSingle = whatsAppModalTarget.tasks.length === 1;
    const msg = isSingle
      ? formatWhatsAppSingleTaskMessage(staffName, whatsAppModalTarget.tasks[0])
      : formatWhatsAppUrgentTasksMessage(staffName, whatsAppModalTarget.tasks);

    if (whatsAppModalTarget.user.id > 0) {
      try {
        setSavingWhatsAppPhone(true);
        await api.updateUser(whatsAppModalTarget.user.id, { phone: rawInput });
        const found = staffList.find((s) => s.id === whatsAppModalTarget.user.id);
        if (found) found.phone = rawInput;
      } catch (e) {
        console.warn('Could not save phone to staff profile:', e);
      } finally {
        setSavingWhatsAppPhone(false);
      }
    }

    openWhatsApp(cleaned, msg);
    setWhatsAppModalTarget(null);
    setWhatsAppPhoneInput('');
    setWhatsAppSuccessNotice(`WhatsApp opened for ${staffName} (${cleaned})!`);
    setTimeout(() => setWhatsAppSuccessNotice(null), 3000);
  };

  const handleCopyWhatsAppText = (group: {
    user: { id: number; full_name: string; username: string; email?: string; phone?: string; department_name?: string; role?: string };
    tasks: Task[];
  }) => {
    const staffName = group.user.full_name || group.user.username;
    const msg = formatWhatsAppUrgentTasksMessage(staffName, group.tasks);
    navigator.clipboard.writeText(msg);
    setWhatsAppSuccessNotice(`Copied WhatsApp message text for ${staffName}!`);
    setTimeout(() => setWhatsAppSuccessNotice(null), 2500);
  };

  const activeDepartmentObj = departments.find((d) => d.id === selectedDeptId);
  const activeStaffObj = staffList.find((s) => s.id === selectedPersonId);

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1480px', margin: '0 auto' }}>
      {/* Executive Command Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            >
              <img
                src={rathinamLogo}
                alt="Rathinam"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  ⚡ GM Priority Desk
                </span>
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--notion-text)', letterSpacing: '-0.03em' }}>
                Today's Deliverables &amp; Urgent to Close
              </h1>
            </div>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--notion-text-muted)', maxWidth: '780px' }}>
            Executive GM command center. Monitor critical deadlines, sign off on pending verification tickets, and review work allocations isolated by department and staff.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="notion-btn notion-btn-bordered"
              style={{ gap: '7px', fontSize: '12.5px', padding: '8px 14px', borderRadius: '9px' }}
              title="Refresh workspace status"
            >
              <RefreshCw size={14} />
              <span>Refresh Desk</span>
            </button>
          )}

          {onOpenCreateTask && (
            <button
              onClick={() => onOpenCreateTask(selectedDeptId !== 'ALL' ? selectedDeptId : undefined, true)}
              className="notion-btn notion-btn-primary"
              style={{ gap: '7px', fontSize: '12.5px', padding: '8px 16px', borderRadius: '9px', background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', border: 'none' }}
            >
              <Plus size={15} />
              <span>+ Add Urgent Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {/* Due Today */}
        <div
          onClick={() => setPriorityTab('DUE_TODAY')}
          style={{
            background: 'var(--notion-card)',
            border: priorityTab === 'DUE_TODAY' ? '2px solid #f59e0b' : '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: priorityTab === 'DUE_TODAY' ? '0 8px 20px rgba(245, 158, 11, 0.2)' : 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', fontWeight: 600 }}>Due Today</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {metrics.dueToday}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', marginTop: '4px', display: 'block' }}>
            Deadlines scheduled today
          </span>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setPriorityTab('DUE_TODAY')}
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', fontWeight: 600 }}>Overdue Tickets</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {metrics.overdue}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', marginTop: '4px', display: 'block' }}>
            Requires immediate escalation
          </span>
        </div>

        {/* Urgent to Close / Sign-off */}
        <div
          onClick={() => setPriorityTab('AWAITING_CLOSE')}
          style={{
            background: 'var(--notion-card)',
            border: priorityTab === 'AWAITING_CLOSE' ? '2px solid #10b981' : '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: priorityTab === 'AWAITING_CLOSE' ? '0 8px 20px rgba(16, 185, 129, 0.2)' : 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #10b981, #059669)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', fontWeight: 600 }}>Awaiting GM Sign-Off</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {metrics.awaitingClose}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', marginTop: '4px', display: 'block' }}>
            Staff submitted • Ready to close
          </span>
        </div>

        {/* Urgent Priority */}
        <div
          onClick={() => setPriorityTab('URGENT_PRIORITY')}
          style={{
            background: 'var(--notion-card)',
            border: priorityTab === 'URGENT_PRIORITY' ? '2px solid #e11d48' : '1px solid var(--notion-border)',
            borderRadius: '14px',
            padding: '18px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: priorityTab === 'URGENT_PRIORITY' ? '0 8px 20px rgba(225, 29, 72, 0.2)' : 'var(--notion-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #e11d48, #f43f5e)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', fontWeight: 600 }}>Urgent Priority</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(225, 29, 72, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} style={{ color: '#e11d48' }} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#e11d48', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {metrics.urgentPriority}
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--notion-text-dim)', marginTop: '4px', display: 'block' }}>
            Critical operational tickets
          </span>
        </div>
      </div>

      {/* WHATSAPP SUCCESS / COPIED NOTICE */}
      {whatsAppSuccessNotice && (
        <div
          className="notion-callout"
          style={{
            marginBottom: '20px',
            background: 'rgba(37, 211, 102, 0.12)',
            border: '1px solid rgba(37, 211, 102, 0.35)',
            color: 'var(--notion-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} color="#ffffff" />
            </div>
            <span>{whatsAppSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setWhatsAppSuccessNotice(null)}
            className="notion-btn notion-btn-ghost"
            style={{ padding: '2px 6px' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 🚨 WHATSAPP URGENT DISPATCH CENTER BY ASSIGNED USER */}
      <div
        style={{
          marginBottom: '28px',
          background: 'var(--notion-card)',
          border: '1.5px solid rgba(37, 211, 102, 0.35)',
          borderRadius: '16px',
          padding: '22px 24px',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.08)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                }}
              >
                <MessageCircle size={18} />
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                Urgent Deliverables by Assignee — WhatsApp Dispatch Center
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--notion-text-muted)' }}>
              Instant WhatsApp alert to assigned staff with their list of urgent, high-priority, and overdue deliverables.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#25D366',
                background: 'rgba(37, 211, 102, 0.1)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(37, 211, 102, 0.25)',
              }}
            >
              {urgentStaffGroups.length} Assignee{urgentStaffGroups.length === 1 ? '' : 's'} with Urgent Deliverables
            </span>

            {selectedDeptId !== 'ALL' && (
              <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                (Filtered by {activeDepartmentObj?.name || 'Department'})
              </span>
            )}
          </div>
        </div>

        {urgentStaffGroups.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              borderRadius: '12px',
              background: 'var(--notion-hover)',
              border: '1px dashed var(--notion-border)',
              color: 'var(--notion-text-muted)',
              fontSize: '13px',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>🎉</div>
            <div style={{ fontWeight: 600, color: 'var(--notion-text)' }}>All Urgent Deliverables Cleared!</div>
            <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)', marginTop: '4px' }}>
              No staff members currently have overdue or high-priority tickets pending action.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {urgentStaffGroups.map((group) => {
              const staffName = group.user.full_name || group.user.username;
              const hasPhone = Boolean(group.user.phone && formatWhatsAppPhone(group.user.phone));

              return (
                <div
                  key={group.user.id ? `staff-group-${group.user.id}` : `group-${group.user.username}`}
                  style={{
                    background: 'var(--notion-card)',
                    border: '1px solid var(--notion-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--notion-shadow-sm)',
                  }}
                >
                  <div>
                    {/* Header: User avatar, Name, Dept & Phone Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {staffName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {staffName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{group.user.department_name || 'Staff'}</span>
                            {group.user.email && (
                              <>
                                <span>•</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                                  {group.user.email}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phone pill */}
                      <div>
                        {hasPhone ? (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap',
                            }}
                            title={`Registered Phone: ${group.user.phone}`}
                          >
                            <Phone size={10} />
                            <span>{group.user.phone}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setWhatsAppModalTarget({ user: group.user, tasks: group.tasks });
                              setWhatsAppPhoneInput('');
                            }}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#f59e0b',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <AlertCircle size={10} />
                            <span>+ Add Phone</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metric Pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span className="notion-tag tag-red" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                        🚨 {group.tasks.length} Urgent Deliverable{group.tasks.length > 1 ? 's' : ''}
                      </span>
                      {group.overdueCount > 0 && (
                        <span className="notion-tag tag-orange" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          ⏰ {group.overdueCount} Overdue
                        </span>
                      )}
                      {group.awaitingCloseCount > 0 && (
                        <span className="notion-tag tag-yellow" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          ⏳ {group.awaitingCloseCount} Awaiting GM
                        </span>
                      )}
                    </div>

                    {/* Task Preview Items */}
                    <div
                      style={{
                        background: 'var(--notion-item-bg)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        marginBottom: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        maxHeight: '130px',
                        overflowY: 'auto',
                      }}
                    >
                      {group.tasks.slice(0, 3).map((t) => {
                        const tl = isDueTodayOrOverdue(t);
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '11.5px',
                              gap: '6px',
                            }}
                          >
                            <div
                              onClick={() => onSelectTask(t)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                minWidth: 0,
                                cursor: 'pointer',
                              }}
                              title="Click to view task details"
                            >
                              <span style={{ fontWeight: 700, color: 'var(--notion-text-dim)', flexShrink: 0 }}>#{t.id}</span>
                              <span style={{ fontWeight: 500, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              {tl?.isOverdue ? (
                                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>Overdue</span>
                              ) : t.due_date ? (
                                <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)' }}>{t.due_date}</span>
                              ) : null}

                              {/* Single task WhatsApp button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenWhatsAppForSingleTask(t);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#25D366',
                                  cursor: 'pointer',
                                  padding: '2px 4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                }}
                                title={`WhatsApp alert for Task #${t.id}`}
                              >
                                <MessageCircle size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {group.tasks.length > 3 && (
                        <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)', fontStyle: 'italic', textAlign: 'center', paddingTop: '2px' }}>
                          +{group.tasks.length - 3} more urgent items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--notion-border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppForStaff(group)}
                      className="notion-btn"
                      style={{
                        flex: 1,
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#25D366',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Open WhatsApp and send all ${group.tasks.length} urgent tasks to ${staffName}`}
                    >
                      <MessageCircle size={14} />
                      <span>{hasPhone ? 'Send on WhatsApp' : 'Enter Phone & Send'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppText(group)}
                      className="notion-btn notion-btn-bordered"
                      style={{
                        fontSize: '11.5px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Copy formatted WhatsApp alert text to clipboard"
                    >
                      <Copy size={13} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEPARTMENT TASK COUNT CARDS SHOWCASE ("each deport like court in the page if click the count mean show rhat") */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} style={{ color: '#2383e2' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--notion-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Department Task Allocations & Counts
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
              (Click any department card or count to isolate its deliverables and drill down into staff members)
            </span>
          </div>

          {selectedDeptId !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                setSelectedDeptId('ALL');
                setSelectedPersonId('ALL');
              }}
              className="notion-btn notion-btn-ghost"
              style={{ fontSize: '11px', color: '#2383e2', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={12} />
              <span>Show All Departments</span>
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '12px',
          }}
        >
          {/* "All Departments" Overview Card */}
          <div
            onClick={() => {
              setSelectedDeptId('ALL');
              setSelectedPersonId('ALL');
            }}
            style={{
              background: selectedDeptId === 'ALL' ? 'var(--notion-card)' : 'var(--notion-card)',
              border: selectedDeptId === 'ALL' ? '2px solid var(--notion-blue)' : '1px solid var(--notion-border)',
              borderRadius: '14px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: selectedDeptId === 'ALL' ? '0 8px 24px rgba(79, 70, 229, 0.18)' : 'var(--notion-shadow-sm)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🏢</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    All Departments
                  </span>
                </div>
                {selectedDeptId === 'ALL' && (
                  <span className="notion-tag tag-blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                    ✓ Active
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--notion-text)', lineHeight: 1 }}>
                  {totalActiveTasks}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>
                  Active Tasks
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '10.5px' }}>
              {metrics.urgentPriority > 0 && (
                <span className="notion-tag tag-red" style={{ fontSize: '10px', fontWeight: 700 }}>
                  🔴 {metrics.urgentPriority} Urgent
                </span>
              )}
              {metrics.dueToday > 0 && (
                <span className="notion-tag tag-yellow" style={{ fontSize: '10px', fontWeight: 700 }}>
                  ⚠️ {metrics.dueToday} Today
                </span>
              )}
              {metrics.awaitingClose > 0 && (
                <span className="notion-tag tag-green" style={{ fontSize: '10px', fontWeight: 700 }}>
                  ⏳ {metrics.awaitingClose} Sign-Off
                </span>
              )}
              <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                👥 {staffList.length} Staff
              </span>
            </div>
          </div>

          {/* Each Department Card */}
          {departmentStats.map((item) => {
            const isSelected = selectedDeptId === item.department.id;

            return (
              <div
                key={item.department.id}
                onClick={() => {
                  setSelectedDeptId(isSelected ? 'ALL' : item.department.id);
                  setSelectedPersonId('ALL');
                }}
                style={{
                  background: 'var(--notion-card)',
                  border: isSelected ? '2px solid var(--notion-blue)' : '1px solid var(--notion-border)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 8px 24px rgba(79, 70, 229, 0.18)' : 'var(--notion-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📁</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: isSelected ? 'var(--notion-blue)' : 'var(--notion-text)', lineHeight: 1.25 }}>
                        {item.department.name}
                      </span>
                    </div>
                    <span className="notion-tag tag-purple" style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                      {item.department.code}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                    <span
                      style={{
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        color: isSelected ? 'var(--notion-blue)' : 'var(--notion-text)',
                        lineHeight: 1,
                      }}
                    >
                      {item.totalActive}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>
                      Tasks
                    </span>
                    {isSelected && (
                      <span className="notion-tag tag-blue" style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700 }}>
                        ✓ Filtered
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', fontSize: '10.5px', marginTop: '6px' }}>
                  {item.urgentCount > 0 && (
                    <span className="notion-tag tag-red" style={{ fontSize: '10px', fontWeight: 700 }}>
                      🔴 {item.urgentCount} Urgent
                    </span>
                  )}
                  {item.dueTodayCount > 0 && (
                    <span className="notion-tag tag-yellow" style={{ fontSize: '10px', fontWeight: 700 }}>
                      ⚠️ {item.dueTodayCount} Today
                    </span>
                  )}
                  {item.awaitingCloseCount > 0 && (
                    <span className="notion-tag tag-green" style={{ fontSize: '10px', fontWeight: 700 }}>
                      ⏳ {item.awaitingCloseCount} Sign-Off
                    </span>
                  )}
                  <span className="notion-tag tag-gray" style={{ fontSize: '10px' }}>
                    👥 {item.staffCount} Staff
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAFF MEMBER ALLOCATION & SHARE BAR ("and filter the person to share that make that") */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: 'var(--notion-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={16} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--notion-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Filter by Staff Member (Assignee)
            </h3>
            {activeStaffObj && (
              <span className="notion-tag tag-green" style={{ fontSize: '11px', textTransform: 'none', fontWeight: 600 }}>
                Active: {activeStaffObj.full_name || activeStaffObj.username} ({activeStaffObj.department_name || activeDepartmentObj?.name || 'Staff'})
              </span>
            )}
            {activeDepartmentObj && (
              <span className="notion-tag tag-purple" style={{ fontSize: '11px', textTransform: 'none' }}>
                Showing {filteredStaffList.length} staff in {activeDepartmentObj.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* The Share Button */}
            <button
              type="button"
              onClick={() => {
                setShareCustomNote('');
                setShareSuccessNotice(null);
                setIsShareModalOpen(true);
              }}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '5px 12px',
                background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
              title="Share filtered tasks and priorities via Email digest, Push notification, or Clipboard summary"
            >
              <Share2 size={13} />
              <span>
                {activeStaffObj
                  ? `Share Tasks with ${activeStaffObj.full_name?.split(' ')[0] || activeStaffObj.username}`
                  : 'Share Filtered Tasks'}
              </span>
            </button>

            {selectedPersonId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedPersonId('ALL')}
                className="notion-btn notion-btn-ghost"
                style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={12} />
                <span>Show All Staff</span>
              </button>
            )}
          </div>
        </div>

        {/* Staff Members Visual Cards / Chips Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '14px', alignItems: 'center' }}>
          {/* Quick Dropdown select */}
          <div>
            <select
              className="notion-select"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
            >
              <option value="ALL">
                👥 — All Staff Members ({selectedDeptId === 'ALL' ? 'Across All Departments' : activeDepartmentObj?.name}) —
              </option>
              {filteredStaffList.map((staff) => {
                const staffTasks = tasks.filter((t) => t.assigned_to === staff.id && t.status !== 'CLOSED');
                const staffUrgentCount = staffTasks.filter((t) => {
                  const tl = isDueTodayOrOverdue(t);
                  return tl?.isToday || tl?.isOverdue || t.status === 'PENDING_GM_APPROVAL' || t.priority === 'URGENT';
                }).length;

                return (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name || staff.username} ({staff.role === 'DEPT_MANAGER' ? 'Manager' : staff.job_title || 'Staff'}) — {staffTasks.length} tasks {staffUrgentCount > 0 ? `(${staffUrgentCount} urgent)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quick Staff Cards / Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '110px', overflowY: 'auto', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setSelectedPersonId('ALL')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: selectedPersonId === 'ALL' ? '#10b981' : 'var(--notion-hover)',
                color: selectedPersonId === 'ALL' ? '#ffffff' : 'var(--notion-text)',
                border: selectedPersonId === 'ALL' ? '1px solid #10b981' : '1px solid var(--notion-border-subtle)',
                fontWeight: selectedPersonId === 'ALL' ? 600 : 400,
              }}
            >
              👥 All Staff
            </button>

            {filteredStaffList.map((staff) => {
              const staffTasks = tasks.filter((t) => t.assigned_to === staff.id && t.status !== 'CLOSED');
              const staffUrgentCount = staffTasks.filter((t) => {
                const tl = isDueTodayOrOverdue(t);
                return tl?.isToday || tl?.isOverdue || t.status === 'PENDING_GM_APPROVAL' || t.priority === 'URGENT';
              }).length;

              const isSelected = selectedPersonId === staff.id;

              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => setSelectedPersonId(isSelected ? 'ALL' : staff.id)}
                  className="notion-btn"
                  style={{
                    fontSize: '11px',
                    padding: '5px 11px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--notion-hover)',
                    color: isSelected ? '#10b981' : 'var(--notion-text)',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid var(--notion-border-subtle)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isSelected ? '#10b981' : '#3373ba',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {(staff.full_name || staff.username).charAt(0).toUpperCase()}
                  </span>
                  <span>{staff.full_name || staff.username}</span>
                  <span
                    style={{
                      background: isSelected ? '#10b981' : 'var(--notion-border)',
                      color: isSelected ? '#fff' : 'var(--notion-text-dim)',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    {staffTasks.length}
                  </span>
                  {staffUrgentCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '1px 5px',
                        fontSize: '9px',
                        fontWeight: 700,
                      }}
                      title={`${staffUrgentCount} urgent tasks`}
                    >
                      {staffUrgentCount} urgent
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

            {/* STEP 3: PRIORITY TABS & LIVE SEARCH */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--notion-hover)', padding: '3px 6px', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setPriorityTab('ALL')}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '4px',
              background: priorityTab === 'ALL' ? 'var(--notion-card)' : 'transparent',
              color: priorityTab === 'ALL' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
              fontWeight: priorityTab === 'ALL' ? 600 : 400,
              boxShadow: priorityTab === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              gap: '6px',
            }}
          >
            <span>🔥</span>
            <span>All Executive Priorities ({displayedTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityTab('DUE_TODAY')}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '4px',
              background: priorityTab === 'DUE_TODAY' ? 'var(--notion-card)' : 'transparent',
              color: priorityTab === 'DUE_TODAY' ? '#f59e0b' : 'var(--notion-text-muted)',
              fontWeight: priorityTab === 'DUE_TODAY' ? 600 : 400,
              boxShadow: priorityTab === 'DUE_TODAY' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              gap: '6px',
            }}
          >
            <span>📅</span>
            <span>Due Today & Overdue</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityTab('AWAITING_CLOSE')}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '4px',
              background: priorityTab === 'AWAITING_CLOSE' ? 'var(--notion-card)' : 'transparent',
              color: priorityTab === 'AWAITING_CLOSE' ? '#10b981' : 'var(--notion-text-muted)',
              fontWeight: priorityTab === 'AWAITING_CLOSE' ? 600 : 400,
              boxShadow: priorityTab === 'AWAITING_CLOSE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              gap: '6px',
            }}
          >
            <span>⏳</span>
            <span>Urgent to Close (Awaiting GM)</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityTab('URGENT_PRIORITY')}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '5px 12px',
              borderRadius: '4px',
              background: priorityTab === 'URGENT_PRIORITY' ? 'var(--notion-card)' : 'transparent',
              color: priorityTab === 'URGENT_PRIORITY' ? '#e11d48' : 'var(--notion-text-muted)',
              fontWeight: priorityTab === 'URGENT_PRIORITY' ? 600 : 400,
              boxShadow: priorityTab === 'URGENT_PRIORITY' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              gap: '6px',
            }}
          >
            <span>🔴</span>
            <span>Urgent Priority</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View Layout Switcher: Cards vs Table Matrix */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--notion-hover)',
              padding: '2px',
              borderRadius: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: viewLayout === 'cards' ? 'var(--notion-card)' : 'transparent',
                color: viewLayout === 'cards' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: viewLayout === 'cards' ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Cards Grid View"
            >
              <LayoutGrid size={12} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className="notion-btn"
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: viewLayout === 'table' ? 'var(--notion-card)' : 'transparent',
                color: viewLayout === 'table' ? '#10b981' : 'var(--notion-text-muted)',
                fontWeight: viewLayout === 'table' ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Staff Status Matrix Table"
            >
              <TableIcon size={12} />
              <span>Staff Table</span>
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--notion-text-dim)' }} />
            <input
              type="text"
              placeholder="Search urgent tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notion-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
            />
          </div>
        </div>
      </div>

      {/* TASK CARDS GRID */}
      {displayedTasks.length === 0 ? (
        <div
          className="notion-callout"
          style={{
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '8px',
          }}
        >
          <CheckCircle2 size={36} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 0', color: 'var(--notion-text)' }}>
            No Pending Urgent Tasks for Selected Filter
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--notion-text-muted)', margin: 0, maxWidth: '440px' }}>
            All deliverables in {activeDepartmentObj ? activeDepartmentObj.name : 'all departments'}{' '}
            {activeStaffObj ? `for ${activeStaffObj.full_name}` : ''} are either up to date or cleared.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => {
                setSelectedDeptId('ALL');
                setSelectedPersonId('ALL');
                setPriorityTab('ALL');
                setSearchQuery('');
              }}
              className="notion-btn notion-btn-bordered"
              style={{ fontSize: '12px' }}
            >
              Reset All Filters
            </button>
            {onOpenCreateTask && (
              <button
                onClick={() => onOpenCreateTask(selectedDeptId !== 'ALL' ? selectedDeptId : undefined)}
                className="notion-btn notion-btn-primary"
                style={{ fontSize: '12px', gap: '5px' }}
              >
                <Plus size={13} />
                <span>Assign New Task</span>
              </button>
            )}
          </div>
        </div>
      ) : viewLayout === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {displayedTasks.map((task) => {
            const timeline = isDueTodayOrOverdue(task);
            const isAwaitingGmApproval = task.status === 'PENDING_GM_APPROVAL';
            const isUrgent = task.priority === 'URGENT';
            const isIssue = task.title.toUpperCase().includes('[ISSUE]');

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="notion-card"
                style={{
                  borderRadius: '16px',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'var(--notion-card)',
                  border: isAwaitingGmApproval
                    ? '2px solid rgba(16, 185, 129, 0.6)'
                    : isUrgent
                    ? '2px solid rgba(239, 68, 68, 0.55)'
                    : '1px solid var(--notion-border)',
                  boxShadow: isAwaitingGmApproval
                    ? '0 8px 24px rgba(16, 185, 129, 0.15)'
                    : isUrgent
                    ? '0 8px 24px rgba(239, 68, 68, 0.15)'
                    : 'var(--notion-shadow-sm)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--notion-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = isAwaitingGmApproval
                    ? '0 8px 24px rgba(16, 185, 129, 0.15)'
                    : isUrgent
                    ? '0 8px 24px rgba(239, 68, 68, 0.15)'
                    : 'var(--notion-shadow-sm)';
                }}
              >
                <div>
                  {/* Top Header Badge Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="notion-tag tag-purple" style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        {task.department_code}
                      </span>
                      {isAwaitingGmApproval && (
                        <span className="notion-tag tag-yellow" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          ⏳ Awaiting GM Close
                        </span>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <span className="notion-tag tag-blue" style={{ fontSize: '10.5px', fontWeight: 600 }}>
                          ⚡ In Progress
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {task.attachment_image && (
                        <span className="notion-tag tag-blue" style={{ fontSize: '10.5px', padding: '1px 6px' }}>
                          🖼️ Image
                        </span>
                      )}
                      {task.priority === 'URGENT' && (
                        <span className="notion-tag tag-red" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                          🔴 URGENT
                        </span>
                      )}
                      {task.priority === 'HIGH' && (
                        <span className="notion-tag tag-orange" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                          🟠 HIGH
                        </span>
                      )}
                      {task.priority === 'MEDIUM' && (
                        <span className="notion-tag tag-blue" style={{ fontSize: '10.5px' }}>
                          🔵 Medium
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Title */}
                  <h3
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 700,
                      margin: '0 0 8px',
                      color: 'var(--notion-text)',
                      lineHeight: 1.4,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <span>{isIssue ? '🚨' : '📄'}</span>
                    <span>{task.title}</span>
                  </h3>

                  {/* Description preview */}
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--notion-text-muted)',
                      margin: '0 0 14px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {task.description || 'No description provided.'}
                  </p>

                  {/* GM Feedback if changes were requested */}
                  {task.gm_feedback_notes && task.status === 'CHANGES_REQUESTED' && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        fontSize: '11.5px',
                        color: 'var(--tag-red-text)',
                        marginBottom: '12px',
                      }}
                    >
                      GM Notes: "{task.gm_feedback_notes}"
                    </div>
                  )}

                  {/* Assignee & Timeline Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      color: 'var(--notion-text-dim)',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--notion-item-bg)',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)',
                          color: '#fff',
                          fontSize: '10.5px',
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

                    {timeline && (
                      <span className={`notion-tag ${timeline.tagClass}`} style={{ fontSize: '10.5px', padding: '2px 7px', fontWeight: 700 }}>
                        {timeline.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  style={{
                    borderTop: '1px solid var(--notion-border-subtle)',
                    paddingTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {task.assigned_to && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPushModalTask(task);
                          setPushMessageText(`Hi ${task.assigned_to_name}, urgent update needed on '${task.title}'.`);
                        }}
                        className="notion-btn"
                        style={{ fontSize: '11px', padding: '4px 9px', gap: '5px', color: 'var(--notion-blue)', background: 'rgba(79, 70, 229, 0.08)', borderRadius: '7px' }}
                        title={`Push direct message to ${task.assigned_to_name}`}
                      >
                        <Send size={11} />
                        <span>Ping Staff</span>
                      </button>
                    )}
                    {task.assigned_to && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenWhatsAppForSingleTask(task);
                        }}
                        className="notion-btn"
                        style={{
                          fontSize: '11px',
                          padding: '4px 9px',
                          gap: '5px',
                          color: '#25D366',
                          background: 'rgba(37, 211, 102, 0.08)',
                          border: '1px solid rgba(37, 211, 102, 0.25)',
                          borderRadius: '7px',
                        }}
                        title={`Send direct WhatsApp alert to ${task.assigned_to_name}`}
                      >
                        <MessageCircle size={11} />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Exclusive GM Verify & Close Action */}
                    {isAwaitingGmApproval && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickApprove(task);
                        }}
                        className="notion-btn notion-btn-success"
                        style={{
                          fontSize: '11.5px',
                          padding: '5px 12px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                        }}
                        title="Executive sign-off: Approve & close task officially"
                      >
                        <CheckCircle size={13} />
                        <span>Verify &amp; Close</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="notion-btn notion-btn-bordered"
                      style={{ fontSize: '11.5px', padding: '4px 9px', gap: '4px', borderRadius: '7px' }}
                      title="View task details and attachments"
                    >
                      <span>Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TODAY & URGENT STAFF STATUS MATRIX TABLE */
        <div
          style={{
            background: 'var(--notion-card)',
            border: '1px solid var(--notion-border)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'var(--notion-shadow)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--notion-item-bg)',
                    borderBottom: '2px solid var(--notion-border)',
                    color: 'var(--notion-text-dim)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '25%' }}>👤 Staff Member</th>
                  <th style={{ padding: '12px 16px', width: '25%' }}>⚪ Open Tasks (To Do)</th>
                  <th style={{ padding: '12px 16px', width: '25%' }}>🔵 In Process ("in preces")</th>
                  <th style={{ padding: '12px 16px', width: '15%' }}>🟢 Completed ("comple t")</th>
                  <th style={{ padding: '12px 16px', width: '10%', textAlign: 'center' }}>📊 Active Tasks</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffList.map((staff) => {
                  const staffTasks = displayedTasks.filter((t) => t.assigned_to === staff.id);
                  const allStaffTasks = tasks.filter((t) => t.assigned_to === staff.id);
                  const openTasks = staffTasks.filter((t) => t.status === 'TODO' || t.status === 'CHANGES_REQUESTED');
                  const inProcessTasks = staffTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'PENDING_GM_APPROVAL');
                  const completedTasks = allStaffTasks.filter((t) => t.status === 'CLOSED');

                  if (staffTasks.length === 0 && selectedPersonId !== 'ALL') return null;

                  return (
                    <tr
                      key={staff.id}
                      style={{
                        borderBottom: '1px solid var(--notion-border-subtle)',
                        verticalAlign: 'top',
                        background: selectedPersonId === staff.id ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = selectedPersonId === staff.id ? 'rgba(16, 185, 129, 0.05)' : 'transparent')}
                    >
                      {/* Staff Info */}
                      <td style={{ padding: '12px 16px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(staff.full_name || staff.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--notion-text)', fontSize: '13px' }}>
                              {staff.full_name || staff.username}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--notion-text-muted)' }}>
                              {staff.email}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span className="notion-tag tag-purple" style={{ fontSize: '9px', display: 'inline-block' }}>
                                {staff.department_name || activeDepartmentObj?.name || 'Staff'}
                              </span>
                              {staffTasks.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenWhatsAppForStaff({ user: staff, tasks: staffTasks });
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'rgba(37, 211, 102, 0.12)',
                                    color: '#25D366',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title={`Share task list to ${staff.full_name || staff.username} via WhatsApp`}
                                >
                                  <MessageCircle size={10} />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Open Tasks */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="notion-tag tag-gray" style={{ fontSize: '10px', fontWeight: 700 }}>
                            ⚪ {openTasks.length} Open
                          </span>
                        </div>
                        {openTasks.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>— No open tasks</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {openTasks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTask(t)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--notion-item-bg)',
                                  border: '1px solid var(--notion-border-subtle)',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                                title={`Click to inspect task #${t.id}`}
                              >
                                #{t.id}: {t.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* In Process Tasks */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="notion-tag tag-blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                            🔵 {inProcessTasks.length} In Process
                          </span>
                        </div>
                        {inProcessTasks.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>— No active work</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {inProcessTasks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTask(t)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '4px',
                                  background: t.status === 'PENDING_GM_APPROVAL' ? 'rgba(234, 179, 8, 0.08)' : 'rgba(2, 132, 199, 0.06)',
                                  border: t.status === 'PENDING_GM_APPROVAL' ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(2, 132, 199, 0.25)',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                                title={`Click to inspect task #${t.id}`}
                              >
                                #{t.id}: {t.title} {t.status === 'PENDING_GM_APPROVAL' && '⏳ (Review)'}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Completed Tasks */}
                      <td style={{ padding: '12px 14px', borderRight: '1px solid var(--notion-border-subtle)' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span className="notion-tag tag-green" style={{ fontSize: '10px', fontWeight: 700 }}>
                            🟢 {completedTasks.length} Completed
                          </span>
                        </div>
                        {completedTasks.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>— None closed</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {completedTasks.slice(0, 3).map((t) => (
                              <div
                                key={t.id}
                                onClick={() => onSelectTask(t)}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.06)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  textDecoration: 'line-through',
                                }}
                                title={`Click to inspect closed task #${t.id}`}
                              >
                                #{t.id}: {t.title}
                              </div>
                            ))}
                            {completedTasks.length > 3 && (
                              <span style={{ fontSize: '10px', color: '#10b981' }}>+{completedTasks.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--notion-text)' }}>
                          {staffTasks.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Push Direct Message Modal */}
      {pushModalTask && (
        <div
          className="notion-modal-overlay"
          onClick={() => setPushModalTask(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Send size={15} style={{ color: '#0284c7' }} />
                <span>Executive Ping to {pushModalTask.assigned_to_name}</span>
              </div>
              <button onClick={() => setPushModalTask(null)} className="notion-btn notion-btn-ghost" style={{ padding: '2px 6px' }}>
                <X size={15} />
              </button>
            </div>

            {pushSuccess && (
              <div className="notion-callout" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '12px', fontSize: '12px' }}>
                <CheckCircle2 size={14} />
                <span>{pushSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendPushMessage}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--notion-text-dim)', marginBottom: '4px' }}>
                  Message for {pushModalTask.assigned_to_name} regarding '{pushModalTask.title}'
                </label>
                <textarea
                  className="notion-textarea"
                  rows={3}
                  required
                  value={pushMessageText}
                  onChange={(e) => setPushMessageText(e.target.value)}
                  placeholder="Write message... (Sent to staff inbox & in-app alerts)"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setPushModalTask(null)} className="notion-btn notion-btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingPush || !pushMessageText.trim()}
                  className="notion-btn notion-btn-primary"
                  style={{ background: '#0284c7' }}
                >
                  {sendingPush ? 'Sending...' : 'Send Executive Ping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Share Tasks Modal ("filter the person to share that make that") */}
      {isShareModalOpen && (
        <div className="notion-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%' }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--notion-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} style={{ color: '#2383e2' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--notion-text)' }}>
                  Share Tasks & Daily Priorities
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="notion-btn"
                style={{ padding: '3px 6px', color: 'var(--notion-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '78vh' }}>
              {/* Target info card */}
              <div
                style={{
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border-subtle)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Target Audience / Recipient
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--notion-text)', marginTop: '2px' }}>
                    {activeStaffObj ? (
                      <span>👤 {activeStaffObj.full_name || activeStaffObj.username} &lt;{activeStaffObj.email || 'No email'}&gt;</span>
                    ) : activeDepartmentObj ? (
                      <span>🏢 Department: {activeDepartmentObj.name} ({activeDepartmentObj.code})</span>
                    ) : (
                      <span>🏢 All Departments ({displayedTasks.length} tasks)</span>
                    )}
                  </div>
                </div>
                <span className="notion-tag tag-blue" style={{ fontSize: '11px', fontWeight: 600 }}>
                  {displayedTasks.length} Tasks Included
                </span>
              </div>

              {/* Tasks preview list */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '8px' }}>
                  Deliverables Preview ({displayedTasks.length}):
                </div>
                <div
                  style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--notion-border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    background: 'var(--notion-card)',
                  }}
                >
                  {displayedTasks.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)', padding: '8px' }}>
                      No tasks found for current filter.
                    </div>
                  ) : (
                    displayedTasks.map((t, idx) => (
                      <div
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 0',
                          borderBottom: idx < displayedTasks.length - 1 ? '1px solid var(--notion-border-subtle)' : 'none',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: 'var(--notion-text-dim)' }}>#{t.id}</span>
                          <span style={{ fontWeight: 500, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {t.priority === 'URGENT' && <span className="notion-tag tag-red" style={{ fontSize: '10px' }}>URGENT</span>}
                          {t.priority === 'HIGH' && <span className="notion-tag tag-orange" style={{ fontSize: '10px' }}>HIGH</span>}
                          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                            {t.due_date || 'No deadline'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Custom message / note from GM */}
              {activeStaffObj && (
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text-dim)', marginBottom: '6px' }}>
                    Optional Custom Executive Note:
                  </label>
                  <textarea
                    className="notion-textarea"
                    placeholder={`Hi ${activeStaffObj.full_name?.split(' ')[0] || activeStaffObj.username}, please prioritize these tasks today and reach out if you need assistance...`}
                    value={shareCustomNote}
                    onChange={(e) => setShareCustomNote(e.target.value)}
                    rows={3}
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>
              )}

              {shareSuccessNotice && (
                <div
                  className="notion-callout"
                  style={{
                    marginBottom: '16px',
                    background: 'rgba(52, 199, 89, 0.12)',
                    border: '1px solid rgba(52, 199, 89, 0.3)',
                    color: 'var(--notion-text)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: '#34c759' }} />
                  <span>{shareSuccessNotice}</span>
                </div>
              )}

              {/* Share action buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--notion-border-subtle)' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    {copiedSummary ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    <span>{copiedSummary ? 'Copied Summary!' : 'Copy Summary (WhatsApp/Text)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    {copiedLink ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Filter Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeStaffObj) {
                        const staffTasks = displayedTasks.filter((t) => t.assigned_to === activeStaffObj.id);
                        handleOpenWhatsAppForStaff({
                          user: activeStaffObj,
                          tasks: staffTasks.length > 0 ? staffTasks : displayedTasks,
                        });
                      } else {
                        const summary = generateShareSummaryText();
                        openWhatsApp('', summary);
                      }
                    }}
                    className="notion-btn"
                    style={{
                      fontSize: '12px',
                      background: '#25D366',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>
                      {activeStaffObj
                        ? `WhatsApp ${activeStaffObj.full_name?.split(' ')[0] || activeStaffObj.username}`
                        : 'Share on WhatsApp'}
                    </span>
                  </button>
                </div>

                {activeStaffObj && (
                  <button
                    type="button"
                    onClick={handleDispatchShareEmail}
                    disabled={sendingShare || displayedTasks.length === 0}
                    className="notion-btn notion-btn-primary"
                    style={{
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={13} />
                    <span>{sendingShare ? 'Dispatching...' : `Dispatch to ${activeStaffObj.full_name?.split(' ')[0] || activeStaffObj.username}`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Phone Number Configuration & Dispatch Modal */}
      {whatsAppModalTarget && (
        <div
          className="notion-modal-overlay"
          onClick={() => setWhatsAppModalTarget(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', padding: '24px', borderRadius: '16px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--notion-text)' }}>
                    Share via WhatsApp
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
                    Recipient: {whatsAppModalTarget.user.full_name || whatsAppModalTarget.user.username}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsAppModalTarget(null)}
                className="notion-btn notion-btn-ghost"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content summary */}
            <div
              style={{
                background: 'var(--notion-item-bg)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid var(--notion-border-subtle)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '4px' }}>
                📋 {whatsAppModalTarget.tasks.length} Deliverable{whatsAppModalTarget.tasks.length > 1 ? 's' : ''} to Dispatch:
              </div>
              <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {whatsAppModalTarget.tasks.map((t) => (
                  <div key={t.id} style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--notion-text)' }}>#{t.id}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    <span className={t.priority === 'URGENT' ? 'notion-tag tag-red' : 'notion-tag tag-orange'} style={{ fontSize: '9px', padding: '1px 4px' }}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone Input Field */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '6px' }}>
                Enter WhatsApp Number:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: 'var(--notion-hover)',
                    border: '1px solid var(--notion-border)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--notion-text)',
                  }}
                >
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  className="notion-input"
                  placeholder="e.g. 9876543210 (10 digits)"
                  value={whatsAppPhoneInput}
                  onChange={(e) => setWhatsAppPhoneInput(e.target.value)}
                  style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  autoFocus
                />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '4px', display: 'block' }}>
                This phone number will be automatically saved to {whatsAppModalTarget.user.full_name || whatsAppModalTarget.user.username}'s profile for future one-click WhatsApp dispatch.
              </span>
            </div>

            {/* Modal Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setWhatsAppModalTarget(null)}
                className="notion-btn notion-btn-ghost"
                style={{ fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWhatsAppSend}
                disabled={savingWhatsAppPhone || !whatsAppPhoneInput.trim()}
                className="notion-btn"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                }}
              >
                <MessageCircle size={14} />
                <span>{savingWhatsAppPhone ? 'Saving & Opening...' : 'Open WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
