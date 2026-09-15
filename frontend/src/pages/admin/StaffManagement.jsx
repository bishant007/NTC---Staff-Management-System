import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createStaff, getAllStaff } from '../../services/authService';
import AdminSidebar from '../../components/AdminSidebar';

function StaffManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [allStaff, setAllStaff] = useState([]);
  const [sectionHeads, setSectionHeads] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '',
    department: '', branch: '',
    role: 'STAFF',
    sectionHeadId: '',
    departmentHeadId: '',
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

  const resetForm = () => {
    setFormData({
      fullName: '', phone: '', email: '',
      department: '', branch: '',
      role: 'STAFF',
      sectionHeadId: '',
      departmentHeadId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      const res = await createStaff(formData);
      if (res.data.success) {
        setMessage('✅ Staff created. Credentials sent to email & printed in backend console.');
        setSuccess(true);
        resetForm();
        loadStaff();
      } else {
        setMessage('❌ ' + res.data.message);
      }
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
          Manage accounts and hierarchy. As Admin you can create any role and assign their reporting heads.
        </p>

        {/* Tabs */}
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
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={th}>Staff ID</th>
                      <th style={th}>Name</th>
                      <th style={th}>Email</th>
                      <th style={th}>Role</th>
                      <th style={th}>Dept / Branch</th>
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
                <Field label="Role *">
                  <select name="role" value={formData.role} onChange={handleChange} style={inp}>
                    <option value="STAFF">Staff</option>
                    <option value="SECTION_HEAD">Section Head</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                  </select>
                </Field>
                <Field label="Department *">
                  <input name="department" value={formData.department} onChange={handleChange} required style={inp} />
                </Field>
                <Field label="Branch *">
                  <input name="branch" value={formData.branch} onChange={handleChange} required style={inp} />
                </Field>
              </div>

              {formData.role === 'STAFF' && (
                <>
                  <h3 style={sectionH}>Reporting Chain</h3>
                  <div style={grid2}>
                    <Field label="Section Head *">
                      <select name="sectionHeadId" value={formData.sectionHeadId} onChange={handleChange} style={inp}>
                        <option value="">-- Select Section Head --</option>
                        {sectionHeads.map(h => (
                          <option key={h.staffId} value={h.staffId}>
                            {h.fullName} ({h.staffId}) — {h.department}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Department Head *">
                      <select name="departmentHeadId" value={formData.departmentHeadId} onChange={handleChange} style={inp}>
                        <option value="">-- Select Department Head --</option>
                        {deptHeads.map(h => (
                          <option key={h.staffId} value={h.staffId}>
                            {h.fullName} ({h.staffId}) — {h.department}
                          </option>
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
                        <option key={h.staffId} value={h.staffId}>
                          {h.fullName} ({h.staffId}) — {h.department}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {formData.role === 'DEPARTMENT_HEAD' && (
                <p style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                  ℹ️ Department Heads sit at the top of their reporting chain — no further head assignment needed.
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 24, padding: '14px 32px',
                background: loading ? '#a9c6f5' : '#0d6efd',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const colors = {
    STAFF: '#dbeafe',
    SECTION_HEAD: '#ede9fe',
    DEPARTMENT_HEAD: '#fce7f3',
  };
  const fg = {
    STAFF: '#1e40af',
    SECTION_HEAD: '#6b21a8',
    DEPARTMENT_HEAD: '#9d174d',
  };
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