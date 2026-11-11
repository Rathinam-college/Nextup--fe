import { Task } from '../types';
import { parseGmDirective } from './gmDirectiveUtils';
import { parseCoAssignedTeam } from './coAssignUtils';

/**
 * Strips HTML comment tags from description (e.g. metadata tags)
 */
function cleanDescription(desc?: string): string {
  if (!desc) return 'No description provided.';
  return desc.replace(/<!--.*?-->/g, '').trim() || 'No description provided.';
}

/**
 * Formats a date into a clean printable string
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates an official, crystal-clear HTML Work Order document for a single task
 */
export function generateTaskWorkOrderHtml(task: Task): string {
  const directive = parseGmDirective(task);
  const { team } = parseCoAssignedTeam(task.description);
  const cleanDesc = cleanDescription(task.description);

  const statusLabel = task.status_display || task.status.replace(/_/g, ' ');
  const priorityLabel = task.priority_display || task.priority;

  const coAssigneeRows =
    team.length > 0
      ? team.map((m) => `<li><strong>${m.staffName}</strong> (${m.deptName}${m.staffEmail ? ` &bull; ${m.staffEmail}` : ''})</li>`).join('')
      : '';

  const commentsRows =
    task.comments && task.comments.length > 0
      ? task.comments
          .map(
            (c) => `
          <div style="border-bottom: 1px dashed #e2e8f0; padding: 8px 0;">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">
              <strong>${c.author_name || 'Team Member'}</strong> &bull; ${formatDateTime(c.created_at)}
            </div>
            <div style="font-size: 12px; color: #1e293b; white-space: pre-wrap;">${(c as any).content || (c as any).text || ''}</div>
          </div>
        `
          )
          .join('')
      : '<p style="color: #94a3b8; font-style: italic; font-size: 12px; margin: 4px 0;">No comments logged yet.</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Work Order #${task.id} - ${task.title.replace(/"/g, '&quot;')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .org-title {
      font-size: 18px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.01em;
    }
    .org-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-badge .title {
      font-size: 15px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-badge .ref {
      font-size: 11px;
      color: #64748b;
    }
    .task-title-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #2563eb;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .task-id {
      font-size: 11px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
    }
    .task-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0 0 0;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      background: #ffffff;
    }
    .card-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .prop-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .prop-label {
      color: #64748b;
      font-weight: 500;
    }
    .prop-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 800;
    }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-medium { background: #dbeafe; color: #1e40af; }
    .badge-low { background: #f1f5f9; color: #475569; }
    .badge-closed { background: #dcfce7; color: #166534; }
    .badge-progress { background: #e0e7ff; color: #3730a3; }
    .badge-review { background: #fef3c7; color: #92400e; }
    .badge-todo { background: #f1f5f9; color: #334155; }
    .directive-banner {
      background: #faf5ff;
      border: 1px solid #d8b4fe;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 16px 0 8px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
    }
    .desc-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 12.5px;
      line-height: 1.6;
      color: #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 60px;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 28px;
      page-break-inside: avoid;
    }
    .sign-table td {
      width: 33.33%;
      border: 1px solid #cbd5e1;
      padding: 12px 10px;
      vertical-align: top;
      font-size: 11px;
    }
    .sign-space {
      height: 45px;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org-title">RATHINAM GROUP OF INSTITUTIONS</div>
      <div class="org-subtitle">NextUp Enterprise Task Management &bull; Official Work Order</div>
    </div>
    <div class="doc-badge">
      <div class="title">TASK DIRECTIVE</div>
      <div class="ref">REF: #TASK-${task.id} &bull; Generated: ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="task-title-box">
    <div class="task-id">TASK #${task.id} &bull; ${task.department_name || 'General Operations'} (${task.department_code || 'GEN'})</div>
    <div class="task-title">${task.title}</div>
  </div>

  ${
    directive.isAssignedByGm
      ? `
  <div class="directive-banner">
    <div style="font-weight: 800; color: #6b21a8; margin-bottom: 2px;">
      ${directive.channelIcon} ASSIGNED BY GENERAL MANAGER (${directive.channelDisplay.toUpperCase()})
    </div>
    <div style="color: #475569;">
      Initiated & logged on behalf of Executive GM by <strong>${task.created_by_name || 'Staff'}</strong>${task.created_by_role ? ` (${task.created_by_role})` : ''}.
      ${directive.directiveNotes ? `<br><em>Directive Reference: "${directive.directiveNotes}"</em>` : ''}
    </div>
  </div>
  `
      : ''
  }

  <div class="grid">
    <div class="card">
      <div class="card-title">Assignment &amp; Personnel</div>
      <div class="prop-row">
        <span class="prop-label">Primary Assignee:</span>
        <span class="prop-value">${task.assigned_to_name || 'Department Queue / Unassigned'}</span>
      </div>
      ${task.assigned_to_email ? `<div class="prop-row"><span class="prop-label">Assignee Email:</span><span class="prop-value" style="font-size: 11px;">${task.assigned_to_email}</span></div>` : ''}
      <div class="prop-row">
        <span class="prop-label">Created By:</span>
        <span class="prop-value">${task.created_by_name || 'Management'} (${task.created_by_role || 'Staff'})</span>
      </div>
      <div class="prop-row">
        <span class="prop-label">Assigned By:</span>
        <span class="prop-value">${directive.isAssignedByGm ? `GM (${directive.channelDisplay})` : (task.created_by_name || 'Direct')}</span>
      </div>
      ${
        team.length > 0
          ? `
      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
        <span class="prop-label" style="display: block; margin-bottom: 3px;">Co-Assigned Team (${team.length}):</span>
        <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #334155;">
          ${coAssigneeRows}
        </ul>
      </div>
      `
          : ''
      }
    </div>

    <div class="card">
      <div class="card-title">Classification &amp; Timeline</div>
      <div class="prop-row">
        <span class="prop-label">Priority:</span>
        <span class="prop-value">
          <span class="badge ${task.priority === 'URGENT' ? 'badge-urgent' : task.priority === 'HIGH' ? 'badge-high' : task.priority === 'LOW' ? 'badge-low' : 'badge-medium'}">
            ${priorityLabel.toUpperCase()}
          </span>
        </span>
      </div>
      <div class="prop-row">
        <span class="prop-label">Current Status:</span>
        <span class="prop-value">
          <span class="badge ${task.status === 'CLOSED' ? 'badge-closed' : task.status === 'PENDING_GM_APPROVAL' ? 'badge-review' : task.status === 'IN_PROGRESS' ? 'badge-progress' : 'badge-todo'}">
            ${statusLabel.toUpperCase()}
          </span>
        </span>
      </div>
      <div class="prop-row">
        <span class="prop-label">Due Date:</span>
        <span class="prop-value" style="color: #b91c1c;">${formatDate(task.due_date)}</span>
      </div>
      <div class="prop-row">
        <span class="prop-label">Date Created:</span>
        <span class="prop-value">${formatDateTime(task.created_at)}</span>
      </div>
      ${task.closed_at ? `<div class="prop-row"><span class="prop-label">Closed Date:</span><span class="prop-value" style="color: #15803d;">${formatDateTime(task.closed_at)}</span></div>` : ''}
      ${task.verified_by_name ? `<div class="prop-row"><span class="prop-label">Verified By:</span><span class="prop-value">${task.verified_by_name}</span></div>` : ''}
    </div>
  </div>

  <div class="section-title">Task Deliverables &amp; Specifications</div>
  <div class="desc-box">${cleanDesc}</div>

  ${
    task.gm_feedback_notes
      ? `
  <div class="section-title">General Manager Direct Feedback / Instructions</div>
  <div class="desc-box" style="background: #faf5ff; border-color: #d8b4fe; color: #6b21a8; font-weight: 600;">
    ${task.gm_feedback_notes}
  </div>
  `
      : ''
  }

  <div class="section-title">Activity &amp; Discussion Audit Trail</div>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 14px; margin-bottom: 18px;">
    ${commentsRows}
  </div>

  <table class="sign-table">
    <tr>
      <td>
        <strong>Assigned Staff Signature</strong>
        <div class="sign-space"></div>
        <div>Name: ______________________</div>
        <div style="margin-top: 3px;">Date: &nbsp; &nbsp;______________________</div>
      </td>
      <td>
        <strong>Department Manager Sign-off</strong>
        <div class="sign-space"></div>
        <div>Name: ______________________</div>
        <div style="margin-top: 3px;">Date: &nbsp; &nbsp;______________________</div>
      </td>
      <td>
        <strong>General Manager Final Approval</strong>
        <div class="sign-space"></div>
        <div>Name: Ramakrishnan V (GM)</div>
        <div style="margin-top: 3px;">Status: <strong>${task.status === 'CLOSED' ? '✓ APPROVED & CLOSED' : '[ &nbsp; ] PENDING REVIEW'}</strong></div>
      </td>
    </tr>
  </table>

  <div class="footer">
    <div>NextUp Enterprise Task Tracker &bull; Rathinam College</div>
    <div>Confidential &bull; Strictly for internal institutional administration</div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a beautiful, official printout of a single task's clear details
 */
export function printTaskDetails(task: Task): void {
  const html = generateTaskWorkOrderHtml(task);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print task work orders.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

/**
 * Generates an executive printable report for Routine Work Checklists & SOP Logs
 */
export function printRoutineWorkReport(
  items: any[],
  logs: any[] = [],
  departmentName: string = 'All Departments',
  pageTab: 'CHECKLIST' | 'REPORT' = 'CHECKLIST'
): void {
  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isLogReport = pageTab === 'REPORT' && logs.length > 0;
  const dataList = isLogReport ? logs : items;

  const rows = dataList
    .map((d, idx) => {
      if (isLogReport) {
        const item = items.find((i) => String(i.id) === String(d.item_id || d.item));
        const dt = d.completed_at ? new Date(d.completed_at).toLocaleString() : '';
        return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
          <td style="font-weight: 700; color: #7c3aed;">#LOG-${d.id}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${d.item_title || item?.title || 'Routine Task'}</div>
            ${item?.description ? `<div style="font-size: 10px; color: #64748b;">${item.description.slice(0, 80)}</div>` : ''}
          </td>
          <td>${d.department_name || item?.department_name || ''}</td>
          <td>${d.item_frequency || item?.frequency || 'DAILY'}</td>
          <td>
            <div style="font-weight: 600;">${d.completed_by_name || 'Staff'}</div>
            <div style="font-size: 10px; color: #64748b;">${dt}</div>
          </td>
          <td>
            <strong style="color: #0284c7;">${d.count !== null && d.count !== undefined ? d.count : '-'}</strong>
            <span style="font-size: 10px; color: #64748b;">${d.unit || item?.unit || ''}</span>
            ${d.target_count || item?.target_count ? `<div style="font-size: 9.5px; color: #64748b;">Target: ${d.target_count || item?.target_count}</div>` : ''}
          </td>
          <td style="font-size: 10.5px; color: #475569;">${d.notes || 'Routine check verified'}</td>
          <td><span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">${d.status || 'COMPLETED'}</span></td>
        </tr>
      `;
      } else {
        return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
          <td style="font-weight: 700; color: #2563eb;">#${d.id}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${d.title}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${(d.description || '').slice(0, 90)}</div>
          </td>
          <td>${d.department_name || ''}</td>
          <td><strong>${d.frequency || 'DAILY'}</strong></td>
          <td>${d.target_time || 'Daily Schedule'}</td>
          <td>
            ${d.requires_count ? `<strong style="color: #0284c7;">Target: ${d.target_count || 1} ${d.unit || 'units'}</strong>` : '<span style="color: #64748b;">Yes/No Check</span>'}
          </td>
          <td style="font-size: 10.5px;">${d.responsible_role || 'Staff / Officer'}</td>
          <td><span style="background: ${d.is_active ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'} padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">${d.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
        </tr>
      `;
      }
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Routine Work Report - ${departmentName}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 11px; }
    .header { border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .org-title { font-size: 16px; font-weight: 800; color: #5b21b6; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
    th { background: #f8fafc; color: #1e293b; font-weight: 800; text-transform: uppercase; font-size: 10px; text-align: left; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org-title">RATHINAM GROUP OF INSTITUTIONS</div>
      <div style="font-size: 11px; color: #64748b;">NextUp Enterprise Routine Operations &bull; SOP Checklist Report</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 13px; font-weight: 800; color: #7c3aed;">${isLogReport ? 'ROUTINE WORK AUDIT LOGS' : 'STANDARD OPERATING CHECKLISTS'}</div>
      <div style="font-size: 10px; color: #64748b;">Dept: <strong>${departmentName}</strong> &bull; Date: ${todayStr} &bull; Total: ${dataList.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th style="width: 55px;">ID</th>
        <th>${isLogReport ? 'Checklist Item & Procedure' : 'SOP Item & Title'}</th>
        <th style="width: 120px;">Department</th>
        <th style="width: 80px;">Frequency</th>
        <th style="width: 130px;">${isLogReport ? 'Completed By & Time' : 'Schedule'}</th>
        <th style="width: 100px;">Count / Target</th>
        <th>${isLogReport ? 'Remarks & Notes' : 'Responsible Role'}</th>
        <th style="width: 75px;">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <div>NextUp Routine Work &bull; Institutional Quality Audit Report</div>
    <div>Verified by Quality Management System &bull; Rathinam College</div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print report.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}




/**
 * Downloads the official Work Order HTML file
 */
export function downloadTaskDetailsHtml(task: Task): void {
  const html = generateTaskWorkOrderHtml(task);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = (task.title || 'task').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  link.setAttribute('download', `NextUp_Task_${task.id}_${safeTitle}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive, printable multi-task summary table report
 */
export function printTasksTableReport(
  tasks: Task[],
  title: string = 'Tasks Overview Report',
  departmentName: string = 'All Departments'
): void {
  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'TODO').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const review = tasks.filter((t) => t.status === 'PENDING_GM_APPROVAL').length;
  const closed = tasks.filter((t) => t.status === 'CLOSED').length;
  const urgent = tasks.filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'CLOSED').length;

  const rows = tasks
    .map((t, idx) => {
      const directive = parseGmDirective(t);
      const cleanDesc = cleanDescription(t.description);
      const shortDesc = cleanDesc.length > 90 ? `${cleanDesc.slice(0, 90)}...` : cleanDesc;
      return `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
        <td style="font-weight: 700; color: #2563eb;">#${t.id}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${t.title}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${shortDesc}</div>
        </td>
        <td>${t.department_name || ''} <span style="color:#64748b; font-size:10px;">(${t.department_code || ''})</span></td>
        <td>
          <div style="font-weight: 600;">${t.assigned_to_name || 'Unassigned'}</div>
          ${directive.isAssignedByGm ? `<div style="font-size: 10px; color: #7c3aed; font-weight: 700;">${directive.channelIcon} GM (${directive.channelDisplay})</div>` : ''}
        </td>
        <td><span style="font-weight: 700;">${t.priority}</span></td>
        <td>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: ${
            t.status === 'CLOSED'
              ? '#dcfce7; color: #166534;'
              : t.status === 'PENDING_GM_APPROVAL'
              ? '#fef3c7; color: #92400e;'
              : t.status === 'IN_PROGRESS'
              ? '#e0e7ff; color: #3730a3;'
              : '#f1f5f9; color: #334155;'
          }">
            ${t.status.replace(/_/g, ' ')}
          </span>
        </td>
        <td style="font-size: 11px; white-space: nowrap;">${formatDate(t.due_date)}</td>
      </tr>
    `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ${departmentName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 12mm 12mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      line-height: 1.4;
      font-size: 11.5px;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .org-title {
      font-size: 17px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .kpi-row {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      background: #f8fafc;
      text-align: center;
    }
    .kpi .num {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi .lbl {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      text-align: left;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="org-title">RATHINAM GROUP OF INSTITUTIONS</div>
      <div style="font-size: 11px; color: #64748b;">NextUp Enterprise Task Management &bull; Executive Digest Report</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: 800; color: #2563eb;">${title.toUpperCase()}</div>
      <div style="font-size: 10.5px; color: #64748b;">Dept: <strong>${departmentName}</strong> &bull; Date: ${todayStr}</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="num">${total}</div><div class="lbl">Total Tasks</div></div>
    <div class="kpi"><div class="num" style="color: #2563eb;">${todo}</div><div class="lbl">To Do / Backlog</div></div>
    <div class="kpi"><div class="num" style="color: #4f46e5;">${inProgress}</div><div class="lbl">In Progress</div></div>
    <div class="kpi"><div class="num" style="color: #d97706;">${review}</div><div class="lbl">Pending GM Review</div></div>
    <div class="kpi"><div class="num" style="color: #16a34a;">${closed}</div><div class="lbl">Completed / Closed</div></div>
    <div class="kpi"><div class="num" style="color: #dc2626;">${urgent}</div><div class="lbl">Urgent / Attention</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th style="width: 45px;">ID</th>
        <th>Task Title &amp; Deliverables</th>
        <th style="width: 140px;">Department</th>
        <th style="width: 150px;">Assignee / Directive</th>
        <th style="width: 70px;">Priority</th>
        <th style="width: 90px;">Status</th>
        <th style="width: 80px;">Due Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <div>NextUp Task Tracker &bull; Confidential Institutional Document</div>
    <div>Page 1 of 1 &bull; Verified by Executive Administration</div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print task reports.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}




