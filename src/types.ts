export type Role = 'SUPER_ADMIN' | 'GENERAL_MANAGER' | 'DEPT_MANAGER' | 'STAFF';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PENDING_GM_APPROVAL' | 'CHANGES_REQUESTED' | 'CLOSED';

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at?: string;
  members_count: number;
  active_tasks_count: number;
  manager?: {
    id: number;
    name: string;
    email: string;
    username: string;
  } | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  role_display?: string;
  department: number | null;
  department_name?: string;
  department_code?: string;
  phone?: string;
  job_title?: string;
  is_active?: boolean;
  allowed_pages?: string[];
}

export interface TaskComment {
  id: number;
  task: number;
  author: number;
  author_name: string;
  author_role: Role;
  content: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  department: number;
  department_name: string;
  department_code: string;
  assigned_to: number | null;
  assigned_to_name: string;
  assigned_to_email?: string;
  assigned_to_phone?: string;
  created_by: number;
  created_by_name: string;
  priority: Priority;
  priority_display: string;
  status: TaskStatus;
  status_display: string;
  due_date: string | null;
  gm_feedback_notes?: string;
  verified_by?: number | null;
  verified_by_name?: string;
  closed_at?: string | null;
  attachment_image?: string | null;
  image?: string | null;
  is_gm_own_task?: boolean;
  created_at: string;
  updated_at: string;
  comments?: TaskComment[];
}

export interface NotificationItem {
  id: number;
  recipient: number;
  title: string;
  message: string;
  notification_type: string;
  task: number | null;
  is_read: boolean;
  created_at: string;
}

export interface DispatchedEmail {
  id: number;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  event_type: string;
  created_at: string;
}

export interface ActivityLogItem {
  id: number;
  user: number | null;
  user_name: string;
  action: string;
  details: string;
  department: number | null;
  department_name?: string;
  task: number | null;
  timestamp: string;
}

export interface DashboardStats {
  total_tasks: number;
  todo_count: number;
  in_progress_count: number;
  pending_gm_count: number;
  changes_requested_count: number;
  closed_count: number;
  dept_stats: Array<{
    id: number;
    name: string;
    code: string;
    total: number;
    pending_gm: number;
    in_progress: number;
    closed: number;
    members_count: number;
  }>;
}

export interface SystemStats {
  database_name: string;
  database_engine: string;
  database_version: string;
  database_size: string;
  host: string;
  status: string;
  server_time: string;
  tables: {
    departments: number;
    users: number;
    tasks: number;
    comments: number;
    notifications: number;
    email_logs: number;
    activity_logs: number;
  };
  users_breakdown: {
    total: number;
    active: number;
    inactive: number;
    super_admin: number;
    general_manager: number;
    dept_manager: number;
    staff: number;
  };
  tasks_breakdown: {
    total: number;
    todo: number;
    in_progress: number;
    pending_gm: number;
    changes_requested: number;
    closed: number;
  };
}

export interface EmailStatus {
  backend: string;
  mode: string;
  host: string;
  port: number;
  use_tls: boolean;
  from_email: string;
  has_smtp_user: boolean;
  has_smtp_password: boolean;
  total_dispatched_emails: number;
  email_host_user?: string;
}

export interface EmailSettingsPayload {
  email_host_user?: string;
  email_host_password?: string;
  email_host?: string;
  email_port?: number;
  email_use_tls?: boolean;
  default_from_email?: string;
}

export interface SelfTask {
  id: number;
  user: number;
  user_name: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priority_display: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  status_display: string;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelfNote {
  id: number;
  user: number;
  user_name: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'WORK' | 'MEETING' | 'IDEA' | 'CHECKLIST';
  category_display: string;
  color?: string;
  is_pinned: boolean;
  reminder_date?: string | null;
  reminder_time?: string | null;
  reminder_enabled?: boolean;
  is_reminder_sent?: boolean;
  created_at: string;
  updated_at: string;
}

