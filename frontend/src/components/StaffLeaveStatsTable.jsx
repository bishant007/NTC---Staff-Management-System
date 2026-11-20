import React, { useMemo } from 'react';
export default function StaffLeaveStatsTable({
  requests,
  loading,
  title = 'Leave Request History (per staff)',
  highlightStaffId,
  note,
}) {
  const rows = useMemo(() => aggregate(requests || []), [requests]);

  const totals = useMemo(() => {
    const t = { staff: rows.length, requests: 0, approved: 0, rejected: 0, pending: 0, onHold: 0, cancelled: 0 };
    for (const r of rows) {
      t.requests += r.total;
      t.approved += r.approved;
      t.rejected += r.rejected;
      t.pending += r.pending;
      t.onHold += r.onHold;
      t.cancelled += r.cancelled;
    }
    return t;
  }, [rows]);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 4px' }}>
        <span style={{ fontSize: 18 }}>📊</span>
        <h2 style={{ margin: 0, color: '#0b2e6f', fontSize: 16 }}>{title}</h2>
      </div>
      {note && (
        <p style={{ margin: '0 16px 8px', color: '#64748b', fontSize: 12 }}>{note}</p>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8', padding: '4px 16px 16px' }}>Loading statistics…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#94a3b8', padding: '4px 16px 16px' }}>No leave requests recorded yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '0 16px 12px' }}>
            <Summary label="Staff" value={totals.staff} color="#0b2e6f" />
            <Summary label="Total" value={totals.requests} color="#0b2e6f" />
            <Summary label="Approved" value={totals.approved} color="#16a34a" />
            <Summary label="Pending" value={totals.pending + totals.onHold} color="#b45309" />
            <Summary label="Rejected" value={totals.rejected} color="#dc2626" />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={th}>Staff</th>
                  <th style={th}>Staff ID</th>
                  <th style={th}>Department</th>
                  <th style={thRight}>Total</th>
                  <th style={thRight}>Approved</th>
                  <th style={thRight}>Pending</th>
                  <th style={thRight}>On Hold</th>
                  <th style={thRight}>Rejected</th>
                  <th style={thRight}>Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isMe = highlightStaffId && r.staffId === highlightStaffId;
                  return (
                    <tr key={r.staffId || r.staffName}
                      style={{ borderBottom: '1px solid #eef2f7', background: isMe ? '#f0f9ff' : 'transparent' }}>
                      <td style={td}>
                        <span style={{ fontWeight: 700, color: '#0b2e6f' }}>{r.staffName || '—'}</span>
                        {isMe && <span style={youBadge}>YOU</span>}
                      </td>
                      <td style={{ ...td, fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>
                        {r.staffId || '—'}
                      </td>
                      <td style={{ ...td, color: '#64748b' }}>{r.department || '—'}</td>
                      <td style={tdNum}>{r.total}</td>
                      <td style={{ ...tdNum, color: '#16a34a' }}>{r.approved}</td>
                      <td style={{ ...tdNum, color: '#b45309' }}>{r.pending}</td>
                      <td style={{ ...tdNum, color: '#b45309' }}>{r.onHold}</td>
                      <td style={{ ...tdNum, color: '#dc2626' }}>{r.rejected}</td>
                      <td style={{ ...tdNum, color: '#64748b' }}>{r.cancelled}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function aggregate(requests) {
  const map = new Map();
  for (const req of requests) {
    if (!req) continue;
    const key = req.staffId || req.staffName || 'unknown';
    let row = map.get(key);
    if (!row) {
      row = {
        staffId: req.staffId || '',
        staffName: req.staffName || '—',
        department: req.staffDepartment || '',
        total: 0, approved: 0, rejected: 0, pending: 0, onHold: 0, cancelled: 0,
      };
      map.set(key, row);
    }
    row.total += 1;
    switch (req.status) {
      case 'APPROVED':  row.approved  += 1; break;
      case 'REJECTED':  row.rejected  += 1; break;
      case 'CANCELLED': row.cancelled += 1; break;
      case 'ON_HOLD':   row.onHold    += 1; break;
      default:          row.pending   += 1; // all PENDING_* variants
    }
  }
  return [...map.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return (a.staffName || '').localeCompare(b.staffName || '');
  });
}

function Summary({ label, value, color }) {
  return (
    <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e5edf8', borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

const cardStyle = {
  background: '#fff', borderRadius: 14,
  boxShadow: '0 4px 16px rgba(0,0,0,.06)',
  border: '1px solid #e5edf8',
  marginBottom: 20, overflow: 'hidden',
};
const th      = { padding: '10px 12px', textAlign: 'left',  fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: 0.3, textTransform: 'uppercase' };
const thRight = { ...th, textAlign: 'right' };
const td      = { padding: '10px 12px', color: '#0f172a', verticalAlign: 'middle' };
const tdNum   = { ...td, textAlign: 'right', fontWeight: 700, fontSize: 13 };
const youBadge = {
  marginLeft: 8, fontSize: 9, fontWeight: 800,
  background: '#0d6efd', color: '#fff',
  padding: '2px 7px', borderRadius: 10, letterSpacing: 0.5,
  verticalAlign: 'middle',
};