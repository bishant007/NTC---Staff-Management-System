import React, { useEffect, useState } from 'react';

export default function ConfirmDeleteModal({ staff, api, onClose, onDone }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.checkDelete(staff.staffId);
        if (res.data.success) setInfo(res.data.data);
        else setError(res.data.message || 'Failed to load status');
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [staff.staffId]);

  const doHardDelete = async () => {
    if (!window.confirm(`Permanently delete ${staff.fullName}? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try {
      const res = await api.hardDelete(staff.staffId);
      if (res.data.success) { onDone(); onClose(); }
      else setError(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  const doDeactivate = async () => {
    if (!window.confirm(`Deactivate ${staff.fullName}? They will not be able to log in.`)) return;
    setBusy(true); setError('');
    try {
      const res = await api.deactivate(staff.staffId);
      if (res.data.success) { onDone(); onClose(); }
      else setError(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={card}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Manage: {staff.fullName}</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          {staff.staffId} · {staff.role?.replace('_', ' ')}
        </p>

        {loading ? (
          <p>Checking…</p>
        ) : error ? (
          <div style={errBox}>{error}</div>
        ) : info && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <Stat label="Pending Requests" value={info.pendingRequests} warn={info.pendingRequests > 0} />
              <Stat label="Total Requests"   value={info.totalRequests} />
              <Stat label="Subordinates"     value={info.subordinateCount} warn={info.subordinateCount > 0} />
              <Stat label="Status"           value={info.active ? 'Active' : 'Inactive'} />
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={hint}>
                <strong>Deactivate</strong> preserves all history, blocks login. Safe for any user.
              </div>
              <div style={{ ...hint, background: info.canHardDelete ? '#dcfce7' : '#fee2e2', color: info.canHardDelete ? '#166534' : '#991b1b' }}>
                <strong>Permanently delete</strong>: {info.canHardDelete
                  ? 'Allowed — this user has no history.'
                  : info.reason || 'Not allowed.'}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} disabled={busy} style={{ ...btn('#94a3b8'), flex: 1 }}>
            Cancel
          </button>
          <button onClick={doDeactivate} disabled={busy || !info?.active}
            style={{ ...btn('#f59e0b'), flex: 1, opacity: !info?.active ? 0.5 : 1 }}>
            🚫 Deactivate
          </button>
          <button onClick={doHardDelete} disabled={busy || !info?.canHardDelete}
            style={{ ...btn('#dc3545'), flex: 1, opacity: !info?.canHardDelete ? 0.5 : 1 }}>
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div style={{
      padding: 12, background: warn ? '#fef2f2' : '#f8fafc',
      border: '1px solid #e5edf8', borderRadius: 10,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: warn ? '#dc2626' : '#0b2e6f', marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 10000, padding: 20,
};
const card = {
  background: '#fff', padding: 28, borderRadius: 18, width: 540,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
};
const hint = {
  padding: 12, borderRadius: 10, background: '#f0f9ff',
  color: '#1e40af', fontSize: 13, marginBottom: 10,
};
const errBox = {
  padding: 12, borderRadius: 10, background: '#fee2e2',
  color: '#991b1b', fontSize: 13, marginTop: 12,
};
function btn(bg) {
  return {
    padding: '12px 18px', background: bg, color: '#fff',
    border: 'none', borderRadius: 10, fontWeight: 700,
    fontSize: 14, cursor: 'pointer',
  };
}