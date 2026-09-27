import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import { getSectionHeadHistory } from '../../services/authService';

function SectionHeadHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getSectionHeadHistory();
        setRequests(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const base = requests.filter(r => {
    if (filter === 'ACTED_BY_ME') return !!r.sectionHeadApprovedAt;
    if (filter === 'ALL') return true;
    return r.status === filter;
  });
  const filtered = base.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.staffName || '').toLowerCase().includes(s)
        || (r.referenceNumber || '').toLowerCase().includes(s);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const counts = {
    ALL: requests.length,
    ACTED_BY_ME: requests.filter(r => !!r.sectionHeadApprovedAt).length,
    PENDING_SECTION_HEAD: requests.filter(r => r.status === 'PENDING_SECTION_HEAD').length,
    PENDING_OFFICE_INCHARGE: requests.filter(r => r.status === 'PENDING_OFFICE_INCHARGE').length,
    APPROVED: requests.filter(r => r.status === 'APPROVED').length,
    REJECTED: requests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Approval History</h1>
        <p style={{ color: '#5b7bab', marginTop: 0, marginBottom: 20 }}>
          All requests from your assigned staff.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 22 }}>
          <MiniStat label="Total" value={counts.ALL} color="#0d6efd" />
          <MiniStat label="Acted by Me" value={counts.ACTED_BY_ME} color="#7c3aed" />
          <MiniStat label="Pending SH" value={counts.PENDING_SECTION_HEAD} color="#f59e0b" />
          <MiniStat label="Pending OI" value={counts.PENDING_OFFICE_INCHARGE} color="#1e40af" />
          <MiniStat label="Approved" value={counts.APPROVED} color="#16a34a" />
          <MiniStat label="Rejected" value={counts.REJECTED} color="#dc3545" />
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 12, display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search by staff or reference number"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 320, background: '#f8fafc' }} />
          {['ALL', 'ACTED_BY_ME', 'PENDING_SECTION_HEAD', 'PENDING_OFFICE_INCHARGE', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? '#0d6efd' : '#f1f5f9',
              color: filter === f ? '#fff' : '#334155',
              fontWeight: 600, fontSize: 12,
            }}>{f.replace(/_/g, ' ')}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', padding: 50, borderRadius: 16, textAlign: 'center', color: '#94a3b8' }}>
            No matching requests.
          </div>
        ) : (
          filtered.map(r => <RequestDetail key={r.id} request={r} viewerRole="section_head" />)
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', padding: 14, borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default SectionHeadHistory;