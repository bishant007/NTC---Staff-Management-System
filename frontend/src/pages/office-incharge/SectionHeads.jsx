import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import StaffDetailModal from '../../components/StaffDetailModal';
import { useAuth } from '../../context/AuthContext';
import { getMySectionHeads, createStaffByOfficeIncharge } from '../../services/authService';

function SectionHeads() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    department: user?.department || '',
    branch: user?.branch || '',
    role: 'SECTION_HEAD',
  });

  const load = async () => {
    try {
      const r = await getMySectionHeads();
      setList(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMessage('');
    try {
      const res = await createStaffByOfficeIncharge(form);
      if (res.data.success) {
        setCreatedCreds(res.data.data);
        setShowForm(false);
        setForm({
          fullName: '', phone: '', email: '',
          department: user?.department || '',
          branch: user?.branch || '',
          role: 'SECTION_HEAD',
        });
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
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>My Section Heads</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Section Heads reporting to you. You can also create new Section Heads or Staff.
            </p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{
            padding: '11px 22px',
            background: showForm ? '#94a3b8' : '#0d6efd',
            color: '#fff', border: 'none', borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', fontSize: 14,
            boxShadow: '0 4px 0px rgba(0,0,0,.12)',
          }}>
            {showForm ? 'Cancel' : '+ Create Account'}
          </button>
        </div>

        {message && (
          <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545', marginBottom: 16 }}>
            {message}
          </p>
        )}

        {showForm && (
          <form onSubmit={submit} style={{
            background: '#fff', padding: 24, borderRadius: 16, marginBottom: 20,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            boxShadow: '0 4px 16px rgba(0,0,0,.05)',
          }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#1e40af',
                background: '#dbeafe', padding: 10, borderRadius: 8, marginBottom: 8,
              }}>
                ℹ️ The new account will automatically report to you as their Office In-Charge.
              </div>
            </div>

            <div><label style={lbl}>Full Name *</label>
              <input required value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Phone *</label>
              <input required value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Role *</label>
              <select value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })} style={inp}>
                <option value="SECTION_HEAD">Section Head</option>
                <option value="STAFF">Staff</option>
              </select></div>
            <div><label style={lbl}>Department *</label>
              <input required value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Branch *</label>
              <input required value={form.branch}
                onChange={e => setForm({ ...form, branch: e.target.value })} style={inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={submitting} style={{
                padding: '12px 24px', background: submitting ? '#a9c6f5' : '#16a34a',
                color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div style={{
          background: '#fff', padding: 20, borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,.05)',
        }}>
          {loading ? (
            <p style={{ color: '#94a3b8' }}>Loading…</p>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ fontSize: 44 }}>👔</div>
              <div style={{ color: '#0b2e6f', fontWeight: 700, marginTop: 8 }}>
                No Section Heads assigned yet
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                Click "+ Create Account" to add your first Section Head.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={th}>Staff ID</th>
                  <th style={th}>Username</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Department</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id}
                    onClick={() => setSelected(s)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ borderBottom: '1px solid #eef2f7', cursor: 'pointer' }}>
                    <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontFamily: 'monospace', fontSize: 12.5 }}>
                      {s.staffId}
                    </td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{s.username || '—'}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{s.fullName}</td>
                    <td style={{ ...td, color: '#475569', fontSize: 13 }}>{s.email}</td>
                    <td style={{ ...td, fontSize: 13 }}>
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

        {selected && (
          <StaffDetailModal staff={selected} onClose={() => setSelected(null)} />
        )}

        {createdCreds && (
          <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />
        )}
      </div>
    </div>
  );
}

function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  const copyAll = () => {
    const text =
`NTC Staff System — Account Credentials
Name:     ${creds.fullName}
Staff ID: ${creds.staffId}
Username: ${creds.username}
Email:    ${creds.email}
Password: ${creds.tempPassword}
Role:     ${creds.role}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: 32, borderRadius: 16, width: 520,
        boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
      }}>
        <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>✅ Account Created</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Share these credentials with <strong>{creds.fullName}</strong>. They will be
          prompted to set a new password on first login.
        </p>

        <div style={{ marginTop: 20 }}>
          <CredRow label="Username (for login)" value={creds.username} onCopy={copy} highlight />
          <CredRow label="Staff ID (for login)" value={creds.staffId} onCopy={copy} highlight />
          <CredRow label="Full Name" value={creds.fullName} />
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
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        background: highlight ? '#f0f9ff' : '#f8fafc',
        border: highlight ? '2px solid #0d6efd' : '1px solid #e2e8f0',
        borderRadius: 8, padding: '10px 12px',
      }}>
        <code style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0b2e6f', wordBreak: 'break-all' }}>
          {value || '—'}
        </code>
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

const th = { padding: 12, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: 0.3 };
const td = { padding: 12, color: '#0b2e6f' };
const viewBtn = {
  padding: '6px 14px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};
const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };

export default SectionHeads;