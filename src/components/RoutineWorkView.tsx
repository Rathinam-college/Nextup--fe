import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Department, Priority, RoutineFrequency, RoutineWorkItem, RoutineWorkLog } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  ListChecks,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Filter,
  Building,
  User as UserIcon,
  Calendar,
  Clock,
  Printer,
  RotateCcw,
  AlertTriangle,
  Flame,
  Check,
  X,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

interface RoutineWorkViewProps {
  currentUser: User;
  departments: Department[];
  staffList?: User[];
  selectedDeptId?: number | 'ALL';
  onSelectDept?: (deptId: number | 'ALL') => void;
  onOpenCreateTask?: (prefill?: { title?: string; description?: string; department?: number; priority?: Priority }) => void;
}

const LOCAL_STORAGE_BACKUP_KEY = 'nextup_routine_items_cache';
const LOCAL_STORAGE_LOGS_KEY = 'nextup_routine_logs_cache';

// Helper to calculate period identifiers
const getPeriodIdentifier = (frequency: RoutineFrequency): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  switch (frequency) {
    case 'DAILY':
      return `${year}-${month}-${day}`;
    case 'WEEKLY': {
      const tempDate = new Date(now.getTime());
      tempDate.setHours(0, 0, 0, 0);
      tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
      const week1 = new Date(tempDate.getFullYear(), 0, 4);
      const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    }
    case 'MONTHLY':
      return `${year}-${month}`;
    case 'YEARLY':
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

export const RoutineWorkView: React.FC<RoutineWorkViewProps> = ({
  currentUser,
  departments,
  staffList,
  selectedDeptId: selectedDeptIdProp,
  onSelectDept: onSelectDeptProp,
  onOpenCreateTask,
}) => {
  const { isTamil } = useLanguage();

  // Active frequency tab: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL'
  const [activeFrequency, setActiveFrequency] = useState<string>('DAILY');

  // Department Filter with internal / external synchronization
  const [internalDeptFilter, setInternalDeptFilter] = useState<number | 'ALL'>(selectedDeptIdProp || 'ALL');
  const activeDeptFilter = selectedDeptIdProp !== undefined ? selectedDeptIdProp : internalDeptFilter;

  const handleSelectDept = (deptId: number | 'ALL') => {
    setInternalDeptFilter(deptId);
    if (onSelectDeptProp) {
      onSelectDeptProp(deptId);
    }
  };

  useEffect(() => {
    if (selectedDeptIdProp !== undefined) {
      setInternalDeptFilter(selectedDeptIdProp);
    }
  }, [selectedDeptIdProp]);

  // Filters
  const [staffFilter, setStaffFilter] = useState<number | 'ALL'>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Items and logs loaded pure from DB
  const [items, setItems] = useState<RoutineWorkItem[]>([]);
  const [logs, setLogs] = useState<RoutineWorkLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Load from DB tables via API
  const loadRoutineData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorNotice(null);

    try {
      const [fetchedItems, fetchedLogs] = await Promise.all([
        api.getRoutineItems().catch(() => null),
        api.getRoutineLogs().catch(() => null),
      ]);

      if (fetchedItems && Array.isArray(fetchedItems)) {
        setItems(fetchedItems);
        try {
          localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(fetchedItems));
        } catch {}
      } else {
        // Fallback to cache if server is offline
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
          if (cached) setItems(JSON.parse(cached));
        } catch {}
      }

      if (fetchedLogs && Array.isArray(fetchedLogs)) {
        setLogs(fetchedLogs);
        try {
          localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(fetchedLogs));
        } catch {}
      } else {
        try {
          const cachedLogs = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
          if (cachedLogs) setLogs(JSON.parse(cachedLogs));
        } catch {}
      }
    } catch (err: any) {
      console.warn('Routine API call:', err);
      // Read local cache if network/API temporarily unavailable
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        if (cached) setItems(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoutineData();
  }, [loadRoutineData]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineWorkItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFrequency, setFormFrequency] = useState<RoutineFrequency>('DAILY');
  const [formDept, setFormDept] = useState<number | ''>('');
  const [formAssignee, setFormAssignee] = useState<number | ''>('');
  const [formPriority, setFormPriority] = useState<Priority>('MEDIUM');
  const [formTargetTime, setFormTargetTime] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Expandable SOP accordion state
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string | number) => {
    setExpandedItems((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  // Helper to check if an item is completed for its current cycle
  const isItemCompletedCurrentCycle = (item: RoutineWorkItem): { completed: boolean; log?: RoutineWorkLog } => {
    const period = getPeriodIdentifier(item.frequency);
    const foundLog = logs.find((l) => String(l.item_id || (l as any).item) === String(item.id) && l.period_identifier === period);
    if (foundLog) {
      return { completed: true, log: foundLog };
    }
    if (item.last_completed_at && item.last_completed_at.startsWith(period)) {
      return { completed: true };
    }
    return { completed: false };
  };

  // Toggle completion -> Save in DB table
  const handleToggleComplete = async (item: RoutineWorkItem) => {
    const period = getPeriodIdentifier(item.frequency);
    const { completed } = isItemCompletedCurrentCycle(item);

    // Optimistic UI update
    if (completed) {
      setLogs((prev) => prev.filter((l) => !(String(l.item_id || (l as any).item) === String(item.id) && l.period_identifier === period)));
      setItems((prev) =>
        prev.map((i) => {
          if (String(i.id) === String(item.id)) {
            return { ...i, last_completed_at: null, last_completed_by: null, last_completed_by_name: undefined };
          }
          return i;
        })
      );
    } else {
      const nowIso = new Date().toISOString();
      const newLog: RoutineWorkLog = {
        id: `log_${Date.now()}`,
        item_id: item.id,
        completed_by: currentUser.id,
        completed_by_name: currentUser.full_name || currentUser.username,
        completed_at: nowIso,
        period_identifier: period,
      };
      setLogs((prev) => [newLog, ...prev]);
      setItems((prev) =>
        prev.map((i) => {
          if (String(i.id) === String(item.id)) {
            return {
              ...i,
              last_completed_at: nowIso,
              last_completed_by: currentUser.id,
              last_completed_by_name: currentUser.full_name || currentUser.username,
            };
          }
          return i;
        })
      );
    }

    // Call API to persist in database table
    try {
      await api.toggleCompleteRoutineItem(item.id, period);
    } catch (err: any) {
      console.warn('Persist completion to DB failed, updating local store:', err);
      // Persist in local storage
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(items));
        localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
      } catch {}
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = (freq: RoutineFrequency = 'DAILY') => {
    setEditingItem(null);
    setFormTitle('');
    setFormDesc('');
    setFormFrequency(freq);
    const chosenDept = activeDeptFilter !== 'ALL'
      ? Number(activeDeptFilter)
      : (currentUser.department || (departments[0]?.id ?? ''));
    setFormDept(chosenDept);

    // Only assign currentUser if currentUser belongs to chosenDept, else pick first staff of that department or leave empty
    const deptStaff = staffList?.filter((s) => chosenDept && Number(s.department) === Number(chosenDept));
    const isUserInDept = currentUser.department && Number(currentUser.department) === Number(chosenDept);
    if (isUserInDept) {
      setFormAssignee(currentUser.id);
    } else if (deptStaff && deptStaff.length > 0) {
      setFormAssignee(deptStaff[0].id);
    } else {
      setFormAssignee('');
    }

    setFormPriority('MEDIUM');
    setFormTargetTime(
      freq === 'DAILY'
        ? '09:00 AM'
        : freq === 'WEEKLY'
        ? 'Every Monday'
        : freq === 'MONTHLY'
        ? '1st of month'
        : 'January'
    );
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: RoutineWorkItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDesc(item.description || '');
    setFormFrequency(item.frequency);
    setFormDept(item.department || '');
    setFormAssignee(item.assigned_to || '');
    setFormPriority(item.priority || 'MEDIUM');
    setFormTargetTime(item.target_time || '');
    setIsModalOpen(true);
  };

  // Save Modal -> Save in DB table
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSavingItem(true);
    const deptObj = departments.find((d) => d.id === Number(formDept));
    const staffObj = staffList?.find((s) => s.id === Number(formAssignee));

    const payload: Partial<RoutineWorkItem> = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      frequency: formFrequency,
      department: formDept ? Number(formDept) : null,
      assigned_to: formAssignee ? Number(formAssignee) : null,
      priority: formPriority,
      target_time: formTargetTime.trim(),
      is_active: true,
    };

    try {
      if (editingItem) {
        // Update in DB
        const updated = await api.updateRoutineItem(editingItem.id, payload).catch(() => null);
        const savedItem: RoutineWorkItem = updated || {
          ...editingItem,
          ...payload,
          department_name: deptObj?.name || editingItem.department_name,
          department_code: deptObj?.code || editingItem.department_code,
          assigned_to_name: staffObj?.full_name || editingItem.assigned_to_name,
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => prev.map((i) => (String(i.id) === String(editingItem.id) ? savedItem : i)));
      } else {
        // Create in DB
        const created = await api.createRoutineItem(payload).catch(() => null);
        const newItem: RoutineWorkItem = created || {
          id: `routine_${Date.now()}`,
          title: formTitle.trim(),
          description: formDesc.trim(),
          frequency: formFrequency,
          department: formDept ? Number(formDept) : null,
          department_name: deptObj?.name,
          department_code: deptObj?.code,
          assigned_to: formAssignee ? Number(formAssignee) : null,
          assigned_to_name: staffObj?.full_name,
          created_by: currentUser.id,
          created_by_name: currentUser.full_name || currentUser.username,
          priority: formPriority,
          target_time: formTargetTime.trim(),
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setItems((prev) => [newItem, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save routine checklist item: ${err.message}`);
    } finally {
      setSavingItem(false);
    }
  };

  // Delete item from DB
  const handleDeleteItem = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this routine checklist item from the database?')) {
      return;
    }

    // Optimistic removal
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
    setLogs((prev) => prev.filter((l) => String(l.item_id || (l as any).item) !== String(id)));

    try {
      await api.deleteRoutineItem(id);
    } catch (err: any) {
      console.warn('Delete in DB failed, updated locally:', err);
    }
  };

  // Log Issue as Task
  const handleLogIssueAsTask = (item: RoutineWorkItem) => {
    if (onOpenCreateTask) {
      onOpenCreateTask({
        title: `[Routine Defect]: ${item.title}`,
        description: `⚠️ Anomaly / Defect spotted during routine checklist check (${item.frequency.toLowerCase()} cycle):\n\nSOP Procedure: ${item.description}\nSchedule: ${item.target_time}\nReported by: ${currentUser.full_name || currentUser.username} on ${new Date().toLocaleDateString()}\n\nDefect Observations:\n`,
        department: item.department || undefined,
        priority: 'HIGH',
      });
    } else {
      alert(`To log this issue as a task, please click '+ New Task' at the top and reference: ${item.title}`);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Helper to check department matching
  const isItemInDept = useCallback((item: RoutineWorkItem, deptId: number | 'ALL', deptName?: string): boolean => {
    if (deptId === 'ALL') return true;
    if (item.department != null) {
      if (Number(item.department) === Number(deptId) || String(item.department) === String(deptId)) {
        return true;
      }
    }
    if (deptName && item.department_name) {
      if (item.department_name.trim().toLowerCase() === deptName.trim().toLowerCase()) {
        return true;
      }
    }
    return false;
  }, []);

  // Unified list of all departments from departments prop and items
  const allDepartmentOptions = useMemo(() => {
    const map = new Map<string, { id: number; name: string; code?: string }>();
    if (departments && departments.length > 0) {
      departments.forEach((d) => {
        map.set(String(d.id), { id: d.id, name: d.name, code: d.code });
      });
    }
    items.forEach((item) => {
      if (item.department && !map.has(String(item.department))) {
        map.set(String(item.department), {
          id: Number(item.department),
          name: item.department_name || `Dept #${item.department}`,
          code: item.department_code,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, items]);

  const selectedDeptObj = useMemo(() => {
    if (activeDeptFilter === 'ALL') return null;
    return allDepartmentOptions.find((d) => String(d.id) === String(activeDeptFilter)) || null;
  }, [allDepartmentOptions, activeDeptFilter]);

  // Department-wise live stats
  const deptStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; completed: number; percent: number }>();
    allDepartmentOptions.forEach((d) => {
      const deptItems = items.filter((i) => isItemInDept(i, d.id, d.name));
      const done = deptItems.filter((i) => isItemCompletedCurrentCycle(i).completed).length;
      const pct = deptItems.length > 0 ? Math.round((done / deptItems.length) * 100) : 0;
      statsMap.set(String(d.id), { total: deptItems.length, completed: done, percent: pct });
    });
    return statsMap;
  }, [allDepartmentOptions, items, logs, isItemInDept]);

  const selectedDeptStats = useMemo(() => {
    if (!selectedDeptObj) return { total: items.length, completed: 0, percent: 0 };
    return deptStats.get(String(selectedDeptObj.id)) || { total: 0, completed: 0, percent: 0 };
  }, [selectedDeptObj, deptStats, items.length]);

  // Staff list for the modal, strictly filtered by the selected department (formDept)
  const modalAvailableStaff = useMemo(() => {
    if (!staffList || staffList.length === 0) return [];
    if (!formDept) return staffList;

    const currentDeptObj = departments.find((d) => Number(d.id) === Number(formDept));

    return staffList.filter((s) => {
      // 1. Direct ID match
      if (s.department != null && Number(s.department) === Number(formDept)) {
        return true;
      }
      // 2. Department name match
      if (currentDeptObj && s.department_name && s.department_name.trim().toLowerCase() === currentDeptObj.name.trim().toLowerCase()) {
        return true;
      }
      // 3. Department code match
      if (currentDeptObj && currentDeptObj.code && s.department_code && s.department_code.trim().toLowerCase() === currentDeptObj.code.trim().toLowerCase()) {
        return true;
      }
      // 4. If editing existing item, keep current assignee in the list
      if (editingItem && editingItem.assigned_to && Number(s.id) === Number(editingItem.assigned_to)) {
        return true;
      }
      return false;
    });
  }, [staffList, formDept, departments, editingItem]);

  // Toolbar staff list, scoped to active department filter
  const toolbarStaffList = useMemo(() => {
    if (!staffList || staffList.length === 0) return [];
    if (activeDeptFilter === 'ALL') return staffList;
    return staffList.filter((s) => {
      if (s.department != null && Number(s.department) === Number(activeDeptFilter)) return true;
      if (selectedDeptObj && s.department_name && s.department_name.trim().toLowerCase() === selectedDeptObj.name.trim().toLowerCase()) return true;
      const hasItem = items.some((i) => isItemInDept(i, activeDeptFilter, selectedDeptObj?.name) && Number(i.assigned_to) === Number(s.id));
      return hasItem;
    });
  }, [staffList, activeDeptFilter, selectedDeptObj, items, isItemInDept]);

  // Computed Scoped Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Frequency Filter
      if (activeFrequency !== 'ALL' && item.frequency !== activeFrequency) {
        return false;
      }

      // Department Filter: STRICT! Only show checklist items for this department
      if (activeDeptFilter !== 'ALL') {
        if (!isItemInDept(item, activeDeptFilter, selectedDeptObj?.name)) {
          return false;
        }
      }

      // Staff Filter
      if (staffFilter !== 'ALL') {
        if (Number(item.assigned_to) !== Number(staffFilter)) return false;
      }

      // Assigned to Me
      if (onlyMyTasks) {
        if (Number(item.assigned_to) !== Number(currentUser.id)) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        const { completed } = isItemCompletedCurrentCycle(item);
        if (statusFilter === 'COMPLETED' && !completed) return false;
        if (statusFilter === 'PENDING' && completed) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchDept = (item.department_name || item.department_code || '').toLowerCase().includes(q);
        const matchStaff = (item.assigned_to_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDept && !matchStaff) return false;
      }

      return true;
    });
  }, [items, logs, activeFrequency, activeDeptFilter, selectedDeptObj, staffFilter, onlyMyTasks, statusFilter, searchQuery, currentUser.id, isItemInDept]);

  // Frequency-wise completion stats (Scoped dynamically to active department)
  const stats = useMemo(() => {
    const scoped = activeDeptFilter === 'ALL'
      ? items
      : items.filter((i) => isItemInDept(i, activeDeptFilter, selectedDeptObj?.name));

    const calc = (freq: RoutineFrequency) => {
      const list = scoped.filter((i) => i.frequency === freq);
      const done = list.filter((i) => isItemCompletedCurrentCycle(i).completed).length;
      return { total: list.length, completed: done, percent: list.length > 0 ? Math.round((done / list.length) * 100) : 0 };
    };

    return {
      DAILY: calc('DAILY'),
      WEEKLY: calc('WEEKLY'),
      MONTHLY: calc('MONTHLY'),
      YEARLY: calc('YEARLY'),
      ALL: {
        total: scoped.length,
        completed: scoped.filter((i) => isItemCompletedCurrentCycle(i).completed).length,
      },
    };
  }, [items, logs, activeDeptFilter, selectedDeptObj, isItemInDept]);

  const hasActiveFilters = activeDeptFilter !== 'ALL' || staffFilter !== 'ALL' || onlyMyTasks || statusFilter !== 'ALL' || Boolean(searchQuery.trim());

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return <span className="notion-tag tag-red" style={{ fontSize: '10.5px' }}>Urgent</span>;
      case 'HIGH':
        return <span className="notion-tag tag-orange" style={{ fontSize: '10.5px' }}>High</span>;
      case 'MEDIUM':
        return <span className="notion-tag tag-blue" style={{ fontSize: '10.5px' }}>Medium</span>;
      case 'LOW':
      default:
        return <span className="notion-tag tag-gray" style={{ fontSize: '10.5px' }}>Low</span>;
    }
  };

  const getFrequencyBadge = (f: RoutineFrequency) => {
    switch (f) {
      case 'DAILY':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
            Daily
          </span>
        );
      case 'WEEKLY':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
            Weekly
          </span>
        );
      case 'MONTHLY':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
            Monthly
          </span>
        );
      case 'YEARLY':
        return (
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.14)', color: '#d97706' }}>
            Yearly
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <ListChecks size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                {isTamil ? 'வழக்கமான பணிகள் சரிபார்ப்பு பட்டியல்' : 'Routine Work Checklists'}
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: 'var(--notion-text-muted)' }}>
                {isTamil
                  ? 'தினசரி, வாராந்திர, மாதாந்திர மற்றும் வருடாந்திர செயல்பாட்டு சரிபார்ப்புகள் (DB சேமிப்பு)'
                  : 'Daily, Weekly, Monthly, and Yearly operational checklists directly connected to database'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => loadRoutineData(true)}
            className="notion-btn notion-btn-bordered"
            style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '8px', gap: '6px' }}
            title="Refresh database records"
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh DB'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="notion-btn notion-btn-bordered"
            style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '8px', gap: '6px' }}
            title="Print or export checklist report"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal(activeFrequency === 'ALL' ? 'DAILY' : (activeFrequency as RoutineFrequency))}
            className="notion-btn notion-btn-primary"
            style={{
              fontSize: '12.5px',
              padding: '7px 16px',
              borderRadius: '8px',
              gap: '6px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(35, 131, 226, 0.3)',
            }}
          >
            <Plus size={14} />
            <span>Add Checklist Item</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEPARTMENT SELECTOR BAR (Click any department to view only its checklists)*/}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          padding: '14px 18px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={15} />
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
              {isTamil ? 'துறை வாரியான சரிபார்ப்புகள்' : 'Department Checklists'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--notion-text-muted)' }}>
              • {isTamil ? 'துறையை கிளிக் செய்து அந்த துறையின் பணிகளை மட்டும் பார்க்கவும்' : 'Click any department to view only its checklists'}
            </span>
          </div>

          {activeDeptFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => handleSelectDept('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: '#7c3aed',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                padding: '4px 10px',
                borderRadius: '7px',
                cursor: 'pointer',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              <X size={12} />
              <span>{isTamil ? 'அனைத்து துறைகளும்' : 'View All Departments'}</span>
            </button>
          )}
        </div>

        {/* Scrollable / Responsive Department Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {/* 1. All Departments Tab */}
          <button
            type="button"
            onClick={() => handleSelectDept('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: activeDeptFilter === 'ALL' ? '2px solid #7c3aed' : '1px solid var(--notion-border)',
              background: activeDeptFilter === 'ALL' ? 'rgba(124, 58, 237, 0.12)' : 'var(--notion-item-bg)',
              color: activeDeptFilter === 'ALL' ? '#7c3aed' : 'var(--notion-text)',
              fontWeight: activeDeptFilter === 'ALL' ? 800 : 600,
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: activeDeptFilter === 'ALL' ? '0 2px 8px rgba(124, 58, 237, 0.22)' : 'none',
              flexShrink: 0,
            }}
          >
            <span>🌐 {isTamil ? 'அனைத்து துறைகளும்' : 'All Departments'}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '10px',
                background: activeDeptFilter === 'ALL' ? '#7c3aed' : 'rgba(0, 0, 0, 0.06)',
                color: activeDeptFilter === 'ALL' ? '#ffffff' : 'var(--notion-text-muted)',
              }}
            >
              {items.length}
            </span>
          </button>

          {/* 2. Each Individual Department Tab */}
          {allDepartmentOptions.map((d) => {
            const isSelected = String(activeDeptFilter) === String(d.id);
            const stat = deptStats.get(String(d.id)) || { total: 0, completed: 0, percent: 0 };

            return (
              <button
                key={String(d.id)}
                type="button"
                onClick={() => handleSelectDept(d.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #7c3aed' : '1px solid var(--notion-border)',
                  background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'var(--notion-card)',
                  color: isSelected ? '#7c3aed' : 'var(--notion-text)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(124, 58, 237, 0.22)' : 'none',
                  flexShrink: 0,
                }}
              >
                <Building size={13} style={{ color: isSelected ? '#7c3aed' : 'var(--notion-text-muted)' }} />
                <span>{d.name}</span>
                {d.code && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                      color: isSelected ? '#7c3aed' : 'var(--notion-text-dim)',
                    }}
                  >
                    {d.code}
                  </span>
                )}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: isSelected
                      ? '#7c3aed'
                      : stat.total > 0
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : stat.total > 0
                      ? 'var(--notion-text-muted)'
                      : 'var(--notion-text-dim)',
                  }}
                >
                  {stat.total}
                </span>
                {stat.total > 0 && stat.percent === 100 && (
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Department Spotlight Banner */}
      {selectedDeptObj && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.07) 0%, rgba(99, 102, 241, 0.07) 100%)',
            border: '1.5px solid rgba(124, 58, 237, 0.28)',
            borderRadius: '12px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#7c3aed',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12.5px',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
              }}
            >
              {selectedDeptObj.code || <Building size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                {selectedDeptObj.name} {selectedDeptObj.code ? `(${selectedDeptObj.code})` : ''} Checklist
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--notion-text-muted)', marginTop: '1px' }}>
                Showing only checklists for {selectedDeptObj.name} • {selectedDeptStats.total} total items • {selectedDeptStats.completed} completed this cycle ({selectedDeptStats.percent}%)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleOpenCreateModal(activeFrequency === 'ALL' ? 'DAILY' : (activeFrequency as RoutineFrequency))}
              className="notion-btn notion-btn-primary"
              style={{ fontSize: '11.5px', padding: '6px 14px', borderRadius: '7px', fontWeight: 700 }}
            >
              <Plus size={13} />
              <span>Add {selectedDeptObj.name} Checklist Item</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectDept('ALL')}
              className="notion-btn notion-btn-bordered"
              style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '7px' }}
            >
              Show All Departments
            </button>
          </div>
        </div>
      )}

      {/* Progress Cards Across 4 Cycles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        {/* Daily Card */}
        <div
          onClick={() => setActiveFrequency('DAILY')}
          style={{
            background: 'var(--notion-card)',
            border: activeFrequency === 'DAILY' ? '2px solid #3b82f6' : '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: activeFrequency === 'DAILY' ? '0 4px 14px rgba(59, 130, 246, 0.16)' : 'var(--notion-shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>Daily Checklist</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '10px',
                background: stats.DAILY.total > 0 && stats.DAILY.percent === 100 ? '#10b981' : 'rgba(59, 130, 246, 0.12)',
                color: stats.DAILY.total > 0 && stats.DAILY.percent === 100 ? '#ffffff' : '#2563eb',
              }}
            >
              {stats.DAILY.percent}% Done
            </span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>
            {stats.DAILY.completed} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {stats.DAILY.total} Today</span>
          </div>
          <div style={{ marginTop: '8px', height: '5px', borderRadius: '4px', background: 'var(--notion-item-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${stats.DAILY.percent}%`, height: '100%', background: '#3b82f6', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Weekly Card */}
        <div
          onClick={() => setActiveFrequency('WEEKLY')}
          style={{
            background: 'var(--notion-card)',
            border: activeFrequency === 'WEEKLY' ? '2px solid #10b981' : '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: activeFrequency === 'WEEKLY' ? '0 4px 14px rgba(16, 185, 129, 0.16)' : 'var(--notion-shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>Weekly Checklist</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '10px',
                background: stats.WEEKLY.total > 0 && stats.WEEKLY.percent === 100 ? '#10b981' : 'rgba(16, 185, 129, 0.12)',
                color: stats.WEEKLY.total > 0 && stats.WEEKLY.percent === 100 ? '#ffffff' : '#059669',
              }}
            >
              {stats.WEEKLY.percent}% Done
            </span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>
            {stats.WEEKLY.completed} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {stats.WEEKLY.total} This Week</span>
          </div>
          <div style={{ marginTop: '8px', height: '5px', borderRadius: '4px', background: 'var(--notion-item-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${stats.WEEKLY.percent}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Monthly Card */}
        <div
          onClick={() => setActiveFrequency('MONTHLY')}
          style={{
            background: 'var(--notion-card)',
            border: activeFrequency === 'MONTHLY' ? '2px solid #8b5cf6' : '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: activeFrequency === 'MONTHLY' ? '0 4px 14px rgba(139, 92, 246, 0.16)' : 'var(--notion-shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>Monthly Checklist</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '10px',
                background: stats.MONTHLY.total > 0 && stats.MONTHLY.percent === 100 ? '#10b981' : 'rgba(139, 92, 246, 0.12)',
                color: stats.MONTHLY.total > 0 && stats.MONTHLY.percent === 100 ? '#ffffff' : '#7c3aed',
              }}
            >
              {stats.MONTHLY.percent}% Done
            </span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>
            {stats.MONTHLY.completed} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {stats.MONTHLY.total} This Month</span>
          </div>
          <div style={{ marginTop: '8px', height: '5px', borderRadius: '4px', background: 'var(--notion-item-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${stats.MONTHLY.percent}%`, height: '100%', background: '#8b5cf6', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Yearly Card */}
        <div
          onClick={() => setActiveFrequency('YEARLY')}
          style={{
            background: 'var(--notion-card)',
            border: activeFrequency === 'YEARLY' ? '2px solid #f59e0b' : '1px solid var(--notion-border)',
            borderRadius: '12px',
            padding: '14px 18px',
            cursor: 'pointer',
            boxShadow: activeFrequency === 'YEARLY' ? '0 4px 14px rgba(245, 158, 11, 0.16)' : 'var(--notion-shadow-sm)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>Yearly Checklist</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: '10px',
                background: stats.YEARLY.total > 0 && stats.YEARLY.percent === 100 ? '#10b981' : 'rgba(245, 158, 11, 0.14)',
                color: stats.YEARLY.total > 0 && stats.YEARLY.percent === 100 ? '#ffffff' : '#d97706',
              }}
            >
              {stats.YEARLY.percent}% Done
            </span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--notion-text)' }}>
            {stats.YEARLY.completed} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--notion-text-muted)' }}>/ {stats.YEARLY.total} This Year</span>
          </div>
          <div style={{ marginTop: '8px', height: '5px', borderRadius: '4px', background: 'var(--notion-item-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${stats.YEARLY.percent}%`, height: '100%', background: '#f59e0b', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div
        style={{
          background: 'var(--notion-card)',
          border: '1px solid var(--notion-border)',
          borderRadius: '14px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          marginBottom: '18px',
          overflow: 'hidden',
        }}
      >
        {/* ROW 1: Frequency Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: 'rgba(248, 250, 252, 0.7)',
            borderBottom: '1px solid var(--notion-border-subtle)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'DAILY', label: '📅 Daily Checklist', count: stats.DAILY.total, activeColor: '#2563eb', activeBg: 'rgba(59, 130, 246, 0.14)' },
            { id: 'WEEKLY', label: '🗓️ Weekly Checklist', count: stats.WEEKLY.total, activeColor: '#059669', activeBg: 'rgba(16, 185, 129, 0.14)' },
            { id: 'MONTHLY', label: '📆 Monthly Checklist', count: stats.MONTHLY.total, activeColor: '#7c3aed', activeBg: 'rgba(139, 92, 246, 0.14)' },
            { id: 'YEARLY', label: '🏆 Yearly Checklist', count: stats.YEARLY.total, activeColor: '#d97706', activeBg: 'rgba(245, 158, 11, 0.16)' },
            { id: 'ALL', label: '📊 All Frequencies', count: stats.ALL.total, activeColor: '#4f46e5', activeBg: 'rgba(99, 102, 241, 0.14)' },
          ].map((tab) => {
            const isActive = activeFrequency === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFrequency(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: isActive ? `1.5px solid ${tab.activeColor}` : '1px solid transparent',
                  background: isActive ? tab.activeBg : 'transparent',
                  color: isActive ? tab.activeColor : 'var(--notion-text-muted)',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: isActive ? tab.activeColor : 'rgba(0, 0, 0, 0.06)',
                    color: isActive ? '#ffffff' : 'var(--notion-text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ROW 2: Contextual Filters (Department, Staff, Status, Search) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Left: Department & Staff */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Assigned to Me */}
            <button
              type="button"
              onClick={() => setOnlyMyTasks(!onlyMyTasks)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                background: onlyMyTasks ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'var(--notion-card)',
                color: onlyMyTasks ? '#ffffff' : 'var(--notion-text)',
                border: onlyMyTasks ? '1px solid transparent' : '1px solid var(--notion-border)',
                boxShadow: onlyMyTasks ? '0 2px 6px rgba(79, 70, 229, 0.28)' : 'var(--notion-shadow-sm)',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Assigned to Me</span>
            </button>

            {/* Department Dropdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '8px',
                background: activeDeptFilter !== 'ALL' ? 'rgba(124, 58, 237, 0.09)' : 'var(--notion-card)',
                border: activeDeptFilter !== 'ALL' ? '1.5px solid #8b5cf6' : '1px solid var(--notion-border)',
              }}
            >
              <Building size={12} style={{ color: activeDeptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: activeDeptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text-muted)' }}>Dept:</span>
              <select
                value={String(activeDeptFilter)}
                onChange={(e) => handleSelectDept(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '11.5px',
                  fontWeight: activeDeptFilter !== 'ALL' ? 700 : 500,
                  color: activeDeptFilter !== 'ALL' ? '#7c3aed' : 'var(--notion-text)',
                  cursor: 'pointer',
                  maxWidth: '160px',
                }}
              >
                <option value="ALL">All Departments ({items.length})</option>
                {allDepartmentOptions.map((d) => {
                  const stat = deptStats.get(String(d.id));
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `[${d.code}]` : ''} ({stat?.total || 0})
                    </option>
                  );
                })}
              </select>
              {activeDeptFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleSelectDept('ALL')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '11px', padding: 0 }}
                  title="Reset to All Departments"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Staff Dropdown */}
            {staffList && staffList.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  background: staffFilter !== 'ALL' ? 'rgba(35, 131, 226, 0.09)' : 'var(--notion-card)',
                  border: staffFilter !== 'ALL' ? '1.5px solid var(--notion-blue)' : '1px solid var(--notion-border)',
                }}
              >
                <UserIcon size={12} style={{ color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text-muted)' }}>Staff:</span>
                <select
                  value={String(staffFilter)}
                  onChange={(e) => setStaffFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '11.5px',
                    fontWeight: staffFilter !== 'ALL' ? 700 : 500,
                    color: staffFilter !== 'ALL' ? 'var(--notion-blue)' : 'var(--notion-text)',
                    cursor: 'pointer',
                    maxWidth: '160px',
                  }}
                >
                  <option value="ALL">All Personnel ({toolbarStaffList.length})</option>
                  {toolbarStaffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.username}
                    </option>
                  ))}
                </select>
                {staffFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setStaffFilter('ALL')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--notion-blue)', fontSize: '11px', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    fontSize: '11px',
                    padding: '4px 9px',
                    borderRadius: '6px',
                    border: statusFilter === st ? '1px solid var(--notion-border)' : '1px solid transparent',
                    background: statusFilter === st ? 'var(--notion-item-bg)' : 'transparent',
                    color: statusFilter === st ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                    fontWeight: statusFilter === st ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {st === 'ALL' ? 'All' : st === 'PENDING' ? '⏳ Pending' : '✓ Completed'}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  handleSelectDept('ALL');
                  setStaffFilter('ALL');
                  setOnlyMyTasks(false);
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  cursor: 'pointer',
                }}
              >
                <X size={11} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Right: Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border)',
              borderRadius: '8px',
              width: '210px',
            }}
          >
            <Search size={12} style={{ color: 'var(--notion-text-muted)' }} />
            <input
              type="text"
              placeholder="Search checklist or SOP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '11.5px',
                width: '100%',
                color: 'var(--notion-text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)', padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Items Container */}
      <div
        style={{
          border: '1px solid var(--notion-border)',
          borderRadius: '12px',
          background: 'var(--notion-card)',
          overflow: 'hidden',
          boxShadow: 'var(--notion-shadow-sm)',
        }}
      >
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading checklist items from database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '52px 24px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
            <ListChecks size={32} style={{ opacity: 0.35, marginBottom: '10px' }} />
            <p style={{ margin: '0 0 6px 0', fontSize: '14.5px', fontWeight: 700, color: 'var(--notion-text)' }}>
              {selectedDeptObj
                ? `No ${activeFrequency !== 'ALL' ? activeFrequency.toLowerCase() : ''} checklist items for ${selectedDeptObj.name}`
                : `No ${activeFrequency !== 'ALL' ? activeFrequency.toLowerCase() : ''} checklist items in database`}
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: 'var(--notion-text-dim)' }}>
              {selectedDeptObj
                ? `Create routine operational checklists specifically for ${selectedDeptObj.name}. All items will be saved directly into the database.`
                : 'Create your real institutional operational checklists here. All items will be saved directly into the database.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenCreateModal(activeFrequency === 'ALL' ? 'DAILY' : (activeFrequency as RoutineFrequency))}
                className="notion-btn notion-btn-primary"
                style={{ fontSize: '12px', padding: '7px 18px', borderRadius: '8px', fontWeight: 700 }}
              >
                <Plus size={13} />
                <span>{selectedDeptObj ? `Add Checklist Item for ${selectedDeptObj.name}` : 'Create Checklist Item in Database'}</span>
              </button>
              {activeDeptFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleSelectDept('ALL')}
                  className="notion-btn notion-btn-bordered"
                  style={{ fontSize: '12px', padding: '7px 14px', borderRadius: '8px' }}
                >
                  Show All Departments
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const { completed, log } = isItemCompletedCurrentCycle(item);
            const isExpanded = Boolean(expandedItems[String(item.id)]);

            return (
              <div
                key={item.id}
                style={{
                  borderBottom: '1px solid var(--notion-border-subtle)',
                  padding: '12px 18px',
                  background: completed ? 'rgba(240, 253, 244, 0.55)' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                  {/* Left: Checkbox + Title + Attributes */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(item)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: completed ? '#10b981' : 'var(--notion-border-dark, #cbd5e1)',
                        transition: 'color 0.15s ease, transform 0.1s ease',
                      }}
                      title={completed ? 'Click to mark pending' : 'Click to mark completed for this cycle'}
                    >
                      {completed ? (
                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Circle size={20} style={{ color: '#94a3b8' }} />
                      )}
                    </button>

                    {/* Title & Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: completed ? 'var(--notion-text-dim)' : 'var(--notion-text)',
                            textDecoration: completed ? 'line-through' : 'none',
                          }}
                        >
                          {item.title}
                        </span>

                        {getFrequencyBadge(item.frequency)}

                        {(item.department_name || item.department_code) && (
                          <span
                            className="notion-tag tag-purple"
                            style={{ fontSize: '10.5px', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.department) handleSelectDept(item.department);
                            }}
                            title={`Filter strictly by ${item.department_name || item.department_code}`}
                          >
                            🏢 {item.department_name || item.department_code}
                          </span>
                        )}

                        {getPriorityBadge(item.priority)}

                        {item.target_time && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'var(--notion-text-muted)',
                              background: 'var(--notion-item-bg)',
                              padding: '1px 6px',
                              borderRadius: '6px',
                            }}
                          >
                            <Clock size={11} />
                            {item.target_time}
                          </span>
                        )}

                        {item.assigned_to_name && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'var(--notion-text-muted)',
                            }}
                          >
                            <UserIcon size={11} />
                            {item.assigned_to_name}
                          </span>
                        )}
                      </div>

                      {/* Completed Attribution Bar */}
                      {completed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          <ShieldCheck size={13} />
                          <span>
                            Completed for current {item.frequency.toLowerCase()} cycle by{' '}
                            <strong>{log?.completed_by_name || item.last_completed_by_name || 'Staff'}</strong>
                            {log?.completed_at ? ` at ${new Date(log.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                      )}

                      {/* SOP Instructions Accordion */}
                      {item.description && (
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11.5px',
                              color: 'var(--notion-text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            <span>Standard Operating Procedure (SOP)</span>
                          </button>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'var(--notion-item-bg)',
                                fontSize: '12px',
                                color: 'var(--notion-text)',
                                lineHeight: '1.5',
                                borderLeft: '3px solid var(--notion-blue)',
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {/* Log Anomaly as Task Button */}
                    <button
                      type="button"
                      onClick={() => handleLogIssueAsTask(item)}
                      className="notion-btn notion-btn-bordered"
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        gap: '4px',
                        color: '#d97706',
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        background: 'rgba(245, 158, 11, 0.08)',
                      }}
                      title="If a problem or defect was found during this check, convert it to an Action Task"
                    >
                      <AlertTriangle size={11} />
                      <span>Log Issue</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--notion-text-muted)',
                        padding: '4px',
                      }}
                      title="Edit checklist item"
                    >
                      <Edit size={13} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '4px',
                      }}
                      title="Delete checklist item from database"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Add / Edit Routine Checklist Item */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={() => !savingItem && setIsModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--notion-card)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--notion-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListChecks size={18} style={{ color: 'var(--notion-blue)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)' }}>
                  {editingItem ? 'Edit Checklist Item in Database' : 'Add New Checklist Item to Database'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !savingItem && setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ padding: '20px' }}>
              {/* Title */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                  Checklist Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect Campus Water Pumps & Pressure"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-item-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Frequency & Priority Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Checklist Frequency *
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RoutineFrequency)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-item-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  >
                    <option value="DAILY">📅 Daily Checklist</option>
                    <option value="WEEKLY">🗓️ Weekly Checklist</option>
                    <option value="MONTHLY">📆 Monthly Checklist</option>
                    <option value="YEARLY">🏆 Yearly Checklist</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Priority *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-item-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Department & Assignee Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Department
                  </label>
                  <select
                    value={String(formDept)}
                    onChange={(e) => {
                      const newDeptId = e.target.value ? Number(e.target.value) : '';
                      setFormDept(newDeptId);
                      // If chosen assignee does not belong to the newly selected department, reset assignee
                      if (newDeptId && formAssignee) {
                        const newDeptObj = departments.find((d) => Number(d.id) === Number(newDeptId));
                        const stillBelongs = staffList?.some((s) => {
                          if (Number(s.id) !== Number(formAssignee)) return false;
                          if (s.department != null && Number(s.department) === Number(newDeptId)) return true;
                          if (newDeptObj && s.department_name && s.department_name.trim().toLowerCase() === newDeptObj.name.trim().toLowerCase()) return true;
                          return false;
                        });
                        if (!stillBelongs) {
                          setFormAssignee('');
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-item-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Assigned Personnel {formDept ? `(${modalAvailableStaff.length})` : ''}
                  </label>
                  <select
                    value={String(formAssignee)}
                    onChange={(e) => setFormAssignee(e.target.value ? Number(e.target.value) : '')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-item-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  >
                    <option value="">
                      {modalAvailableStaff.length === 0
                        ? (formDept ? 'No staff in this department' : 'Select Department first')
                        : 'Select Staff Member'}
                    </option>
                    {modalAvailableStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name || s.username} {s.department_code ? `[${s.department_code}]` : ''}
                      </option>
                    ))}
                  </select>
                  {formDept && modalAvailableStaff.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                      ⚠️ No staff registered in this department directory.
                    </span>
                  )}
                </div>
              </div>

              {/* Target Schedule */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                  Target Schedule (e.g. 09:30 AM Daily, Every Monday, 1st of month)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM"
                  value={formTargetTime}
                  onChange={(e) => setFormTargetTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-item-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* SOP / Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                  Standard Operating Procedure (SOP) / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed inspection procedure, parameters to verify, and threshold values..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-item-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12.5px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="notion-btn notion-btn-bordered"
                  style={{ fontSize: '12px', padding: '7px 16px', borderRadius: '8px' }}
                  disabled={savingItem}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="notion-btn notion-btn-primary"
                  style={{ fontSize: '12px', padding: '7px 18px', borderRadius: '8px', fontWeight: 700 }}
                  disabled={savingItem}
                >
                  {savingItem ? 'Saving to Database...' : editingItem ? 'Save Changes' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
