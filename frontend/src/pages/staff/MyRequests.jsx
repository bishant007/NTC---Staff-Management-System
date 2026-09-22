import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import { getMyRequests, cancelMyRequest } from '../../services/authService';

function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    try {
      const res = await getMyRequests(user.staffId);
      setRequests(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const doCancel = async () => {
    try {
      const res = await cancelMyRequest(confirmId);
      if (res.data.success) {
        setMessage('✅ Request cancelled');
        setConfirmId(null);
        load();
      } else {
        setMessage('❌ ' + res.data.message);
        setConfirmId(null);
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
      setConfirmId(null);
    }
  };

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>My Leave Requests</h1>
        <p style={{ color: '#5b7bab', marginBottom: 24 }}>
          Complete history with approval trail. You can cancel any pending request.
        </p>

        {message && (
          <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545' }}>
            {message}
          </p>
        )}

        {requests.length === 0 ? (
          <p>You haven't submitted any requests yet.</p>
        ) : (
          [...requests]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(r => (
              <RequestDetail key={r.id} request={r} viewerRole="staff">
                {(r.status === 'PENDING_SECTION_HEAD' || r.status === 'PENDING_DEPARTMENT_HEAD') && (
                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => setConfirmId(r.id)} style={{
                      padding: '10px 20px', background: '#dc3545', color: '#fff',
                      border: 'none', borderRadius: 8, fontWeight: 700,
                      cursor: 'pointer', fontSize: 14,
                    }}>
                      ✕ Cancel Request
                    </button>
                  </div>
                )}
              </RequestDetail>
            ))
        )}

        {confirmId && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }} onClick={() => setConfirmId(null)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#fff', padding: 32, borderRadius: 16, width: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center'
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
              <h2 style={{ marginTop: 0, color: '#0b2e6f' }}>Cancel this request?</h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                This action cannot be undone. The request will be marked as cancelled and
                removed from your approvers' queues.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={() => setConfirmId(null)} style={{
                  flex: 1, padding: 12, background: '#f1f5f9', color: '#334155',
                  border: 'none', borderRadius: 10, fontWeight: 700,
                  fontSize: 14, cursor: 'pointer'
                }}>Keep Request</button>
                <button onClick={doCancel} style={{
                  flex: 1, padding: 12, background: '#dc3545', color: '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 700,
                  fontSize: 14, cursor: 'pointer'
                }}>Yes, Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRequests;