import React, { useState } from 'react';
import { Department, DashboardStats } from '../types';
import {
  Building,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code,
  TrendingUp,
  Globe,
  Database,
  Terminal,
  FileText,
  BarChart2,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import rathinamLogo from '../image/image.png';

interface NotionDepartmentsViewProps {
  departments: Department[];
  stats: DashboardStats | null;
  onSelectDept: (id: number) => void;
  onSelectView?: (view: any) => void;
  onOpenCreateDepartment?: () => void;
  onEditDepartment?: (dept: Department) => void;
  onDeleteDepartment?: (dept: Department) => void;
  onOpenCreateTaskForDept?: (deptId: number, isIssue?: boolean) => void;
  canManageDepartment?: boolean;
  canCreateDepartment?: boolean;
}

// 6 IT Section Modules as requested
const IT_SECTION_MODULES = [
  { name: 'Overview', purpose: 'All software statistics', icon: BarChart2, color: '#2563eb' },
  { name: 'Software Registry', purpose: 'All applications and details', icon: Database, color: '#0284c7' },
  { name: 'Development Tracker', purpose: 'Tasks, hours and progress', icon: Code, color: '#d97706' },
  { name: 'Live Applications', purpose: 'Deployment URL and server status', icon: Globe, color: '#059669' },
  { name: 'Upcoming Projects', purpose: 'Planned applications and priorities', icon: TrendingUp, color: '#7c3aed' },
  { name: 'Reports & Analytics', purpose: 'Monthly and management reports', icon: FileText, color: '#e11d48' },
];

// Department Upcoming Initiatives & Priorities
const UPCOMING_INITIATIVES: Record<string, string[]> = {
  IT: [
    'NextUP Mobile App v2.5 (React Native & Push)',
    'Campus ERP 4.8 Academics & Exam Cloud Sync',
    'RFID Attendance Turnstiles Automation',
    'Admission Portal 2027 Microservices',
  ],
  TD: [
    'Campus Fleet GPS Telemetry & Geo-fencing',
    'Route 35 AC Bus EV Conversion Feasibility',
    'Driver Biometric Duty Log & Fuel Analytics',
  ],
  CCTV: [
    'Main Gate 1 & 2 ANPR Perimeter Camera Array',
    'CV Raman & Chanakya Block Wi-Fi 6 Mesh',
    'AI Intrusion Detection & Night Vision Alerting',
  ],
  INFRA: [
    'Solar 250kW Inverter Grid Telemetry',
    'Auditorium High-Fidelity Audio Cabling',
    'Campus RO Water Desalination Pipeline',
  ],
  FOOD: [
    'Central Mess Oil Trap Desilting & Thermal Logs',
    'Dining Hall Digital Food Quality Inspection',
    'Hostel Kitchen Automated Inventory & Cold Storage',
  ],
  HOSTEL: [
    'Block B & D Biometric Turnstile Access',
    'Solar Hot Water Descaling Maintenance',
    'Parent Weekend Gate-pass QR Scanner',
  ],
};

export const NotionDepartmentsView: React.FC<NotionDepartmentsViewProps> = ({
  departments,
  stats,
  onSelectDept,
  onSelectView,
  onOpenCreateDepartment,
  onEditDepartment,
  onDeleteDepartment,
  onOpenCreateTaskForDept,
  canManageDepartment,
  canCreateDepartment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteDept, setConfirmDeleteDept] = useState<Department | null>(null);

  const filteredDepts = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const handleDeleteClick = (e: React.MouseEvent, dept: Department) => {
    e.stopPropagation();
    setConfirmDeleteDept(dept);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteDept && onDeleteDepartment) {
      onDeleteDepartment(confirmDeleteDept);
      setConfirmDeleteDept(null);
    }
  };

  return (
    <div style={{ padding: '24px 32px 48px', maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                All Departments Workspace
              </h2>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                {departments.length} Units Active
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
              Institutional operational units, active tasks, upcoming projects, and specialized department portals.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--notion-text-dim)' }} />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notion-input"
              style={{ paddingLeft: '32px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {onOpenCreateTaskForDept && (
            <button
              onClick={() => onOpenCreateTaskForDept(departments[0]?.id || 0, true)}
              className="notion-btn notion-btn-bordered"
              style={{ gap: '6px', color: '#e11d48', borderColor: 'rgba(225, 29, 72, 0.4)', background: 'rgba(225, 29, 72, 0.05)', fontSize: '12px', padding: '6px 12px' }}
            >
              <AlertCircle size={14} />
              <span>Report Issue</span>
            </button>
          )}

          {(canCreateDepartment || canManageDepartment) && onOpenCreateDepartment && (
            <button onClick={onOpenCreateDepartment} className="notion-btn notion-btn-primary" style={{ gap: '6px', fontSize: '12px', padding: '6px 14px' }}>
              <Plus size={14} />
              <span>New Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Departments Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredDepts.map((dept) => {
          const deptStat = stats?.dept_stats?.find((s) => s.id === dept.id);
          const totalTasks = deptStat ? deptStat.total : dept.active_tasks_count;
          const pendingTasks = deptStat ? deptStat.pending_gm : 0;
          const closedTasks = deptStat ? deptStat.closed : 0;
          const membersCount = deptStat ? deptStat.members_count : dept.members_count;
          const completionPct = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

          const isITDept = dept.code === 'IT' || dept.name.toLowerCase().includes('information technology');
          const upcomingList = UPCOMING_INITIATIVES[dept.code] || UPCOMING_INITIATIVES[dept.code.toUpperCase()] || [
            'Quarterly infrastructure inspection and preventative maintenance',
            'Staff training and departmental compliance audit',
          ];

          return (
            <div
              key={dept.id}
              className="notion-card"
              style={{
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                background: 'var(--notion-card)',
                border: isITDept ? '1.5px solid #06b6d4' : '1px solid var(--notion-border)',
                boxShadow: isITDept ? '0 4px 16px rgba(6, 182, 212, 0.12)' : 'var(--notion-shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isITDept ? '0 8px 24px rgba(6, 182, 212, 0.2)' : 'var(--notion-shadow)';
                e.currentTarget.style.borderColor = isITDept ? '#0891b2' : 'rgba(99, 102, 241, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = isITDept ? '0 4px 16px rgba(6, 182, 212, 0.12)' : 'var(--notion-shadow-sm)';
                e.currentTarget.style.borderColor = isITDept ? '#06b6d4' : 'var(--notion-border)';
              }}
            >
              <div>
                {/* Header Row: Title & Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: isITDept ? 'rgba(6, 182, 212, 0.12)' : 'var(--notion-item-bg)',
                        color: isITDept ? '#0891b2' : 'var(--notion-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {isITDept ? <Code size={20} /> : '📁'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                          {dept.name}
                        </h3>
                        {isITDept && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              background: '#06b6d4',
                              color: '#ffffff',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            HUB
                          </span>
                        )}
                      </div>
                      <span className="notion-tag tag-purple" style={{ marginTop: '3px', display: 'inline-block', fontSize: '10.5px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                        CODE: {dept.code}
                      </span>
                    </div>
                  </div>

                  {/* Top Action Buttons (Edit / Delete) */}
                  {canManageDepartment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {onEditDepartment && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDepartment(dept);
                          }}
                          className="notion-btn notion-btn-bordered"
                          style={{ padding: '5px 8px', fontSize: '11px', borderRadius: '7px', color: 'var(--notion-text)' }}
                          title={`Edit ${dept.name}`}
                        >
                          <Edit size={12} />
                        </button>
                      )}
                      {onDeleteDepartment && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, dept)}
                          className="notion-btn notion-btn-bordered"
                          style={{ padding: '5px 8px', fontSize: '11px', borderRadius: '7px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title={`Delete ${dept.name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: '12.5px', color: 'var(--notion-text-muted)', margin: '8px 0 12px', lineHeight: 1.5 }}>
                  {dept.description || 'Enterprise operational business unit.'}
                </p>

                {/* Manager Information */}
                {dept.manager && (
                  <div
                    style={{
                      background: 'var(--notion-item-bg)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      marginBottom: '12px',
                      color: 'var(--notion-text)',
                      border: '1px solid var(--notion-border-subtle)',
                    }}
                  >
                    <span>👤</span>
                    <span style={{ fontWeight: 700 }}>Manager:</span>
                    <span>{dept.manager.name}</span>
                    <span style={{ color: 'var(--notion-text-dim)', fontSize: '11px' }}>({dept.manager.email})</span>
                  </div>
                )}

                {/* Metric Indicators */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--notion-item-bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--notion-border-subtle)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--notion-text)' }}>{totalTasks}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Total Tasks</div>
                  </div>
                  <div style={{ background: 'var(--tag-yellow-bg)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tag-yellow-text)' }}>{pendingTasks}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--tag-yellow-text)', fontWeight: 700 }}>Awaiting GM</div>
                  </div>
                  <div style={{ background: 'var(--tag-green-bg)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tag-green-text)' }}>{closedTasks}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--tag-green-text)', fontWeight: 700 }}>Closed</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--notion-text-dim)', marginBottom: '5px', fontWeight: 600 }}>
                    <span>Completion Rate</span>
                    <span style={{ color: 'var(--notion-text)', fontWeight: 700 }}>{completionPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--notion-item-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${completionPct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--notion-blue), #10b981)',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* SPECIAL IT DEPARTMENT 6-MODULE MATRIX & UPCOMING PROJECTS                */}
                {/* ========================================================================= */}
                {isITDept ? (
                  <div
                    style={{
                      background: 'rgba(6, 182, 212, 0.06)',
                      borderRadius: '10px',
                      padding: '12px',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#0891b2',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code size={13} />
                        <span>IT Department — 6 Core Sections:</span>
                      </div>
                      <span style={{ fontSize: '10px', background: 'rgba(6, 182, 212, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                        PORTAL READY
                      </span>
                    </div>

                    {/* 6 Sections Table / Pills with requested Purpose */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '10px' }}>
                      {IT_SECTION_MODULES.map((sec) => {
                        const Icon = sec.icon;
                        return (
                          <div
                            key={sec.name}
                            onClick={() => onSelectView?.('it_portal')}
                            style={{
                              background: 'var(--notion-card)',
                              padding: '6px 8px',
                              borderRadius: '7px',
                              border: '1px solid var(--notion-border-subtle)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = sec.color)}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--notion-border-subtle)')}
                            title={`${sec.name}: ${sec.purpose}`}
                          >
                            <Icon size={13} style={{ color: sec.color, marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--notion-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sec.name}
                              </div>
                              <div style={{ fontSize: '9px', color: 'var(--notion-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sec.purpose}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Upcoming IT Projects */}
                    <div>
                      <div style={{ fontSize: '10.5px', fontWeight: 750, color: '#0891b2', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <TrendingUp size={12} />
                        <span>Upcoming Software & Systems:</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {upcomingList.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--notion-text)',
                              background: 'var(--notion-card)',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              border: '1px solid var(--notion-border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Department Upcoming Projects */
                  <div
                    style={{
                      background: 'var(--notion-item-bg)',
                      borderRadius: '8px',
                      padding: '10px',
                      border: '1px solid var(--notion-border-subtle)',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 750, color: 'var(--notion-text)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <TrendingUp size={12} style={{ color: '#f59e0b' }} />
                      <span>Upcoming Operations & Priorities:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {upcomingList.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: '11px',
                            color: 'var(--notion-text-muted)',
                            background: 'var(--notion-card)',
                            padding: '3px 7px',
                            borderRadius: '5px',
                            border: '1px solid var(--notion-border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Controls */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--notion-text-dim)' }}>
                  <Users size={13} />
                  <span>{membersCount} Member{membersCount === 1 ? '' : 's'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {canManageDepartment && onEditDepartment && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDepartment(dept);
                      }}
                      className="notion-btn"
                      style={{ fontSize: '11.5px', padding: '4px 8px' }}
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  )}

                  {onOpenCreateTaskForDept && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCreateTaskForDept(dept.id, true);
                      }}
                      className="notion-btn notion-btn-bordered"
                      style={{
                        fontSize: '11.5px',
                        padding: '4px 8px',
                        color: '#e11d48',
                        borderColor: 'rgba(225, 29, 72, 0.4)',
                        background: 'rgba(225, 29, 72, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={`Report an issue for ${dept.name}`}
                    >
                      <AlertCircle size={12} />
                      <span>+ Issue</span>
                    </button>
                  )}

                  {/* Primary Department Action */}
                  {isITDept ? (
                    <button
                      type="button"
                      onClick={() => onSelectView ? onSelectView('it_portal') : onSelectDept(dept.id)}
                      className="notion-btn notion-btn-primary"
                      style={{
                        fontSize: '11.5px',
                        padding: '5px 12px',
                        background: 'linear-gradient(135deg, #0891b2 0%, #2563eb 100%)',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(8, 145, 178, 0.25)',
                      }}
                      title="Open IT Software Hub & 6-Section Portal"
                    >
                      <Code size={12} />
                      <span>IT Software Hub</span>
                      <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDept(dept.id)}
                      className="notion-btn notion-btn-bordered"
                      style={{ fontSize: '11.5px', padding: '5px 10px', color: '#2383e2', borderColor: 'rgba(35, 131, 226, 0.4)' }}
                    >
                      <span>View Board</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Create Department Card Slot for GM / Super Admin */}
        {(canCreateDepartment || canManageDepartment) && onOpenCreateDepartment && (
          <div
            onClick={onOpenCreateDepartment}
            style={{
              background: 'transparent',
              border: '2px dashed var(--notion-border)',
              borderRadius: '16px',
              padding: '24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '260px',
              color: 'var(--notion-text-dim)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--notion-blue)';
              e.currentTarget.style.background = 'var(--notion-item-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--notion-border)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--notion-item-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <Plus size={20} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--notion-text)' }}>Add New Department</div>
            <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', marginTop: '4px' }}>
              Create an operational business unit
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Department Deletion */}
      {confirmDeleteDept && (
        <div className="notion-modal-overlay" onClick={() => setConfirmDeleteDept(null)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 800, color: 'var(--notion-text)' }}>
              Delete {confirmDeleteDept.name}?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Are you sure you want to delete this department? All associated tasks will remain in the database but will be unlinked from this department unit.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteDept(null)}
                className="notion-btn notion-btn-bordered"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="notion-btn"
                style={{ padding: '6px 14px', fontSize: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700 }}
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
