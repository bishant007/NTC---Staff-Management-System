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

  const load = async () => {
    try {
      const res = await getMyRequests(user.staffId);
      setRequests(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request? This cannot be undone.')) return;
    try {
      const res = await cancelMyRequest(id);
      if (res.data.success) {
        setMessage('✅ Request cancelled');
        load();
      } else {
        setMessage('❌ ' + res.data.message);
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
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
                    <button onClick={() => handleCancel(r.id)} style={{
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
      </div>
    </div>
  );
}

export default MyRequests;