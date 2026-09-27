import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getMyRequests, getMyProfile } from '../../services/authService';

function StaffDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.all([
          getMyRequests(user.staffId),
          getMyProfile(),
        ]);
        setRequests(r.data || []);
        setProfile(p.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const pending  = requests.filter(r => r.status?.startsWith('PENDING')).length;
  const approved = requests.filter(r => r.status === 'APPROVED').length;
  const rejected = requests.filter(r => r.status === 'REJECTED').length;
  const cancelled = requests.filter(r => r.status === 'CANCELLED').length;

  const recent = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const today = new Date().toDateString();
  const onLeaveToday = requests.filter(r =>
    r.status === 'APPROVED' &&
    new Date(r.leaveStartTime).toDateString() <= today &&
    new Date(r.returnDateTime).toDateString() >= today
  ).length;

  const initials = user?.fullName?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'U';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
          borderRadius: 20, padding: '30px 36px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 26, boxShadow: '0 20px 40px rgba(13,110,253,.22)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, letterSpacing: 1,
            }}>{initials}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>Welcome, {user?.fullName?.split(' ')[0] || 'Staff'}</h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
                {profile?.staffId} · {profile?.department} · {profile?.branch}
              </p>
            </div>
          </div>
          <Link to="/staff/new-request" style={{
            padding: '12px 24px', background: '#fff', color: '#0d6efd',
            textDecoration: 'none', borderRadius: 10, fontWeight: 700,
            boxShadow: '0 4px 0px rgba(0,0,0,.15)', fontSize: 14,
          }}>+ New Request</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, marginBottom: 26 }}>
          <Stat label="Total"     value={requests.length} color="#0d6efd" icon="📋" />
          <Stat label="Pending"   value={pending}         color="#f59e0b" icon="⏳" />
          <Stat label="Approved"  value={approved}        color="#16a34a" icon="✅" />
          <Stat label="Rejected"  value={rejected}        color="#dc3545" icon="❌" />
          <Stat label="Cancelled" value={cancelled}       color="#64748b" icon="⚪" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
          {/* Recent Activity */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#0b2e6f', fontSize: 17 }}>Recent Requests</h2>
              <Link to="/staff/my-requests" style={{ color: '#0d6efd', fontSize: 13, fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No requests yet"
                text="Submit your first leave request to get started."
                action={{ label: 'Submit Request', to: '/staff/new-request' }}
              />
            ) : (
              recent.map(r => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '14px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: '#f0f5ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>📄</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0b2e6f', fontSize: 14 }}>
                        {r.leaveType?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {r.referenceNumber} · {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* On Leave Today */}
            <div style={{
              background: onLeaveToday > 0 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#fff',
              color: onLeaveToday > 0 ? 'white' : '#0b2e6f',
              padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, opacity: 0.75 }}>
                ON LEAVE TODAY
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6 }}>{onLeaveToday}</div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
                {onLeaveToday > 0 ? 'Enjoy your time off' : 'Not on leave'}
              </div>
            </div>

            {/* Signature Status */}
            <div style={{
              background: '#fff', padding: 22, borderRadius: 18,
              boxShadow: '0 6px 20px rgba(0,0,0,.05)',
              borderTop: `4px solid ${profile?.hasSignature ? '#16a34a' : '#f59e0b'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: '#64748b' }}>
                SIGNATURE
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0b2e6f', marginTop: 6 }}>
                {profile?.hasSignature ? '✓ On file' : '⚠ Not uploaded'}
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>
                {profile?.hasSignature
                  ? 'Your signature is applied to every request automatically.'
                  : 'Upload a signature to enable leave requests.'}
              </p>
              <Link to="/profile" style={{
                display: 'inline-block', marginTop: 12, fontSize: 13, color: '#0d6efd', fontWeight: 700,
              }}>
                {profile?.hasSignature ? 'Manage →' : 'Upload now →'}
              </Link>
            </div>

            {/* Quick Links */}
            <div style={{ background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
              <h3 style={{ margin: '0 0 12px', color: '#0b2e6f', fontSize: 15 }}>Quick Actions</h3>
              <QuickLink to="/staff/new-request" icon="✏️" label="Submit Request" />
              <QuickLink to="/staff/my-requests" icon="📋" label="My Requests" />
              <QuickLink to="/profile" icon="👤" label="My Profile" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#fff', padding: '18px 20px', borderRadius: 16,
      boxShadow: '0 4px 16px rgba(0,0,0,.05)',
      borderLeft: `4px solid ${color}`,
      transition: '0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 20 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function QuickLink({ to, icon, label }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', marginBottom: 8,
      background: '#f8fafc', border: '1px solid #e5edf8',
      borderRadius: 10, color: '#0b2e6f', textDecoration: 'none',
      fontWeight: 600, fontSize: 14,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
      <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>→</span>
    </Link>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
      <div style={{ fontSize: 42 }}>{icon}</div>
      <div style={{ color: '#0b2e6f', fontWeight: 700, marginTop: 10 }}>{title}</div>
      <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{text}</p>
      {action && (
        <Link to={action.to} style={{
          display: 'inline-block', marginTop: 14, padding: '10px 20px',
          background: '#0d6efd', color: '#fff', textDecoration: 'none',
          borderRadius: 8, fontWeight: 700, fontSize: 13,
        }}>{action.label}</Link>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    PENDING_SECTION_HEAD:    { bg: '#fef3c7', fg: '#92400e' },
    PENDING_OFFICE_INCHARGE: { bg: '#dbeafe', fg: '#1e40af' },
    PENDING_SELF_APPROVAL:   { bg: '#e0e7ff', fg: '#3730a3' },
    APPROVED:                { bg: '#d1fae5', fg: '#065f46' },
    REJECTED:                { bg: '#fee2e2', fg: '#991b1b' },
    CANCELLED:               { bg: '#e5e7eb', fg: '#374151' },
  };
  const c = m[status] || m.CANCELLED;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
      background: c.bg, color: c.fg, letterSpacing: 0.5, whiteSpace: 'nowrap',
      height: 'fit-content', alignSelf: 'center',
    }}>{status?.replace(/_/g, ' ')}</span>
  );
}

export default StaffDashboard;