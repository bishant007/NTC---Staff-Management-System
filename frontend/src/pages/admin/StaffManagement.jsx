import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createStaff, getAllStaff, updateStaff } from '../../services/authService';
import AdminSidebar from '../../components/AdminSidebar';

function StaffManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [allStaff, setAllStaff] = useState([]);
  const [sectionHeads, setSectionHeads] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [editing, setEditing] = useState(null);
  const [createdCreds, setCreatedCreds] = useState(null);   // ← NEW
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '',
    department: '', branch: '',
    role: 'STAFF', sectionHeadId: '', departmentHeadId: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await getAllStaff();
      const list = res.data || [];
      setAllStaff(list);
      setSectionHeads(list.filter(s => s.role === 'SECTION_HEAD'));
      setDeptHeads(list.filter(s => s.role === 'DEPARTMENT_HEAD'));
    } catch (err) { console.error(err); }
    finally { setFetchLoading(false); }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setFormData({
    fullName: '', phone: '', email: '',
    department: '', branch: '',
    role: 'STAFF', sectionHeadId: '', departmentHeadId: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setSuccess(false);
    try {
      const res = await createStaff(formData);
      if (res.data.success) {
        // Show credentials modal
        setCreatedCreds(res.data.data);      // { staffId, fullName, email, tempPassword, role }
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
    } finally { setLoading(false); }
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
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Staff Management</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Create accounts, assign roles, and manage reporting heads.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 20 }}>
          <TabBtn active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
            Staff List ({allStaff.length})
          </TabBtn>
          <TabBtn active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
            + Create Account
          </TabBtn>
        </div>

        {message && (
          <p style={{ color: success ? 'green' : '#dc3545', fontWeight: 600, marginBottom: 20 }}>
            {message}
          </p>
        )}

        {activeTab === 'list' && (
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0 }}>All Accounts</h2>
            {fetchLoading ? <p>Loading...</p> :
              allStaff.length === 0 ? <p style={{ color: '#888' }}>No accounts created yet.</p> :
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={th}>Staff ID</th>
                      <th style={th}>Name</th>
                      <th style={th}>Email</th>
                      <th style={th}>Role</th>
                      <th style={th}>Dept / Branch</th>
                      <th style={th}>Section Head</th>
                      <th style={th}>Dept Head</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStaff.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ ...td, fontWeight: 700, color: '#0d6efd' }}>{s.staffId}</td>
                        <td style={td}>{s.fullName}</td>
                        <td style={td}>{s.email}</td>
                        <td style={td}><RoleBadge role={s.role} /></td>
                        <td style={td}>{s.department} · {s.branch}</td>
                        <td style={{ ...td, fontSize: 12, color: '#64748b' }}>
                          {s.sectionHeadName || s.sectionHeadStaffId || '—'}
                        </td>
                        <td style={{ ...td, fontSize: 12, color: '#64748b' }}>
                          {s.departmentHeadName || s.departmentHeadStaffId || '—'}
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => setEditing({
                              staffId: s.staffId,
                              fullName: s.fullName,
                              phone: s.phone,
                              email: s.email,
                              department: s.department,
                              branch: s.branch,
                              role: s.role,
                              sectionHeadId: s.sectionHeadStaffId || '',
                              departmentHeadId: s.departmentHeadStaffId || '',
                              newPassword: '',
                            })}
                            style={{
                              padding: '6px 14px', background: '#0d6efd', color: '#fff',
                              border: 'none', borderRadius: 6, cursor: 'pointer',
                              fontWeight: 600, fontSize: 12,
                            }}
                          >Edit</button>
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
                <Field label="Full Name *"><input name="fullName" value={formData.fullName} onChange={handleChange} required style={inp} /></Field>
                <Field label="Phone *"><input name="phone" value={formData.phone} onChange={handleChange} required style={inp} /></Field>
                <Field label="Email *"><input type="email" name="email" value={formData.email} onChange={handleChange} required style={inp} /></Field>
                <Field label="Role *">
                  <select name="role" value={formData.role} onChange={handleChange} style={inp}>
                    <option value="STAFF">Staff</option>
                    <option value="SECTION_HEAD">Section Head</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                  </select>
                </Field>
                <Field label="Department *"><input name="department" value={formData.department} onChange={handleChange} required style={inp} /></Field>
                <Field label="Branch *"><input name="branch" value={formData.branch} onChange={handleChange} required style={inp} /></Field>
              </div>

              {formData.role === 'STAFF' && (
                <>
                  <h3 style={sectionH}>Reporting Chain</h3>
                  <div style={grid2}>
                    <Field label="Section Head *">
                      <select name="sectionHeadId" value={formData.sectionHeadId} onChange={handleChange} style={inp}>
                        <option value="">-- Select Section Head --</option>
                        {sectionHeads.map(h => (
                          <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.staffId}) — {h.department}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Department Head *">
                      <select name="departmentHeadId" value={formData.departmentHeadId} onChange={handleChange} style={inp}>
                        <option value="">-- Select Department Head --</option>
                        {deptHeads.map(h => (
                          <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.staffId}) — {h.department}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}

              {formData.role === 'SECTION_HEAD' && (
                <>
                  <h3 style={sectionH}>Reporting Chain</h3>
                  <Field label="Department Head *">
                    <select name="departmentHeadId" value={formData.departmentHeadId} onChange={handleChange} style={inp}>
                      <option value="">-- Select Department Head --</option>
                      {deptHeads.map(h => (
                        <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.staffId}) — {h.department}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {formData.role === 'DEPARTMENT_HEAD' && (
                <p style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                  ℹ️ Department Heads sit at the top of the reporting chain.
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

        {editing && (
          <EditModal
            editing={editing}
            setEditing={setEditing}
            sectionHeads={sectionHeads}
            deptHeads={deptHeads}
            onSave={saveEdit}
            loading={loading}
          />
        )}

        {createdCreds && (
          <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />
        )}
      </div>
    </div>
  );
}

/* ==================== Credentials Modal ==================== */
function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  const copyAll = () => {
    const text =
`NTC Staff System — Account Credentials
Name:     ${creds.fullName}
Staff ID: ${creds.staffId}
Email:    ${creds.email}
Password: ${creds.tempPassword}
Role:     ${creds.role}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: 32, borderRadius: 16, width: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Share these credentials with <strong>{creds.fullName}</strong>. They will be
          prompted to change the password on first login.
        </p>

        <div style={{ marginTop: 20 }}>
          <CredRow label="Staff ID (username for login)" value={creds.staffId} onCopy={copy} highlight />
          <CredRow label="Full Name" value={creds.fullName} />
          <CredRow label="Email" value={creds.email} onCopy={copy} />
          <CredRow label="Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
          <CredRow label="Role" value={creds.role} />
        </div>

        <div style={{
          marginTop: 16, padding: 12, background: '#fef3c7',
          borderRadius: 8, fontSize: 13, color: '#92400e'
        }}>
          ⚠️ The password cannot be shown again. Copy it now before closing.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={copyAll} style={{
            flex: 1, padding: 14, background: '#f0f9ff', color: '#0d6efd',
            border: '2px solid #0d6efd', borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: 'pointer'
          }}>📋 Copy All</button>
          <button onClick={onClose} style={{
            flex: 1, padding: 14, background: '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: 'pointer'
          }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function CredRow({ label, value, onCopy, highlight }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: highlight ? '#f0f9ff' : '#f8fafc',
        border: highlight ? '2px solid #0d6efd' : '1px solid #e2e8f0',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <code style={{
          flex: 1, fontSize: 14, fontWeight: 700, color: '#0b2e6f',
          wordBreak: 'break-all'
        }}>{value || '—'}</code>
        {onCopy && value && (
          <button onClick={() => onCopy(value)} style={{
            padding: '6px 12px', background: '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, fontWeight: 600
          }}>Copy</button>
        )}
      </div>
    </div>
  );
}

/* ==================== Edit Modal ==================== */
function EditModal({ editing, setEditing, sectionHeads, deptHeads, onSave, loading }) {
  const upd = (k, v) => setEditing({ ...editing, [k]: v });
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={() => setEditing(null)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: 28, borderRadius: 16, width: 640,
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Edit: {editing.staffId}</h2>

        <div style={grid2}>
          <Field label="Full Name"><input value={editing.fullName} onChange={e => upd('fullName', e.target.value)} style={inp} /></Field>
          <Field label="Phone"><input value={editing.phone} onChange={e => upd('phone', e.target.value)} style={inp} /></Field>
          <Field label="Email"><input value={editing.email} onChange={e => upd('email', e.target.value)} style={inp} /></Field>
          <Field label="Role">
            <select value={editing.role} onChange={e => upd('role', e.target.value)} style={inp}>
              <option value="STAFF">Staff</option>
              <option value="SECTION_HEAD">Section Head</option>
              <option value="DEPARTMENT_HEAD">Department Head</option>
            </select>
          </Field>
          <Field label="Department"><input value={editing.department} onChange={e => upd('department', e.target.value)} style={inp} /></Field>
          <Field label="Branch"><input value={editing.branch} onChange={e => upd('branch', e.target.value)} style={inp} /></Field>
        </div>

        <h3 style={sectionH}>Reporting Chain</h3>
        <div style={grid2}>
          <Field label="Section Head">
            <select value={editing.sectionHeadId} onChange={e => upd('sectionHeadId', e.target.value)} style={inp}>
              <option value="">-- None --</option>
              {sectionHeads.map(h => (
                <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.staffId})</option>
              ))}
            </select>
          </Field>
          <Field label="Department Head">
            <select value={editing.departmentHeadId} onChange={e => upd('departmentHeadId', e.target.value)} style={inp}>
              <option value="">-- None --</option>
              {deptHeads.map(h => (
                <option key={h.staffId} value={h.staffId}>{h.fullName} ({h.staffId})</option>
              ))}
            </select>
          </Field>
        </div>

        <h3 style={sectionH}>Password Reset (optional)</h3>
        <Field label="New Password (leave blank to keep current)">
          <input type="text" value={editing.newPassword}
            onChange={e => upd('newPassword', e.target.value)}
            placeholder="Leave blank to keep current password" style={inp} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={() => setEditing(null)} style={{
            flex: 1, padding: 14, background: '#f1f5f9', color: '#334155',
            border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onSave} disabled={loading} style={{
            flex: 1, padding: 14, background: loading ? '#a9c6f5' : '#16a34a',
            color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
            fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
          }}>{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== Small UI helpers ==================== */
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', cursor: 'pointer',
      borderRadius: 10, fontWeight: 600, fontSize: 14,
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
  const colors = { STAFF: '#dbeafe', SECTION_HEAD: '#ede9fe', DEPARTMENT_HEAD: '#fce7f3' };
  const fg = { STAFF: '#1e40af', SECTION_HEAD: '#6b21a8', DEPARTMENT_HEAD: '#9d174d' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: colors[role] || '#eee', color: fg[role] || '#333',
    }}>{role?.replace('_', ' ')}</span>
  );
}

const th = { padding: '10px', textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: '10px', color: '#0b2e6f' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 };
const sectionH = { marginTop: 20, marginBottom: 12, fontSize: 15, color: '#0b2e6f' };

export default StaffManagement;