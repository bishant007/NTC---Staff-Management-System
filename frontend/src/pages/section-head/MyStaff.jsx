import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { createStaffBySectionHead, getMyStaff } from '../../services/authService';

function MyStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    department: user?.department || '', branch: user?.branch || '', role: 'STAFF'
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await getMyStaff();
      setStaff(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await createStaffBySectionHead(form);
      if (res.data.success) {
        setMessage('✅ Staff created. Temporary password was sent to their email and printed in backend console.');
        setShowForm(false);
        setForm({ ...form, fullName: '', phone: '', email: '' });
        load();
      } else {
        setMessage('❌ ' + res.data.message);
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>My Staff</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Staff assigned to you. You can create new staff accounts.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            padding: '10px 20px', background: '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ Create Staff'}
          </button>
        </div>

        {message && (
          <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545', marginTop: 16 }}>
            {message}
          </p>
        )}

        {showForm && (
          <form onSubmit={submit} style={{
            background: '#fff', padding: 24, borderRadius: 16, marginTop: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16
          }}>
            <div><label style={lbl}>Full Name *</label>
              <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Phone *</label>
              <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Department *</label>
              <input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Branch *</label>
              <input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '12px 24px', background: submitting ? '#a9c6f5' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}>
                {submitting ? 'Creating...' : 'Create Staff'}
              </button>
            </div>
          </form>
        )}

        <div style={{ background: '#fff', padding: 24, borderRadius: 16, marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Staff List</h2>
          {loading ? <p>Loading...</p> :
            staff.length === 0 ? <p style={{ color: '#888' }}>No staff assigned to you yet.</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={th}>Staff ID</th><th style={th}>Name</th>
                  <th style={th}>Email</th><th style={th}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}><strong>{s.staffId}</strong></td>
                    <td style={td}>{s.fullName}</td>
                    <td style={td}>{s.email}</td>
                    <td style={td}>{s.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const th = { padding: '10px', textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: '10px', fontSize: 14, color: '#0b2e6f' };

export default MyStaff;