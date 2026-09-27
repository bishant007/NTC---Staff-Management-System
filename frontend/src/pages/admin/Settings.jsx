import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import { changeAdminPassword } from '../../services/authService';

function Settings() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [message, setMessage] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage(''); setOk(false);

    if (newPassword.length < 6) {
      setMessage('❌ New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await changeAdminPassword(user.email, oldPassword, newPassword);
      if (res.data.success) {
        setMessage('✅ Password updated successfully');
        setOk(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage('❌ ' + (res.data.message || 'Failed to update password'));
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
          borderRadius: 20, padding: '28px 36px', color: 'white',
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 26, boxShadow: '0 20px 40px rgba(13,110,253,.22)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800,
          }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>Settings</h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
              Manage your administrator profile and password.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 22 }}>

          {/* Profile card */}
          <div style={{
            background: '#fff', padding: 26, borderRadius: 18,
            boxShadow: '0 6px 20px rgba(0,0,0,.05)',
            borderTop: '4px solid #0d6efd',
          }}>
            <h3 style={{ marginTop: 0, color: '#0b2e6f', fontSize: 17 }}>Administrator Profile</h3>

            <InfoRow icon="✉" label="Email" value={user?.email} />
            <InfoRow icon="🎭" label="Role" value="Administrator" />
            <InfoRow icon="🔑" label="Access" value="Full system access" />
            <InfoRow icon="🎫" label="Session" value="JWT · 24-hour expiry" />

            <div style={{
              marginTop: 18, padding: 14, borderRadius: 12,
              background: '#f0f9ff', border: '1px solid #bae6fd',
              fontSize: 12, color: '#075985', lineHeight: 1.6,
            }}>
              <strong>Note:</strong> Administrators have read-only access to leave approvals.
              All approvals happen through the Section Head → Office In-Charge chain.
            </div>
          </div>

          {/* Change password card */}
          <div style={{
            background: '#fff', padding: 26, borderRadius: 18,
            boxShadow: '0 6px 20px rgba(0,0,0,.05)',
            borderTop: '4px solid #16a34a',
          }}>
            <h3 style={{ marginTop: 0, color: '#0b2e6f', fontSize: 17 }}>Change Password</h3>

            {message && (
              <div style={{
                padding: 12, borderRadius: 10, marginBottom: 16,
                fontWeight: 600, fontSize: 14,
                background: ok ? '#dcfce7' : '#fee2e2',
                color: ok ? '#166534' : '#991b1b',
              }}>{message}</div>
            )}

            <form onSubmit={handlePasswordChange}>
              <label style={lbl}>Current Password</label>
              <input type="password" value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter your current password" required style={inp} />

              <label style={lbl}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters" required
                  style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', fontSize: 16, color: '#64748b',
                  }}>{showPw ? '🙈' : '👁'}</button>
              </div>

              <label style={lbl}>Confirm New Password</label>
              <input type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password" required style={inp} />

              <button type="submit" disabled={loading} style={{
                marginTop: 20, width: '100%', padding: 14,
                background: loading ? '#a9c6f5' : 'linear-gradient(180deg,#3b8dfd,#0d6efd)',
                color: '#fff', border: '2px solid #0a4fc4', borderRadius: 10,
                fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 0px #0a4fc4',
              }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#f0f5ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.3 }}>
          {label}
        </div>
        <div style={{
          fontSize: 14, color: '#0b2e6f', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value || '—'}</div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginTop: 14, marginBottom: 6, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 15, boxSizing: 'border-box', background: '#f8fafc' };

export default Settings;