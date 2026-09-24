import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getOfficeInchargeRequests, getOfficeInchargeHistory } from '../../services/authService';

function OfficeInchargeDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, h] = await Promise.all([getOfficeInchargeRequests(), getOfficeInchargeHistory()]);
        setPending(p.data || []); setHistory(h.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const today = new Date().toDateString();
  const approvedToday = history.filter(r =>
    r.status === 'APPROVED' && r.officeInchargeApprovedAt &&
    new Date(r.officeInchargeApprovedAt).toDateString() === today
  ).length;
  const acted = history.filter(r => r.officeInchargeApprovedAt).length;
  const rejected = history.filter(r => r.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f' }}>Office Incharge Dashboard</h1>
        <p style={{ color: '#5b7bab', marginBottom: 30 }}>Welcome, {user?.fullName}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
          <Card label="Pending Approvals" value={pending.length} color="#f59e0b" />
          <Card label="Approved Today" value={approvedToday} color="#16a34a" />
          <Card label="Rejected" value={rejected} color="#dc3545" />
          <Card label="Total Acted" value={acted} color="#0d6efd" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Awaiting Your Decision</h2>
              <Link to="/office-incharge/pending" style={{ color: '#0d6efd', fontWeight: 600, fontSize: 14 }}>View all →</Link>
            </div>
            {pending.length === 0 ? <p style={{ color: '#888' }}>No pending requests.</p> :
              pending.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.staffName}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {r.leaveType?.replace(/_/g, ' ')} · {r.referenceNumber}
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: '#dbeafe', color: '#1e40af', fontWeight: 700, height: 'fit-content' }}>PENDING</span>
                </div>
              ))}
          </div>

          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
            <Link to="/office-incharge/pending" style={ab}>⏳ Review Pending</Link>
            <Link to="/office-incharge/section-heads" style={ab}>👔 Section Heads</Link>
            <Link to="/profile" style={ab}>👤 My Profile</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const ab = {
  display: 'block', padding: 14, marginBottom: 12, background: '#f4f8ff',
  border: '2px solid #cfe0fc', borderRadius: 10, color: '#0b2e6f',
  textDecoration: 'none', fontWeight: 600, fontSize: 14,
};

function Card({ label, value, color }) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 14, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default OfficeInchargeDashboard;