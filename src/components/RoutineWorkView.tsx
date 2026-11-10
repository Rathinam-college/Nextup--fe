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
  Building2,
  User as UserIcon,
  Users,
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
  BarChart3,
  Download,
  TrendingUp,
  FileSpreadsheet,
  Hash,
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

  // Page Tab Mode: 'CHECKLIST' vs 'REPORT'
  const [pageTab, setPageTab] = useState<'CHECKLIST' | 'REPORT'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('report') || window.location.search.includes('tab=report')) {
        return 'REPORT';
      }
    }
    return 'CHECKLIST';
  });

  // Report Specific Filter States
  const [reportDateRange, setReportDateRange] = useState<'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'ALL_TIME' | 'CUSTOM'>('THIS_MONTH');
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportDeptFilter, setReportDeptFilter] = useState<number | 'ALL'>('ALL');
  const [reportFrequencyFilter, setReportFrequencyFilter] = useState<RoutineFrequency | 'ALL'>('ALL');
  const [reportStaffFilter, setReportStaffFilter] = useState<number | 'ALL'>('ALL');
  const [reportSearch, setReportSearch] = useState<string>('');

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
  const [formTargetCount, setFormTargetCount] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Daily / Routine Completion Modal State (Asks Count & Notes)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completingItem, setCompletingItem] = useState<RoutineWorkItem | null>(null);
  const [completeCount, setCompleteCount] = useState<number>(1);
  const [completeNotes, setCompleteNotes] = useState<string>('');
  const [isUpdatingExisting, setIsUpdatingExisting] = useState<boolean>(false);
  const [savingCompletion, setSavingCompletion] = useState<boolean>(false);

  // Already Completed Action Modal State
  const [alreadyCompletedModalItem, setAlreadyCompletedModalItem] = useState<RoutineWorkItem | null>(null);

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

  // User clicked checkbox on an item: asks count for daily completion
  const handleClickItemCheckbox = (item: RoutineWorkItem) => {
    const { completed, log } = isItemCompletedCurrentCycle(item);
    if (completed) {
      // Already completed -> open action modal (Update count or Undo)
      setAlreadyCompletedModalItem(item);
    } else {
      // Not completed -> open Completion Modal and ask count
      setCompletingItem(item);
      const defaultCnt = item.target_count && item.target_count > 0 ? item.target_count : 1;
      setCompleteCount(defaultCnt);
      setCompleteNotes('');
      setIsUpdatingExisting(false);
      setIsCompleteModalOpen(true);
    }
  };

  // Open modal to update existing completion count
  const handleOpenUpdateCount = (item: RoutineWorkItem) => {
    const { log } = isItemCompletedCurrentCycle(item);
    setAlreadyCompletedModalItem(null);
    setCompletingItem(item);
    setCompleteCount(Number(log?.count ?? item.last_completed_count) || 1);
    setCompleteNotes(log?.notes || item.completion_notes || '');
    setIsUpdatingExisting(true);
    setIsCompleteModalOpen(true);
  };

  // Direct undo / uncheck completion -> Remove from DB
  const handleDirectUndoComplete = async (item: RoutineWorkItem) => {
    setAlreadyCompletedModalItem(null);
    const period = getPeriodIdentifier(item.frequency);

    // Optimistic UI update
    setLogs((prev) => prev.filter((l) => !(String(l.item_id || (l as any).item) === String(item.id) && l.period_identifier === period)));
    setItems((prev) =>
      prev.map((i) => {
        if (String(i.id) === String(item.id)) {
          return { ...i, last_completed_at: null, last_completed_by: null, last_completed_by_name: undefined, last_completed_count: 0 };
        }
        return i;
      })
    );

    try {
      await api.toggleCompleteRoutineItem(item.id, period);
    } catch (err: any) {
      console.warn('Persist undo to DB failed, updating local store:', err);
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(items));
        localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
      } catch {}
    }
  };

  // Save completion modal (Persist daily count and notes to DB)
  const handleSaveCompletion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!completingItem) return;

    setSavingCompletion(true);
    const period = getPeriodIdentifier(completingItem.frequency);
    const nowIso = new Date().toISOString();
    const finalCount = Math.max(1, Number(completeCount) || 1);
    const finalNotes = completeNotes.trim();

    // Optimistic UI update
    const newLog: RoutineWorkLog = {
      id: isUpdatingExisting ? `log_upd_${Date.now()}` : `log_${Date.now()}`,
      item_id: completingItem.id,
      completed_by: currentUser.id,
      completed_by_name: currentUser.full_name || currentUser.username,
      completed_at: nowIso,
      period_identifier: period,
      count: finalCount,
      notes: finalNotes,
    };

    if (isUpdatingExisting) {
      setLogs((prev) => {
        const withoutOld = prev.filter((l) => !(String(l.item_id || (l as any).item) === String(completingItem.id) && l.period_identifier === period));
        return [newLog, ...withoutOld];
      });
    } else {
      setLogs((prev) => [newLog, ...prev]);
    }

    setItems((prev) =>
      prev.map((i) => {
        if (String(i.id) === String(completingItem.id)) {
          return {
            ...i,
            last_completed_at: nowIso,
            last_completed_by: currentUser.id,
            last_completed_by_name: currentUser.full_name || currentUser.username,
            last_completed_count: finalCount,
            completion_notes: finalNotes,
          };
        }
        return i;
      })
    );

    try {
      await api.toggleCompleteRoutineItem(completingItem.id, period, finalNotes, finalCount, isUpdatingExisting);
    } catch (err: any) {
      console.warn('Persist completion to DB failed, updating local store:', err);
      try {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(items));
        localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
      } catch {}
    } finally {
      setSavingCompletion(false);
      setIsCompleteModalOpen(false);
      setCompletingItem(null);
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
    setFormTargetCount('');
    setFormUnit('');
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
    setFormTargetCount(item.target_count || '');
    setFormUnit(item.unit || '');
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
      target_count: formTargetCount ? Number(formTargetCount) : 0,
      unit: formUnit.trim(),
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
          target_count: formTargetCount ? Number(formTargetCount) : 0,
          unit: formUnit.trim(),
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
      let done = 0;
      let totalCount = 0;
      list.forEach((i) => {
        const { completed, log } = isItemCompletedCurrentCycle(i);
        if (completed) {
          done++;
          totalCount += Number(log?.count ?? i.last_completed_count) || 1;
        }
      });
      return {
        total: list.length,
        completed: done,
        percent: list.length > 0 ? Math.round((done / list.length) * 100) : 0,
        totalCount,
      };
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

  // Filtered logs for report view
  const filteredReportLogs = useMemo(() => {
    return logs.filter((log) => {
      // Date filter
      if (log.completed_at) {
        const logDateStr = log.completed_at.slice(0, 10);
        if (reportDateRange === 'TODAY') {
          const today = new Date().toISOString().slice(0, 10);
          if (logDateStr !== today) return false;
        } else if (reportDateRange === 'YESTERDAY') {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          const yStr = y.toISOString().slice(0, 10);
          if (logDateStr !== yStr) return false;
        } else if (reportDateRange === 'THIS_WEEK') {
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff)).toISOString().slice(0, 10);
          if (logDateStr < monday) return false;
        } else if (reportDateRange === 'THIS_MONTH') {
          const now = new Date();
          const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          if (logDateStr < startMonth) return false;
        } else if (reportDateRange === 'LAST_30_DAYS') {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          const dStr = d.toISOString().slice(0, 10);
          if (logDateStr < dStr) return false;
        } else if (reportDateRange === 'CUSTOM') {
          if (reportStartDate && logDateStr < reportStartDate) return false;
          if (reportEndDate && logDateStr > reportEndDate) return false;
        }
      }

      // Department filter
      if (reportDeptFilter !== 'ALL') {
        const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
        const deptId = log.department_id || item?.department_id || item?.department;
        if (deptId !== reportDeptFilter) return false;
      }

      // Frequency filter
      if (reportFrequencyFilter !== 'ALL') {
        const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
        const freq = log.item_frequency || item?.frequency;
        if (freq !== reportFrequencyFilter) return false;
      }

      // Staff filter
      if (reportStaffFilter !== 'ALL') {
        if (log.completed_by_id !== reportStaffFilter && log.completed_by !== reportStaffFilter) return false;
      }

      // Search query
      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase();
        const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
        const title = (log.item_title || item?.title || '').toLowerCase();
        const staff = (log.completed_by_name || '').toLowerCase();
        const notes = (log.notes || '').toLowerCase();
        const dept = (log.department_name || item?.department_name || '').toLowerCase();
        if (!title.includes(q) && !staff.includes(q) && !notes.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, items, reportDateRange, reportStartDate, reportEndDate, reportDeptFilter, reportFrequencyFilter, reportStaffFilter, reportSearch]);

  // Report KPIs
  const reportKpis = useMemo(() => {
    const totalCompletions = filteredReportLogs.length;
    let totalCount = 0;
    const staffSet = new Set<string | number>();
    const itemSet = new Set<string | number>();
    const deptSet = new Set<string | number>();

    filteredReportLogs.forEach((l) => {
      if (typeof l.count === 'number') totalCount += l.count;
      const sId = l.completed_by_id || l.completed_by;
      if (sId) staffSet.add(sId);
      const itId = l.item_id || (l as any).item;
      if (itId) itemSet.add(itId);
      const item = items.find((i) => String(i.id) === String(itId));
      const deptId = l.department_id || item?.department_id || item?.department;
      if (deptId) deptSet.add(deptId);
    });

    return {
      totalCompletions,
      totalCount,
      uniqueStaff: staffSet.size,
      uniqueChecklists: itemSet.size,
      uniqueDepartments: deptSet.size,
    };
  }, [filteredReportLogs, items]);

  // Department Report breakdown
  const departmentReportStats = useMemo(() => {
    const map = new Map<number, { name: string; completions: number; totalCount: number }>();
    filteredReportLogs.forEach((l) => {
      const item = items.find((i) => String(i.id) === String(l.item_id || (l as any).item));
      const deptId = (l.department_id || item?.department_id || item?.department || 0) as number;
      const deptName = l.department_name || item?.department_name || 'General Operations';
      const existing = map.get(deptId) || { name: deptName, completions: 0, totalCount: 0 };
      existing.completions += 1;
      if (typeof l.count === 'number') existing.totalCount += l.count;
      map.set(deptId, existing);
    });
    return Array.from(map.entries()).map(([id, val]) => ({ id, ...val }));
  }, [filteredReportLogs, items]);

  // CSV Export handler
  const handleExportReportCsv = () => {
    if (filteredReportLogs.length === 0) {
      alert('No routine log entries found for the selected filters.');
      return;
    }
    const headers = [
      'Log ID',
      'Date',
      'Time',
      'Period Identifier',
      'Checklist Title',
      'Frequency',
      'Department',
      'Staff Name',
      'Staff Email',
      'Count / Units',
      'Target Count',
      'Unit',
      'Notes / Remarks',
      'Status'
    ];

    const rows = filteredReportLogs.map((l) => {
      const item = items.find((i) => String(i.id) === String(l.item_id || (l as any).item));
      const d = l.completed_at ? new Date(l.completed_at) : null;
      const dateStr = d ? d.toISOString().slice(0, 10) : '';
      const timeStr = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      return [
        l.id,
        dateStr,
        timeStr,
        `"${(l.period_identifier || '').replace(/"/g, '""')}"`,
        `"${(l.item_title || item?.title || '').replace(/"/g, '""')}"`,
        l.item_frequency || item?.frequency || '',
        `"${(l.department_name || item?.department_name || '').replace(/"/g, '""')}"`,
        `"${(l.completed_by_name || '').replace(/"/g, '""')}"`,
        `"${(l.completed_by_email || '').replace(/"/g, '""')}"`,
        l.count !== null && l.count !== undefined ? l.count : '',
        l.target_count || item?.target_count || '',
        `"${(l.unit || item?.unit || '').replace(/"/g, '""')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        l.status || 'COMPLETED',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NextUp_Routine_Work_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenEditReportLog = (log: RoutineWorkLog) => {
    const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
    if (item) {
      setCompletingItem(item);
      setCompleteCount(log.count !== null && log.count !== undefined ? Number(log.count) : Number(item.target_count || 1));
      setCompleteNotes(log.notes || '');
      setIsUpdatingExisting(true);
      setIsCompleteModalOpen(true);
    }
  };

  const handleDeleteReportLog = async (log: RoutineWorkLog) => {
    const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
    if (!item) return;
    if (!confirm(`Are you sure you want to remove the log record for "${log.item_title || item.title}"?`)) return;
    await handleDirectUndoComplete(item);
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

        {/* Mode Switcher: Checklists vs Report */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--notion-item-bg)',
            padding: '3px',
            borderRadius: '9px',
            border: '1px solid var(--notion-border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setPageTab('CHECKLIST')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: pageTab === 'CHECKLIST' ? 'var(--notion-card)' : 'transparent',
              color: pageTab === 'CHECKLIST' ? 'var(--notion-blue)' : 'var(--notion-text-muted)',
              fontWeight: pageTab === 'CHECKLIST' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: pageTab === 'CHECKLIST' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <ListChecks size={14} />
            <span>Checklists</span>
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: pageTab === 'CHECKLIST' ? 'rgba(2, 132, 199, 0.12)' : 'var(--notion-border)', color: pageTab === 'CHECKLIST' ? 'var(--notion-blue)' : 'inherit', fontWeight: 800 }}>
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPageTab('REPORT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '7px',
              border: 'none',
              background: pageTab === 'REPORT' ? 'var(--notion-card)' : 'transparent',
              color: pageTab === 'REPORT' ? '#7c3aed' : 'var(--notion-text-muted)',
              fontWeight: pageTab === 'REPORT' ? 800 : 600,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: pageTab === 'REPORT' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <BarChart3 size={14} />
            <span>Report &amp; Daily Logs</span>
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: pageTab === 'REPORT' ? 'rgba(124, 58, 237, 0.12)' : 'var(--notion-border)', color: pageTab === 'REPORT' ? '#7c3aed' : 'inherit', fontWeight: 800 }}>
              {logs.length}
            </span>
          </button>
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

          {pageTab === 'REPORT' && (
            <button
              type="button"
              onClick={handleExportReportCsv}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                borderRadius: '8px',
                gap: '6px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              }}
              title="Download filtered logs as CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          )}

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

          {pageTab === 'CHECKLIST' && (
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
          )}
        </div>
      </div>

      {pageTab === 'CHECKLIST' ? (
        <>
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
          {stats.DAILY.totalCount > 0 && (
            <div style={{ marginTop: '3px', fontSize: '11px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📊 Daily Count Logged:</span>
              <strong style={{ fontSize: '12px' }}>{stats.DAILY.totalCount}</strong>
            </div>
          )}
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
                      onClick={() => handleClickItemCheckbox(item)}
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
                      title={completed ? `Completed (Count: ${log?.count ?? item.last_completed_count ?? 1}). Click to view or update.` : 'Click to record completion and enter count'}
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

                      {/* Completed Attribution Bar & Daily Count */}
                      {completed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '5px', fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={13} />
                            <span>
                              Completed for current {item.frequency.toLowerCase()} cycle by{' '}
                              <strong>{log?.completed_by_name || item.last_completed_by_name || 'Staff'}</strong>
                              {log?.completed_at ? ` at ${new Date(log.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                          </div>

                          {/* Daily Count Badge with click to edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateCount(item)}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Click to edit recorded count"
                          >
                            <span>📊 Count: <strong>{log?.count ?? item.last_completed_count ?? 1}</strong> {item.unit || ''}</span>
                            <Edit size={10} />
                          </button>

                          {log?.notes && (
                            <span style={{ color: 'var(--notion-text-muted)', fontStyle: 'italic', fontSize: '11px' }}>
                              💬 "{log.notes}"
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pending Target Badge */}
                      {!completed && item.target_count && item.target_count > 0 ? (
                        <div style={{ marginTop: '4px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '1px 7px',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              color: '#2563eb',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            🎯 Target Goal: {item.target_count} {item.unit || 'units'}
                          </span>
                        </div>
                      ) : null}

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
      </>
      ) : (
        /* ========================================================================= */
        /* REPORT & AUDIT LOG VIEW (Detailed operational metrics, count, export)     */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {/* KPI 1: Total Completions */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '14px',
                border: '1px solid var(--notion-border)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--notion-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Completed Checks
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--notion-text)', lineHeight: 1.2 }}>
                  {reportKpis.totalCompletions}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                  Across all active routines
                </div>
              </div>
            </div>

            {/* KPI 2: Total Daily Units Logged */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '14px',
                border: '1px solid var(--notion-border)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Daily Units Logged
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', lineHeight: 1.2 }}>
                  {reportKpis.totalCount.toLocaleString()}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                  Cumulative count recorded
                </div>
              </div>
            </div>

            {/* KPI 3: Participating Departments */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '14px',
                border: '1px solid var(--notion-border)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(124, 58, 237, 0.12)',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Departments
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--notion-text)', lineHeight: 1.2 }}>
                  {reportKpis.uniqueDepartments}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                  Operating routine checklists
                </div>
              </div>
            </div>

            {/* KPI 4: Active Staff */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '14px',
                border: '1px solid var(--notion-border)',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Staff Members
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--notion-text)', lineHeight: 1.2 }}>
                  {reportKpis.uniqueStaff}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                  Logging checks &amp; counts
                </div>
              </div>
            </div>
          </div>

          {/* Report Filters Card */}
          <div
            style={{
              background: 'var(--notion-card)',
              borderRadius: '14px',
              border: '1px solid var(--notion-border)',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Quick Date Presets Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--notion-text-muted)', marginRight: '4px' }}>
                  Date Range:
                </span>
                {[
                  { id: 'TODAY', label: 'Today' },
                  { id: 'YESTERDAY', label: 'Yesterday' },
                  { id: 'THIS_WEEK', label: 'This Week' },
                  { id: 'THIS_MONTH', label: 'This Month' },
                  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
                  { id: 'ALL_TIME', label: 'All Time' },
                  { id: 'CUSTOM', label: 'Custom' },
                ].map((preset) => {
                  const isSelected = reportDateRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setReportDateRange(preset.id as any)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #7c3aed' : '1px solid var(--notion-border)',
                        background: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'var(--notion-input-bg)',
                        color: isSelected ? '#7c3aed' : 'var(--notion-text-muted)',
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Start & End Date Inputs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>From:</span>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => {
                      setReportStartDate(e.target.value);
                      setReportDateRange('CUSTOM');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-input-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '11.5px',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>To:</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => {
                      setReportEndDate(e.target.value);
                      setReportDateRange('CUSTOM');
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-input-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '11.5px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Filter Dropdowns & Search Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--notion-border-subtle)' }}>
              {/* Department Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--notion-text-dim)', marginBottom: '3px' }}>
                  DEPARTMENT
                </label>
                <select
                  value={reportDeptFilter}
                  onChange={(e) => setReportDeptFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                  }}
                >
                  <option value="ALL">All Departments ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--notion-text-dim)', marginBottom: '3px' }}>
                  FREQUENCY
                </label>
                <select
                  value={reportFrequencyFilter}
                  onChange={(e) => setReportFrequencyFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                  }}
                >
                  <option value="ALL">All Frequencies</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              {/* Staff Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--notion-text-dim)', marginBottom: '3px' }}>
                  STAFF CONTRIBUTOR
                </label>
                <select
                  value={reportStaffFilter}
                  onChange={(e) => setReportStaffFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: '1px solid var(--notion-border)',
                    background: 'var(--notion-input-bg)',
                    color: 'var(--notion-text)',
                    fontSize: '12px',
                  }}
                >
                  <option value="ALL">All Staff Members</option>
                  {(staffList || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Query */}
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: 'var(--notion-text-dim)', marginBottom: '3px' }}>
                  SEARCH ACTIVITY
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--notion-text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Search title, staff, notes..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 28px',
                      borderRadius: '7px',
                      border: '1px solid var(--notion-border)',
                      background: 'var(--notion-input-bg)',
                      color: 'var(--notion-text)',
                      fontSize: '12px',
                    }}
                  />
                  {reportSearch && (
                    <button
                      type="button"
                      onClick={() => setReportSearch('')}
                      style={{
                        position: 'absolute',
                        right: '7px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--notion-text-muted)',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Department Volume Matrix Summary */}
          {departmentReportStats.length > 0 && (
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} style={{ color: '#7c3aed' }} />
                <span>Department Volume &amp; Completion Breakdown</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {departmentReportStats.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      background: 'var(--notion-card)',
                      borderRadius: '10px',
                      border: '1px solid var(--notion-border)',
                      padding: '10px 14px',
                      boxShadow: 'var(--notion-shadow-sm)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dept.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--notion-blue)' }}>
                        {dept.completions} checks
                      </span>
                      {dept.totalCount > 0 && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                          • {dept.totalCount} units
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Audit & Activity Log Table */}
          <div
            style={{
              background: 'var(--notion-card)',
              borderRadius: '14px',
              border: '1px solid var(--notion-border)',
              overflow: 'hidden',
              boxShadow: 'var(--notion-shadow-sm)',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--notion-border)',
                background: 'linear-gradient(180deg, var(--notion-item-bg) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={16} style={{ color: '#7c3aed' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                  Detailed Operational Log Records
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                  {filteredReportLogs.length} Entries
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportReportCsv}
                  className="notion-btn notion-btn-bordered"
                  style={{ fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px', gap: '5px' }}
                  title="Download CSV spreadsheet"
                >
                  <Download size={12} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {filteredReportLogs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--notion-text-muted)' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                <div style={{ fontSize: '14px', fontWeight: 700 }}>No routine logs match your filter criteria</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--notion-text-dim)' }}>
                  Try selecting a broader date range or clearing the search query.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--notion-item-bg)', borderBottom: '1px solid var(--notion-border)' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>DATE / TIME</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>CHECKLIST ITEM</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>FREQUENCY</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>DEPARTMENT</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>COMPLETED BY</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px', textAlign: 'right' }}>DAILY COUNT</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px' }}>REMARKS / NOTES</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--notion-text-dim)', fontSize: '11px', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportLogs.map((log) => {
                      const item = items.find((i) => String(i.id) === String(log.item_id || (log as any).item));
                      const d = log.completed_at ? new Date(log.completed_at) : null;
                      const dateDisplay = d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                      const timeDisplay = d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                      const freq = log.item_frequency || item?.frequency || 'DAILY';
                      const deptName = log.department_name || item?.department_name || 'General';
                      const unit = log.unit || item?.unit || '';
                      const target = log.target_count || item?.target_count;

                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: '1px solid var(--notion-border-subtle)',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-item-bg)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Date / Time */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: 'var(--notion-text)' }}>{dateDisplay}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>{timeDisplay}</div>
                          </td>

                          {/* Item Title */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--notion-text)' }}>
                              {log.item_title || item?.title || `Routine #${log.item_id}`}
                            </div>
                            {item?.description && (
                              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                              </div>
                            )}
                          </td>

                          {/* Frequency */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            {getFrequencyBadge(freq as RoutineFrequency)}
                          </td>

                          {/* Department */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.1)',
                                color: 'var(--notion-blue)',
                              }}
                            >
                              {deptName}
                            </span>
                          </td>

                          {/* Staff */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: 'var(--notion-text)' }}>
                              {log.completed_by_name || 'Staff Member'}
                            </div>
                            {log.completed_by_email && (
                              <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                                {log.completed_by_email}
                              </div>
                            )}
                          </td>

                          {/* Daily Count */}
                          <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {log.count !== null && log.count !== undefined ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#059669',
                                  }}
                                >
                                  {log.count} {unit}
                                </span>
                                {target && (
                                  <span style={{ fontSize: '10px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                                    Target: {target}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--notion-text-dim)' }}>-</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td style={{ padding: '10px 14px' }}>
                            {log.notes ? (
                              <span style={{ fontSize: '11.5px', color: 'var(--notion-text)' }}>
                                {log.notes}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontStyle: 'italic' }}>
                                No remarks
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditReportLog(log)}
                                className="notion-btn notion-btn-bordered"
                                style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', gap: '3px' }}
                                title="Edit logged count or notes"
                              >
                                <Edit size={11} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReportLog(log)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  padding: '4px',
                                }}
                                title="Undo / Delete log record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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

              {/* Target Count & Unit (Optional) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Target Count / Quota <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50 (daily goal)"
                    value={formTargetCount}
                    onChange={(e) => setFormTargetCount(e.target.value ? Number(e.target.value) : '')}
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

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--notion-text)' }}>
                    Count Unit <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. calls, files, audits, tickets"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
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

      {/* ========================================================================= */}
      {/* MODAL: RECORD ROUTINE / DAILY WORK COMPLETION & ASK COUNT                 */}
      {/* ========================================================================= */}
      {isCompleteModalOpen && completingItem && (
        <div
          className="notion-modal-overlay"
          onClick={() => !savingCompletion && setIsCompleteModalOpen(false)}
          style={{
            backdropFilter: 'blur(8px)',
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              maxHeight: 'min(90vh, 520px)',
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '14px',
              overflow: 'hidden',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.45)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: '1px solid var(--notion-border)',
                background: 'linear-gradient(180deg, var(--notion-item-bg) 0%, transparent 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 3px 8px -2px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    {isUpdatingExisting ? 'Update Daily Routine Count' : 'Record Daily Routine Completion'}
                  </h3>
                  <p style={{ margin: '1px 0 0 0', fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>
                    Save today's completed count &amp; notes to database
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !savingCompletion && setIsCompleteModalOpen(false)}
                aria-label="Close"
                title="Close"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'var(--notion-item-bg)',
                  border: '1px solid var(--notion-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--notion-text)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--notion-item-bg)';
                  e.currentTarget.style.color = 'var(--notion-text)';
                  e.currentTarget.style.borderColor = 'var(--notion-border)';
                }}
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCompletion} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
              <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Task Item Banner */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--notion-item-bg)',
                    border: '1px solid var(--notion-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {getFrequencyBadge(completingItem.frequency)}
                    {(completingItem.department_name || completingItem.department_code) && (
                      <span className="notion-tag tag-purple" style={{ fontSize: '10.5px' }}>
                        🏢 {completingItem.department_name || completingItem.department_code}
                      </span>
                    )}
                    {completingItem.target_time && (
                      <span style={{ fontSize: '11px', color: 'var(--notion-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {completingItem.target_time}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    {completingItem.title}
                  </div>
                  {completingItem.target_count ? (
                    <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#2563eb', fontWeight: 700 }}>
                      🎯 Expected Target: {completingItem.target_count} {completingItem.unit || 'units'}
                    </div>
                  ) : null}
                </div>

                {/* Daily Count Input */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', letterSpacing: '0.01em' }}>
                      DAILY COUNT / UNITS DONE <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      Units: {completingItem.unit || 'records / items'}
                    </span>
                  </div>

                  {/* Counter Stepper Control */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setCompleteCount((prev) => Math.max(1, prev - 1))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '9px',
                        border: '1px solid var(--notion-border)',
                        background: 'var(--notion-input-bg)',
                        color: 'var(--notion-text)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      required
                      min="1"
                      autoFocus
                      value={completeCount}
                      onChange={(e) => setCompleteCount(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--notion-border)',
                        background: 'var(--notion-input-bg)',
                        color: 'var(--notion-text)',
                        fontSize: '18px',
                        fontWeight: 800,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setCompleteCount((prev) => prev + 1)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '9px',
                        border: '1px solid var(--notion-border)',
                        background: 'var(--notion-input-bg)',
                        color: 'var(--notion-text)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Count Preset Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>Quick Add:</span>
                    {[1, 5, 10, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCompleteCount((prev) => (prev === 1 ? num : prev + num))}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--notion-border-subtle)',
                          background: 'var(--notion-item-bg)',
                          color: 'var(--notion-text)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        +{num}
                      </button>
                    ))}
                    {completingItem.target_count && completingItem.target_count > 0 ? (
                      <button
                        type="button"
                        onClick={() => setCompleteCount(completingItem.target_count || 1)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        🎯 Target ({completingItem.target_count})
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Work Remarks / Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '6px', letterSpacing: '0.01em' }}>
                    WORK REMARKS &amp; NOTES <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Completed all scheduled verification calls, verified document uploads..."
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
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
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--notion-border)',
                  padding: '12px 20px',
                  background: 'var(--notion-item-bg)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="notion-btn notion-btn-bordered"
                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600 }}
                  disabled={savingCompletion}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingCompletion || !completeCount || completeCount < 1}
                  className="notion-btn"
                  style={{
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: savingCompletion ? 'not-allowed' : 'pointer',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{savingCompletion ? 'Saving...' : isUpdatingExisting ? 'Update Daily Count' : 'Save & Mark Complete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALREADY COMPLETED ACTION (Update Count / Notes OR Mark Pending)    */}
      {/* ========================================================================= */}
      {alreadyCompletedModalItem && (
        <div
          className="notion-modal-overlay"
          onClick={() => setAlreadyCompletedModalItem(null)}
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
              maxWidth: '460px',
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    Routine Item Completed
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    Logged for current {alreadyCompletedModalItem.frequency.toLowerCase()} cycle
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlreadyCompletedModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ margin: '16px 0', padding: '12px', borderRadius: '10px', background: 'var(--notion-item-bg)', border: '1px solid var(--notion-border)' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--notion-text)' }}>
                {alreadyCompletedModalItem.title}
              </div>
              {(() => {
                const { log } = isItemCompletedCurrentCycle(alreadyCompletedModalItem);
                const recordedCount = log?.count ?? alreadyCompletedModalItem.last_completed_count;
                return (
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11.5px' }}>
                    {recordedCount != null && (
                      <span style={{ fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                        📊 Recorded Count: {recordedCount} {alreadyCompletedModalItem.unit || ''}
                      </span>
                    )}
                    {log?.completed_by_name && (
                      <span style={{ color: 'var(--notion-text-muted)' }}>
                        by <strong>{log.completed_by_name}</strong>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleOpenUpdateCount(alreadyCompletedModalItem)}
                className="notion-btn notion-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '9px 14px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 700,
                  gap: '6px',
                }}
              >
                <Edit size={14} />
                <span>Update Today's Count &amp; Notes</span>
              </button>

              <button
                type="button"
                onClick={() => handleDirectUndoComplete(alreadyCompletedModalItem)}
                className="notion-btn notion-btn-bordered"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '9px 14px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 600,
                  gap: '6px',
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <RotateCcw size={14} />
                <span>Mark as Pending (Undo)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
