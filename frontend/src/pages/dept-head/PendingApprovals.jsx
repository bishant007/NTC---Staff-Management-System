import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import {
  getDeptHeadRequests, approveByDeptHead, rejectByDeptHead
} from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

function DeptHeadPending() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeAction, setActiveAction] = useState(null); // { type, id }
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async () => {
    try {
      const res = await getDeptHeadRequests();
      setRequests(res.data || []);
    } catch { setMessage('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openApprove = (r) => {
    setActiveAction({ type: 'approve', id: r.id });
    setSignature(user?.fullName || '');
    setNotes('');
  };
  const openReject = (r) => {
    setActiveAction({ type: 'reject', id: r.id });
    setRejectionReason('');
  };
  const closeAction = () => setActiveAction(null);

  const submitApprove = async () => {
    if (!signature.trim()) { alert('Please enter your signature'); return; }
    try {
      await approveByDeptHead(activeAction.id, signature, notes);
      setMessage('✅ Approved');
      closeAction();
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) { alert('Please provide a rejection reason'); return; }
    try {
      await rejectByDeptHead(activeAction.id, rejectionReason);
      setMessage('✅ Request rejected');
      closeAction();
      load();
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Pending Approvals</h1>
        <p style={{ color: '#5b7bab', marginBottom: 24 }}>
          Requests awaiting your final review.
        </p>

        {message && (
          <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545' }}>
            {message}
          </p>
        )}

        {requests.length === 0 ? (
          <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#888' }}>
            No pending requests.
          </div>
        ) : (
          requests.map(r => (
            <RequestDetail key={r.id} request={r} viewerRole="department_head">
              {activeAction?.id === r.id ? (
                <div style={{
                  marginTop: 16, padding: 16, background: '#f8fafc',
                  borderRadius: 10, border: '1px solid #e2e8f0'
                }}>
                  {activeAction.type === 'approve' ? (
                    <>
                      <label style={lbl}>Digital Signature</label>
                      <input value={signature} onChange={e => setSignature(e.target.value)}
                        placeholder="Type your full name to sign" style={inp} />

                      <label style={lbl}>Notes (optional)</label>
                      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Any remarks" style={{ ...inp, resize: 'vertical' }} />

                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button onClick={submitApprove} style={btn('#16a34a')}>✓ Confirm Approval</button>
                        <button onClick={closeAction} style={btn('#94a3b8')}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label style={lbl}>Rejection Reason</label>
                      <textarea rows={3} value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Explain why you are rejecting this request" style={{ ...inp, resize: 'vertical' }} />

                      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <button onClick={submitReject} style={btn('#dc3545')}>✕ Confirm Rejection</button>
                        <button onClick={closeAction} style={btn('#94a3b8')}>Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={() => openApprove(r)} style={btn('#16a34a')}>Approve</button>
                  <button onClick={() => openReject(r)} style={btn('#dc3545')}>Reject</button>
                </div>
              )}
            </RequestDetail>
          ))
        )}
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 10, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };

function btn(bg) {
  return {
    padding: '10px 18px', background: bg, color: 'white',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14,
  };
}

export default DeptHeadPending;