import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { createStaffByDeptHead, getMySectionHeads } from '../../services/authService';

function SectionHeads() {
  const { user } = useAuth();
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    department: user?.department || '', branch: user?.branch || '', role: 'SECTION_HEAD'
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await getMySectionHeads();
      setHeads(res.data || []);
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
      const res = await createStaffByDeptHead(form);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setShowForm(false);
        setForm({ ...form, fullName: '', phone: '', email: '' });
        load();
      } else { setMessage('❌ ' + res.data.message); }
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
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Section Heads</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Section heads in your department. You can create new section head accounts.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            padding: '10px 20px', background: '#0d6efd', color: '#fff',
            border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ Create Section Head'}
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
                {submitting ? 'Creating...' : 'Create Section Head'}
              </button>
            </div>
          </form>
        )}

        <div style={{ background: '#fff', padding: 24, borderRadius: 16, marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Section Head List</h2>
          {loading ? <p>Loading...</p> :
            heads.length === 0 ? <p style={{ color: '#888' }}>No section heads assigned to you yet.</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={th}>Staff ID</th><th style={th}>Name</th>
                  <th style={th}>Email</th><th style={th}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {heads.map(s => (
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

        {createdCreds && (
          <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />
        )}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const th = { padding: '10px', textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: '10px', fontSize: 14, color: '#0b2e6f' };

function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: 32, borderRadius: 16, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Share these credentials with <strong>{creds.fullName}</strong>. They must change
          the password on first login.
        </p>

        <div style={{ marginTop: 20 }}>
          <CredRow label="Staff ID (username)" value={creds.staffId} onCopy={copy} />
          <CredRow label="Email" value={creds.email} onCopy={copy} />
          <CredRow label="Temporary Password" value={creds.tempPassword} onCopy={copy} highlight />
          <CredRow label="Role" value={creds.role} />
        </div>

        <div style={{
          marginTop: 16, padding: 12, background: '#fef3c7',
          borderRadius: 8, fontSize: 13, color: '#92400e'
        }}>
          ⚠️ The password cannot be shown again. Copy it now.
        </div>

        <button onClick={onClose} style={{
          marginTop: 20, width: '100%', padding: 14, background: '#0d6efd',
          color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
          fontSize: 15, cursor: 'pointer'
        }}>Done</button>
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
        {onCopy && (
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

export default SectionHeads;