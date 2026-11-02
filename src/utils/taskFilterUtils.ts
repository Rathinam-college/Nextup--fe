import { Task, User, Department } from '../types';
import { parseCoAssignedTeam, CoAssignMember } from './coAssignUtils';

export interface AvailableStaffOption {
  id: string | number;
  name: string;
  dept?: string;
  email?: string;
  full_name: string;
  username: string;
  department_name?: string;
}

/**
 * Builds an alphabetically sorted list of all active staff members and assignees/co-assignees
 * found in tasks, ensuring no duplicates.
 */
export function buildAvailableStaffList(staffList?: User[], tasks?: Task[]): AvailableStaffOption[] {
  const map = new Map<string, AvailableStaffOption>();

  // 1. From official staffList
  if (staffList && staffList.length > 0) {
    staffList.forEach((u) => {
      if (u.is_active !== false) {
        const displayName = u.full_name || u.username || `User #${u.id}`;
        map.set(String(u.id), {
          id: u.id,
          name: displayName,
          full_name: u.full_name || u.username || displayName,
          username: u.username || u.full_name || displayName,
          dept: u.department_code || u.department_name,
          department_name: u.department_name || u.department_code,
          email: u.email,
        });
      }
    });
  }

  // 2. From tasks pool (primary assignees and co-assigned team members)
  if (tasks && tasks.length > 0) {
    tasks.forEach((t) => {
      if (t.assigned_to && t.assigned_to_name) {
        const idKey = String(t.assigned_to);
        if (!map.has(idKey)) {
          map.set(idKey, {
            id: t.assigned_to,
            name: t.assigned_to_name,
            full_name: t.assigned_to_name,
            username: t.assigned_to_name,
            dept: t.department_code || t.department_name,
            department_name: t.department_name || t.department_code,
            email: t.assigned_to_email,
          });
        }
      }

      const { team } = parseCoAssignedTeam(t.description);
      team.forEach((m) => {
        const key = m.staffId ? String(m.staffId) : `name_${m.staffName.trim().toLowerCase()}`;
        if (!map.has(key) && m.staffName) {
          map.set(key, {
            id: m.staffId || m.staffName,
            name: m.staffName,
            full_name: m.staffName,
            username: m.staffName,
            dept: m.deptCode || m.deptName,
            department_name: m.deptName || m.deptCode,
            email: m.staffEmail,
          });
        }
      });
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Checks whether a task is assigned or co-assigned to a specific staff member.
 */
export function isTaskAssignedToStaff(
  task: Task,
  staffIdOrKey: string | number | 'ALL' | 'UNASSIGNED',
  staffMeta?: { id?: string | number; name?: string; email?: string } | null
): boolean {
  if (staffIdOrKey === 'ALL') return true;

  const { team } = parseCoAssignedTeam(task.description);

  if (staffIdOrKey === 'UNASSIGNED') {
    return !task.assigned_to && team.length === 0;
  }

  const targetIdStr = String(staffIdOrKey);
  const targetMetaIdStr = staffMeta?.id != null ? String(staffMeta.id) : null;
  const targetName = (staffMeta?.name || (typeof staffIdOrKey === 'string' && staffIdOrKey.startsWith('name_') ? staffIdOrKey.replace(/^name_/, '') : '')).trim().toLowerCase();
  const targetEmail = staffMeta?.email ? staffMeta.email.trim().toLowerCase() : null;

  // 1. Check primary assignee
  if (task.assigned_to != null) {
    const taskAssigneeIdStr = String(task.assigned_to);
    if (taskAssigneeIdStr === targetIdStr) return true;
    if (targetMetaIdStr && taskAssigneeIdStr === targetMetaIdStr) return true;
  }

  if (targetName && task.assigned_to_name && task.assigned_to_name.trim().toLowerCase() === targetName) {
    return true;
  }

  if (targetEmail && task.assigned_to_email && task.assigned_to_email.trim().toLowerCase() === targetEmail) {
    return true;
  }

  // 2. Check co-assigned team members
  if (team.length > 0) {
    const matchedInTeam = team.some((m) => {
      if (m.staffId != null) {
        const mIdStr = String(m.staffId);
        if (mIdStr === targetIdStr) return true;
        if (targetMetaIdStr && mIdStr === targetMetaIdStr) return true;
      }
      if (targetName && m.staffName && m.staffName.trim().toLowerCase() === targetName) {
        return true;
      }
      if (targetEmail && m.staffEmail && m.staffEmail.trim().toLowerCase() === targetEmail) {
        return true;
      }
      return false;
    });
    if (matchedInTeam) return true;
  }

  return false;
}

/**
 * Checks whether a task belongs to a department either directly or through a co-assigned team member.
 */
export function isTaskInDepartment(
  task: Task,
  deptIdOrKey: number | string | 'ALL',
  deptName?: string | null
): boolean {
  if (deptIdOrKey === 'ALL') return true;

  const targetDeptIdStr = String(deptIdOrKey);
  const normalizedDeptName = deptName ? deptName.trim().toLowerCase() : null;

  // 1. Check primary department
  if (task.department != null && String(task.department) === targetDeptIdStr) {
    return true;
  }
  if (normalizedDeptName && task.department_name && task.department_name.trim().toLowerCase() === normalizedDeptName) {
    return true;
  }

  // 2. Check co-assigned team members
  const { team } = parseCoAssignedTeam(task.description);
  if (team.length > 0) {
    const matchedInTeam = team.some((m) => {
      if (m.departmentId != null && String(m.departmentId) === targetDeptIdStr) return true;
      if (normalizedDeptName && m.deptName && m.deptName.trim().toLowerCase() === normalizedDeptName) return true;
      return false;
    });
    if (matchedInTeam) return true;
  }

  return false;
}
