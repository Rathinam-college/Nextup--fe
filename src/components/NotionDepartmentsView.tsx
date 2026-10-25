import React, { useState } from 'react';
import { Department, DashboardStats } from '../types';
import { Building, Users, Plus, Edit, Trash2, Search, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import rathinamLogo from '../image/image.png';

interface NotionDepartmentsViewProps {
  departments: Department[];
  stats: DashboardStats | null;
  onSelectDept: (id: number) => void;
  onOpenCreateDepartment?: () => void;
  onEditDepartment?: (dept: Department) => void;
  onDeleteDepartment?: (dept: Department) => void;
  onOpenCreateTaskForDept?: (deptId: number, isIssue?: boolean) => void;
  canManageDepartment?: boolean;
  canCreateDepartment?: boolean;
}

export const NotionDepartmentsView: React.FC<NotionDepartmentsViewProps> = ({
  departments,
  stats,
  onSelectDept,
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
    <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
            Departments
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--notion-text-dim)', background: 'var(--notion-item-bg)', padding: '2px 8px', borderRadius: '10px' }}>
            {departments.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--notion-text-dim)' }} />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notion-input"
              style={{ paddingLeft: '32px', fontSize: '12px' }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredDepts.map((dept) => {
          const deptStat = stats?.dept_stats?.find((s) => s.id === dept.id);
          const totalTasks = deptStat ? deptStat.total : dept.active_tasks_count;
          const pendingTasks = deptStat ? deptStat.pending_gm : 0;
          const closedTasks = deptStat ? deptStat.closed : 0;
          const membersCount = deptStat ? deptStat.members_count : dept.members_count;
          const completionPct = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={dept.id}
              className="notion-card"
              style={{
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                background: 'var(--notion-card)',
                border: '1px solid var(--notion-border)',
                boxShadow: 'var(--notion-shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--notion-shadow)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--notion-shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--notion-border)';
              }}
            >
              <div>
                {/* Header Row: Title & Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '26px' }}>📁</span>
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--notion-text)', letterSpacing: '-0.02em' }}>
                        {dept.name}
                      </h3>
                      <span className="notion-tag tag-purple" style={{ marginTop: '5px', display: 'inline-block', fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
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
                          style={{ padding: '6px 9px', fontSize: '12px', borderRadius: '7px', color: 'var(--notion-text)' }}
                          title={`Edit ${dept.name}`}
                        >
                          <Edit size={13} />
                        </button>
                      )}
                      {onDeleteDepartment && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, dept)}
                          className="notion-btn notion-btn-bordered"
                          style={{ padding: '6px 9px', fontSize: '12px', borderRadius: '7px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title={`Delete ${dept.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--notion-text-muted)', margin: '10px 0 16px', lineHeight: 1.55, minHeight: '40px' }}>
                  {dept.description || 'Enterprise operational business unit.'}
                </p>

                {/* Manager Information */}
                {dept.manager && (
                  <div
                    style={{
                      background: 'var(--notion-item-bg)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '18px' }}>
                  <div style={{ background: 'var(--notion-item-bg)', padding: '10px', borderRadius: '10px', border: '1px solid var(--notion-border-subtle)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--notion-text)' }}>{totalTasks}</div>
                    <div style={{ fontSize: '11px', color: 'var(--notion-text-dim)', fontWeight: 600 }}>Total Tasks</div>
                  </div>
                  <div style={{ background: 'var(--tag-yellow-bg)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tag-yellow-text)' }}>{pendingTasks}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tag-yellow-text)', fontWeight: 700 }}>Awaiting GM</div>
                  </div>
                  <div style={{ background: 'var(--tag-green-bg)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--tag-green-text)' }}>{closedTasks}</div>
                    <div style={{ fontSize: '11px', color: 'var(--tag-green-text)', fontWeight: 700 }}>Closed</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--notion-text-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    <span>Completion Rate</span>
                    <span style={{ color: 'var(--notion-text)', fontWeight: 700 }}>{completionPct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'var(--notion-item-bg)', borderRadius: '9999px', overflow: 'hidden' }}>
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
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                  )}
                  {canManageDepartment && onDeleteDepartment && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, dept)}
                      className="notion-btn"
                      style={{ fontSize: '12px', padding: '4px 8px', color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
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
                        fontSize: '12px',
                        padding: '4px 9px',
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
                      <span>+ Add Issue</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectDept(dept.id)}
                    className="notion-btn notion-btn-bordered"
                    style={{ fontSize: '12px', padding: '4px 10px', color: '#2383e2', borderColor: 'rgba(35, 131, 226, 0.4)' }}
                  >
                    <span>View Board</span>
                    <ArrowRight size={12} />
                  </button>
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
              borderRadius: '8px',
              padding: '24px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              color: 'var(--notion-text-dim)',
              transition: 'all 0.15s ease',
              minHeight: '260px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--notion-hover)';
              e.currentTarget.style.borderColor = 'var(--notion-blue)';
              e.currentTarget.style.color = 'var(--notion-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--notion-border)';
              e.currentTarget.style.color = 'var(--notion-text-dim)';
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--notion-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={22} style={{ color: '#2383e2' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Create New Department</span>
            <span style={{ fontSize: '12px', color: 'var(--notion-text-muted)', textAlign: 'center' }}>
              Add a new enterprise department unit with isolated scope
            </span>
          </div>
        )}
      </div>

      {/* Delete Department Confirmation Modal */}
      {confirmDeleteDept && (
        <div className="notion-modal-overlay" onClick={() => setConfirmDeleteDept(null)}>
          <div className="notion-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--notion-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                <Trash2 size={16} />
                <span>Confirm Department Deletion</span>
              </div>
              <button onClick={() => setConfirmDeleteDept(null)} className="notion-btn" style={{ padding: '3px 6px' }}>✕</button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--notion-text)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete department <strong>"{confirmDeleteDept.name}" ({confirmDeleteDept.code})</strong>?
              </p>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#ef4444', marginBottom: '18px' }}>
                ⚠️ <strong>Warning:</strong> Deleting this department will also remove all its tasks and milestones. Staff members assigned to this department will become unassigned.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteDept(null)}
                  className="notion-btn notion-btn-bordered"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="notion-btn"
                  style={{ background: '#ef4444', color: '#fff', fontWeight: 600, padding: '7px 16px', border: 'none' }}
                >
                  Yes, Delete Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
