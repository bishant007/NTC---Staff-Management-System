import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import {
  getOfficeInchargeRequests, approveByOfficeIncharge, rejectByOfficeIncharge,
  getMyProfile, getSignatureBlob, getOfficeInchargeHistory,
} from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

function PendingApprovals() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [msg, setMsg] = useState('');
  const [profile, setProfile] = useState(null);
  const [checkingSig, setCheckingSig] = useState(true);
  const [mySigUrl, setMySigUrl] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [req, hist] = await Promise.all([
        getOfficeInchargeRequests(),
        getOfficeInchargeHistory().catch(() => ({ data: [] })),
      ]);
      setItems(req.data || []);
      setHistory(hist.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data.data);
        if (res.data.data?.hasSignature) {
          try {
            const url = await getSignatureBlob(res.data.data.staffId);
            setMySigUrl(url);
          } catch {}
        }
      } catch {}
      finally { setCheckingSig(false); }
    })();
  }, []);

  const openApprove = (r) => { setActiveAction({ type: 'approve', id: r.id }); setNotes(''); };
  const openReject  = (r) => { setActiveAction({ type: 'reject', id: r.id }); setRejectionReason(''); };
  const closeAction = () => setActiveAction(null);

  const submitApprove = async (id) => {
    if (!profile?.hasSignature) { setMsg('❌ Upload your signature first'); return; }
    try {
      await approveByOfficeIncharge(id, user?.fullName || 'Signed', notes);
      setMsg('✅ Approved');
      closeAction();
      load();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || e.message));
    }
  };

  const submitReject = async (id) => {
    if (!profile?.hasSignature) { setMsg('❌ Upload your signature first'); return; }
    if (!rejectionReason.trim()) { setMsg('❌ Rejection reason required'); return; }
    try {
      await rejectByOfficeIncharge(id, user?.fullName || 'Signed', rejectionReason);
      setMsg('✅ Rejected');
      closeAction();
      load();
    } catch (e) {
      setMsg('❌ ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading || checkingSig) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const recent = [...history]
    .filter(r => r.officeInchargeApprovedAt)
    .sort((a, b) => new Date(b.officeInchargeApprovedAt) - new Date(a.officeInchargeApprovedAt))
    .slice(0, 4);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

        <div style={hero}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: 0.4, fontWeight: 600 }}>
              OFFICE IN-CHARGE
            </div>
            <h1 style={{ margin: '6px 0 4px', fontSize: 26 }}>Pending Approvals</h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
              {items.length === 0
                ? 'All caught up — no requests awaiting your final decision.'
                : `${items.length} request${items.length > 1 ? 's' : ''} awaiting your final decision.`}
            </p>
          </div>
          <button onClick={load} style={refreshBtn}>↻ Refresh</button>
        </div>

        {msg && (
          <p style={{
            fontWeight: 600, marginBottom: 16, padding: 12, borderRadius: 10,
            background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2',
            color: msg.startsWith('✅') ? '#166534' : '#991b1b',
          }}>{msg}</p>
        )}

        {items.length === 0 ? (
          <EmptyState recent={recent} />
        ) : (
          items.map(r => (
            <RequestDetail key={r.id} request={r} viewerRole="office_incharge">
              {activeAction?.id === r.id ? (
                <div style={actionPanel}>
                  <div style={{
                    ...sigPanel,
                    borderColor: activeAction.type === 'approve' ? '#16a34a' : '#dc3545',
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8,
                      color: activeAction.type === 'approve' ? '#166534' : '#991b1b'
                    }}>
                      {activeAction.type === 'approve'
                        ? 'AUTHORIZING SIGNATURE'
                        : 'SIGNATURE ON FILE (REJECTING)'}
                    </div>
                    {mySigUrl ? (
                      <>
                        <img src={mySigUrl} alt="my signature"
                          style={{ maxHeight: 70, display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0b2e6f' }}>
                          {user?.fullName}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {user?.staffId} · {new Date().toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#dc3545', fontSize: 13, fontWeight: 600 }}>
                        ⚠️ No signature on file.
                      </div>
                    )}
                  </div>

                  {activeAction.type === 'approve' ? (
                    <>
                      <label style={lbl}>Remarks (optional)</label>
                      <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                        placeholder="Any remarks to record with this approval"
                        style={{ ...inp, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button onClick={() => submitApprove(r.id)} disabled={!mySigUrl}
                          style={{ ...btn('#16a34a'), opacity: mySigUrl ? 1 : 0.5 }}>
                          ✓ Approve & Sign
                        </button>
                        <button onClick={closeAction} style={btn('#94a3b8')}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label style={lbl}>Rejection Reason</label>
                      <textarea rows={3} value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder="Explain why this request is being rejected"
                        style={{ ...inp, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                        <button onClick={() => submitReject(r.id)} disabled={!mySigUrl}
                          style={{ ...btn('#dc3545'), opacity: mySigUrl ? 1 : 0.5 }}>
                          ✕ Reject & Sign
                        </button>
                        <button onClick={closeAction} style={btn('#94a3b8')}>Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              ) : !profile?.hasSignature ? (
                <div style={warningBox}>
                  ⚠️ You must upload your digital signature before approving or rejecting.
                  {' '}<Link to="/profile" style={{ color: '#92400e', fontWeight: 700 }}>
                    Go to My Profile →
                  </Link>
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

function EmptyState({ recent }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
      <div style={emptyCard}>
        <div style={{
          width: 92, height: 92, borderRadius: '50%',
          background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 42,
        }}>✅</div>
        <h2 style={{ color: '#0b2e6f', marginTop: 0, marginBottom: 8, fontSize: 22 }}>
          You're all caught up!
        </h2>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          There are no pending leave requests awaiting your final decision.
          Requests forwarded from Section Heads will appear here.
        </p>

        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center',
          marginTop: 24, flexWrap: 'wrap',
        }}>
          <Link to="/office-incharge/history" style={quickBtn}>📜 Approval History</Link>
          <Link to="/office-incharge/section-heads" style={quickBtn}>👔 Section Heads</Link>
          <Link to="/profile" style={quickBtn}>👤 My Profile</Link>
        </div>
      </div>

      <div style={{ background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
        <h3 style={{ margin: '0 0 14px', color: '#0b2e6f', fontSize: 15 }}>Recently Decided</h3>
        {recent.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            Your recent decisions will appear here.
          </p>
        ) : recent.map(r => (
          <div key={r.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 0', borderBottom: '1px solid #f1f5f9',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: '#0b2e6f', fontSize: 13 }}>{r.staffName}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {r.leaveType?.replace(/_/g, ' ')} · {new Date(r.officeInchargeApprovedAt).toLocaleDateString()}
              </div>
            </div>
            <span style={{
              padding: '3px 9px', borderRadius: 12, fontSize: 9, fontWeight: 800,
              background: r.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
              color: r.status === 'APPROVED' ? '#065f46' : '#991b1b',
              letterSpacing: 0.4, height: 'fit-content', alignSelf: 'center',
            }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const hero = {
  background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
  borderRadius: 20, padding: '26px 32px', color: 'white',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 24, boxShadow: '0 20px 40px rgba(13,110,253,.22)',
};
const refreshBtn = {
  padding: '10px 18px', background: 'rgba(255,255,255,.2)', color: '#fff',
  border: '1px solid rgba(255,255,255,.35)', borderRadius: 10,
  fontWeight: 700, cursor: 'pointer', fontSize: 13,
};
const emptyCard = {
  background: '#fff', padding: '48px 32px', borderRadius: 18,
  textAlign: 'center', boxShadow: '0 6px 20px rgba(0,0,0,.05)',
};
const quickBtn = {
  display: 'inline-block', padding: '10px 20px',
  background: '#f0f9ff', color: '#0b2e6f', textDecoration: 'none',
  border: '1px solid #bfdbfe', borderRadius: 10,
  fontWeight: 700, fontSize: 13,
};
const actionPanel = {
  marginTop: 16, padding: 20, background: '#f8fafc',
  borderRadius: 12, border: '1px solid #e2e8f0',
};
const sigPanel = {
  padding: 16, background: '#fff', borderRadius: 10,
  border: '2px dashed', marginBottom: 16,
};
const warningBox = {
  marginTop: 14, padding: 14, background: '#fef3c7',
  borderRadius: 8, fontSize: 13, color: '#92400e',
};
const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 10, fontSize: 13, color: '#334155' };
const inp = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };
function btn(bg) {
  return {
    padding: '10px 18px', background: bg, color: 'white',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14,
  };
}

export default PendingApprovals;