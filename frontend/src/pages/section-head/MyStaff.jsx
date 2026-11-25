import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import StaffDetailModal from '../../components/StaffDetailModal';
import ConfirmBulkActionModal from '../../components/ConfirmBulkActionModal';
import { useAuth } from '../../context/AuthContext';
import { createStaffBySectionHead, getMyStaff } from '../../services/authService';
import {
  getUnassignedStaffForSH,
  bulkAssignStaffToSH,
  bulkUnassignStaffFromSH,
} from '../../services/bulkService';

function MyStaff() {
  const { user } = useAuth();
  const [tab, setTab] = useState('assigned');
  const [staff, setStaff] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', staffId: '',
    department: user?.department || '', branch: user?.branch || '', role: 'STAFF',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([getMyStaff(), getUnassignedStaffForSH()]);
      setStaff(a.data || []);
      setUnassigned(u.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setSelectedIds(new Set()); }, [tab]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      const res = await createStaffBySectionHead(form);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setShowForm(false);
        setForm({ ...form, fullName: '', phone: '', email: '', staffId: '' });
        load();
      } else {
        setMessage('❌ ' + res.data.message);
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSubmitting(false); }
  };

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = (list) => {
    setSelectedIds(prev => {
      if (list.every(s => prev.has(s.staffId))) return new Set();
      return new Set(list.map(s => s.staffId));
    });
  };
  const currentList = tab === 'assigned' ? staff : unassigned;
  const allSelected = currentList.length > 0 && currentList.every(s => selectedIds.has(s.staffId));

  const askAssign = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ action: 'assign', staffIds: [...selectedIds] });
  };

  const askUnassign = () => {
    if (selectedIds.size === 0) return;
    setConfirm({ action: 'unassign', staffIds: [...selectedIds] });
  };

  const executeConfirmed = async () => {
    if (!confirm) return;
    setBulkBusy(true); setMessage('');
    try {
      const res = confirm.action === 'assign'
        ? await bulkAssignStaffToSH(confirm.staffIds)
        : await bulkUnassignStaffFromSH(confirm.staffIds);
      const d = res.data?.data || {};
      const verb = confirm.action === 'assign' ? 'Assigned' : 'Unassigned';
      const count = confirm.action === 'assign' ? d.assigned : d.unassigned;
      setMessage('✅ ' + verb + ' ' + (count ?? '?') + ' staff'
        + (d.skipped?.length ? ' — skipped: ' + d.skipped.join(', ') : ''));
      setSelectedIds(new Set());
      load();
      if (confirm.action === 'assign') setTab('assigned');
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setBulkBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>My Staff</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Manage staff under you, or claim unassigned staff from the pool.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            padding: '11px 22px', background: showForm ? '#94a3b8' : '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            fontSize: 14, boxShadow: '0 4px 0px rgba(0,0,0,.12)',
          }}>
            {showForm ? 'Cancel' : '+ Create Staff'}
          </button>
        </div>

        {message && (
          <p style={{
            fontWeight: 600, marginBottom: 16, padding: 10, borderRadius: 8,
            background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
            color: message.startsWith('✅') ? '#166534' : '#991b1b',
          }}>{message}</p>
        )}

        {showForm && (
          <form onSubmit={submit} style={{
            background: '#fff', padding: 24, borderRadius: 16, marginBottom: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,.05)',
          }}>
            <div><label style={lbl}>Full Name *</label>
              <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Phone *</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Staff ID (optional)</label>
              <input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} placeholder="Blank = auto-generate" style={inp} /></div>
            <div><label style={lbl}>Department *</label>
              <input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Branch *</label>
              <input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '12px 24px', background: submitting ? '#a9c6f5' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>
                {submitting ? 'Creating...' : 'Create Staff'}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setTab('assigned')} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 10,
            fontWeight: 600, fontSize: 14,
            background: tab === 'assigned' ? '#0d6efd' : '#fff',
            color: tab === 'assigned' ? '#fff' : '#0b2e6f',
            boxShadow: '0 2px 6px rgba(0,0,0,.05)',
          }}>My Staff ({staff.length})</button>
          <button onClick={() => setTab('unassigned')} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 10,
            fontWeight: 600, fontSize: 14,
            background: tab === 'unassigned' ? '#0d6efd' : '#fff',
            color: tab === 'unassigned' ? '#fff' : '#0b2e6f',
            boxShadow: '0 2px 6px rgba(0,0,0,.05)',
          }}>Unassigned ({unassigned.length})</button>
        </div>

        {tab === 'unassigned' && (
          <div style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 8,
            background: '#f0f9ff', border: '1px solid #bae6fd',
            fontSize: 12, color: '#075985',
          }}>
            ℹ️ These are <strong>all</strong> staff accounts across the system that are not yet
            assigned to any Section Head. Select any to claim them under you.
          </div>
        )}

        {selectedIds.size > 0 && (
          <div style={{
            background: '#e0e7ff', padding: '12px 16px', borderRadius: 10, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            borderLeft: '4px solid #0d6efd',
          }}>
            <strong style={{ color: '#0b2e6f' }}>{selectedIds.size} selected</strong>
            {tab === 'unassigned' && (
              <button onClick={askAssign} disabled={bulkBusy} style={{
                padding: '8px 16px', background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: bulkBusy ? 'not-allowed' : 'pointer',
              }}>↘ Assign selected to me</button>
            )}
            {tab === 'assigned' && (
              <button onClick={askUnassign} disabled={bulkBusy} style={{
                padding: '8px 16px', background: '#dc3545', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: bulkBusy ? 'not-allowed' : 'pointer',
              }}>✕ Unassign selected</button>
            )}
            <button onClick={() => setSelectedIds(new Set())} style={{
              marginLeft: 'auto', padding: '6px 12px', background: '#fff',
              border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600,
              fontSize: 12, cursor: 'pointer',
            }}>Clear</button>
          </div>
        )}

        <div style={{ background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
          {loading ? <p style={{ color: '#94a3b8' }}>Loading…</p> : currentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ fontSize: 44 }}>👥</div>
              <div style={{ color: '#0b2e6f', fontWeight: 700, marginTop: 8 }}>
                {tab === 'assigned' ? 'No staff yet' : 'No unassigned staff in the system'}
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                {tab === 'assigned'
                  ? 'Click "+ Create Staff" or claim unassigned staff from the other tab.'
                  : 'All staff currently have a Section Head assigned.'}
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...th, width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={() => toggleAll(currentList)} />
                  </th>
                  <th style={th}>Staff ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Department</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(s => (
                  <tr key={s.id} style={{
                    borderBottom: '1px solid #eef2f7', cursor: 'pointer',
                    opacity: s.active === false ? 0.55 : 1,
                    background: selectedIds.has(s.staffId) ? '#f0f9ff' : 'transparent',
                  }}>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(s.staffId)}
                        onChange={() => toggle(s.staffId)} />
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontFamily: 'monospace', fontSize: 12.5 }}
                      onClick={() => setSelected(s)}>{s.staffId}</td>
                    <td style={{ ...td, fontWeight: 600 }} onClick={() => setSelected(s)}>{s.fullName}</td>
                    <td style={{ ...td, color: '#475569' }} onClick={() => setSelected(s)}>{s.email}</td>
                    <td style={{ ...td, color: '#475569' }} onClick={() => setSelected(s)}>{s.phone || '—'}</td>
                    <td style={{ ...td, fontSize: 13 }} onClick={() => setSelected(s)}>
                      {s.department}{s.branch ? ` · ${s.branch}` : ''}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelected(s)} style={viewBtn}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && <StaffDetailModal staff={selected} onClose={() => setSelected(null)} />}
        {createdCreds && <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />}

        <ConfirmBulkActionModal
          open={!!confirm}
          variant={confirm?.action === 'assign' ? 'success' : 'danger'}
          title={confirm?.action === 'assign'
            ? `Assign ${confirm.staffIds.length} staff to you?`
            : `Unassign ${confirm.staffIds.length} staff from you?`}
          message={confirm?.action === 'assign'
            ? 'The selected staff will be assigned under you as their Section Head. You can unassign them later.'
            : 'The selected staff will no longer report to you. They will become unassigned and can be claimed by any Section Head.'}
          confirmLabel={confirm?.action === 'assign' ? 'Assign to me' : 'Unassign'}
          busy={bulkBusy}
          onConfirm={executeConfirmed}
          onCancel={() => !bulkBusy && setConfirm(null)}
        />
      </div>
    </div>
  );
}

function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 32, borderRadius: 18, width: 480, boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Share these credentials with <strong>{creds.fullName}</strong>.
        </p>
        <div style={{ marginTop: 20 }}>
          <CredRow label="Staff ID (username)" value={creds.staffId} onCopy={copy} />
          <CredRow label="Email" value={creds.email} onCopy={copy} />
          <CredRow label="Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
          <CredRow label="Role" value={creds.role} />
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: 14, background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Done</button>
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
        {onCopy && <button onClick={() => onCopy(value)} style={{ padding: '6px 12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Copy</button>}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const th = { padding: 12, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: 0.3 };
const td = { padding: 12, fontSize: 14, color: '#0b2e6f' };
const viewBtn = { padding: '6px 14px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 };

export default MyStaff;