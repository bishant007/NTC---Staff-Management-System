import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import { getDeptHeadHistory } from '../../services/authService';

function DeptHeadHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      try {
        const res = await getDeptHeadHistory();
        setRequests(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const filtered = requests.filter(r => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTED_BY_ME') return r.departmentHeadApprovedAt !== null;
    return r.status === filter;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Approval History</h1>
        <p style={{ color: '#5b7bab', marginBottom: 24 }}>
          All requests you have acted on (or that are still pending).
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'ACTED_BY_ME', 'PENDING_DEPARTMENT_HEAD', 'APPROVED', 'REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? '#0d6efd' : '#fff',
              color: filter === f ? '#fff' : '#0b2e6f',
              fontWeight: 600, fontSize: 13,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#888' }}>
            No matching requests.
          </div>
        ) : (
          filtered
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(r => <RequestDetail key={r.id} request={r} viewerRole="department_head" />)
        )}
      </div>
    </div>
  );
}

export default DeptHeadHistory;