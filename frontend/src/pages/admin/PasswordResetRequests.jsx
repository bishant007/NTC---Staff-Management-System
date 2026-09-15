import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';

function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch password reset requests (assuming backend endpoint exists)
  // If not, we'll show a placeholder
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Adjust endpoint if you have one
        // const res = await api.get('/admin/password-reset-requests');
        // setRequests(res.data);
        // For now, simulate data
        setRequests([]);
      } catch (err) {
        setMessage('Failed to load password reset requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Password Reset Requests</h1>
        <p>Staff can request password reset via the "Contact Administrator" page. Their requests will appear here.</p>

        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No pending password reset requests.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Message</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{req.fullName}</td>
                  <td style={{ padding: '12px' }}>{req.email}</td>
                  <td style={{ padding: '12px' }}>{req.phone}</td>
                  <td style={{ padding: '12px' }}>{req.message}</td>
                  <td style={{ padding: '12px' }}>
                    <button style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default PasswordResetRequests;