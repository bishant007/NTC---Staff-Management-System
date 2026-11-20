import React, { useEffect, useState } from 'react';

export default function ConfirmDeleteModal({ staff, api, onClose, onDone }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // '' | 'confirm-deactivate' | 'confirm-delete' | 'confirm-activate'
  const [confirmStep, setConfirmStep] = useState('');

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

  const doActivate = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.activate(staff.staffId);
      if (res.data.success) { onDone(); onClose(); }
      else { setError(res.data.message); setConfirmStep(''); }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setConfirmStep('');
    } finally { setBusy(false); }
  };

  const doDeactivate = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.deactivate(staff.staffId);
      if (res.data.success) { onDone(); onClose(); }
      else { setError(res.data.message); setConfirmStep(''); }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setConfirmStep('');
    } finally { setBusy(false); }
  };

  const doHardDelete = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.hardDelete(staff.staffId);
      if (res.data.success) { onDone(); onClose(); }
      else { setError(res.data.message); setConfirmStep(''); }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setConfirmStep('');
    } finally { setBusy(false); }
  };

  /* ---------- Confirmation: Reactivate ---------- */
  if (confirmStep === 'confirm-activate') {
    return (
      <div style={overlay} onClick={() => setConfirmStep('')}>
        <div onClick={e => e.stopPropagation()} style={card}>
          <div style={{ fontSize: 40, textAlign: 'center' }}>✅</div>
          <h2 style={{ marginTop: 12, color: '#0b2e6f', textAlign: 'center' }}>
            Reactivate {staff.fullName}?
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            This user will be able to log in again. All history stays intact.
          </p>
          {error && <div style={errBox}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={() => setConfirmStep('')} disabled={busy}
              style={{ ...btn('#f1f5f9', '#334155'), flex: 1 }}>
              Back
            </button>
            <button onClick={doActivate} disabled={busy}
              style={{ ...btn('#16a34a'), flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Reactivating…' : 'Yes, Reactivate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Confirmation: Deactivate ---------- */
  if (confirmStep === 'confirm-deactivate') {
    return (
      <div style={overlay} onClick={() => setConfirmStep('')}>
        <div onClick={e => e.stopPropagation()} style={card}>
          <div style={{ fontSize: 40, textAlign: 'center' }}>⚠️</div>
          <h2 style={{ marginTop: 12, color: '#0b2e6f', textAlign: 'center' }}>
            Deactivate {staff.fullName}?
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            This user will no longer be able to log in. All their leave history and
            approvals will be preserved. You can reactivate them later if needed.
          </p>
          {error && <div style={errBox}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={() => setConfirmStep('')} disabled={busy}
              style={{ ...btn('#f1f5f9', '#334155'), flex: 1 }}>
              Back
            </button>
            <button onClick={doDeactivate} disabled={busy}
              style={{ ...btn('#f59e0b'), flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Deactivating…' : 'Yes, Deactivate'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Confirmation: Delete ---------- */
  if (confirmStep === 'confirm-delete') {
    return (
      <div style={overlay} onClick={() => setConfirmStep('')}>
        <div onClick={e => e.stopPropagation()} style={card}>
          <div style={{ fontSize: 40, textAlign: 'center' }}>🗑️</div>
          <h2 style={{ marginTop: 12, color: '#b91c1c', textAlign: 'center' }}>
            Permanently delete {staff.fullName}?
          </h2>
          <p style={{ color: '#991b1b', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            This action <strong>cannot be undone</strong>. The user account will be
            removed from the system. Their Staff ID, username, and email will become
            available for reuse.
          </p>
          {error && <div style={errBox}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={() => setConfirmStep('')} disabled={busy}
              style={{ ...btn('#f1f5f9', '#334155'), flex: 1 }}>
              Back
            </button>
            <button onClick={doHardDelete} disabled={busy}
              style={{ ...btn('#dc3545'), flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Deleting…' : 'Yes, Delete Forever'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Main status view ---------- */
  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={card}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Manage: {staff.fullName}</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          {staff.staffId} · {staff.role?.replace('_', ' ')}
          {info && (
            <span style={{
              marginLeft: 10, fontSize: 11, fontWeight: 800,
              padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5,
              background: info.active ? '#dcfce7' : '#fee2e2',
              color: info.active ? '#166534' : '#991b1b',
            }}>{info.active ? 'ACTIVE' : 'INACTIVE'}</span>
          )}
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
              <Stat label="Status"           value={info.active ? 'Active' : 'Inactive'} warn={!info.active} />
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={hint}>
                <strong>Deactivate</strong> preserves all history, blocks login. Safe for any user.
              </div>
              <div style={{
                ...hint,
                background: info.canHardDelete ? '#dcfce7' : '#fee2e2',
                color: info.canHardDelete ? '#166534' : '#991b1b',
              }}>
                <strong>Permanently delete</strong>: {info.canHardDelete
                  ? 'Allowed — this user has no history.'
                  : info.reason || 'Not allowed.'}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={onClose} disabled={busy}
            style={{ ...btn('#f1f5f9', '#334155'), flex: 1, minWidth: 90 }}>
            Cancel
          </button>

          {info && info.active && (
            <button onClick={() => setConfirmStep('confirm-deactivate')}
              disabled={busy}
              style={{ ...btn('#f59e0b'), flex: 1, minWidth: 120 }}>
              🚫 Deactivate
            </button>
          )}

          {info && !info.active && (
            <button onClick={() => setConfirmStep('confirm-activate')}
              disabled={busy}
              style={{ ...btn('#16a34a'), flex: 1, minWidth: 120 }}>
              ✅ Reactivate
            </button>
          )}

          <button onClick={() => setConfirmStep('confirm-delete')}
            disabled={busy || !info?.canHardDelete}
            style={{
              ...btn('#dc3545'), flex: 1, minWidth: 120,
              opacity: !info?.canHardDelete ? 0.5 : 1,
              cursor: !info?.canHardDelete ? 'not-allowed' : 'pointer',
            }}>
            🗑 Delete
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0, textAlign: 'center' }}>
          💡 To find deactivated users later, tick <strong>"Show inactive"</strong> in the Staff List.
        </p>
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
  background: '#fff', padding: 28, borderRadius: 18, width: 560,
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
function btn(bg, fg = '#fff') {
  return {
    padding: '12px 18px', background: bg, color: fg,
    border: 'none', borderRadius: 10, fontWeight: 700,
    fontSize: 14, cursor: 'pointer',
  };
}