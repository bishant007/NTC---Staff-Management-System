import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { getDashboardStats } from '../../services/authService';

function Reports() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeStaff: 0,
    fieldRequests: 0,
    pendingRequests: 0,
    todayRequests: 0,
    passwordReset: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Reports & Analytics</h1>
        <p>Overview of leave metrics and staff activity.</p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Total Staff</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.totalStaff}</p>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Active Staff</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.activeStaff}</p>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Total Requests</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.fieldRequests}</p>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Pending Approvals</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.pendingRequests}</p>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Today's Requests</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.todayRequests}</p>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3>Password Reset Requests</h3>
              <p style={{ fontSize: 32, fontWeight: 'bold' }}>{stats.passwordReset}</p>
            </div>
          </div>
        )}
        {/* You could add charts here if needed */}
      </div>
    </div>
  );
}

export default Reports;