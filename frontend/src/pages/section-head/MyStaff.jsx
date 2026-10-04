import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import StaffDetailModal from '../../components/StaffDetailModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { useAuth } from '../../context/AuthContext';
import { createStaffBySectionHead, getMyStaff, shStaffApi } from '../../services/authService';

function MyStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', staffId: '',
    department: user?.department || '', branch: user?.branch || '', role: 'STAFF'
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await getMyStaff();
      setStaff(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>My Staff</h1>
            <p style={{ color: '#5b7bab', marginTop: 0 }}>
              Staff assigned to you. Click any row for full details.
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
            <div><label style={lbl}>Full Name *</label>
              <input required value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Phone *</label>
              <input required value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Email *</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Staff ID (optional)</label>
              <input value={form.staffId}
                onChange={e => setForm({ ...form, staffId: e.target.value })}
                placeholder="Blank = auto-generate" style={inp} /></div>
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
                {submitting ? 'Creating...' : 'Create Staff'}
              </button>
            </div>
          </form>
        )}

        <div style={{
          background: '#fff', padding: 20, borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,.05)',
        }}>
          {loading ? <p style={{ color: '#94a3b8' }}>Loading…</p> :
            staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{ fontSize: 44 }}>👥</div>
                <div style={{ color: '#0b2e6f', fontWeight: 700, marginTop: 8 }}>No staff yet</div>
                <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                  Click "+ Create Staff" to add your first staff member.
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={th}>Staff ID</th>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Phone</th>
                    <th style={th}>Department</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(s => (
                    <tr key={s.id} style={{
                      borderBottom: '1px solid #eef2f7', cursor: 'pointer',
                      opacity: s.active === false ? 0.55 : 1,
                    }}>
                      <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontFamily: 'monospace', fontSize: 12.5 }}
                        onClick={() => setSelected(s)}>{s.staffId}</td>
                      <td style={{ ...td, fontWeight: 600 }} onClick={() => setSelected(s)}>
                        {s.fullName}
                        {s.active === false && (
                          <span style={{
                            marginLeft: 8, fontSize: 10, fontWeight: 800,
                            background: '#dc2626', color: '#fff',
                            padding: '2px 8px', borderRadius: 10,
                          }}>INACTIVE</span>
                        )}
                      </td>
                      <td style={{ ...td, color: '#475569' }} onClick={() => setSelected(s)}>{s.email}</td>
                      <td style={{ ...td, color: '#475569' }} onClick={() => setSelected(s)}>{s.phone || '—'}</td>
                      <td style={{ ...td, fontSize: 13 }} onClick={() => setSelected(s)}>
                        {s.department}{s.branch ? ` · ${s.branch}` : ''}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(s)} style={{ ...viewBtn, background: '#f1f5f9', color: '#0b2e6f', border: '1px solid #cbd5e1' }}>View</button>
                        <button onClick={() => setDeleting(s)} style={{ ...viewBtn, background: '#dc3545', color: '#fff', marginLeft: 6 }}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        {createdCreds && (
          <CredModal creds={createdCreds} onClose={() => setCreatedCreds(null)} />
        )}

        {selected && (
          <StaffDetailModal
            staff={selected}
            canManage={true}
            onDelete={(s) => { setSelected(null); setDeleting(s); }}
            onDeactivate={async (s) => {
              if (!window.confirm(`Deactivate ${s.fullName}?`)) return;
              try {
                const res = await shStaffApi.deactivate(s.staffId);
                if (res.data.success) { setSelected(null); load(); }
                else alert(res.data.message);
              } catch (err) { alert(err.response?.data?.message || err.message); }
            }}
            onActivate={async (s) => {
              try {
                const res = await shStaffApi.activate(s.staffId);
                if (res.data.success) { setSelected(null); load(); }
                else alert(res.data.message);
              } catch (err) { alert(err.response?.data?.message || err.message); }
            }}
            onClose={() => setSelected(null)}
          />
        )}

        {deleting && (
          <ConfirmDeleteModal
            staff={deleting}
            api={shStaffApi}
            onClose={() => setDeleting(null)}
            onDone={() => load()}
          />
        )}
      </div>
    </div>
  );
}

/* ==================== Credentials Modal ==================== */
function CredModal({ creds, onClose }) {
  const copy = (text) => navigator.clipboard.writeText(text);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', padding: 32, borderRadius: 18, width: 480,
        boxShadow: '0 25px 80px rgba(0,0,0,0.35)'
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

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
const th = { padding: 12, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: 0.3 };
const td = { padding: 12, fontSize: 14, color: '#0b2e6f' };
const viewBtn = {
  padding: '6px 14px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};

export default MyStaff;