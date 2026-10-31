import { User, Role } from '../types';

export type ViewType =
  | 'board'
  | 'table'
  | 'list'
  | 'calendar'
  | 'self_desk'
  | 'today'
  | 'approvals'
  | 'departments'
  | 'staff'
  | 'report'
  | 'settings';

export interface AppPageDef {
  key: ViewType;
  label: string;
  category: 'Workspace' | 'Executive Desk' | 'Directory & Reports' | 'Administration';
  description: string;
  route: string;
  iconName: string;
}

export const ALL_APP_PAGES: AppPageDef[] = [
  {
    key: 'board',
    label: 'Tasks & Actions (Kanban Board)',
    category: 'Workspace',
    description: 'Main task tracking board with drag-and-drop status stages',
    route: '/nextup/board',
    iconName: 'CheckSquare',
  },
  {
    key: 'table',
    label: 'Staff Matrix Table',
    category: 'Workspace',
    description: 'Spreadsheet-style task matrix with inline edits & sorting',
    route: '/nextup/table',
    iconName: 'Table',
  },
  {
    key: 'list',
    label: 'Task List View',
    category: 'Workspace',
    description: 'Compact list view of all departmental deliverables',
    route: '/nextup/list',
    iconName: 'List',
  },
  {
    key: 'calendar',
    label: 'Task Calendar',
    category: 'Workspace',
    description: 'Monthly & weekly schedule view of deadlines and due dates',
    route: '/nextup/calendar',
    iconName: 'Calendar',
  },
  {
    key: 'self_desk',
    label: 'Personal Desk (Private Notes & Tasks)',
    category: 'Workspace',
    description: 'Confidential personal workspace, notes & checklists',
    route: '/nextup/self-desk',
    iconName: 'Lock',
  },
  {
    key: 'today',
    label: 'Today & Urgent Desk',
    category: 'Executive Desk',
    description: 'High-priority deliverables, overdue items & immediate action items',
    route: '/nextup/today',
    iconName: 'Flame',
  },
  {
    key: 'approvals',
    label: 'GM Approvals Hub',
    category: 'Executive Desk',
    description: 'Review and approve/reject work submitted by staff',
    route: '/nextup/approvals',
    iconName: 'ShieldCheck',
  },
  {
    key: 'departments',
    label: 'Departments Management',
    category: 'Executive Desk',
    description: 'Manage departmental units, members count, and department codes',
    route: '/nextup/departments',
    iconName: 'Building',
  },
  {
    key: 'staff',
    label: 'Personnel & Staff Directory',
    category: 'Directory & Reports',
    description: 'View staff directory, assign roles & configure user page permissions',
    route: '/nextup/staff',
    iconName: 'Users',
  },
  {
    key: 'report',
    label: 'Reports & Analytics',
    category: 'Directory & Reports',
    description: 'Performance charts, completion rates, and CSV export',
    route: '/nextup/report',
    iconName: 'BarChart3',
  },
  {
    key: 'settings',
    label: 'System Administration & Settings',
    category: 'Administration',
    description: 'System configurations, audit trails & security controls',
    route: '/nextup/settings',
    iconName: 'Settings',
  },
];

export const getDefaultAllowedPagesForRole = (role?: Role): ViewType[] => {
  if (role === 'SUPER_ADMIN' || role === 'GENERAL_MANAGER') {
    return ALL_APP_PAGES.map((p) => p.key);
  }
  if (role === 'DEPT_MANAGER') {
    return ['board', 'table', 'list', 'calendar', 'self_desk', 'departments', 'staff', 'report'];
  }
  // Standard Staff
  return ['board', 'table', 'list', 'calendar', 'self_desk', 'staff'];
};

export const isUserAllowedToViewPage = (user: User | null | undefined, view: ViewType): boolean => {
  if (!user) return false;
  // Super Admin always has full access to avoid accidental lockout
  if (user.role === 'SUPER_ADMIN') return true;

  // Check explicit allowed_pages list if present on user
  if (Array.isArray(user.allowed_pages)) {
    return user.allowed_pages.includes(view);
  }

  // Fallback to role defaults
  return getDefaultAllowedPagesForRole(user.role).includes(view);
};
