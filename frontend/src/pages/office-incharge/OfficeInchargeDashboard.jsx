import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { getOfficeInchargeRequests, getOfficeInchargeHistory, getMySectionHeads } from '../../services/authService';

function OfficeInchargeDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, h, sh] = await Promise.all([
          getOfficeInchargeRequests(),
          getOfficeInchargeHistory(),
          getMySectionHeads().catch(() => ({ data: [] })),
        ]);
        setPending(p.data || []);
        setHistory(h.data || []);
        setHeads(sh.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const today = new Date().toDateString();
  const approvedToday = history.filter(r =>
    r.officeInchargeApprovedAt && new Date(r.officeInchargeApprovedAt).toDateString() === today
  ).length;
  const acted = history.filter(r => r.officeInchargeApprovedAt).length;
  const rejected = history.filter(r => r.status === 'REJECTED').length;
  const approved = history.filter(r => r.status === 'APPROVED').length;

  const recent = [...history]
    .filter(r => r.officeInchargeApprovedAt)
    .sort((a, b) => new Date(b.officeInchargeApprovedAt) - new Date(a.officeInchargeApprovedAt))
    .slice(0, 5);

  const initials = user?.fullName?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'OI';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

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
              fontSize: 22, fontWeight: 800,
            }}>{initials}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26 }}>Office In-Charge Dashboard</h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.9 }}>
                Welcome, {user?.fullName}
              </p>
            </div>
          </div>
          <Link to="/office-incharge/pending" style={{
            padding: '12px 24px', background: '#fff', color: '#0d6efd',
            textDecoration: 'none', borderRadius: 10, fontWeight: 700,
            boxShadow: '0 4px 0px rgba(0,0,0,.15)', fontSize: 14,
          }}>Review Pending ({pending.length})</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, marginBottom: 26 }}>
          <Stat label="Pending"          value={pending.length}  color="#f59e0b" icon="⏳" />
          <Stat label="Approved Today"   value={approvedToday}   color="#16a34a" icon="✅" />
          <Stat label="Approved"         value={approved}        color="#0d6efd" icon="📗" />
          <Stat label="Rejected"         value={rejected}        color="#dc3545" icon="❌" />
          <Stat label="Section Heads"    value={heads.length}    color="#7c3aed" icon="👔" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 22 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#0b2e6f', fontSize: 17 }}>Recent Decisions</h2>
              <Link to="/office-incharge/history" style={{ color: '#0d6efd', fontSize: 13, fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>
                No decisions yet.
              </div>
            ) : recent.map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0', borderBottom: '1px solid #f1f5f9',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0b2e6f', fontSize: 14 }}>{r.staffName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {r.leaveType?.replace(/_/g, ' ')} · {r.referenceNumber}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                  background: r.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                  color: r.status === 'APPROVED' ? '#065f46' : '#991b1b',
                  letterSpacing: 0.5, height: 'fit-content', alignSelf: 'center',
                }}>{r.status}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: pending.length > 0 ? 'linear-gradient(135deg,#f59e0b,#fbbf24)' : '#fff',
              color: pending.length > 0 ? 'white' : '#0b2e6f',
              padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, opacity: 0.8 }}>
                AWAITING DECISION
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6 }}>{pending.length}</div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
                {pending.length > 0 ? 'Final approvals pending' : 'Nothing to review'}
              </div>
              {pending.length > 0 && (
                <Link to="/office-incharge/pending" style={{
                  display: 'inline-block', marginTop: 14, fontSize: 13,
                  color: 'white', fontWeight: 700, textDecoration: 'underline',
                }}>Review now →</Link>
              )}
            </div>

            <div style={{ background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
              <h3 style={{ margin: '0 0 12px', color: '#0b2e6f', fontSize: 15 }}>Quick Actions</h3>
              <QuickLink to="/office-incharge/pending" icon="⏳" label="Pending Approvals" />
              <QuickLink to="/office-incharge/history" icon="📜" label="Approval History" />
              <QuickLink to="/office-incharge/section-heads" icon="👔" label="Section Heads" />
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
      boxShadow: '0 4px 16px rgba(0,0,0,.05)', borderLeft: `4px solid ${color}`,
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

export default OfficeInchargeDashboard;