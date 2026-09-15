import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';

function Settings() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      // This endpoint is not yet implemented; for now, we show success placeholder
      // await api.post('/admin/change-password', { oldPassword, newPassword });
      setMessage('✅ Password updated successfully (simulated)');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage('❌ Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Settings</h1>
        <p>Manage your profile and password.</p>

        <div style={{ background: '#fff', padding: 30, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: 500 }}>
          <h3>Admin Profile</h3>
          <p><strong>Name:</strong> {user?.fullName || user?.email}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Role:</strong> Admin</p>

          <hr style={{ margin: '20px 0' }} />

          <h3>Change Password</h3>
          {message && <p style={{ color: message.startsWith('✅') ? 'green' : '#dc3545' }}>{message}</p>}
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #ccc' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 30px',
                background: loading ? '#a9c6f5' : '#0d6efd',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;