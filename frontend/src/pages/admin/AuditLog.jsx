import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { getAuditLogs } from '../../services/authService';
import { formatNepalDateTime } from '../../utils/date';

const ACTION_LABELS = {
  USER_CREATED: 'User Created',
  USER_UPDATED: 'User Updated',
  USER_DELETED: 'User Deleted',
  USER_DEACTIVATED: 'User Deactivated',
  USER_REACTIVATED: 'User Reactivated',
  PASSWORD_CHANGED: 'Password Changed',
  PASSWORD_RESET_BY_ADMIN: 'Password Reset (Admin)',
  PASSWORD_RESET_APPROVED: 'Reset Approved',
  PASSWORD_RESET_REJECTED: 'Reset Rejected',
  LEAVE_SUBMITTED: 'Leave Submitted',
  LEAVE_APPROVED_SECTION_HEAD: 'Approved (SH)',
  LEAVE_APPROVED_OFFICE_INCHARGE: 'Approved (OI)',
  LEAVE_REJECTED_SECTION_HEAD: 'Rejected (SH)',
  LEAVE_REJECTED_OFFICE_INCHARGE: 'Rejected (OI)',
  LEAVE_CANCELLED: 'Leave Cancelled',
  LEAVE_HELD: 'Leave Held',
  LEAVE_HOLD_CLEARED: 'Hold Cleared',
  LEAVE_AUTO_REJECTED: 'Auto-Rejected (Hold)',
  SESSION_STARTED: 'Session Started',
  SESSION_REVOKED: 'Session Revoked',
  SESSION_REUSE_DETECTED: 'Token Reuse Detected',
  SIGNATURE_UPLOADED: 'Signature Uploaded',
  SIGNATURE_DELETED: 'Signature Deleted',
};

function actionColor(action) {
  if (!action) return '#64748b';
  if (action.includes('DELETED') || action.includes('REJECTED')
      || action.includes('DEACTIVATED') || action.includes('REUSE')) return '#dc2626';
  if (action.includes('CREATED') || action.includes('APPROVED')
      || action.includes('STARTED') || action.includes('REACTIVATED')) return '#16a34a';
  if (action.includes('HELD') || action.includes('HOLD')) return '#b45309';
  if (action.includes('CHANGED') || action.includes('UPDATED')) return '#0d6efd';
  return '#475569';
}

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [limit, setLimit] = useState(200);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit };
      if (actor) params.actor = actor;
      if (action) params.action = action;
      const res = await getAuditLogs(params);
      setLogs(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Audit Log</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Chronological record of every significant action taken across the system.
        </p>

        <div style={{
          background: '#fff', padding: 14, borderRadius: 12,
          display: 'flex', gap: 12, marginTop: 18, marginBottom: 18,
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input placeholder="Search by username"
            value={actor} onChange={e => setActor(e.target.value)}
            style={{ ...inp, minWidth: 220 }} />
          <select value={action} onChange={e => setAction(e.target.value)} style={inp}>
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={inp}>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
            <option value={500}>Last 500</option>
            <option value={1000}>Last 1000</option>
          </select>
          <button onClick={load} style={{
            padding: '9px 18px', background: '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}>Apply Filters</button>
          <button onClick={() => { setActor(''); setAction(''); }} style={{
            padding: '9px 18px', background: '#f1f5f9', color: '#334155',
            border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}>Clear</button>
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 14 }}>
          {loading ? <p>Loading...</p> :
            logs.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: 30 }}>No log entries match your filters.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={th}>Time (NPT)</th>
                      <th style={th}>Actor</th>
                      <th style={th}>Action</th>
                      <th style={th}>Target</th>
                      <th style={th}>Details</th>
                      <th style={th}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ ...td, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {formatNepalDateTime(l.timestamp)}
                        </td>
                        <td style={td}>
                          <div style={{ fontWeight: 600, color: '#0b2e6f' }}>
                            {l.actorName || l.actorUsername}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {l.actorType} · {l.actorUsername}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 10px',
                            borderRadius: 14, background: `${actionColor(l.action)}18`,
                            color: actionColor(l.action), whiteSpace: 'nowrap',
                          }}>{ACTION_LABELS[l.action] || l.action}</span>
                        </td>
                        <td style={{ ...td, fontSize: 12 }}>
                          {l.targetName || l.targetId || '—'}
                          {l.targetType && (
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{l.targetType}</div>
                          )}
                        </td>
                        <td style={{ ...td, fontSize: 12, color: '#334155', maxWidth: 380 }}>
                          {l.details || '—'}
                        </td>
                        <td style={{ ...td, fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                          {l.ipAddress || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

const th = { padding: 10, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700 };
const td = { padding: 10, color: '#0b2e6f', verticalAlign: 'top' };
const inp = { padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' };

export default AuditLog;