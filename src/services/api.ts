import {
  User, Department, Task, NotificationItem,
  DispatchedEmail, ActivityLogItem, DashboardStats, TaskComment, SystemStats, EmailStatus, EmailSettingsPayload,
  SelfTask, SelfNote
} from '../types';

let activeUserId: number | null = null;

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 Days / 3 Months persistent login

export const setActiveUserHeader = (id: number | null) => {
  activeUserId = id;
  if (id) {
    localStorage.setItem('task_tracker_active_user_id', id.toString());
    const expiresAt = Date.now() + THREE_MONTHS_MS;
    localStorage.setItem('task_tracker_session_expiry', expiresAt.toString());
  } else {
    localStorage.removeItem('task_tracker_active_user_id');
    localStorage.removeItem('task_tracker_session_expiry');
  }
};

export const getSavedActiveUserId = (): number | null => {
  const expiry = localStorage.getItem('task_tracker_session_expiry');
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    // Session expired after 3 months
    setActiveUserHeader(null);
    return null;
  }
  const val = localStorage.getItem('task_tracker_active_user_id');
  return val ? parseInt(val, 10) : null;
};

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (cleanEndpoint.startsWith('/nextup/')) {
    return cleanEndpoint;
  }
  const isNextup =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/nextup') ||
      window.location.pathname.includes('/nextup'));
  const base = isNextup ? '/nextup' : '';
  return `${base}${cleanEndpoint}`;
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const currentId = activeUserId || getSavedActiveUserId();
  const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/logout') || url.includes('/api/auth/personas');
  if (currentId && !isAuthEndpoint) {
    headers['X-Active-User-Id'] = currentId.toString();
  }

  const response = await fetch(getApiUrl(url), {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errorDetail = errJson.detail;
      else if (errJson.error) errorDetail = errJson.error;
      else if (typeof errJson === 'object') {
        errorDetail = Object.entries(errJson)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      }
    } catch {
      // ignore
    }

    if (response.status === 401 || response.status === 403) {
      if (
        errorDetail.includes('Authentication credentials were not provided') ||
        errorDetail.includes('User for persona switcher not found')
      ) {
        setActiveUserHeader(null);
      }
    }

    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const api = {
  // Personas & Auth
  login: async (username: string, password: string) => {
    setActiveUserHeader(null);
    return request<User>('/api/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) });
  },
  logout: () =>
    request<{ status: string }>('/api/auth/logout/', { method: 'POST' }),
  getPersonas: () => request<User[]>('/api/auth/personas/'),
  getCurrentUser: () => request<User>('/api/auth/me/'),
  getDashboardStats: () => request<DashboardStats>('/api/dashboard/stats/'),

  // Departments
  getDepartments: () => request<Department[]>('/api/departments/'),
  createDepartment: (data: Partial<Department>) =>
    request<Department>('/api/departments/', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: Partial<Department>) =>
    request<Department>(`/api/departments/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDepartment: (id: number) =>
    request<void>(`/api/departments/${id}/`, { method: 'DELETE' }),

  // Users & Staff CRUD
  getUsers: (params?: { department?: number; role?: string }) => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department.toString());
    if (params?.role) query.append('role', params.role);
    return request<User[]>(`/api/users/?${query.toString()}`);
  },
  createUser: (data: Partial<User> & { password?: string }) =>
    request<User>('/api/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: Partial<User>) =>
    request<User>(`/api/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: number) =>
    request<void>(`/api/users/${id}/`, { method: 'DELETE' }),
  toggleUserStatus: (id: number) =>
    request<{ status: string; is_active: boolean; message: string }>(`/api/users/${id}/toggle_status/`, { method: 'POST' }),
  resetUserPassword: (id: number, new_password: string) =>
    request<{ status: string; message: string }>(`/api/users/${id}/reset_password/`, {
      method: 'POST',
      body: JSON.stringify({ new_password }),
    }),

  // Tasks
  getTasks: (params?: { department?: number; status?: string; priority?: string; assigned_to?: number; my_tasks?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to.toString());
    if (params?.my_tasks) query.append('my_tasks', 'true');
    return request<Task[]>(`/api/tasks/?${query.toString()}`);
  },
  getTask: (id: number) => request<Task>(`/api/tasks/${id}/`),
  createTask: (data: Partial<Task>) =>
    request<Task>('/api/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: number) =>
    request<void>(`/api/tasks/${id}/`, { method: 'DELETE' }),

  // Lifecycle transitions
  startWork: (id: number, data?: { attachment_image?: string; image?: string }) =>
    request<Task>(`/api/tasks/${id}/start-work/`, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  submitForApproval: (id: number, data?: { attachment_image?: string; image?: string }) =>
    request<Task>(`/api/tasks/${id}/submit-for-approval/`, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  attachImage: (id: number, attachment_image: string) =>
    request<Task>(`/api/tasks/${id}/attach-image/`, { method: 'POST', body: JSON.stringify({ attachment_image }) }),
  gmReview: (id: number, action: 'APPROVE' | 'REQUEST_CHANGES', notes: string) =>
    request<Task>(`/api/tasks/${id}/gm-review/`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    }),

  // Timeline & Task Assignment Email Notifications
  sendTaskTimelineReminder: (taskId: number) =>
    request<{ status: string; message: string }>(`/api/tasks/${taskId}/send-timeline-reminder/`, {
      method: 'POST',
    }),
  sendTaskAssignmentEmail: (taskId: number) =>
    request<{ status: string; message: string }>(`/api/tasks/${taskId}/send-assignment-email/`, {
      method: 'POST',
    }),
  pushMessageToAssignee: (
    taskId: number,
    data: { message: string; send_email?: boolean; send_in_app?: boolean; is_urgent?: boolean }
  ) =>
    request<{ status: string; message: string; details: any }>(`/api/tasks/${taskId}/push-message/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkAllTimelineReminders: () =>
    request<{
      status: string;
      message: string;
      details: {
        tasks_checked: number;
        emails_dispatched: number;
        items: Array<{ task_id: number; title: string; timeline_text: string; assignee_email: string }>;
      };
    }>('/api/tasks/check-timeline-reminders/', {
      method: 'POST',
    }),

  // Comments
  addComment: (taskId: number, content: string) =>
    request<TaskComment>('/api/comments/', {
      method: 'POST',
      body: JSON.stringify({ task: taskId, content }),
    }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/api/notifications/'),
  markAllNotificationsRead: () =>
    request<{ status: string }>('/api/notifications/mark-all-read/', { method: 'POST' }),
  markNotificationRead: (id: number) =>
    request<{ status: string }>(`/api/notifications/${id}/mark-read/`, { method: 'POST' }),
  triggerHourlyReminder: (targetAll = false) =>
    request<{ status: string; message: string; dispatched_count: number }>(
      '/api/notifications/trigger-hourly-reminder/',
      { method: 'POST', body: JSON.stringify({ all: targetAll }) }
    ),
  triggerDailyReminder: (targetAll = false) =>
    request<{ status: string; message: string; dispatched_count: number }>(
      '/api/notifications/trigger-hourly-reminder/',
      { method: 'POST', body: JSON.stringify({ all: targetAll }) }
    ),


  // Dispatched Email Logs & Audit Logs
  getEmailLogs: () => request<DispatchedEmail[]>('/api/email-logs/'),
  getActivityLogs: () => request<ActivityLogItem[]>('/api/activity-logs/'),

  // Export CSV download URL helper
  getCsvExportUrl: () => {
    const currentId = activeUserId || getSavedActiveUserId();
    return getApiUrl(`/api/tasks/export-csv/${currentId ? `?active_user_id=${currentId}` : ''}`);
  },

  // Super Admin System & Database Backup
  getAdminSystemStats: () => request<SystemStats>('/api/admin/system-stats/'),
  downloadSqlBackup: async () => {
    const activeId = activeUserId || getSavedActiveUserId();
    const endpoint = `/api/admin/backup/sql/${activeId ? `?active_user_id=${activeId}` : ''}`;
    const res = await fetch(getApiUrl(endpoint), {
      headers: activeId ? { 'X-Active-User-Id': activeId.toString() } : {},
      credentials: 'include',
    });
    if (!res.ok) {
      let errorMsg = `Failed to generate SQL dump backup (status ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMsg = errJson.detail;
        else if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = res.headers.get('content-disposition');
    let filename = 'task_tracker_backup.sql';
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  downloadJsonBackup: async () => {
    const activeId = activeUserId || getSavedActiveUserId();
    const endpoint = `/api/admin/backup/json/${activeId ? `?active_user_id=${activeId}` : ''}`;
    const res = await fetch(getApiUrl(endpoint), {
      headers: activeId ? { 'X-Active-User-Id': activeId.toString() } : {},
      credentials: 'include',
    });
    if (!res.ok) {
      let errorMsg = `Failed to generate JSON backup (status ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errorMsg = errJson.detail;
        else if (errJson.error) errorMsg = errJson.error;
      } catch (_) {}
      throw new Error(errorMsg);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = res.headers.get('content-disposition');
    let filename = 'task_tracker_backup.json';
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  restoreDatabaseSql: async (options: { file?: File; sqlContent?: string; wipeBeforeRestore?: boolean }) => {
    const activeId = activeUserId || getSavedActiveUserId();
    const formData = new FormData();
    if (options.file) {
      formData.append('file', options.file);
    }
    if (options.sqlContent) {
      formData.append('sql_content', options.sqlContent);
    }
    formData.append('wipe_before_restore', options.wipeBeforeRestore ?? true ? 'true' : 'false');
    if (activeId) {
      formData.append('active_user_id', activeId.toString());
    }

    const headers: Record<string, string> = {};
    if (activeId) headers['X-Active-User-Id'] = activeId.toString();

    const endpoint = `/api/admin/restore/sql/${activeId ? `?active_user_id=${activeId}` : ''}`;
    const res = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    let data: any;
    try {
      data = await res.json();
    } catch (_) {
      throw new Error(`Failed to restore database from SQL (status ${res.status} ${res.statusText})`);
    }
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Failed to restore database from SQL');
    }
    return data as {
      status: string;
      message: string;
      method?: string;
      admin?: {
        id: number;
        username: string;
        role: string;
        full_name?: string;
      };
      summary?: {
        departments: number;
        users: number;
        tasks: number;
        comments: number;
        notifications: number;
        email_logs: number;
      };
    };
  },
  restoreDatabaseJson: async (file: File) => {
    const activeId = activeUserId || getSavedActiveUserId();
    const formData = new FormData();
    formData.append('file', file);
    if (activeId) {
      formData.append('active_user_id', activeId.toString());
    }

    const headers: Record<string, string> = {};
    if (activeId) headers['X-Active-User-Id'] = activeId.toString();

    const endpoint = `/api/admin/restore/json/${activeId ? `?active_user_id=${activeId}` : ''}`;
    const res = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    let data: any;
    try {
      data = await res.json();
    } catch (_) {
      throw new Error(`Failed to restore database from JSON (status ${res.status} ${res.statusText})`);
    }
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Failed to restore database from JSON fixture');
    }
    return data as {
      status: string;
      message: string;
      admin?: {
        id: number;
        username: string;
        role: string;
        full_name?: string;
      };
      summary?: {
        departments: number;
        users: number;
        tasks: number;
      };
    };
  },
  clearDatabase: (data: {
    confirmation: string;
    admin_username?: string;
    admin_password?: string;
    keep_departments?: boolean;
  }) =>
    request<{
      status: string;
      message: string;
      preserved_admin: { id: number; username: string; role: string; full_name: string };
    }>('/api/admin/clear-database/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEmailStatus: () => request<EmailStatus>('/api/admin/email-status/'),
  updateEmailSettings: (payload: EmailSettingsPayload) =>
    request<{ status: string; message: string; settings: EmailStatus }>('/api/admin/email-settings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendTestEmail: (email: string) =>
    request<{ status: string; message: string; details: any }>('/api/admin/send-test-email/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Self Tasks (Personal tasks strictly private to each user)
  getSelfTasks: (params?: { status?: string; is_completed?: boolean }) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.is_completed !== undefined) q.append('is_completed', String(params.is_completed));
      const s = q.toString();
      if (s) query = `?${s}`;
    }
    return request<SelfTask[]>(`/api/self-tasks/${query}`);
  },
  createSelfTask: (data: Partial<SelfTask>) =>
    request<SelfTask>('/api/self-tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSelfTask: (id: number, data: Partial<SelfTask>) =>
    request<SelfTask>(`/api/self-tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSelfTask: (id: number) =>
    request<{ status: string }>(`/api/self-tasks/${id}/`, {
      method: 'DELETE',
    }),
  toggleCompleteSelfTask: (id: number) =>
    request<SelfTask>(`/api/self-tasks/${id}/toggle-complete/`, {
      method: 'POST',
    }),

  // Self Notes (Personal notes strictly private to each user)
  getSelfNotes: (params?: { category?: string; is_pinned?: boolean }) => {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.category) q.append('category', params.category);
      if (params.is_pinned !== undefined) q.append('is_pinned', String(params.is_pinned));
      const s = q.toString();
      if (s) query = `?${s}`;
    }
    return request<SelfNote[]>(`/api/self-notes/${query}`);
  },
  createSelfNote: (data: Partial<SelfNote>) =>
    request<SelfNote>('/api/self-notes/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSelfNote: (id: number, data: Partial<SelfNote>) =>
    request<SelfNote>(`/api/self-notes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSelfNote: (id: number) =>
    request<{ status: string }>(`/api/self-notes/${id}/`, {
      method: 'DELETE',
    }),
  togglePinSelfNote: (id: number) =>
    request<SelfNote>(`/api/self-notes/${id}/toggle-pin/`, {
      method: 'POST',
    }),
  checkSelfNoteReminders: () =>
    request<{ triggered_count: number; triggered_notes: SelfNote[] }>(
      '/api/self-notes/check-reminders/',
      { method: 'POST' }
    ),
  sendSelfNoteReminder: (id: number) =>
    request<{ status: string; message: string; note: SelfNote }>(
      `/api/self-notes/${id}/send-reminder/`,
      { method: 'POST' }
    ),
};
