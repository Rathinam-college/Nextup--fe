import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    label: 'English (Simple)',
    nativeLabel: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'ta',
    label: 'Tamil (தமிழ்)',
    nativeLabel: 'தமிழ்',
    flag: '🇮🇳',
  },
];

// Comprehensive dictionary with simple, everyday English and natural, polite Tamil
export const DICTIONARY: Record<string, Record<Language, string>> = {
  // Navigation & Workspace
  workspace: { en: 'Workspace', ta: 'பணி இடம்' },
  allTasks: { en: 'All Tasks', ta: 'அனைத்து பணிகள்' },
  staffMatrix: { en: 'Staff Work Table', ta: 'பணியாளர் பணி அட்டவணை' },
  personalDesk: { en: 'My Private Desk', ta: 'எனது சொந்த வேலை மேசை' },
  strictlyPrivate: { en: 'Private', ta: 'தனிப்பட்டது' },
  todayUrgent: { en: 'Urgent Today', ta: 'இன்றைய அவசர பணிகள்' },
  approvalsHub: { en: 'Task Approvals', ta: 'பணிகள் ஒப்புதல்' },
  departments: { en: 'Departments', ta: 'துறைகள்' },
  staffDirectory: { en: 'Staff List', ta: 'பணியாளர்கள் பட்டியல்' },
  reportsAnalytics: { en: 'Work Reports', ta: 'பணி அறிக்கைகள்' },
  systemSettings: { en: 'Settings', ta: 'அமைப்புகள்' },
  auditCompliance: { en: 'System Logs', ta: 'செயல்பாட்டு பதிவுகள்' },
  emailLogs: { en: 'Email History', ta: 'மின்னஞ்சல் வரலாறு' },
  activityTrail: { en: 'Activity History', ta: 'வரலாற்று பதிவு' },
  exportCsv: { en: 'Download Excel/CSV', ta: 'Excel/CSV பதிவிறக்கு' },
  departmentFilters: { en: 'Department Filter', ta: 'துறை வடிகட்டி' },
  assignedDept: { en: 'Your Department', ta: 'உங்கள் துறை' },
  allDepartments: { en: 'All Departments', ta: 'அனைத்து துறைகளும்' },
  signOut: { en: 'Sign Out', ta: 'வெளியேறு' },
  theme: { en: 'Theme', ta: 'வண்ணம்' },
  language: { en: 'Language', ta: 'மொழி' },
  switchPersona: { en: 'Switch User Role', ta: 'பயனர் மாற்றம்' },

  // Top Bar & Views
  boardView: { en: 'Board', ta: 'அட்டை வடிவம்' },
  listView: { en: 'List', ta: 'பட்டியல்' },
  tableView: { en: 'Table', ta: 'அட்டவணை' },
  calendarView: { en: 'Calendar', ta: 'நாள்காட்டி' },
  searchPlaceholder: { en: 'Search tasks, staff...', ta: 'பணிகள், பணியாளர்களைத் தேடுக...' },
  newTask: { en: 'New Task', ta: 'புதிய பணி' },
  directTask: { en: 'Direct Task', ta: 'நேரடி பணி' },
  addStaff: { en: 'Add Staff', ta: 'புதிய பணியாளர்' },
  newDepartment: { en: 'Add Department', ta: 'புதிய துறை' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்' },

  // Task Statuses (Simple, normal English and clear Tamil)
  status_todo: { en: 'To Do', ta: 'தொடங்க வேண்டியவை' },
  status_in_progress: { en: 'In Progress', ta: 'நடந்துகொண்டிருக்கிறது' },
  status_pending_gm_approval: { en: 'Waiting for Approval', ta: 'ஒப்புதலுக்கு காத்திருக்கிறது' },
  status_changes_requested: { en: 'Needs Changes', ta: 'மாற்றங்கள் தேவை' },
  status_closed: { en: 'Completed', ta: 'முடிந்தது' },

  // Priorities
  priority_urgent: { en: 'Urgent', ta: 'மிக அவசரம்!' },
  priority_high: { en: 'High', ta: 'முக்கியம்' },
  priority_medium: { en: 'Medium', ta: 'சாதாரண' },
  priority_low: { en: 'Low', ta: 'குறைவு' },

  // Task Actions & Modal
  taskTitle: { en: 'Task Title', ta: 'பணியின் தலைப்பு' },
  taskDescription: { en: 'Description & Notes', ta: 'பணியின் விவரம் & குறிப்புகள்' },
  department: { en: 'Department', ta: 'துறை' },
  assignedTo: { en: 'Assigned To', ta: 'பொறுப்பாளர் (Staff)' },
  assignedBy: { en: 'Assigned By', ta: 'வழங்கியவர்' },
  dueDate: { en: 'Due Date', ta: 'முடிக்க வேண்டிய நாள்' },
  priority: { en: 'Priority', ta: 'முன்னுரிமை' },
  status: { en: 'Status', ta: 'நிலை' },
  startWork: { en: 'Start Work', ta: 'வேலையைத் தொடங்கு' },
  submitForApproval: { en: 'Submit for Approval', ta: 'ஒப்புதலுக்கு அனுப்பு' },
  approveAndClose: { en: 'Approve & Complete', ta: 'சரிபார்த்து ஒப்புதல் செய்' },
  requestChanges: { en: 'Request Changes', ta: 'திருத்தங்கள் கோரு' },
  editTask: { en: 'Edit Task', ta: 'பணியைத் திருத்து' },
  deleteTask: { en: 'Delete Task', ta: 'பணியை நீக்கு' },
  saveChanges: { en: 'Save Changes', ta: 'சேமிக்க' },
  cancel: { en: 'Cancel', ta: 'ரத்து செய்' },
  addComment: { en: 'Add a comment or note...', ta: 'குறிப்பு அல்லது கருத்தை உள்ளிடுக...' },
  send: { en: 'Send', ta: 'அனுப்பு' },
  attachedImage: { en: 'Attached Photo', ta: 'இணைக்கப்பட்ட படம்' },
  addImage: { en: 'Add Photo (Optional)', ta: 'படம் இணைக்க (விருப்பம்)' },
  sendMessageToStaff: { en: 'Send Message to Staff', ta: 'பணியாளருக்கு செய்தி அனுப்பு' },
  overdue: { en: 'Overdue', ta: 'காலக்கெடு முடிந்தது' },
  dueToday: { en: 'Due Today', ta: 'இன்று முடிக்க வேண்டும்' },
  dueTomorrow: { en: 'Due Tomorrow', ta: 'நாளை முடிக்க வேண்டும்' },
  daysLeft: { en: 'days left', ta: 'நாட்கள் உள்ளன' },

  // Create Task Modal
  createNewTask: { en: 'Create New Task', ta: 'புதிய பணியை உருவாக்கு' },
  reportIssue: { en: 'Report a Problem / Issue', ta: 'பிரச்சனை / புகார் பதிவு செய்' },
  deliverableTaskTab: { en: 'Normal Task', ta: 'சாதாரண பணி' },
  directTaskTab: { en: 'Direct Task (No Review)', ta: 'நேரடி பணி (ஒப்புதல் தேவையில்லை)' },
  reportIssueTab: { en: 'Report Problem', ta: 'புகார் / பிரச்சனை' },
  taskTitlePlaceholder: { en: 'What needs to be done? (e.g. Prepare monthly budget report)', ta: 'என்ன வேலை செய்ய வேண்டும்? (எ.கா: மாதாந்திர அறிக்கை தயார் செய்தல்)' },
  taskDescPlaceholder: { en: 'Write simple instructions, details, or steps...', ta: 'வேலைக்கான எளிய விவரங்கள் அல்லது குறிப்புகளை எழுதவும்...' },
  selectStaffPlaceholder: { en: 'Choose staff member...', ta: 'பணியாளரைத் தேர்ந்தெடுக்கவும்...' },
  selectDeptPlaceholder: { en: 'Choose department...', ta: 'துறையைத் தேர்ந்தெடுக்கவும்...' },
  createTaskButton: { en: 'Create Task', ta: 'பணியை உருவாக்கு' },

  // Table Matrix
  staffMember: { en: 'Staff Member', ta: 'பணியாளர்' },
  openTasks: { en: 'Open Tasks', ta: 'தொடங்க வேண்டியவை' },
  inProgressTasks: { en: 'In Progress', ta: 'நடந்துகொண்டிருக்கிறது' },
  completedTasks: { en: 'Completed', ta: 'முடிந்தது' },
  totalCount: { en: 'Total', ta: 'மொத்தம்' },
  unassignedTasks: { en: 'Unassigned Tasks', ta: 'பொறுப்பாளர் இல்லாத பணிகள்' },
  allStaffMembers: { en: 'All Staff Members', ta: 'அனைத்து பணியாளர்கள்' },
  searchStaffPlaceholder: { en: 'Search staff by name or job...', ta: 'பெயர் அல்லது பதவி மூலம் தேடுக...' },
  noStaffFound: { en: 'No staff members found', ta: 'பணியாளர்கள் எவரும் காணப்படவில்லை' },

  // Approvals Hub
  approvalsTitle: { en: 'Tasks Waiting for Approval', ta: 'ஒப்புதலுக்காக காத்திருக்கும் பணிகள்' },
  approvalsSubtitle: { en: 'Staff members have finished these tasks. Please review and click Approve.', ta: 'பணியாளர்கள் இந்த வேலைகளை முடித்துள்ளனர். சரிபார்த்து ஒப்புதல் அளிக்கவும்.' },
  allClearedTitle: { en: 'All Clear! No Pending Approvals', ta: 'அனைத்தும் சரிபார்க்கப்பட்டது! நிலுவையில் ஏதுமில்லை' },
  allClearedSubtitle: { en: 'There are no tasks waiting for approval right now.', ta: 'தற்போது ஒப்புதலுக்காக எந்தப் பணியும் காத்திருக்கவில்லை.' },

  // Self Desk (Personal Tasks & Notes)
  myPrivateDeskTitle: { en: 'My Private Desk', ta: 'எனது சொந்த வேலை மேசை' },
  myPrivateDeskSubtitle: { en: 'Your personal tasks and quick notes. Only you can see them.', ta: 'உங்களது சொந்த பணிகள் மற்றும் குறிப்புகள். நீங்கள் மட்டுமே பார்க்க முடியும்.' },
  myTasksTab: { en: 'My Private Tasks', ta: 'எனது சொந்த பணிகள்' },
  myNotesTab: { en: 'My Quick Notes', ta: 'எனது குறிப்புகள்' },
  quickAddPlaceholder: { en: 'Add a quick personal task and press Enter...', ta: 'விரைவான சொந்த பணியை உள்ளிட்டு Enter அழுத்தவும்...' },
  addTaskBtn: { en: '+ Add Task', ta: '+ பணி சேர்' },
  addNoteBtn: { en: '+ New Note', ta: '+ புதிய குறிப்பு' },
  noPersonalTasks: { en: 'No personal tasks yet. Add one above!', ta: 'சொந்த பணிகள் எதுவும் இல்லை. மேலே உள்ள பெட்டியில் சேர்க்கவும்!' },
  noPersonalNotes: { en: 'No personal notes yet. Click + New Note above!', ta: 'குறிப்புகள் எதுவும் இல்லை. மேலே + புதிய குறிப்பு என்பதை கிளிக் செய்யவும்!' },

  // Login Page
  loginWelcome: { en: 'Welcome to NextUp', ta: 'NextUp-க்கு வரவேற்கிறோம்' },
  loginSubtitle: { en: 'Campus Task & Work Management System', ta: 'கல்லூரி பணி மற்றும் வேலை மேலாண்மை தளம்' },
  username: { en: 'Username', ta: 'பயனர் பெயர் (Username)' },
  password: { en: 'Password', ta: 'கடவுச்சொல் (Password)' },
  rememberMe: { en: 'Remember me', ta: 'என்னை நினைவில் கொள்' },
  signIn: { en: 'Sign In', ta: 'உள்நுழைக' },
  signingIn: { en: 'Signing in...', ta: 'உள்நுழைகிறது...' },
  enterCredentials: { en: 'Please enter your username and password', ta: 'உங்கள் பயனர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்' },

  // General & Common
  loading: { en: 'Loading...', ta: 'ஏற்றுகிறது...' },
  refresh: { en: 'Refresh', ta: 'புதுப்பி' },
  close: { en: 'Close', ta: 'மூடு' },
  back: { en: 'Back', ta: 'பின்னே' },
  actions: { en: 'Actions', ta: 'செயல்கள்' },
  filter: { en: 'Filter', ta: 'வடிகட்டி' },
  clear: { en: 'Clear', ta: 'அழி' },
  save: { en: 'Save', ta: 'சேமி' },
  delete: { en: 'Delete', ta: 'நீக்கு' },
  success: { en: 'Success', ta: 'வெற்றி' },
  error: { en: 'Error', ta: 'பிழை' },
  today: { en: 'Today', ta: 'இன்று' },
  yesterday: { en: 'Yesterday', ta: 'நேற்று' },
  tomorrow: { en: 'Tomorrow', ta: 'நாளை' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  isTamil: boolean;
  availableLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('task_tracker_language') as Language;
      return saved === 'ta' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('task_tracker_language', language);
      document.documentElement.setAttribute('lang', language);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ta' : 'en'));
  };

  const t = (key: string, defaultText?: string): string => {
    if (DICTIONARY[key]) {
      return DICTIONARY[key][language] || DICTIONARY[key]['en'] || defaultText || key;
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isTamil: language === 'ta',
        availableLanguages: LANGUAGE_OPTIONS,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper for status translation
export const getTranslatedStatus = (status: string, language: Language = 'en'): string => {
  const keyMap: Record<string, string> = {
    TODO: 'status_todo',
    IN_PROGRESS: 'status_in_progress',
    PENDING_GM_APPROVAL: 'status_pending_gm_approval',
    CHANGES_REQUESTED: 'status_changes_requested',
    CLOSED: 'status_closed',
  };
  const key = keyMap[status];
  if (key && DICTIONARY[key]) {
    return DICTIONARY[key][language];
  }
  return status;
};

// Helper for priority translation
export const getTranslatedPriority = (priority: string, language: Language = 'en'): string => {
  const keyMap: Record<string, string> = {
    URGENT: 'priority_urgent',
    HIGH: 'priority_high',
    MEDIUM: 'priority_medium',
    LOW: 'priority_low',
  };
  const key = keyMap[priority];
  if (key && DICTIONARY[key]) {
    return DICTIONARY[key][language];
  }
  return priority;
};
