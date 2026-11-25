import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import StaffDetailModal from '../../components/StaffDetailModal';
import ConfirmBulkActionModal from '../../components/ConfirmBulkActionModal';
import { useAuth } from '../../context/AuthContext';
import { createStaffByOfficeIncharge, getMySectionHeads } from '../../services/authService';
import {
  getUnassignedSHsForOI,
  getUnassignedStaffForOI,
  getStaffUnderMySHs,
  bulkAssignSHsToOI,
  bulkUnassignSHsFromOI,
  bulkAssignStaffToSHByOI,
  bulkUnassignStaffFromSHByOI,
} from '../../services/bulkService';

function SectionHeads() {
  const { user } = useAuth();
  const [tab, setTab] = useState('my-shs');
  const [mySHs, setMySHs] = useState([]);
  const [unassignedSHs, setUnassignedSHs] = useState([]);
  const [unassignedStaff, setUnassignedStaff] = useState([]);
  const [staffUnderMe, setStaffUnderMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [pickSH, setPickSH] = useState('');
  const [confirm, setConfirm] = useState(null);

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', staffId: '',
    department: user?.department || '', branch: user?.branch || '',
    role: 'SECTION_HEAD',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [a, b, c, d] = await Promise.all([
        getMySectionHeads(),
        getUnassignedSHsForOI(),
        getUnassignedStaffForOI(),
        getStaffUnderMySHs(),
      ]);
      setMySHs(a.data || []);
      setUnassignedSHs(b.data || []);
      setUnassignedStaff(c.data || []);
      setStaffUnderMe(d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { setSelectedIds(new Set()); setPickSH(''); }, [tab]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      const res = await createStaffByOfficeIncharge(form);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setShowForm(false);
        setForm({ ...form, fullName: '', phone: '', email: '', staffId: '' });
        load();
      } else setMessage('❌ ' + res.data.message);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally { setSubmitting(false); }
  };

  const toggle = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = (list) => {
    setSelectedIds(prev => {
      if (list.every(s => prev.has(s.staffId))) return new Set();
      return new Set(list.map(s => s.staffId));
    });
  };

  const listForTab = () => {
    if (tab === 'my-shs') return mySHs;
    if (tab === 'unassigned-shs') return unassignedSHs;
    if (tab === 'unassigned-staff') return unassignedStaff;
    if (tab === 'staff-under-my-shs') return staffUnderMe;
    return [];
  };
  const currentList = listForTab();
  const allSelected = currentList.length > 0 && currentList.every(s => selectedIds.has(s.staffId));

  const askBulk = (config) => {
    if (selectedIds.size === 0) return;
    setConfirm(config);
  };

  const executeConfirmed = async () => {
    if (!confirm) return;
    setBulkBusy(true); setMessage('');
    try {
      const res = await confirm.run();
      const d = res.data?.data || {};
      setMessage('✅ ' + (res.data?.message || 'Done')
        + (d.skipped?.length ? ' — skipped: ' + d.skipped.join(', ') : ''));
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setBulkBusy(false);
      setConfirm(null);
    }
  };

  const askAssignStaffToPickedSH = () => {
    if (!pickSH) { setMessage('❌ Pick a Section Head first'); return; }
    const sh = mySHs.find(s => s.staffId === pickSH);
    askBulk({
      title: `Assign ${selectedIds.size} staff to ${sh?.fullName || pickSH}?`,
      message: 'The selected staff will report to this Section Head. You can unassign them later.',
      variant: 'success',
      confirmLabel: 'Assign',
      run: () => bulkAssignStaffToSHByOI([...selectedIds], pickSH),
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>My Section Heads & Staff</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Manage Section Heads under you and staff under those Section Heads.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            padding: '11px 22px', background: showForm ? '#94a3b8' : '#0d6efd',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
            cursor: 'pointer', fontSize: 14,
            boxShadow: '0 4px 0px rgba(0,0,0,.12)',
          }}>
            {showForm ? 'Cancel' : '+ Create Account'}
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
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                ℹ️ The new account will automatically report to you as their Office In-Charge.
              </div>
            </div>
            <div><label style={lbl}>Full Name *</label><input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Phone *</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Staff ID (optional)</label><input value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })} placeholder="Blank = auto-generate" style={inp} /></div>
            <div><label style={lbl}>Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                <option value="SECTION_HEAD">Section Head</option>
                <option value="STAFF">Staff</option>
              </select></div>
            <div><label style={lbl}>Department *</label><input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Branch *</label><input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '12px 24px', background: submitting ? '#a9c6f5' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}>{submitting ? 'Creating...' : 'Create Account'}</button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <TabBtn active={tab === 'my-shs'} onClick={() => setTab('my-shs')}>
            My Section Heads ({mySHs.length})
          </TabBtn>
          <TabBtn active={tab === 'unassigned-shs'} onClick={() => setTab('unassigned-shs')}>
            Unassigned Section Heads ({unassignedSHs.length})
          </TabBtn>
          <TabBtn active={tab === 'unassigned-staff'} onClick={() => setTab('unassigned-staff')}>
            Unassigned Staff ({unassignedStaff.length})
          </TabBtn>
          <TabBtn active={tab === 'staff-under-my-shs'} onClick={() => setTab('staff-under-my-shs')}>
            Staff under my Section Heads ({staffUnderMe.length})
          </TabBtn>
        </div>

        {(tab === 'unassigned-shs' || tab === 'unassigned-staff') && (
          <div style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 8,
            background: '#f0f9ff', border: '1px solid #bae6fd',
            fontSize: 12, color: '#075985',
          }}>
            ℹ️ This shows <strong>all</strong> {tab === 'unassigned-shs' ? 'Section Heads' : 'staff'} across the system
            that are not yet assigned to {tab === 'unassigned-shs' ? 'an Office In-Charge' : 'any Section Head'}.
            Select any to bring them under your scope.
          </div>
        )}

        {tab === 'unassigned-staff' && selectedIds.size > 0 && (
          <div style={{
            background: '#fff7ed', padding: '12px 16px', borderRadius: 10,
            marginBottom: 12, borderLeft: '4px solid #f59e0b',
            display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 700, color: '#92400e' }}>
              Assign {selectedIds.size} selected to:
            </span>
            <select value={pickSH} onChange={e => setPickSH(e.target.value)} style={{ ...inp, width: 280 }}>
              <option value="">-- Pick a Section Head under you --</option>
              {mySHs.map(sh => (
                <option key={sh.staffId} value={sh.staffId}>
                  {sh.fullName} ({sh.staffId}) — {sh.department}
                </option>
              ))}
            </select>
            <button onClick={askAssignStaffToPickedSH} disabled={bulkBusy || !pickSH} style={{
              padding: '8px 16px', background: pickSH ? '#16a34a' : '#a9c6f5',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
              cursor: !pickSH || bulkBusy ? 'not-allowed' : 'pointer',
            }}>↘ Assign</button>
          </div>
        )}

        {selectedIds.size > 0 && tab !== 'unassigned-staff' && (
          <div style={{
            background: '#e0e7ff', padding: '12px 16px', borderRadius: 10, marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            borderLeft: '4px solid #0d6efd',
          }}>
            <strong style={{ color: '#0b2e6f' }}>{selectedIds.size} selected</strong>
            {tab === 'unassigned-shs' && (
              <button onClick={() => askBulk({
                title: `Assign ${selectedIds.size} Section Head(s) to you?`,
                message: 'The selected Section Heads will report to you as their Office In-Charge. This can be undone later.',
                variant: 'success',
                confirmLabel: 'Assign to me',
                run: () => bulkAssignSHsToOI([...selectedIds]),
              })} disabled={bulkBusy} style={bulkBtn('#16a34a', bulkBusy)}>
                ↘ Assign selected to me
              </button>
            )}
            {tab === 'my-shs' && (
              <button onClick={() => askBulk({
                title: `Unassign ${selectedIds.size} Section Head(s) from you?`,
                message: 'The selected Section Heads will no longer report to you. Their staff remain assigned to them.',
                variant: 'danger',
                confirmLabel: 'Unassign',
                run: () => bulkUnassignSHsFromOI([...selectedIds]),
              })} disabled={bulkBusy} style={bulkBtn('#dc3545', bulkBusy)}>
                ✕ Unassign selected from me
              </button>
            )}
            {tab === 'staff-under-my-shs' && (
              <button onClick={() => askBulk({
                title: `Unassign ${selectedIds.size} staff from their Section Heads?`,
                message: 'The selected staff will become unassigned and can be claimed by any Section Head.',
                variant: 'danger',
                confirmLabel: 'Unassign',
                run: () => bulkUnassignStaffFromSHByOI([...selectedIds]),
              })} disabled={bulkBusy} style={bulkBtn('#dc3545', bulkBusy)}>
                ✕ Unassign selected from their SH
              </button>
            )}
            <button onClick={() => setSelectedIds(new Set())} style={{
              marginLeft: 'auto', padding: '6px 12px', background: '#fff',
              border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 600,
              fontSize: 12, cursor: 'pointer',
            }}>Clear</button>
          </div>
        )}

        <div style={{ background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading…</p>
          ) : currentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ fontSize: 44 }}>👔</div>
              <div style={{ color: '#0b2e6f', fontWeight: 700, marginTop: 8 }}>
                {emptyLabel(tab)}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...th, width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={() => toggleAll(currentList)} />
                  </th>
                  <th style={th}>Staff ID</th>
                  <th style={th}>Username</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
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
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }} onClick={() => setSelected(s)}>{s.username || '—'}</td>
                    <td style={{ ...td, fontWeight: 600 }} onClick={() => setSelected(s)}>{s.fullName}</td>
                    <td style={{ ...td, color: '#475569', fontSize: 13 }} onClick={() => setSelected(s)}>{s.email}</td>
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
        {createdCreds && <CredModalSimple creds={createdCreds} onClose={() => setCreatedCreds(null)} />}

        <ConfirmBulkActionModal
          open={!!confirm}
          variant={confirm?.variant}
          title={confirm?.title}
          message={confirm?.message}
          confirmLabel={confirm?.confirmLabel}
          busy={bulkBusy}
          onConfirm={executeConfirmed}
          onCancel={() => !bulkBusy && setConfirm(null)}
        />
      </div>
    </div>
  );
}

function emptyLabel(tab) {
  return {
    'my-shs': 'No Section Heads under you yet.',
    'unassigned-shs': 'All Section Heads in the system are already assigned to an Office In-Charge.',
    'unassigned-staff': 'All staff in the system are already assigned to a Section Head.',
    'staff-under-my-shs': 'No staff currently under your Section Heads.',
  }[tab] || 'Nothing to show.';
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 10,
      fontWeight: 600, fontSize: 13,
      background: active ? '#0d6efd' : '#fff',
      color: active ? '#fff' : '#0b2e6f',
      boxShadow: '0 2px 6px rgba(0,0,0,.05)',
    }}>{children}</button>
  );
}

function CredModalSimple({ creds, onClose }) {
  const copy = (t) => navigator.clipboard.writeText(t);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 32, borderRadius: 18, width: 480, boxShadow: '0 25px 80px rgba(0,0,0,0.35)' }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Share with <strong>{creds.fullName}</strong></p>
        <div style={{ marginTop: 20 }}>
          <CR label="Staff ID" value={creds.staffId} onCopy={copy} />
          <CR label="Username" value={creds.username} onCopy={copy} />
          <CR label="Email" value={creds.email} onCopy={copy} />
          <CR label="Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
          <CR label="Role" value={creds.role} />
        </div>
        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: 14, background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}

function CR({ label, value, onCopy, highlight }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: highlight ? '#f0f9ff' : '#f8fafc',
        border: highlight ? '2px solid #0d6efd' : '1px solid #e2e8f0',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <code style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0b2e6f', wordBreak: 'break-all' }}>{value || '—'}</code>
        {onCopy && value && <button onClick={() => onCopy(value)} style={{ padding: '6px 12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Copy</button>}
      </div>
    </div>
  );
}

const bulkBtn = (bg, busy) => ({
  padding: '8px 16px', background: bg, color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
  cursor: busy ? 'not-allowed' : 'pointer',
});
const th = { padding: 12, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: 0.3 };
const td = { padding: 12, color: '#0b2e6f' };
const viewBtn = { padding: '6px 14px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };

export default SectionHeads;