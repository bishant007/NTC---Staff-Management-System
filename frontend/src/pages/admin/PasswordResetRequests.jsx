import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import {
  listPasswordResets, approvePasswordReset, rejectPasswordReset
} from '../../services/authService';

function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [createdCreds, setCreatedCreds] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPasswordResets(filter === 'ALL' ? undefined : filter);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setMsg('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const doApprove = async (id) => {
    try {
      const res = await approvePasswordReset(id);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setMsg('✅ Password reset — share the new credentials with the user.');
        load();
      } else {
        setMsg('❌ ' + res.data.message);
      }
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const doReject = async () => {
    try {
      await rejectPasswordReset(rejecting.id, rejectReason);
      setMsg('✅ Request rejected');
      setRejecting(null);
      setRejectReason('');
      load();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Password Reset Requests</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Staff submit reset requests via the "Contact Administrator" page.
          Approving generates a fresh temporary password and emails it to the user.
        </p>

        {msg && (
          <p style={{ fontWeight: 600, color: msg.startsWith('✅') ? 'green' : '#dc3545' }}>
            {msg}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 20 }}>
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? '#0d6efd' : '#fff',
              color: filter === f ? '#fff' : '#0b2e6f',
              fontWeight: 600, fontSize: 13,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
          {loading ? <p>Loading...</p> :
            requests.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: 30 }}>
                No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={th}>Name</th><th style={th}>Email</th><th style={th}>Phone</th>
                    <th style={th}>Message</th><th style={th}>Submitted</th>
                    <th style={th}>Status</th><th style={th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={td}><strong>{r.fullName}</strong></td>
                      <td style={td}>{r.email}</td>
                      <td style={td}>{r.phone}</td>
                      <td style={{ ...td, maxWidth: 260, fontSize: 13, color: '#64748b' }}>
                        {r.message || '—'}
                      </td>
                      <td style={{ ...td, fontSize: 12 }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                      </td>
                      <td style={td}><StatusPill status={r.status} /></td>
                      <td style={td}>
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => doApprove(r.id)} style={btn('#16a34a')}>
                              ✅ Approve
                            </button>
                            <button onClick={() => setRejecting(r)} style={{ ...btn('#dc3545'), marginLeft: 6 }}>
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {r.status !== 'PENDING' && (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {createdCreds && (
          <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />
        )}

        {rejecting && (
          <div style={modalOverlay} onClick={() => setRejecting(null)}>
            <div onClick={e => e.stopPropagation()} style={modalCard}>
              <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Reject request?</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                From: <strong>{rejecting.fullName}</strong> ({rejecting.email})
              </p>
              <label style={lbl}>Reason (optional)</label>
              <textarea rows={3} value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Identity not verified in person"
                style={inp} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setRejecting(null)} style={{ ...btn('#94a3b8'), flex: 1 }}>
                  Cancel
                </button>
                <button onClick={doReject} style={{ ...btn('#dc3545'), flex: 1 }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CredModal({ creds, onClose }) {
  const copy = (t) => navigator.clipboard.writeText(t);
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalCard, width: 500 }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Password Reset</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          New credentials for <strong>{creds.fullName}</strong>. Share them securely.
        </p>
        <div style={{ marginTop: 16 }}>
          <CredRow label="Staff ID" value={creds.staffId} onCopy={copy} />
          <CredRow label="Email" value={creds.email} onCopy={copy} />
          <CredRow label="New Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
        </div>
        <div style={{ marginTop: 14, padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
          ⚠️ Password cannot be shown again. Copy it now.
        </div>
        <button onClick={onClose} style={{ ...btn('#0d6efd'), width: '100%', marginTop: 18 }}>
          Done
        </button>
      </div>
    </div>
  );
}

function CredRow({ label, value, onCopy, highlight }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: highlight ? '#f0f9ff' : '#f8fafc',
        border: highlight ? '2px solid #0d6efd' : '1px solid #e2e8f0',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <code style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0b2e6f', wordBreak: 'break-all' }}>{value}</code>
        {onCopy && <button onClick={() => onCopy(value)} style={btn('#0d6efd', '6px 12px')}>Copy</button>}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    PENDING:  { bg: '#fef3c7', fg: '#92400e' },
    APPROVED: { bg: '#d1fae5', fg: '#065f46' },
    REJECTED: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const c = m[status] || m.PENDING;
  return <span style={{
    padding: '4px 10px', borderRadius: 20, fontSize: 11,
    fontWeight: 700, background: c.bg, color: c.fg, whiteSpace: 'nowrap',
  }}>{status}</span>;
}

const th = { padding: 12, textAlign: 'left', fontSize: 13, color: '#334155', fontWeight: 700 };
const td = { padding: 12, color: '#0b2e6f', fontSize: 14, verticalAlign: 'top' };
const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 10, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
};
const modalCard = {
  background: '#fff', padding: 28, borderRadius: 16, width: 460,
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
function btn(bg, padding = '8px 16px') {
  return { padding, background: bg, color: 'white', border: 'none',
    borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 };
}

export default PasswordResetRequests;