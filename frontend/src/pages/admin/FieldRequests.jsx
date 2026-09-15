import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaveRequests } from '../../services/authService';
import AdminSidebar from '../../components/AdminSidebar';

function FieldRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');

  const loadRequests = async (status) => {
    try {
      const res = await getLeaveRequests(status);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const fmt = (v) => v ? new Date(v).toLocaleString() : '—';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Leave Requests</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          System-wide view for monitoring. Admins can see but not act on requests — approvals
          are handled by Section Heads and Department Heads.
        </p>

        {message && <p style={{ color: '#dc3545' }}>{message}</p>}

        <div style={{ marginTop: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              loadRequests(e.target.value);
            }}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
              fontSize: 14, background: '#fff'
            }}
          >
            <option value="">All</option>
            <option value="PENDING_SECTION_HEAD">Pending Section Head</option>
            <option value="PENDING_DEPARTMENT_HEAD">Pending Department Head</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        {requests.length === 0 ? (
          <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#888' }}>
            No requests found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={th}>Staff</th>
                  <th style={th}>Leave Type</th>
                  <th style={th}>Reason</th>
                  <th style={th}>Return Date</th>
                  <th style={th}>Section Head</th>
                  <th style={th}>Dept Head</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{req.staffName || req.staff?.fullName || '—'}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{req.staffId || req.staff?.staffId}</div>
                    </td>
                    <td style={td}>{req.leaveType}</td>
                    <td style={{ ...td, maxWidth: 240, fontSize: 13, color: '#475569' }}>
                      {req.reason}
                    </td>
                    <td style={{ ...td, fontSize: 13 }}>{fmt(req.returnDateTime)}</td>
                    <td style={{ ...td, fontSize: 13 }}>
                      {req.sectionHeadName
                        ? <><div style={{ fontWeight: 600 }}>{req.sectionHeadName}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{req.sectionHeadSignature || 'no signature'}</div></>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ ...td, fontSize: 13 }}>
                      {req.departmentHeadName
                        ? <><div style={{ fontWeight: 600 }}>{req.departmentHeadName}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{req.departmentHeadSignature || 'no signature'}</div></>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={td}><StatusPill status={req.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: 24, padding: 14, background: '#f0f9ff',
          border: '1px solid #bae6fd', borderRadius: 10,
          fontSize: 13, color: '#075985'
        }}>
          🔒 <strong>Admin access is read-only.</strong> Requests can only be approved or
          rejected by the assigned Section Head and Department Head. This preserves the
          integrity of the approval chain.
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    PENDING_SECTION_HEAD:    { bg: '#fef3c7', fg: '#92400e' },
    PENDING_DEPARTMENT_HEAD: { bg: '#dbeafe', fg: '#1e40af' },
    APPROVED:                { bg: '#d1fae5', fg: '#065f46' },
    REJECTED:                { bg: '#fee2e2', fg: '#991b1b' },
    CANCELLED:               { bg: '#e5e7eb', fg: '#374151' },
    ON_HOLD:                 { bg: '#e5e7eb', fg: '#374151' },
  };
  const c = styles[status] || styles.ON_HOLD;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, background: c.bg, color: c.fg, whiteSpace: 'nowrap',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const th = { padding: '12px', textAlign: 'left', fontSize: 13, color: '#334155', fontWeight: 700 };
const td = { padding: '12px', color: '#0b2e6f', fontSize: 14, verticalAlign: 'top' };

export default FieldRequests;