import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getMyRequests } from '../../services/authService';

function StaffDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyRequests(user.staffId);
        setRequests(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const pending = requests.filter(r => r.status?.startsWith('PENDING')).length;
  const approved = requests.filter(r => r.status === 'APPROVED').length;
  const rejected = requests.filter(r => r.status === 'REJECTED').length;

  const recent = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 8 }}>Welcome, {user?.fullName}</h1>
        <p style={{ color: '#5b7bab', marginBottom: 30 }}>
          Here's an overview of your leave activity.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
          <StatCard label="Total Requests" value={requests.length} color="#0d6efd" />
          <StatCard label="Pending" value={pending} color="#f59e0b" />
          <StatCard label="Approved" value={approved} color="#16a34a" />
          <StatCard label="Rejected" value={rejected} color="#dc3545" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Recent Requests</h2>
              <Link to="/staff/my-requests" style={{ color: '#0d6efd', fontSize: 14, fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p style={{ color: '#888' }}>No requests yet.</p>
            ) : (
              recent.map(r => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0', borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.leaveType?.replace('_', ' ')}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={pill(r.status)}>{r.status?.replace(/_/g, ' ')}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
            <Link to="/staff/new-request" style={actionBtn}>
              ✏️ Submit New Request
            </Link>
            <Link to="/staff/my-requests" style={actionBtn}>
              📋 My Requests
            </Link>
            <Link to="/profile" style={actionBtn}>
              👤 My Profile & Signature
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const actionBtn = {
  display: 'block', padding: 14, marginBottom: 12,
  background: '#f4f8ff', border: '2px solid #cfe0fc', borderRadius: 10,
  color: '#0b2e6f', textDecoration: 'none', fontWeight: 600, fontSize: 14,
};

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 14, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function pill(status) {
  const map = {
    PENDING_SECTION_HEAD:    '#fef3c7',
    PENDING_DEPARTMENT_HEAD: '#dbeafe',
    APPROVED: '#d1fae5',
    REJECTED: '#fee2e2',
  };
  return {
    padding: '4px 10px', borderRadius: 20, fontSize: 11,
    fontWeight: 700, background: map[status] || '#eee',
    color: '#333', height: 'fit-content',
  };
}

export default StaffDashboard;