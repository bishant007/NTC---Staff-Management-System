import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createStaff, getAllStaff, updateStaff, adminStaffApi } from '../../services/authService';
import AdminSidebar from '../../components/AdminSidebar';
import StaffDetailModal from '../../components/StaffDetailModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import ConfirmBulkActionModal from '../../components/ConfirmBulkActionModal';
import { adminBulkAssign, adminBulkUnassign } from '../../services/bulkService';

function StaffManagement() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const roleFilter = searchParams.get('role') || 'ALL';
  const statusFilter = searchParams.get('status') || 'active';

  const [activeTab, setActiveTab] = useState('list');
  const [allStaff, setAllStaff] = useState([]);
  const [sectionHeads, setSectionHeads] = useState([]);
  const [officeIncharges, setOfficeIncharges] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', staffId: '',
    department: '', branch: '',
    role: 'STAFF', sectionHeadId: '', officeInchargeId: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const loadStaff = async () => {
    setFetchLoading(true);
    try {
      const res = await getAllStaff(true);
      const list = res.data || [];
      setAllStaff(list);
      setSectionHeads(list.filter(s => s.role === 'SECTION_HEAD' && s.active));
      setOfficeIncharges(list.filter(s => s.role === 'OFFICE_INCHARGE' && s.active));
    } catch (err) { console.error(err); }
    finally { setFetchLoading(false); }
  };

  useEffect(() => { loadStaff(); /* eslint-disable-next-line */ }, []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (value === 'ALL' && key === 'role')) next.delete(key);
    else if (value === 'active' && key === 'status') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allStaff.filter(s => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      if (q) {
        const hay = `${s.fullName || ''} ${s.staffId || ''} ${s.email || ''} ${s.phone || ''} ${s.username || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allStaff, roleFilter, statusFilter, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'role') {
        next.sectionHeadId = '';
        next.officeInchargeId = '';
      }
      return next;
    });
  };

  const resetForm = () => setFormData({
    fullName: '', phone: '', email: '', staffId: '',
    department: '', branch: '',
    role: 'STAFF', sectionHeadId: '', officeInchargeId: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setSuccess(false);
    try {
      const res = await createStaff(formData);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setSuccess(true);
        setMessage('✅ Account created successfully.');
        resetForm();
        setActiveTab('list');
        loadStaff();
      } else {
        setMessage('❌ ' + res.data.message);
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    setLoading(true); setMessage(''); setSuccess(false);
    try {
      const res = await updateStaff(editing.staffId, editing);
      if (res.data.success) {
        setMessage('✅ Staff updated');
        setSuccess(true);
        setEditing(null);
        loadStaff();
      } else setMessage('❌ ' + res.data.message);
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    ALL: 'All Users', STAFF: 'Staff',
    SECTION_HEAD: 'Section Heads', OFFICE_INCHARGE: 'Office In-Charge',
  }[roleFilter] || 'Users';

  const statusLabel = {
    active: 'Active', inactive: 'Inactive', all: 'All statuses',
  }[statusFilter] || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Staff Management</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Create accounts, assign roles, and manage reporting heads.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <TabBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
            {roleLabel} ({filteredStaff.length})
          </TabBtn>
          <TabBtn active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
            + Create Account
          </TabBtn>
          <TabBtn active={activeTab === 'bulk'} onClick={() => setActiveTab('bulk')}>
            Bulk Assign / Unassign
          </TabBtn>
        </div>

        {activeTab === 'list' && (
          <div style={{
            background: '#fff', padding: 14, borderRadius: 12, marginBottom: 18,
            display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
            boxShadow: '0 2px 8px rgba(0,0,0,.04)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 320px', minWidth: 260 }}>
              <label style={filterLabel}>🔍 Search:</label>
              <input
                type="text"
                placeholder="Search by name, Staff ID, email, phone, or username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...filterSelect, flex: 1, minWidth: 220, cursor: 'text' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={filterLabel}>Role:</label>
              <select value={roleFilter} onChange={e => setFilter('role', e.target.value)} style={filterSelect}>
                <option value="ALL">All Roles</option>
                <option value="STAFF">Staff</option>
                <option value="SECTION_HEAD">Section Head</option>
                <option value="OFFICE_INCHARGE">Office In-Charge</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={filterLabel}>Status:</label>
              <select value={statusFilter} onChange={e => setFilter('status', e.target.value)} style={filterSelect}>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
                <option value="all">All</option>
              </select>
            </div>

            {(roleFilter !== 'ALL' || statusFilter !== 'active' || search) && (
              <button
                onClick={() => { setSearchParams(new URLSearchParams()); setSearch(''); }}
                style={{
                  padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                  borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', color: '#334155',
                }}>
                Clear filters
              </button>
            )}

            <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Showing <span style={{ color: '#0b2e6f' }}>{filteredStaff.length}</span> of {allStaff.length} accounts
            </div>
          </div>
        )}

        {message && (
          <p style={{ color: success ? 'green' : '#dc3545', fontWeight: 600, marginBottom: 20 }}>
            {message}
          </p>
        )}

        {activeTab === 'list' && (
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0 }}>
              {roleLabel} {statusLabel && `· ${statusLabel}`}
              {search && ` · matching "${search}"`}
            </h2>
            {fetchLoading ? <p>Loading...</p> :
              filteredStaff.length === 0 ? (
                <p style={{ color: '#888' }}>
                  {search ? `No accounts match "${search}".` : 'No accounts match the current filters.'}
                </p>
              ) :
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={th}>Staff ID</th>
                      <th style={th}>Username</th>
                      <th style={th}>Name</th>
                      <th style={th}>Email</th>
                      <th style={th}>Phone</th>
                      <th style={th}>Role</th>
                      <th style={th}>Dept / Branch</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #eee', opacity: s.active ? 1 : 0.55 }}>
                        <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontSize: 12 }}>{s.staffId}</td>
                        <td style={{ ...td, fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{s.username}</td>
                        <td style={td}>
                          {s.fullName}
                          {!s.active && (
                            <span style={{
                              marginLeft: 8, fontSize: 10, fontWeight: 800,
                              background: '#dc2626', color: '#fff',
                              padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5,
                            }}>INACTIVE</span>
                          )}
                        </td>
                        <td style={{ ...td, fontSize: 13 }}>{s.email}</td>
                        <td style={{ ...td, fontSize: 13 }}>{s.phone || '—'}</td>
                        <td style={td}><RoleBadge role={s.role} /></td>
                        <td style={{ ...td, fontSize: 13 }}>{s.department} · {s.branch}</td>
                        <td style={td}>
                          <button onClick={() => setViewing(s)} style={actionBtn('#f1f5f9', '#0b2e6f', 0)}>View</button>
                          <button onClick={() => setEditing({
                            staffId: s.staffId, fullName: s.fullName, username: s.username,
                            phone: s.phone, email: s.email, department: s.department,
                            branch: s.branch, role: s.role,
                            sectionHeadId: s.sectionHeadStaffId || '',
                            officeInchargeId: s.officeInchargeStaffId || '',
                            newPassword: '',
                          })} style={actionBtn('#0d6efd', '#fff', 6)}>Edit</button>
                          <button onClick={() => setDeleting(s)} style={actionBtn('#dc3545', '#fff', 6)}>Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </div>
        )}

        {activeTab === 'create' && (
          <div style={{ background: '#fff', padding: 28, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: 780 }}>
            <h2 style={{ marginTop: 0 }}>Create New Account</h2>
            <form onSubmit={handleSubmit}>
              <div style={grid2}>
                <Field label="Full Name *">
                  <input name="fullName" value={formData.fullName} onChange={handleChange} required style={inp} />
                </Field>
                <Field label="Phone *">
                  <input name="phone" value={formData.phone} onChange={handleChange} required style={inp} />
                </Field>
                <Field label="Email *">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inp} />
                </Field>
                <Field label="Staff ID (optional — blank = auto-generate)">
                  <input name="staffId" value={formData.staffId} onChange={handleChange}
                    placeholder="e.g., NTC-8001 or any company ID" style={inp} />
                </Field>
                <Field label="Role *">
                  <select name="role" value={formData.role} onChange={handleChange} style={inp}>
                    <option value="STAFF">Staff</option>
                    <option value="SECTION_HEAD">Section Head</option>
                    <option value="OFFICE_INCHARGE">Office Incharge</option>
                  </select>
                </Field>
                <Field label="Department *">
                  <input name="department" value={formData.department} onChange={handleChange} required style={inp} />
                </Field>
                <Field label="Branch *">
                  <input name="branch" value={formData.branch} onChange={handleChange} required style={inp} />
                </Field>
              </div>

              <div style={{
                marginTop: 12, padding: 12, borderRadius: 10,
                background: '#f0f9ff', border: '1px dashed #0d6efd',
                fontSize: 13, color: '#1e40af',
              }}>
                ℹ️ If Staff ID is blank, it will be auto-generated as <code>NTC-XXXXX</code>.
                Username is auto-generated as <code>firstname.role@ntc.com</code>.
              </div>

              {formData.role === 'STAFF' && (
                <>
                  <h3 style={sectionH}>Reporting Chain (optional — can be assigned later)</h3>
                  <div style={grid2}>
                    <Field label="Section Head">
                      <select name="sectionHeadId" value={formData.sectionHeadId} onChange={handleChange} style={inp}>
                        <option value="">-- None --</option>
                        {sectionHeads.map(h => (
                          <option key={h.staffId} value={h.staffId}>
                            {h.fullName} ({h.username}) — {h.department}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Office Incharge">
                      <select name="officeInchargeId" value={formData.officeInchargeId} onChange={handleChange} style={inp}>
                        <option value="">-- None --</option>
                        {officeIncharges.map(h => (
                          <option key={h.staffId} value={h.staffId}>
                            {h.fullName} ({h.username}) — {h.department}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}

              {formData.role === 'SECTION_HEAD' && (
                <>
                  <h3 style={sectionH}>Reporting Chain (optional)</h3>
                  <Field label="Office Incharge">
                    <select name="officeInchargeId" value={formData.officeInchargeId} onChange={handleChange} style={inp}>
                      <option value="">-- None --</option>
                      {officeIncharges.map(h => (
                        <option key={h.staffId} value={h.staffId}>
                          {h.fullName} ({h.username}) — {h.department}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {formData.role === 'OFFICE_INCHARGE' && (
                <p style={{ marginTop: 16, padding: 12, background: '#e0e7ff', borderRadius: 8, fontSize: 13, color: '#3730a3' }}>
                  ℹ️ Office Incharge sits at the top of the reporting chain.
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 24, padding: '14px 32px',
                background: loading ? '#a9c6f5' : '#0d6efd',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>{loading ? 'Creating...' : 'Create Account'}</button>
            </form>
          </div>
        )}

        {activeTab === 'bulk' && (
          <BulkAssignPanel allStaff={allStaff} onDone={loadStaff} />
        )}

        {editing && (
          <EditModal
            editing={editing}
            setEditing={setEditing}
            sectionHeads={sectionHeads}
            officeIncharges={officeIncharges}
            onSave={saveEdit}
            loading={loading}
          />
        )}

        {viewing && <StaffDetailModal staff={viewing} onClose={() => setViewing(null)} />}

        {deleting && (
          <ConfirmDeleteModal
            staff={deleting}
            api={adminStaffApi}
            onClose={() => setDeleting(null)}
            onDone={() => loadStaff()}
          />
        )}

        {createdCreds && <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BULK ASSIGN / UNASSIGN PANEL
   ═══════════════════════════════════════════════════════════════ */
function BulkAssignPanel({ allStaff, onDone }) {
  const [tab, setTab] = useState('assign-sh');
  const [selected, setSelected] = useState(new Set());
  const [targetSH, setTargetSH] = useState('');
  const [targetOI, setTargetOI] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  const shs = allStaff.filter(s => s.role === 'SECTION_HEAD' && s.active);
  const ois = allStaff.filter(s => s.role === 'OFFICE_INCHARGE' && s.active);

  const list = useMemo(() => {
    if (tab === 'assign-sh') {
      return allStaff.filter(s => s.active && s.role === 'STAFF' && !s.sectionHeadStaffId);
    }
    if (tab === 'assign-oi') {
      return allStaff.filter(s => s.active && (s.role === 'STAFF' || s.role === 'SECTION_HEAD') && !s.officeInchargeStaffId);
    }
    if (tab === 'unassign') {
      return allStaff.filter(s => s.active && (s.sectionHeadStaffId || s.officeInchargeStaffId));
    }
    return [];
  }, [allStaff, tab]);

  useEffect(() => { setSelected(new Set()); setMsg(''); }, [tab]);

  const toggle = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelected(prev => {
      if (list.every(s => prev.has(s.staffId))) return new Set();
      return new Set(list.map(s => s.staffId));
    });
  };

  const askAssignSH = () => {
    if (!targetSH) { setMsg('❌ Pick a target Section Head'); return; }
    if (selected.size === 0) return;
    const sh = shs.find(s => s.staffId === targetSH);
    setConfirm({
      title: `Assign ${selected.size} account(s) to ${sh?.fullName || targetSH}?`,
      message: 'The selected accounts will report to the chosen Section Head. This can be undone later.',
      variant: 'success',
      confirmLabel: 'Assign',
      run: () => adminBulkAssign([...selected], targetSH, null),
    });
  };

  const askAssignOI = () => {
    if (!targetOI) { setMsg('❌ Pick a target Office In-Charge'); return; }
    if (selected.size === 0) return;
    const oi = ois.find(s => s.staffId === targetOI);
    setConfirm({
      title: `Assign ${selected.size} account(s) to ${oi?.fullName || targetOI}?`,
      message: 'The selected accounts will report to the chosen Office In-Charge. This can be undone later.',
      variant: 'success',
      confirmLabel: 'Assign',
      run: () => adminBulkAssign([...selected], null, targetOI),
    });
  };

  const askUnassign = (clearSH, clearOI) => {
    if (selected.size === 0) return;
    const label = clearSH && clearOI ? 'both Section Head and Office In-Charge'
      : clearSH ? 'their Section Head'
      : 'their Office In-Charge';
    setConfirm({
      title: `Remove ${label} from ${selected.size} account(s)?`,
      message: 'Those fields will be cleared. The accounts become unassigned and can be reassigned later.',
      variant: 'danger',
      confirmLabel: 'Remove',
      run: () => adminBulkUnassign([...selected], clearSH, clearOI),
    });
  };

  const executeConfirmed = async () => {
    if (!confirm) return;
    setBusy(true); setMsg('');
    try {
      const res = await confirm.run();
      setMsg('✅ ' + (res.data.message || 'Done'));
      setSelected(new Set());
      onDone();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || e.message));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Bulk Assign / Unassign</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        Select multiple accounts and apply a reporting change at once.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('assign-sh')} style={tabBtnStyle(tab === 'assign-sh')}>Assign Staff → Section Head</button>
        <button onClick={() => setTab('assign-oi')} style={tabBtnStyle(tab === 'assign-oi')}>Assign → Office In-Charge</button>
        <button onClick={() => setTab('unassign')} style={tabBtnStyle(tab === 'unassign')}>Unassign</button>
      </div>

      {msg && (
        <p style={{
          fontWeight: 600,
          color: msg.startsWith('✅') ? '#166534' : '#991b1b',
          background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          padding: 10, borderRadius: 8, marginBottom: 12,
        }}>{msg}</p>
      )}

      {tab === 'assign-sh' && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Target Section Head:</label>
          <select value={targetSH} onChange={e => setTargetSH(e.target.value)} style={filterSelect}>
            <option value="">-- Pick --</option>
            {shs.map(s => <option key={s.staffId} value={s.staffId}>{s.fullName} ({s.staffId})</option>)}
          </select>
        </div>
      )}

      {tab === 'assign-oi' && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>Target Office In-Charge:</label>
          <select value={targetOI} onChange={e => setTargetOI(e.target.value)} style={filterSelect}>
            <option value="">-- Pick --</option>
            {ois.map(s => <option key={s.staffId} value={s.staffId}>{s.fullName} ({s.staffId})</option>)}
          </select>
        </div>
      )}

      {tab === 'unassign' && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => askUnassign(true, false)} disabled={busy || selected.size === 0}
            style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 ? 0.5 : 1 }}>
            Remove Section Head from selected
          </button>
          <button onClick={() => askUnassign(false, true)} disabled={busy || selected.size === 0}
            style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 ? 0.5 : 1 }}>
            Remove Office In-Charge from selected
          </button>
          <button onClick={() => askUnassign(true, true)} disabled={busy || selected.size === 0}
            style={{ padding: '8px 16px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 ? 0.5 : 1 }}>
            Remove BOTH from selected
          </button>
        </div>
      )}

      {tab === 'assign-sh' && (
        <button onClick={askAssignSH} disabled={busy || selected.size === 0 || !targetSH}
          style={{ marginBottom: 16, padding: '10px 20px', background: (busy || selected.size === 0 || !targetSH) ? '#a9c6f5' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: (busy || selected.size === 0 || !targetSH) ? 'not-allowed' : 'pointer' }}>
          ↘ Assign {selected.size} selected
        </button>
      )}

      {tab === 'assign-oi' && (
        <button onClick={askAssignOI} disabled={busy || selected.size === 0 || !targetOI}
          style={{ marginBottom: 16, padding: '10px 20px', background: (busy || selected.size === 0 || !targetOI) ? '#a9c6f5' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: (busy || selected.size === 0 || !targetOI) ? 'not-allowed' : 'pointer' }}>
          ↘ Assign {selected.size} selected
        </button>
      )}

      {list.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>
          No accounts match this action.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={th}>
                  <input type="checkbox" checked={list.every(s => selected.has(s.staffId))} onChange={toggleAll} />
                </th>
                <th style={th}>Staff ID</th>
                <th style={th}>Name</th>
                <th style={th}>Role</th>
                <th style={th}>Current SH</th>
                <th style={th}>Current OI</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #eee', background: selected.has(s.staffId) ? '#f0f9ff' : 'transparent' }}>
                  <td style={td}><input type="checkbox" checked={selected.has(s.staffId)} onChange={() => toggle(s.staffId)} /></td>
                  <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontSize: 12 }}>{s.staffId}</td>
                  <td style={td}>{s.fullName}</td>
                  <td style={td}><RoleBadge role={s.role} /></td>
                  <td style={{ ...td, fontSize: 13 }}>{s.sectionHeadName || '—'}</td>
                  <td style={{ ...td, fontSize: 13 }}>{s.officeInchargeName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmBulkActionModal
        open={!!confirm}
        variant={confirm?.variant}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        busy={busy}
        onConfirm={executeConfirmed}
        onCancel={() => !busy && setConfirm(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CREDENTIALS / EDIT MODALS (unchanged from earlier delivery)
   ═══════════════════════════════════════════════════════════════ */
function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  const copyAll = () => {
    navigator.clipboard.writeText(
`NTC Staff System — Account Credentials
Name:     ${creds.fullName}
Staff ID: ${creds.staffId}
Username: ${creds.username}
Email:    ${creds.email}
Password: ${creds.tempPassword}
Role:     ${creds.role}`);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 32, borderRadius: 16, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Share these credentials with <strong>{creds.fullName}</strong>. They will be prompted to change the password on first login.
        </p>
        <div style={{ marginTop: 20 }}>
          <CredRow label="Username (for login)" value={creds.username} onCopy={copy} highlight />
          <CredRow label="Staff ID (for login)" value={creds.staffId} onCopy={copy} highlight />
          <CredRow label="Full Name" value={creds.fullName} />
          <CredRow label="Email" value={creds.email} onCopy={copy} />
          <CredRow label="Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
          <CredRow label="Role" value={creds.role} />
        </div>
        <div style={{ marginTop: 16, padding: 12, background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
          ⚠️ The password cannot be shown again. Copy it now before closing.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={copyAll} style={{ flex: 1, padding: 14, background: '#f0f9ff', color: '#0d6efd', border: '2px solid #0d6efd', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>📋 Copy All</button>
          <button onClick={onClose} style={{ flex: 1, padding: 14, background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Done</button>
        </div>
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
        <code style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0b2e6f', wordBreak: 'break-all' }}>{value || '—'}</code>
        {onCopy && value && (
          <button onClick={() => onCopy(value)} style={{ padding: '6px 12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Copy</button>
        )}
      </div>
    </div>
  );
}

function EditModal({ editing, setEditing, sectionHeads, officeIncharges, onSave, loading }) {
  const upd = (k, v) => {
    setEditing(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'role') {
        next.sectionHeadId = '';
        next.officeInchargeId = '';
      }
      return next;
    });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setEditing(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 28, borderRadius: 16, width: 640, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Edit: {editing.staffId}</h2>
        <div style={grid2}>
          <Field label="Full Name"><input value={editing.fullName} onChange={e => upd('fullName', e.target.value)} style={inp} /></Field>
          <Field label="Username (read-only)"><input value={editing.username || ''} readOnly style={{ ...inp, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} /></Field>
          <Field label="Phone"><input value={editing.phone} onChange={e => upd('phone', e.target.value)} style={inp} /></Field>
          <Field label="Email"><input value={editing.email} onChange={e => upd('email', e.target.value)} style={inp} /></Field>
          <Field label="Role">
            <select value={editing.role} onChange={e => upd('role', e.target.value)} style={inp}>
              <option value="STAFF">Staff</option>
              <option value="SECTION_HEAD">Section Head</option>
              <option value="OFFICE_INCHARGE">Office Incharge</option>
            </select>
          </Field>
          <Field label="Department"><input value={editing.department} onChange={e => upd('department', e.target.value)} style={inp} /></Field>
          <Field label="Branch"><input value={editing.branch} onChange={e => upd('branch', e.target.value)} style={inp} /></Field>
        </div>
        {editing.role === 'STAFF' && (
          <>
            <h3 style={sectionH}>Reporting Chain</h3>
            <div style={grid2}>
              <Field label="Section Head">
                <select value={editing.sectionHeadId || ''} onChange={e => upd('sectionHeadId', e.target.value)} style={inp}>
                  <option value="">-- None --</option>
                  {sectionHeads.map(h => <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.username})</option>)}
                </select>
              </Field>
              <Field label="Office Incharge">
                <select value={editing.officeInchargeId || ''} onChange={e => upd('officeInchargeId', e.target.value)} style={inp}>
                  <option value="">-- None --</option>
                  {officeIncharges.map(h => <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.username})</option>)}
                </select>
              </Field>
            </div>
          </>
        )}
        {editing.role === 'SECTION_HEAD' && (
          <>
            <h3 style={sectionH}>Reporting Chain</h3>
            <Field label="Office Incharge">
              <select value={editing.officeInchargeId || ''} onChange={e => upd('officeInchargeId', e.target.value)} style={inp}>
                <option value="">-- None --</option>
                {officeIncharges.map(h => <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.username})</option>)}
              </select>
            </Field>
          </>
        )}
        {editing.role === 'OFFICE_INCHARGE' && (
          <p style={{ marginTop: 16, padding: 12, background: '#e0e7ff', borderRadius: 8, fontSize: 13, color: '#3730a3' }}>
            ℹ️ Office Incharge sits at the top of the reporting chain.
          </p>
        )}
        <h3 style={sectionH}>Password Reset (optional)</h3>
        <Field label="New Password (leave blank to keep current)">
          <input type="text" value={editing.newPassword} onChange={e => upd('newPassword', e.target.value)} placeholder="Leave blank to keep current password" style={inp} />
        </Field>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={() => setEditing(null)} style={{ flex: 1, padding: 14, background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSave} disabled={loading} style={{ flex: 1, padding: 14, background: loading ? '#a9c6f5' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

/* Small UI helpers */
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 10,
      fontWeight: 600, fontSize: 14,
      background: active ? '#0d6efd' : '#fff',
      color: active ? '#fff' : '#0b2e6f',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    }}>{children}</button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' }}>{label}</label>
      {children}
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = { STAFF: '#dbeafe', SECTION_HEAD: '#ede9fe', OFFICE_INCHARGE: '#fce7f3' };
  const fg = { STAFF: '#1e40af', SECTION_HEAD: '#6b21a8', OFFICE_INCHARGE: '#9d174d' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: colors[role] || '#eee', color: fg[role] || '#333' }}>
      {role?.replace('_', ' ')}
    </span>
  );
}

function actionBtn(bg, fg, ml) {
  return {
    padding: '6px 14px', background: bg, color: fg,
    border: bg === '#f1f5f9' ? '1px solid #cbd5e1' : 'none',
    borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12, marginLeft: ml,
  };
}

const tabBtnStyle = (active) => ({
  padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: 10,
  fontWeight: 600, fontSize: 13,
  background: active ? '#0d6efd' : '#f1f5f9',
  color: active ? '#fff' : '#334155',
});
const th = { padding: '10px', textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: '10px', color: '#0b2e6f' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 };
const sectionH = { marginTop: 20, marginBottom: 12, fontSize: 15, color: '#0b2e6f' };
const filterLabel = { fontSize: 13, fontWeight: 600, color: '#334155' };
const filterSelect = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
  fontSize: 13, background: '#fff', cursor: 'pointer',
};

export default StaffManagement;