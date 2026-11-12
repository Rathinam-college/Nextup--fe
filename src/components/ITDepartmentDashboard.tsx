import React, { useState, useEffect, useMemo } from 'react';
import { User, Department } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Code,
  Server,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Globe,
  Shield,
  Database,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  Layers,
  ExternalLink,
  FileText,
  BarChart2,
  Cpu,
  TrendingUp,
  Trash2,
  Edit,
  Terminal,
  Check,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Wifi,
  Lock,
  GitBranch,
  Calendar,
  User as UserIcon,
  HelpCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

export type ITSectionTab =
  | 'overview'
  | 'registry'
  | 'dev_tracker'
  | 'live_apps'
  | 'upcoming'
  | 'reports';

export interface SoftwareAppItem {
  id: string;
  name: string;
  code: string;
  category: 'Academic & LMS' | 'Administrative ERP' | 'Student Services' | 'Campus Operations' | 'Security & Infrastructure' | 'Finance & Payments';
  version: string;
  environment: 'Production' | 'Staging' | 'Development' | 'Maintenance' | 'Deprecated';
  techStack: string[];
  database: string;
  serverHost: string;
  leadDeveloper: string;
  repoUrl?: string;
  docsUrl?: string;
  deploymentUrl?: string;
  uptimePercent: number;
  lastDeployed: string;
  description: string;
}

export interface DevTrackerItem {
  id: string;
  softwareName: string;
  taskTitle: string;
  module: string;
  assignedDeveloper: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'BACKLOG' | 'IN_DEVELOPMENT' | 'CODE_REVIEW' | 'TESTING' | 'DEPLOYED';
  estimatedHours: number;
  actualHours: number;
  progressPercent: number;
  targetDate: string;
  notes?: string;
}

export interface LiveAppItem {
  id: string;
  name: string;
  url: string;
  environment: 'Production' | 'Staging' | 'Internal Campus';
  serverIp: string;
  port: number | string;
  sslStatus: 'Valid (HTTPS)' | 'Self-Signed' | 'HTTP Only';
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
  latencyMs: number;
  lastChecked: string;
  notes?: string;
}

export interface UpcomingProjectItem {
  id: string;
  projectName: string;
  requestingDept: string;
  priority: 'P1 - Institutional Critical' | 'P2 - High Priority' | 'P3 - Departmental';
  targetQuarter: string;
  targetLaunchDate: string;
  status: 'REQUIREMENT_GATHERING' | 'FEASIBILITY_APPROVED' | 'ARCHITECTURE_DESIGN' | 'BACKLOG_READY' | 'UNDER_DEVELOPMENT';
  estimatedDevWeeks: number;
  leadArchitect: string;
  businessPurpose: string;
}

// Built-in Seed Data for Rathinam Higher Education Operations
const DEFAULT_SOFTWARE_REGISTRY: SoftwareAppItem[] = [
  {
    id: 'app-nextup',
    name: 'NextUP Enterprise Task Tracker',
    code: 'NEXTUP',
    category: 'Campus Operations',
    version: 'v2.4.0',
    environment: 'Production',
    techStack: ['React', 'TypeScript', 'Django REST', 'Docker', 'Nginx'],
    database: 'PostgreSQL 15',
    serverHost: '10.10.90.202',
    leadDeveloper: 'Sanjay A',
    deploymentUrl: 'https://www.rguedu.in/nextup/',
    repoUrl: 'https://github.com/Rathinam-college/Nextup--fe',
    uptimePercent: 99.98,
    lastDeployed: '2026-11-11',
    description: 'Multi-department executive task tracking with GM approval lifecycle and Android push integration.',
  },
  {
    id: 'app-erp',
    name: 'Rathinam Campus ERP & Academics',
    code: 'R-ERP',
    category: 'Administrative ERP',
    version: 'v4.8.2',
    environment: 'Production',
    techStack: ['React', 'Node.js', 'Express', 'Redis'],
    database: 'MySQL 8.0 Cluster',
    serverHost: '10.10.90.205',
    leadDeveloper: 'Peer Mohammed',
    deploymentUrl: 'https://erp.rathinam.in',
    uptimePercent: 99.95,
    lastDeployed: '2026-11-04',
    description: 'Student lifecycle, faculty attendance, gradebook & semester examination marks processing.',
  },
  {
    id: 'app-admissions',
    name: 'Online Admissions & Counseling Portal 2026',
    code: 'ADM-26',
    category: 'Student Services',
    version: 'v2.1.0',
    environment: 'Production',
    techStack: ['Next.js', 'Python Flask', 'TailwindCSS'],
    database: 'PostgreSQL 14',
    serverHost: '10.10.90.210',
    leadDeveloper: 'Manimaran J',
    deploymentUrl: 'https://admissions.rathinam.in',
    uptimePercent: 99.99,
    lastDeployed: '2026-10-28',
    description: 'Real-time student seat allotment, document verification and WhatsApp bot auto-alerts.',
  },
  {
    id: 'app-koha',
    name: 'Central Library KOHA Automation',
    code: 'KOHA',
    category: 'Academic & LMS',
    version: 'v22.11',
    environment: 'Production',
    techStack: ['Perl', 'HTML5', 'Apache', 'Z39.50'],
    database: 'MariaDB 10.6',
    serverHost: '10.10.90.215',
    leadDeveloper: 'Balaji R',
    deploymentUrl: 'https://library.rathinam.in',
    uptimePercent: 99.90,
    lastDeployed: '2026-09-15',
    description: 'Barcoded book cataloging, patron checkout, digital e-book repository and RFID turnstiles.',
  },
  {
    id: 'app-mess-buggy',
    name: 'Hostel Mess & Buggy Transport Fleet Hub',
    code: 'OPS-HUB',
    category: 'Campus Operations',
    version: 'v1.4.0',
    environment: 'Production',
    techStack: ['React Native', 'Node.js', 'Socket.io'],
    database: 'MongoDB Atlas',
    serverHost: '10.10.90.220',
    leadDeveloper: 'Mr. Nandha Kumar',
    deploymentUrl: 'https://ops.rathinam.in',
    uptimePercent: 99.85,
    lastDeployed: '2026-11-08',
    description: 'Dining meal counters, buggy campus transit requests and electric fleet charging telematics.',
  },
  {
    id: 'app-wifi-firewall',
    name: 'Campus Wi-Fi & FortiGate Firewall Gateway',
    code: 'GATEWAY',
    category: 'Security & Infrastructure',
    version: 'v7.2',
    environment: 'Production',
    techStack: ['FortiOS', 'RADIUS', 'OpenLDAP', 'Syslog'],
    database: 'Local Appliance Cache',
    serverHost: '10.10.90.1',
    leadDeveloper: 'IT Network Team',
    uptimePercent: 99.99,
    lastDeployed: '2026-10-01',
    description: 'Bandwidth allocation, blocklist enforcement, and secure student/faculty identity authentication.',
  },
];

const DEFAULT_DEV_TRACKER: DevTrackerItem[] = [
  {
    id: 'dev-1',
    softwareName: 'Rathinam Campus ERP & Academics',
    taskTitle: 'Biometric Attendance API Sync with Payroll Module',
    module: 'Backend API & Cron',
    assignedDeveloper: 'Peer Mohammed',
    priority: 'URGENT',
    status: 'IN_DEVELOPMENT',
    estimatedHours: 45,
    actualHours: 38,
    progressPercent: 80,
    targetDate: '2026-11-18',
    notes: 'Connecting ZKTeco biometric logs to daily salary deductions.',
  },
  {
    id: 'dev-2',
    softwareName: 'NextUP Enterprise Task Tracker',
    taskTitle: 'IT Department 6-Section Executive Dashboard & Software Registry',
    module: 'Full-Stack React + DRF',
    assignedDeveloper: 'Sanjay A',
    priority: 'HIGH',
    status: 'TESTING',
    estimatedHours: 30,
    actualHours: 28,
    progressPercent: 95,
    targetDate: '2026-11-12',
    notes: 'Providing Registry, Dev Tracker, Live Apps & Reports with interactive data persistence.',
  },
  {
    id: 'dev-3',
    softwareName: 'Hostel Mess & Buggy Transport Fleet Hub',
    taskTitle: 'Live GPS WebSockets for Aqualia Electric Buggies',
    module: 'Mobile Telematics',
    assignedDeveloper: 'Balaji R',
    priority: 'MEDIUM',
    status: 'IN_DEVELOPMENT',
    estimatedHours: 50,
    actualHours: 25,
    progressPercent: 50,
    targetDate: '2026-11-25',
    notes: 'Real-time buggy map tracking for faculty and disabled students.',
  },
  {
    id: 'dev-4',
    softwareName: 'Online Admissions & Counseling Portal 2026',
    taskTitle: 'Automatic Marksheet OCR Extraction with Gemini 2.0',
    module: 'AI Document Parsing',
    assignedDeveloper: 'Manimaran J',
    priority: 'HIGH',
    status: 'CODE_REVIEW',
    estimatedHours: 40,
    actualHours: 36,
    progressPercent: 90,
    targetDate: '2026-11-15',
    notes: 'Verifying 12th board marks against state database.',
  },
  {
    id: 'dev-5',
    softwareName: 'Central Library KOHA Automation',
    taskTitle: 'RFID Self-Service Checkout Kiosk Touchscreen UI',
    module: 'Hardware & Client App',
    assignedDeveloper: 'Balaji R',
    priority: 'MEDIUM',
    status: 'BACKLOG',
    estimatedHours: 60,
    actualHours: 10,
    progressPercent: 20,
    targetDate: '2026-12-05',
    notes: 'Empowering students to borrow books without queuing at counter.',
  },
];

const DEFAULT_LIVE_APPS: LiveAppItem[] = [
  {
    id: 'live-1',
    name: 'NextUP Task Tracker (Production)',
    url: 'https://www.rguedu.in/nextup/',
    environment: 'Production',
    serverIp: '10.10.90.202 (Docker)',
    port: '80 / 443',
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 24,
    lastChecked: '2 mins ago',
    notes: 'Nginx reverse proxy with Gunicorn WSGI and SQLite/Postgres DB.',
  },
  {
    id: 'live-2',
    name: 'Rathinam Campus ERP System',
    url: 'https://erp.rathinam.in',
    environment: 'Production',
    serverIp: '10.10.90.205 (VM)',
    port: 443,
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 42,
    lastChecked: '5 mins ago',
    notes: 'Active load balancer with automatic failover.',
  },
  {
    id: 'live-3',
    name: 'Admissions 2026 Web Engine',
    url: 'https://admissions.rathinam.in',
    environment: 'Production',
    serverIp: '10.10.90.210 (Cloud)',
    port: 443,
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 18,
    lastChecked: '1 min ago',
    notes: 'CloudFlare CDN edge-cached.',
  },
  {
    id: 'live-4',
    name: 'Koha Central Library Server',
    url: 'https://library.rathinam.in',
    environment: 'Production',
    serverIp: '10.10.90.215 (Internal)',
    port: '8080 / 443',
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 35,
    lastChecked: '10 mins ago',
    notes: 'Integrated with Campus LDAP for Single Sign-On.',
  },
  {
    id: 'live-5',
    name: 'Hostel & Transport Operations Hub',
    url: 'https://ops.rathinam.in',
    environment: 'Production',
    serverIp: '10.10.90.220 (Container)',
    port: '5000 / 443',
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 50,
    lastChecked: '4 mins ago',
    notes: 'Socket server handling push telematics.',
  },
];

const DEFAULT_UPCOMING_PROJECTS: UpcomingProjectItem[] = [
  {
    id: 'up-1',
    projectName: 'AI Facial Recognition Campus Attendance & Turnstiles',
    requestingDept: 'Campus Security & Principal Office',
    priority: 'P1 - Institutional Critical',
    targetQuarter: 'Q1 2027 (Jan 2027)',
    targetLaunchDate: '2027-01-15',
    status: 'ARCHITECTURE_DESIGN',
    estimatedDevWeeks: 12,
    leadArchitect: 'Sanjay A & Vision Team',
    businessPurpose: 'Eliminate student proxy attendance and automate real-time SMS alerts to parents on campus entry.',
  },
  {
    id: 'up-2',
    projectName: 'Centralized QR Asset Lifecycle & Preventive Maintenance Tracker',
    requestingDept: 'Operation & Infrastructure',
    priority: 'P2 - High Priority',
    targetQuarter: 'Q2 2027 (Apr 2027)',
    targetLaunchDate: '2027-04-10',
    status: 'FEASIBILITY_APPROVED',
    estimatedDevWeeks: 8,
    leadArchitect: 'Balaji R',
    businessPurpose: 'Attach durable QR plates to all campus ACs, generators, projectors and lab computers for 1-tap service logs.',
  },
  {
    id: 'up-3',
    projectName: 'Examination Hall Seating Allotment & Barcode Evaluation Engine',
    requestingDept: 'Controller of Examinations (COE)',
    priority: 'P1 - Institutional Critical',
    targetQuarter: 'Q2 2027 (May 2027)',
    targetLaunchDate: '2027-05-01',
    status: 'REQUIREMENT_GATHERING',
    estimatedDevWeeks: 10,
    leadArchitect: 'Peer Mohammed',
    businessPurpose: 'Algorithmically distribute exam students with strict anti-copy seating layouts and barcode answer booklets.',
  },
  {
    id: 'up-4',
    projectName: 'Rathinam Alumni Global Mentorship & Career Network',
    requestingDept: 'Placement & Alumni Division',
    priority: 'P3 - Departmental',
    targetQuarter: 'Q3 2027 (Aug 2027)',
    targetLaunchDate: '2027-08-15',
    status: 'BACKLOG_READY',
    estimatedDevWeeks: 6,
    leadArchitect: 'Manimaran J',
    businessPurpose: 'Connect 15,000+ Rathinam alumni worldwide with graduating seniors for mock interviews and job referrals.',
  },
];

interface ITDepartmentDashboardProps {
  currentUser?: User;
  departments?: Department[];
  staffList?: User[];
  onBackToDepartments?: () => void;
}

export const ITDepartmentDashboard: React.FC<ITDepartmentDashboardProps> = ({
  currentUser,
  departments,
  staffList,
  onBackToDepartments,
}) => {
  const { t, isTamil } = useLanguage();

  // Active Section Tab
  const [activeTab, setActiveTab] = useState<ITSectionTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Software Registry State (Persistent)
  const [softwareList, setSoftwareList] = useState<SoftwareAppItem[]>(() => {
    try {
      const saved = localStorage.getItem('nextup_it_software_registry');
      return saved ? JSON.parse(saved) : DEFAULT_SOFTWARE_REGISTRY;
    } catch {
      return DEFAULT_SOFTWARE_REGISTRY;
    }
  });

  // 2. Dev Tracker State (Persistent)
  const [devTasks, setDevTasks] = useState<DevTrackerItem[]>(() => {
    try {
      const saved = localStorage.getItem('nextup_it_dev_tracker');
      return saved ? JSON.parse(saved) : DEFAULT_DEV_TRACKER;
    } catch {
      return DEFAULT_DEV_TRACKER;
    }
  });

  // 3. Live Applications State (Persistent)
  const [liveApps, setLiveApps] = useState<LiveAppItem[]>(() => {
    try {
      const saved = localStorage.getItem('nextup_it_live_apps');
      return saved ? JSON.parse(saved) : DEFAULT_LIVE_APPS;
    } catch {
      return DEFAULT_LIVE_APPS;
    }
  });

  // 4. Upcoming Projects State (Persistent)
  const [upcomingProjects, setUpcomingProjects] = useState<UpcomingProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('nextup_it_upcoming_projects');
      return saved ? JSON.parse(saved) : DEFAULT_UPCOMING_PROJECTS;
    } catch {
      return DEFAULT_UPCOMING_PROJECTS;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('nextup_it_software_registry', JSON.stringify(softwareList));
    } catch {}
  }, [softwareList]);

  useEffect(() => {
    try {
      localStorage.setItem('nextup_it_dev_tracker', JSON.stringify(devTasks));
    } catch {}
  }, [devTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('nextup_it_live_apps', JSON.stringify(liveApps));
    } catch {}
  }, [liveApps]);

  useEffect(() => {
    try {
      localStorage.setItem('nextup_it_upcoming_projects', JSON.stringify(upcomingProjects));
    } catch {}
  }, [upcomingProjects]);

  // Modal Visibility State
  const [isAddSoftwareOpen, setIsAddSoftwareOpen] = useState(false);
  const [isAddDevTaskOpen, setIsAddDevTaskOpen] = useState(false);
  const [isAddLiveAppOpen, setIsAddLiveAppOpen] = useState(false);
  const [isAddUpcomingOpen, setIsAddUpcomingOpen] = useState(false);

  // Form State: Add Software
  const [newSoftware, setNewSoftware] = useState<Partial<SoftwareAppItem>>({
    name: '',
    code: '',
    category: 'Administrative ERP',
    version: 'v1.0.0',
    environment: 'Production',
    techStack: ['React', 'Python', 'PostgreSQL'],
    database: 'PostgreSQL',
    serverHost: '10.10.90.202',
    leadDeveloper: currentUser?.full_name || 'IT Engineer',
    deploymentUrl: '',
    repoUrl: '',
    uptimePercent: 99.9,
    description: '',
  });

  // Form State: Add Dev Task
  const [newDevTask, setNewDevTask] = useState<Partial<DevTrackerItem>>({
    softwareName: softwareList[0]?.name || 'NextUP Enterprise Task Tracker',
    taskTitle: '',
    module: 'Core Module',
    assignedDeveloper: currentUser?.full_name || 'Developer',
    priority: 'HIGH',
    status: 'IN_DEVELOPMENT',
    estimatedHours: 20,
    actualHours: 0,
    progressPercent: 10,
    targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  // Form State: Add Live App
  const [newLiveApp, setNewLiveApp] = useState<Partial<LiveAppItem>>({
    name: '',
    url: 'https://',
    environment: 'Production',
    serverIp: '10.10.90.202',
    port: 443,
    sslStatus: 'Valid (HTTPS)',
    healthStatus: 'HEALTHY',
    latencyMs: 25,
    notes: '',
  });

  // Form State: Add Upcoming Project
  const [newUpcoming, setNewUpcoming] = useState<Partial<UpcomingProjectItem>>({
    projectName: '',
    requestingDept: 'Campus Operations',
    priority: 'P2 - High Priority',
    targetQuarter: 'Q1 2027',
    targetLaunchDate: '2027-01-30',
    status: 'REQUIREMENT_GATHERING',
    estimatedDevWeeks: 8,
    leadArchitect: currentUser?.full_name || 'Lead Architect',
    businessPurpose: '',
  });

  // Handlers to Add Data
  const handleCreateSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoftware.name?.trim()) return;

    const item: SoftwareAppItem = {
      id: `app-${Date.now()}`,
      name: newSoftware.name.trim(),
      code: (newSoftware.code || newSoftware.name.slice(0, 6)).toUpperCase(),
      category: newSoftware.category as any || 'Campus Operations',
      version: newSoftware.version || 'v1.0.0',
      environment: newSoftware.environment as any || 'Production',
      techStack: Array.isArray(newSoftware.techStack) ? newSoftware.techStack : String(newSoftware.techStack).split(',').map(s => s.trim()),
      database: newSoftware.database || 'PostgreSQL',
      serverHost: newSoftware.serverHost || '10.10.90.202',
      leadDeveloper: newSoftware.leadDeveloper || 'IT Team',
      deploymentUrl: newSoftware.deploymentUrl,
      repoUrl: newSoftware.repoUrl,
      uptimePercent: Number(newSoftware.uptimePercent) || 99.9,
      lastDeployed: new Date().toISOString().split('T')[0],
      description: newSoftware.description || 'Institutional software service.',
    };

    setSoftwareList([item, ...softwareList]);
    setIsAddSoftwareOpen(false);
    setNewSoftware({
      name: '',
      code: '',
      category: 'Administrative ERP',
      version: 'v1.0.0',
      environment: 'Production',
      techStack: ['React', 'Python'],
      database: 'PostgreSQL',
      serverHost: '10.10.90.202',
      leadDeveloper: currentUser?.full_name || 'IT Engineer',
      description: '',
    });
  };

  const handleCreateDevTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevTask.taskTitle?.trim()) return;

    const item: DevTrackerItem = {
      id: `dev-${Date.now()}`,
      softwareName: newDevTask.softwareName || softwareList[0]?.name || 'NextUP',
      taskTitle: newDevTask.taskTitle.trim(),
      module: newDevTask.module || 'General',
      assignedDeveloper: newDevTask.assignedDeveloper || 'Developer',
      priority: newDevTask.priority as any || 'HIGH',
      status: newDevTask.status as any || 'IN_DEVELOPMENT',
      estimatedHours: Number(newDevTask.estimatedHours) || 10,
      actualHours: Number(newDevTask.actualHours) || 0,
      progressPercent: Number(newDevTask.progressPercent) || 10,
      targetDate: newDevTask.targetDate || new Date().toISOString().split('T')[0],
      notes: newDevTask.notes || '',
    };

    setDevTasks([item, ...devTasks]);
    setIsAddDevTaskOpen(false);
    setNewDevTask({
      softwareName: softwareList[0]?.name || 'NextUP Enterprise Task Tracker',
      taskTitle: '',
      module: 'Core Module',
      assignedDeveloper: currentUser?.full_name || 'Developer',
      priority: 'HIGH',
      status: 'IN_DEVELOPMENT',
      estimatedHours: 20,
      actualHours: 0,
      progressPercent: 10,
      notes: '',
    });
  };

  const handleCreateLiveApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveApp.name?.trim() || !newLiveApp.url?.trim()) return;

    const item: LiveAppItem = {
      id: `live-${Date.now()}`,
      name: newLiveApp.name.trim(),
      url: newLiveApp.url.trim(),
      environment: newLiveApp.environment as any || 'Production',
      serverIp: newLiveApp.serverIp || '10.10.90.202',
      port: newLiveApp.port || 443,
      sslStatus: newLiveApp.sslStatus as any || 'Valid (HTTPS)',
      healthStatus: newLiveApp.healthStatus as any || 'HEALTHY',
      latencyMs: Number(newLiveApp.latencyMs) || 25,
      lastChecked: 'Just now',
      notes: newLiveApp.notes || '',
    };

    setLiveApps([item, ...liveApps]);
    setIsAddLiveAppOpen(false);
    setNewLiveApp({
      name: '',
      url: 'https://',
      environment: 'Production',
      serverIp: '10.10.90.202',
      port: 443,
      sslStatus: 'Valid (HTTPS)',
      healthStatus: 'HEALTHY',
      latencyMs: 25,
      notes: '',
    });
  };

  const handleCreateUpcoming = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpcoming.projectName?.trim()) return;

    const item: UpcomingProjectItem = {
      id: `up-${Date.now()}`,
      projectName: newUpcoming.projectName.trim(),
      requestingDept: newUpcoming.requestingDept || 'Administration',
      priority: newUpcoming.priority as any || 'P2 - High Priority',
      targetQuarter: newUpcoming.targetQuarter || 'Q1 2027',
      targetLaunchDate: newUpcoming.targetLaunchDate || '2027-01-30',
      status: newUpcoming.status as any || 'REQUIREMENT_GATHERING',
      estimatedDevWeeks: Number(newUpcoming.estimatedDevWeeks) || 6,
      leadArchitect: newUpcoming.leadArchitect || 'Lead Architect',
      businessPurpose: newUpcoming.businessPurpose || 'Institutional project proposal.',
    };

    setUpcomingProjects([item, ...upcomingProjects]);
    setIsAddUpcomingOpen(false);
    setNewUpcoming({
      projectName: '',
      requestingDept: 'Campus Operations',
      priority: 'P2 - High Priority',
      targetQuarter: 'Q1 2027',
      targetLaunchDate: '2027-01-30',
      status: 'REQUIREMENT_GATHERING',
      estimatedDevWeeks: 8,
      leadArchitect: currentUser?.full_name || 'Lead Architect',
      businessPurpose: '',
    });
  };

  // Computations for Overview & Analytics
  const stats = useMemo(() => {
    const totalApps = softwareList.length;
    const prodApps = softwareList.filter(s => s.environment === 'Production').length;
    const devApps = softwareList.filter(s => s.environment === 'Development' || s.environment === 'Staging').length;
    const totalDevHours = devTasks.reduce((acc, curr) => acc + curr.actualHours, 0);
    const estDevHours = devTasks.reduce((acc, curr) => acc + curr.estimatedHours, 0);
    const healthyServers = liveApps.filter(l => l.healthStatus === 'HEALTHY').length;
    const upcomingCount = upcomingProjects.length;

    const avgUptime = (
      softwareList.reduce((acc, curr) => acc + curr.uptimePercent, 0) / (softwareList.length || 1)
    ).toFixed(2);

    return {
      totalApps,
      prodApps,
      devApps,
      totalDevHours,
      estDevHours,
      healthyServers,
      totalLiveServers: liveApps.length,
      upcomingCount,
      avgUptime,
    };
  }, [softwareList, devTasks, liveApps, upcomingProjects]);

  // One-Click Print Report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print the IT report.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rathinam Group — IT Department Software & Infrastructure Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; margin: 0; }
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #1e3a8a; }
          .header p { margin: 3px 0 0; font-size: 11px; color: #64748b; }
          .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .kpi { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #2563eb; }
          .kpi-lbl { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px; }
          th { background: #f1f5f9; text-align: left; padding: 7px 9px; border: 1px solid #cbd5e1; font-weight: 700; }
          td { padding: 6px 9px; border: 1px solid #cbd5e1; }
          h2 { font-size: 14px; border-left: 4px solid #2563eb; padding-left: 8px; margin: 20px 0 10px; color: #1e293b; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-blue { background: #dbeafe; color: #1d4ed8; }
          .badge-yellow { background: #fef3c7; color: #b45309; }
          .sign-block { margin-top: 40px; display: flex; justify-content: space-between; padding-top: 20px; }
          .sign-line { width: 200px; border-top: 1px dashed #64748b; text-align: center; font-size: 11px; padding-top: 5px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>RATHINAM GROUP OF INSTITUTIONS</h1>
            <p>Information Technology (IT) Department — Enterprise Software & Operations Report</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
            Ref: IT-DIGEST-${new Date().toISOString().slice(0, 7)}
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi"><div class="kpi-val">${stats.totalApps}</div><div class="kpi-lbl">Total Registered Apps</div></div>
          <div class="kpi"><div class="kpi-val">${stats.prodApps}</div><div class="kpi-lbl">Production Live</div></div>
          <div class="kpi"><div class="kpi-val">${stats.totalDevHours} hrs</div><div class="kpi-lbl">Hours Logged</div></div>
          <div class="kpi"><div class="kpi-val">${stats.avgUptime}%</div><div class="kpi-lbl">Average Uptime</div></div>
        </div>

        <h2>1. Software Registry</h2>
        <table>
          <thead>
            <tr><th>#</th><th>App Name</th><th>Category</th><th>Tech Stack</th><th>Lead Dev</th><th>Host IP</th><th>Status</th><th>Uptime</th></tr>
          </thead>
          <tbody>
            ${softwareList.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${s.name}</strong> (${s.code})</td>
                <td>${s.category}</td>
                <td>${s.techStack.join(', ')}</td>
                <td>${s.leadDeveloper}</td>
                <td>${s.serverHost}</td>
                <td><span class="badge ${s.environment === 'Production' ? 'badge-green' : 'badge-yellow'}">${s.environment}</span></td>
                <td>${s.uptimePercent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>2. Active Development Tracker</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Feature / Task</th><th>Application</th><th>Module</th><th>Assigned</th><th>Progress</th><th>Hours</th><th>Target</th></tr>
          </thead>
          <tbody>
            ${devTasks.map((d, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${d.taskTitle}</strong></td>
                <td>${d.softwareName}</td>
                <td>${d.module}</td>
                <td>${d.assignedDeveloper}</td>
                <td>${d.progressPercent}%</td>
                <td>${d.actualHours} / ${d.estimatedHours} hrs</td>
                <td>${d.targetDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>3. Live Production Applications & URLs</h2>
        <table>
          <thead>
            <tr><th>#</th><th>App Name</th><th>Live URL</th><th>Server Host</th><th>Port</th><th>SSL</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${liveApps.map((l, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${l.name}</strong></td>
                <td>${l.url}</td>
                <td>${l.serverIp}</td>
                <td>${l.port}</td>
                <td>${l.sslStatus}</td>
                <td><span class="badge ${l.healthStatus === 'HEALTHY' ? 'badge-green' : 'badge-yellow'}">${l.healthStatus}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>4. Upcoming Planned Projects</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Project Title</th><th>Requesting Dept</th><th>Priority</th><th>Target Quarter</th><th>Weeks</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${upcomingProjects.map((u, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${u.projectName}</strong></td>
                <td>${u.requestingDept}</td>
                <td>${u.priority}</td>
                <td>${u.targetQuarter}</td>
                <td>${u.estimatedDevWeeks} wks</td>
                <td>${u.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sign-block">
          <div class="sign-line">Prepared by (IT Lead)</div>
          <div class="sign-line">Reviewed by (Dean IT & Systems)</div>
          <div class="sign-line">Approved by (General Manager)</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  // CSV Export
  const handleExportCsv = () => {
    let csv = 'SECTION,ID,NAME_TITLE,CATEGORY_APP,TECH_OR_MODULE,LEAD_OR_DEV,STATUS,EXTRA_DATA\n';
    softwareList.forEach(s => {
      csv += `"SOFTWARE_REGISTRY","${s.id}","${s.name}","${s.category}","${s.techStack.join('; ')}","${s.leadDeveloper}","${s.environment}","Uptime: ${s.uptimePercent}% | Server: ${s.serverHost}"\n`;
    });
    devTasks.forEach(d => {
      csv += `"DEV_TRACKER","${d.id}","${d.taskTitle}","${d.softwareName}","${d.module}","${d.assignedDeveloper}","${d.status}","Progress: ${d.progressPercent}% | Hours: ${d.actualHours}/${d.estimatedHours}"\n`;
    });
    liveApps.forEach(l => {
      csv += `"LIVE_APPS","${l.id}","${l.name}","${l.url}","Port: ${l.port}","${l.serverIp}","${l.healthStatus}","Latency: ${l.latencyMs}ms | SSL: ${l.sslStatus}"\n`;
    });
    upcomingProjects.forEach(u => {
      csv += `"UPCOMING_PROJECTS","${u.id}","${u.projectName}","${u.requestingDept}","Target: ${u.targetQuarter}","${u.leadArchitect}","${u.status}","Priority: ${u.priority} | Est: ${u.estimatedDevWeeks} wks"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rathinam_IT_Department_Full_Digest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="it-department-dashboard"
      style={{
        padding: '20px 24px 40px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        color: 'var(--notion-text)',
      }}
    >
      {/* Back to All Departments Shortcut */}
      {onBackToDepartments && (
        <div style={{ marginBottom: '14px' }}>
          <button
            type="button"
            onClick={onBackToDepartments}
            className="notion-btn notion-btn-bordered"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
              color: 'var(--notion-text)',
              background: 'var(--notion-item-bg)',
              border: '1px solid var(--notion-border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} style={{ color: '#06b6d4' }} />
            <span>{isTamil ? '← அனைத்து துறைகளுக்கும் திரும்பு' : '← Back to All Departments'}</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE COMMAND BAR                                              */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--notion-border)',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
              flexShrink: 0,
            }}
          >
            <Code size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--notion-text)',
                }}
              >
                {isTamil ? 'தகவல் தொழில்நுட்பம் (IT) துறை' : 'Information Technology (IT) Department'}
              </h1>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: '#0891b2',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '1.5px 7px',
                  borderRadius: '5px',
                  letterSpacing: '0.04em',
                }}
              >
                DEPT PORTAL
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
              Enterprise Software Registry, Active Development Tracker, Live Production Deployments & IT Operations
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePrintReport}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 650,
              cursor: 'pointer',
              color: 'var(--notion-text)',
            }}
            title="Print Official Executive IT Digest"
          >
            <Printer size={13} style={{ color: '#2563eb' }} />
            <span>{isTamil ? 'அறிக்கை அச்சிடு' : 'Print IT Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="notion-btn"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 650,
              cursor: 'pointer',
              color: 'var(--notion-text)',
            }}
            title="Download complete IT database CSV"
          >
            <Download size={13} style={{ color: '#16a34a' }} />
            <span>{isTamil ? 'CSV பதிவிறக்கு' : 'Export CSV'}</span>
          </button>

          {/* Contextual "+ Add Data" Button based on current tab */}
          {activeTab === 'registry' && (
            <button
              type="button"
              onClick={() => setIsAddSoftwareOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>+ Register Software</span>
            </button>
          )}

          {activeTab === 'dev_tracker' && (
            <button
              type="button"
              onClick={() => setIsAddDevTaskOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>+ Log Dev Task / Hours</span>
            </button>
          )}

          {activeTab === 'live_apps' && (
            <button
              type="button"
              onClick={() => setIsAddLiveAppOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>+ Add Live App URL</span>
            </button>
          )}

          {activeTab === 'upcoming' && (
            <button
              type="button"
              onClick={() => setIsAddUpcomingOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} />
              <span>+ Propose Project</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 6 CORE IT SECTIONS & PURPOSES SHOWCASE                             */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'var(--notion-card)',
          borderRadius: '14px',
          padding: '16px 20px',
          border: '1px solid var(--notion-border)',
          boxShadow: 'var(--notion-shadow-sm)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>⚡</span>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.01em' }}>
                {isTamil ? 'IT துறை - 6 முக்கிய பிரிவுகள் & நோக்கங்கள்' : 'IT Department — 6 Core Sections & Purposes'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--notion-text-dim)' }}>
                {isTamil ? 'அனைத்து மென்பொருள் புள்ளிவிவரங்கள், மேம்பாடு மற்றும் நேரடி செயலிகள்' : 'Comprehensive software statistics, development tracking & live systems'}
              </p>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>
            {isTamil ? 'பிரிவுக்கு மாற கிளிக் செய்யவும்' : 'Click any section to switch view'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}
        >
          {[
            { id: 'overview', name: 'Overview', purpose: 'All software statistics', icon: BarChart2, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
            { id: 'registry', name: 'Software Registry', purpose: 'All applications and details', icon: Database, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.08)' },
            { id: 'dev_tracker', name: 'Development Tracker', purpose: 'Tasks, hours and progress', icon: Code, color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)' },
            { id: 'live_apps', name: 'Live Applications', purpose: 'Deployment URL and server status', icon: Globe, color: '#059669', bg: 'rgba(5, 150, 105, 0.08)' },
            { id: 'upcoming', name: 'Upcoming Projects', purpose: 'Planned applications and priorities', icon: TrendingUp, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' },
            { id: 'reports', name: 'Reports & Analytics', purpose: 'Monthly and management reports', icon: FileText, color: '#e11d48', bg: 'rgba(225, 29, 72, 0.08)' },
          ].map((sec) => {
            const Icon = sec.icon;
            const isCurrent = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id as ITSectionTab)}
                style={{
                  background: isCurrent ? sec.bg : 'var(--notion-item-bg)',
                  border: isCurrent ? `1.5px solid ${sec.color}` : '1px solid var(--notion-border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: isCurrent ? sec.color : 'var(--notion-text)' }}>
                    {sec.name}
                  </span>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: sec.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={13} style={{ color: sec.color, flexShrink: 0 }} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', lineHeight: 1.35 }}>
                  {sec.purpose}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THE 6 REQUESTED SECTION TABS                                           */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--notion-item-bg)',
          padding: '4px',
          borderRadius: '11px',
          border: '1px solid var(--notion-border-subtle)',
          marginBottom: '20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {[
          { id: 'overview', label: isTamil ? 'கண்ணோட்டம்' : 'Overview', purpose: 'All software statistics', icon: BarChart2, count: null, color: '#2563eb' },
          { id: 'registry', label: isTamil ? 'மென்பொருள் பதிவேடு' : 'Software Registry', purpose: 'All applications and details', icon: Database, count: softwareList.length, color: '#0284c7' },
          { id: 'dev_tracker', label: isTamil ? 'மேம்பாட்டு கண்காணிப்பாளர்' : 'Development Tracker', purpose: 'Tasks, hours and progress', icon: Code, count: devTasks.length, color: '#d97706' },
          { id: 'live_apps', label: isTamil ? 'நேரடி செயலிகள்' : 'Live Applications', purpose: 'Deployment URL and server status', icon: Globe, count: liveApps.length, color: '#059669' },
          { id: 'upcoming', label: isTamil ? 'வரவிருக்கும் திட்டங்கள்' : 'Upcoming Projects', purpose: 'Planned applications and priorities', icon: TrendingUp, count: upcomingProjects.length, color: '#7c3aed' },
          { id: 'reports', label: isTamil ? 'அறிக்கைகள் & பகுப்பாய்வு' : 'Reports & Analytics', purpose: 'Monthly and management reports', icon: FileText, count: null, color: '#e11d48' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ITSectionTab)}
              title={`${tab.label} — ${tab.purpose}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isSelected ? 'var(--notion-card)' : 'transparent',
                color: isSelected ? 'var(--notion-text)' : 'var(--notion-text-muted)',
                fontWeight: isSelected ? 800 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--notion-shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Icon size={14} style={{ color: isSelected ? tab.color : 'inherit' }} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--notion-border-subtle)',
                    color: isSelected ? '#2563eb' : 'var(--notion-text-dim)',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW — ALL SOFTWARE STATISTICS & HEALTH                        */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top 4 Metric KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            {/* KPI 1: Total Registered Apps */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--notion-text)', lineHeight: 1 }}>
                  {stats.totalApps}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 650, marginTop: '4px' }}>
                  Total Software Registry ({stats.prodApps} in Production)
                </div>
              </div>
            </div>

            {/* KPI 2: Development Hours Logged */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Code size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--notion-text)', lineHeight: 1 }}>
                  {stats.totalDevHours} <span style={{ fontSize: '14px', fontWeight: 600 }}>hrs</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 650, marginTop: '4px' }}>
                  Active Dev Hours Logged ({devTasks.length} Ongoing Tasks)
                </div>
              </div>
            </div>

            {/* KPI 3: Live Application Health */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Globe size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                  {stats.healthyServers} / {stats.totalLiveServers}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 650, marginTop: '4px' }}>
                  Live Servers Online ({stats.avgUptime}% Avg Uptime)
                </div>
              </div>
            </div>

            {/* KPI 4: Upcoming Project Pipeline */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--notion-text)', lineHeight: 1 }}>
                  {stats.upcomingCount}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 650, marginTop: '4px' }}>
                  Upcoming Institutional Systems in Pipeline
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Quick Launchers + Live System Health Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Quick Action Dock */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--notion-text)', marginBottom: '12px' }}>
                🚀 IT Quick Operations
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('registry');
                    setIsAddSoftwareOpen(true);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border-subtle)',
                    background: 'var(--notion-item-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Database size={16} style={{ color: '#2563eb', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>+ Add Software</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>Register new system</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dev_tracker');
                    setIsAddDevTaskOpen(true);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border-subtle)',
                    background: 'var(--notion-item-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Code size={16} style={{ color: '#0284c7', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>+ Log Dev Task</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>Hours & progress</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('live_apps');
                    setIsAddLiveAppOpen(true);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border-subtle)',
                    background: 'var(--notion-item-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Globe size={16} style={{ color: '#10b981', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>+ Live URL</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>Deployment endpoint</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upcoming');
                    setIsAddUpcomingOpen(true);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border-subtle)',
                    background: 'var(--notion-item-bg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <TrendingUp size={16} style={{ color: '#8b5cf6', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text)' }}>+ Propose Project</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)' }}>Upcoming pipeline</div>
                </button>
              </div>
            </div>

            {/* Live Infrastructure Health Card */}
            <div
              style={{
                background: 'var(--notion-card)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--notion-text)' }}>
                  ⚡ Live Campus Infrastructure Status
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  All Systems Operational
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {liveApps.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--notion-item-bg)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={13} style={{ color: '#2563eb' }} />
                      <span style={{ fontWeight: 650 }}>{app.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {app.latencyMs}ms
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                        }}
                      >
                        {app.healthStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOFTWARE REGISTRY — ALL APPLICATIONS & DETAILS                     */}
      {/* ========================================================================= */}
      {activeTab === 'registry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
              📦 Institutional Software Registry ({softwareList.length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search software by name, stack, lead..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: '1px solid var(--notion-border)',
                  background: 'var(--notion-card)',
                  color: 'var(--notion-text)',
                  fontSize: '12px',
                  width: '240px',
                }}
              />
              <button
                type="button"
                onClick={() => setIsAddSoftwareOpen(true)}
                className="notion-btn notion-btn-primary"
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>Add Software</span>
              </button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--notion-card)',
              borderRadius: '12px',
              border: '1px solid var(--notion-border)',
              overflowX: 'auto',
              boxShadow: 'var(--notion-shadow-sm)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--notion-item-bg)', borderBottom: '1px solid var(--notion-border)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Application</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Category</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Version</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Tech Stack</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Lead Dev</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Host / Server</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Uptime</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {softwareList
                  .filter((s) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(q) ||
                      s.code.toLowerCase().includes(q) ||
                      s.category.toLowerCase().includes(q) ||
                      s.leadDeveloper.toLowerCase().includes(q) ||
                      s.techStack.some((tech) => tech.toLowerCase().includes(q))
                    );
                  })
                  .map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid var(--notion-border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-item-bg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 750, color: 'var(--notion-text)' }}>{app.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontFamily: 'var(--font-mono)' }}>
                          #{app.code}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'var(--notion-item-bg)',
                            color: 'var(--notion-text)',
                            border: '1px solid var(--notion-border-subtle)',
                          }}
                        >
                          {app.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                        {app.version}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {app.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'rgba(37, 99, 235, 0.08)',
                                color: '#2563eb',
                                fontWeight: 650,
                              }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{app.leadDeveloper}</td>
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                        <div>{app.serverHost}</div>
                        <div style={{ fontSize: '10px' }}>{app.database}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            background:
                              app.environment === 'Production'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : 'rgba(245, 158, 11, 0.12)',
                            color: app.environment === 'Production' ? '#10b981' : '#d97706',
                          }}
                        >
                          {app.environment}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 750, color: '#10b981' }}>
                        {app.uptimePercent}%
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {app.deploymentUrl && (
                            <a
                              href={app.deploymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '3px 7px',
                                borderRadius: '5px',
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <ExternalLink size={10} />
                              Open
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${app.name} from Registry?`)) {
                                setSoftwareList(softwareList.filter((s) => s.id !== app.id));
                              }
                            }}
                            style={{
                              padding: '3px 7px',
                              borderRadius: '5px',
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                            }}
                            title="Remove Application"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEVELOPMENT TRACKER — TASKS, HOURS & PROGRESS                      */}
      {/* ========================================================================= */}
      {activeTab === 'dev_tracker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                ⚡ Active Development Tracker ({devTasks.length})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Track engineer sprints, milestone progress, estimated vs logged development hours
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddDevTaskOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Log Dev Task</span>
            </button>
          </div>

          <div
            style={{
              background: 'var(--notion-card)',
              borderRadius: '12px',
              border: '1px solid var(--notion-border)',
              overflowX: 'auto',
              boxShadow: 'var(--notion-shadow-sm)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--notion-item-bg)', borderBottom: '1px solid var(--notion-border)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Task / Milestone</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Software System</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Module</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Developer</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Priority</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Progress</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Logged Hours</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Target Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 750, color: 'var(--notion-text-dim)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {devTasks.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: '1px solid var(--notion-border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--notion-item-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 750, color: 'var(--notion-text)' }}>{t.taskTitle}</div>
                      {t.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                          {t.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 650, color: '#2563eb' }}>{t.softwareName}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      {t.module}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.assignedDeveloper}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          background:
                            t.priority === 'URGENT'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : t.priority === 'HIGH'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(59, 130, 246, 0.1)',
                          color:
                            t.priority === 'URGENT'
                              ? '#ef4444'
                              : t.priority === 'HIGH'
                              ? '#d97706'
                              : '#2563eb',
                        }}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: 'var(--notion-border-subtle)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${t.progressPercent}%`,
                              height: '100%',
                              background:
                                t.progressPercent >= 100
                                  ? '#10b981'
                                  : t.progressPercent >= 70
                                  ? '#2563eb'
                                  : '#f59e0b',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 750, width: '28px' }}>
                          {t.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                      <span>{t.actualHours}</span>
                      <span style={{ color: 'var(--notion-text-dim)', fontWeight: 500 }}> / {t.estimatedHours} hrs</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                      {t.targetDate}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          background:
                            t.status === 'DEPLOYED'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : t.status === 'IN_DEVELOPMENT'
                              ? 'rgba(2, 132, 199, 0.12)'
                              : 'rgba(100, 116, 139, 0.12)',
                          color:
                            t.status === 'DEPLOYED'
                              ? '#10b981'
                              : t.status === 'IN_DEVELOPMENT'
                              ? '#0284c7'
                              : '#64748b',
                        }}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE APPLICATIONS — DEPLOYMENT URL & SERVER STATUS                  */}
      {/* ========================================================================= */}
      {activeTab === 'live_apps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                🌐 Live Production Applications & Server Status ({liveApps.length})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Real-time endpoint URLs, SSL certificate health, port numbers, and latency ping tests
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddLiveAppOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Add Live App URL</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {liveApps.map((app) => (
              <div
                key={app.id}
                style={{
                  background: 'var(--notion-card)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--notion-border)',
                  boxShadow: 'var(--notion-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        background: 'rgba(37, 99, 235, 0.08)',
                        color: '#2563eb',
                      }}
                    >
                      {app.environment}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '1.5px 7px',
                        borderRadius: '10px',
                        background:
                          app.healthStatus === 'HEALTHY'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                        color: app.healthStatus === 'HEALTHY' ? '#10b981' : '#ef4444',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: app.healthStatus === 'HEALTHY' ? '#10b981' : '#ef4444',
                        }}
                      />
                      {app.healthStatus}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    {app.name}
                  </h3>

                  <div style={{ fontSize: '11.5px', color: '#2563eb', wordBreak: 'break-all', marginBottom: '8px' }}>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>{app.url}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    <div>
                      <strong>Server:</strong> {app.serverIp}
                    </div>
                    <div>
                      <strong>Port:</strong> {app.port}
                    </div>
                    <div>
                      <strong>SSL:</strong> {app.sslStatus}
                    </div>
                    <div>
                      <strong>Latency:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{app.latencyMs}ms</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--notion-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10.5px',
                    color: 'var(--notion-text-dim)',
                  }}
                >
                  <span>Checked: {app.lastChecked}</span>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Pinged ${app.name} (${app.serverIp}): Health check response 200 OK (${app.latencyMs}ms).`);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--notion-border)',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: 'var(--notion-text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <RefreshCw size={10} />
                    Ping Health
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: UPCOMING PROJECTS — PLANNED APPLICATIONS & PRIORITIES              */}
      {/* ========================================================================= */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                🚀 Upcoming Software Initiatives & Priorities ({upcomingProjects.length})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                Planned institutional systems, target quarters, requesting departments and lead architects
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddUpcomingOpen(true)}
              className="notion-btn notion-btn-primary"
              style={{
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#8b5cf6',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>Propose Project</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {upcomingProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--notion-card)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--notion-border)',
                  boxShadow: 'var(--notion-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        background:
                          p.priority.includes('P1')
                            ? 'rgba(239, 68, 68, 0.12)'
                            : p.priority.includes('P2')
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(59, 130, 246, 0.1)',
                        color:
                          p.priority.includes('P1')
                            ? '#ef4444'
                            : p.priority.includes('P2')
                            ? '#d97706'
                            : '#2563eb',
                      }}
                    >
                      {p.priority}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>
                      {p.targetQuarter}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800, color: 'var(--notion-text)' }}>
                    {p.projectName}
                  </h3>

                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--notion-text-dim)', lineHeight: 1.4 }}>
                    {p.businessPurpose}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px', color: 'var(--notion-text-dim)' }}>
                    <div>
                      <strong>Dept:</strong> {p.requestingDept}
                    </div>
                    <div>
                      <strong>Est Weeks:</strong> {p.estimatedDevWeeks} wks
                    </div>
                    <div>
                      <strong>Lead:</strong> {p.leadArchitect}
                    </div>
                    <div>
                      <strong>Launch:</strong> {p.targetLaunchDate}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--notion-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'var(--notion-item-bg)',
                      color: 'var(--notion-text)',
                    }}
                  >
                    {p.status.replace('_', ' ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove upcoming project ${p.projectName}?`)) {
                        setUpcomingProjects(upcomingProjects.filter((u) => u.id !== p.id));
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REPORTS & ANALYTICS — MONTHLY & MANAGEMENT REPORTS                 */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              borderRadius: '14px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--notion-text)' }}>
                📊 Monthly IT & Management Performance Digest
              </div>
              <div style={{ fontSize: '12px', color: 'var(--notion-text-dim)', marginTop: '2px' }}>
                Official summary of software deployment velocity, uptime reliability, and upcoming releases for Executive GM Review.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handlePrintReport}
                className="notion-btn notion-btn-primary"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Printer size={14} />
                <span>Print Official IT Report</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="notion-btn"
                style={{
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--notion-card)',
                  color: 'var(--notion-text)',
                  border: '1px solid var(--notion-border)',
                  cursor: 'pointer',
                }}
              >
                <Download size={14} style={{ color: '#16a34a' }} />
                <span>Download All Datasets (CSV)</span>
              </button>
            </div>
          </div>

          {/* Analytics Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--notion-card)', borderRadius: '12px', padding: '18px', border: '1px solid var(--notion-border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
                👨‍💻 Development Hours by Engineer
              </div>
              {Array.from(new Set(devTasks.map((t) => t.assignedDeveloper))).map((dev, i) => {
                const hours = devTasks.filter((t) => t.assignedDeveloper === dev).reduce((acc, c) => acc + c.actualHours, 0);
                const pct = Math.min(100, Math.round((hours / (stats.totalDevHours || 1)) * 100));

                return (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 650 }}>{dev}</span>
                      <span style={{ fontWeight: 800, color: '#2563eb' }}>{hours} hrs ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--notion-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'var(--notion-card)', borderRadius: '12px', padding: '18px', border: '1px solid var(--notion-border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>
                🌐 Service Uptime Reliability Scorecard
              </div>
              {liveApps.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--notion-border-subtle)', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontWeight: 650 }}>{l.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--notion-text-dim)', fontSize: '10.5px' }}>{l.latencyMs}ms</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>99.9% Uptime</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SOFTWARE APPLICATION TO REGISTRY                             */}
      {/* ========================================================================= */}
      {isAddSoftwareOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsAddSoftwareOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '100%',
              borderRadius: '14px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: '#2563eb' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Register New Software Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSoftwareOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--notion-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSoftware} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>
                  APPLICATION NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Mobile Fee Payment Gateway"
                  value={newSoftware.name}
                  onChange={(e) => setNewSoftware({ ...newSoftware, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>CODE</label>
                  <input
                    type="text"
                    placeholder="e.g. PAY-GATE"
                    value={newSoftware.code}
                    onChange={(e) => setNewSoftware({ ...newSoftware, code: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>CATEGORY</label>
                  <select
                    value={newSoftware.category}
                    onChange={(e) => setNewSoftware({ ...newSoftware, category: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Academic & LMS">Academic & LMS</option>
                    <option value="Administrative ERP">Administrative ERP</option>
                    <option value="Student Services">Student Services</option>
                    <option value="Campus Operations">Campus Operations</option>
                    <option value="Security & Infrastructure">Security & Infrastructure</option>
                    <option value="Finance & Payments">Finance & Payments</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>TECH STACK (comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Django, PostgreSQL"
                    value={Array.isArray(newSoftware.techStack) ? newSoftware.techStack.join(', ') : newSoftware.techStack}
                    onChange={(e) => setNewSoftware({ ...newSoftware, techStack: e.target.value.split(',').map(s => s.trim()) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>LEAD DEVELOPER</label>
                  <input
                    type="text"
                    placeholder="Engineer Name"
                    value={newSoftware.leadDeveloper}
                    onChange={(e) => setNewSoftware({ ...newSoftware, leadDeveloper: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>HOST / SERVER IP</label>
                  <input
                    type="text"
                    placeholder="10.10.90.202"
                    value={newSoftware.serverHost}
                    onChange={(e) => setNewSoftware({ ...newSoftware, serverHost: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>LIVE URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newSoftware.deploymentUrl}
                    onChange={(e) => setNewSoftware({ ...newSoftware, deploymentUrl: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>DESCRIPTION / PURPOSE</label>
                <textarea
                  rows={2}
                  placeholder="Key features, modules, user groups..."
                  value={newSoftware.description}
                  onChange={(e) => setNewSoftware({ ...newSoftware, description: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSoftwareOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'transparent', color: 'var(--notion-text)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  Save to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD DEV TASK / LOG HOURS                                         */}
      {/* ========================================================================= */}
      {isAddDevTaskOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsAddDevTaskOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '14px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Log Development Task & Progress</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDevTaskOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--notion-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDevTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>
                  SELECT SOFTWARE SYSTEM *
                </label>
                <select
                  value={newDevTask.softwareName}
                  onChange={(e) => setNewDevTask({ ...newDevTask, softwareName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                >
                  {softwareList.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>TASK TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Integrate SMS API Webhook for Fee Reminders"
                  value={newDevTask.taskTitle}
                  onChange={(e) => setNewDevTask({ ...newDevTask, taskTitle: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>MODULE</label>
                  <input
                    type="text"
                    placeholder="Backend / Frontend / Auth"
                    value={newDevTask.module}
                    onChange={(e) => setNewDevTask({ ...newDevTask, module: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>ASSIGNED DEVELOPER</label>
                  <input
                    type="text"
                    placeholder="Developer Name"
                    value={newDevTask.assignedDeveloper}
                    onChange={(e) => setNewDevTask({ ...newDevTask, assignedDeveloper: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>EST HOURS</label>
                  <input
                    type="number"
                    value={newDevTask.estimatedHours}
                    onChange={(e) => setNewDevTask({ ...newDevTask, estimatedHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>LOGGED HOURS</label>
                  <input
                    type="number"
                    value={newDevTask.actualHours}
                    onChange={(e) => setNewDevTask({ ...newDevTask, actualHours: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>PROGRESS %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDevTask.progressPercent}
                    onChange={(e) => setNewDevTask({ ...newDevTask, progressPercent: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>PRIORITY</label>
                  <select
                    value={newDevTask.priority}
                    onChange={(e) => setNewDevTask({ ...newDevTask, priority: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="URGENT">⚡ Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>DEV STATUS</label>
                  <select
                    value={newDevTask.status}
                    onChange={(e) => setNewDevTask({ ...newDevTask, status: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="BACKLOG">Backlog / Planning</option>
                    <option value="IN_DEVELOPMENT">In Development</option>
                    <option value="CODE_REVIEW">Code Review</option>
                    <option value="TESTING">QA & Testing</option>
                    <option value="DEPLOYED">Deployed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDevTaskOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'transparent', color: 'var(--notion-text)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  Save Dev Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD LIVE APPLICATION URL                                         */}
      {/* ========================================================================= */}
      {isAddLiveAppOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsAddLiveAppOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              borderRadius: '14px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Add Live Application & Server Status</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLiveAppOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--notion-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLiveApp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>APP NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Fees & Online Receipt Portal"
                  value={newLiveApp.name}
                  onChange={(e) => setNewLiveApp({ ...newLiveApp, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>DEPLOYMENT URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://fees.rathinam.in"
                  value={newLiveApp.url}
                  onChange={(e) => setNewLiveApp({ ...newLiveApp, url: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>SERVER IP / HOST</label>
                  <input
                    type="text"
                    placeholder="10.10.90.202"
                    value={newLiveApp.serverIp}
                    onChange={(e) => setNewLiveApp({ ...newLiveApp, serverIp: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>PORT</label>
                  <input
                    type="text"
                    placeholder="443"
                    value={newLiveApp.port}
                    onChange={(e) => setNewLiveApp({ ...newLiveApp, port: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>SSL STATUS</label>
                  <select
                    value={newLiveApp.sslStatus}
                    onChange={(e) => setNewLiveApp({ ...newLiveApp, sslStatus: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Valid (HTTPS)">🔒 Valid (HTTPS)</option>
                    <option value="Self-Signed">Self-Signed</option>
                    <option value="HTTP Only">HTTP Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>HEALTH STATUS</label>
                  <select
                    value={newLiveApp.healthStatus}
                    onChange={(e) => setNewLiveApp({ ...newLiveApp, healthStatus: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="HEALTHY">🟢 Healthy / Online</option>
                    <option value="DEGRADED">🟡 Degraded</option>
                    <option value="OFFLINE">🔴 Offline</option>
                    <option value="MAINTENANCE">🔧 Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddLiveAppOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'transparent', color: 'var(--notion-text)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  Add Live App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PROPOSE UPCOMING PROJECT                                         */}
      {/* ========================================================================= */}
      {isAddUpcomingOpen && (
        <div
          className="notion-modal-overlay"
          onClick={() => setIsAddUpcomingOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="notion-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '14px',
              background: 'var(--notion-card)',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Propose Upcoming Software Initiative</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUpcomingOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--notion-text-dim)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUpcoming} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>PROJECT NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Canteen Token Display & Kiosk"
                  value={newUpcoming.projectName}
                  onChange={(e) => setNewUpcoming({ ...newUpcoming, projectName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>REQUESTING DEPT</label>
                  <input
                    type="text"
                    placeholder="e.g. Food Department / Mess"
                    value={newUpcoming.requestingDept}
                    onChange={(e) => setNewUpcoming({ ...newUpcoming, requestingDept: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>PRIORITY</label>
                  <select
                    value={newUpcoming.priority}
                    onChange={(e) => setNewUpcoming({ ...newUpcoming, priority: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="P1 - Institutional Critical">🔴 P1 - Institutional Critical</option>
                    <option value="P2 - High Priority">🟡 P2 - High Priority</option>
                    <option value="P3 - Departmental">🔵 P3 - Departmental Need</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>TARGET QUARTER</label>
                  <input
                    type="text"
                    placeholder="Q1 2027"
                    value={newUpcoming.targetQuarter}
                    onChange={(e) => setNewUpcoming({ ...newUpcoming, targetQuarter: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>EST DEV WEEKS</label>
                  <input
                    type="number"
                    value={newUpcoming.estimatedDevWeeks}
                    onChange={(e) => setNewUpcoming({ ...newUpcoming, estimatedDevWeeks: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text-dim)' }}>BUSINESS PURPOSE / OBJECTIVE</label>
                <textarea
                  rows={2}
                  placeholder="Why is this software required? Expected impact..."
                  value={newUpcoming.businessPurpose}
                  onChange={(e) => setNewUpcoming({ ...newUpcoming, businessPurpose: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'var(--notion-item-bg)', color: 'var(--notion-text)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddUpcomingOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid var(--notion-border)', background: 'transparent', color: 'var(--notion-text)', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  Propose Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
