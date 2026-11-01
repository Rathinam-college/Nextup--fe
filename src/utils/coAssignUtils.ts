export interface CoAssignMember {
  deptName: string;
  deptCode?: string;
  departmentId?: string | number;
  staffName: string;
  staffEmail?: string;
  staffId?: string | number;
}

export function parseCoAssignedTeam(desc?: string | null): { team: CoAssignMember[]; cleanDesc: string } {
  if (!desc) return { team: [], cleanDesc: '' };

  let team: CoAssignMember[] = [];
  const metaMatch = desc.match(/<!-- CO_ASSIGN_TEAM:(.*?) -->/);
  if (metaMatch && metaMatch[1]) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (Array.isArray(parsed)) {
        team = parsed.map((m: any) => ({
          deptName: m.deptName || '',
          deptCode: m.deptCode || '',
          departmentId: m.departmentId,
          staffName: m.staffName || '',
          staffEmail: m.staffEmail || '',
          staffId: m.staffId,
        }));
      }
    } catch {}
  }

  // Fallback plain text parse if no JSON comment
  if (team.length === 0 && desc.includes('📋 Co-Assigned Departments & Staff Members:')) {
    const lines = desc.split('\n');
    let capturing = false;
    for (const l of lines) {
      if (l.includes('📋 Co-Assigned Departments & Staff Members:')) {
        capturing = true;
        continue;
      }
      if (capturing) {
        if (l.trim().startsWith('• [')) {
          const m = l.match(/• \[(.*?)\] : ([^(]+)(?:\s*\((.*?)\))?/);
          if (m) {
            team.push({
              deptName: m[1]?.trim() || '',
              staffName: m[2]?.trim() || '',
              staffEmail: m[3]?.trim() || '',
            });
          }
        } else if (l.trim() === '' || l.startsWith('<!--')) {
          continue;
        } else {
          break;
        }
      }
    }
  }

  // Clean description removing the metadata block and header
  let cleanDesc = desc
    .replace(/<!-- CO_ASSIGN_TEAM:.*?-->/gs, '')
    .replace(/📋 Co-Assigned Departments & Staff Members:(\n• .*)*/gs, '')
    .trim();

  return { team, cleanDesc };
}
