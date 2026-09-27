import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { submitLeaveRequest, getMyProfile, getSignatureBlob } from '../../services/authService';

function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reason, setReason] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [returnDateTime, setReturnDateTime] = useState('');
  const [leaveType, setLeaveType] = useState('FULL_DAY');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [profile, setProfile] = useState(null);
  const [checkingSig, setCheckingSig] = useState(true);
  const [sigUrl, setSigUrl] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data.data);
        if (res.data.data?.hasSignature) {
          try {
            const url = await getSignatureBlob(res.data.data.staffId);
            setSigUrl(url);
          } catch {}
        }
      } catch {}
      finally { setCheckingSig(false); }
    })();
  }, []);

  const durationDays = () => {
    if (!startDateTime || !returnDateTime) return null;
    const ms = new Date(returnDateTime) - new Date(startDateTime);
    if (ms <= 0) return null;
    const days = ms / (1000 * 60 * 60 * 24);
    return days >= 1 ? `${days.toFixed(1)} day${days >= 2 ? 's' : ''}` :
           `${(ms / (1000 * 60 * 60)).toFixed(1)} hours`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (new Date(returnDateTime) <= new Date(startDateTime)) {
      setMessage('❌ Return date/time must be after start date/time');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitLeaveRequest({
        staffId: user.staffId,
        reason,
        startDateTime,
        returnDateTime,
        leaveType,
      });
      if (res.data.success) {
        setMessage('✅ Leave request submitted successfully!');
        setTimeout(() => navigate('/staff/my-requests'), 800);
      } else {
        setMessage('❌ ' + (res.data.message || 'Submission failed'));
      }
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSig) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  if (!profile?.hasSignature) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
          <div style={{
            background: '#fff', padding: 50, borderRadius: 20, maxWidth: 640,
            textAlign: 'center', borderTop: '4px solid #f59e0b',
            boxShadow: '0 12px 30px rgba(0,0,0,.08)'
          }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>✍️</div>
            <h2 style={{ color: '#0b2e6f', marginTop: 0 }}>Digital Signature Required</h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>
              Every leave request must be authorized by your digital signature.
              Before you can submit, please upload your signature in your profile.
              It will be automatically applied to every request you make.
            </p>
            <Link to="/profile" style={{
              display: 'inline-block', marginTop: 22, padding: '14px 34px',
              background: 'linear-gradient(180deg,#3b8dfd,#0d6efd)', color: '#fff',
              textDecoration: 'none', borderRadius: 10, fontWeight: 700,
              boxShadow: '0 4px 0px #0a4fc4'
            }}>
              Go to My Profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
          borderRadius: 20, padding: '28px 36px', color: 'white',
          marginBottom: 26, boxShadow: '0 20px 40px rgba(13,110,253,.22)'
        }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Submit Leave Request</h1>
          <p style={{ marginTop: 8, opacity: 0.9, fontSize: 14 }}>
            Your request will be routed through the approval chain automatically.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

          {/* FORM */}
          <div style={{ background: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
            {message && (
              <p style={{
                padding: 12, borderRadius: 10, fontWeight: 600,
                background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                color: message.startsWith('✅') ? '#166534' : '#991b1b',
                marginBottom: 20,
              }}>{message}</p>
            )}

            <form onSubmit={handleSubmit}>
              <label style={lbl}>Leave Type</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={inp}>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="AFTER_HOUR">After Hour</option>
                <option value="MULTI_DAY">Multi Day</option>
                <option value="SICK">Sick</option>
                <option value="CASUAL">Casual</option>
                <option value="EMERGENCY">Emergency</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Leave Start Date & Time</label>
                  <input type="datetime-local" value={startDateTime}
                    onChange={e => setStartDateTime(e.target.value)} required style={inp} />
                </div>
                <div>
                  <label style={lbl}>Expected Return Date & Time</label>
                  <input type="datetime-local" value={returnDateTime}
                    onChange={e => setReturnDateTime(e.target.value)} required style={inp} />
                </div>
              </div>

              {durationDays() && (
                <div style={{
                  padding: '10px 14px', background: '#f0f9ff',
                  border: '1px solid #bae6fd', borderRadius: 10,
                  fontSize: 13, color: '#075985', marginTop: 12
                }}>
                  📅 Duration: <strong>{durationDays()}</strong>
                </div>
              )}

              <label style={lbl}>Reason</label>
              <textarea rows={5} value={reason} onChange={e => setReason(e.target.value)}
                required style={{ ...inp, resize: 'vertical' }}
                placeholder="Describe the reason for your leave" />

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: 16, marginTop: 24,
                background: submitting ? '#a9c6f5' : 'linear-gradient(180deg,#3b8dfd,#0d6efd)',
                color: '#fff', border: '2px solid #0a4fc4', borderRadius: 12,
                fontSize: 16, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 0px #0a4fc4',
              }}>
                {submitting ? 'Submitting...' : '✓ Submit Leave Request'}
              </button>
            </form>
          </div>

          {/* SIDEBAR: SIGNATURE PREVIEW + APPLICANT INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Applicant Card */}
            <div style={{ background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
              <h3 style={{ margin: '0 0 14px', color: '#0b2e6f', fontSize: 15, letterSpacing: 0.4 }}>APPLICANT</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: '#dbeafe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, color: '#1e40af'
                }}>
                  {profile?.fullName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0b2e6f' }}>{profile?.fullName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{profile?.staffId}</div>
                </div>
              </div>
              <InfoLine k="Department" v={profile?.department} />
              <InfoLine k="Branch" v={profile?.branch} />
              <InfoLine k="Role" v={profile?.role?.replace('_', ' ')} capitalize />
            </div>

            {/* Signature Card */}
            <div style={{
              background: '#fff', padding: 22, borderRadius: 18,
              boxShadow: '0 6px 20px rgba(0,0,0,.05)',
              borderTop: '4px solid #16a34a'
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#0b2e6f', fontSize: 15, letterSpacing: 0.4 }}>
                DIGITAL SIGNATURE
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 0, lineHeight: 1.5 }}>
                Your signature is on file and will be automatically applied to this request.
              </p>
              {sigUrl ? (
                <div style={{
                  border: '2px dashed #86efac', borderRadius: 12, padding: 14,
                  background: '#f0fdf4', textAlign: 'center', marginTop: 10
                }}>
                  <img src={sigUrl} alt="signature"
                    style={{ maxHeight: 70, maxWidth: '100%' }} />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading signature...</div>
              )}
              <div style={{ marginTop: 12, padding: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                ✓ Verified
              </div>
            </div>

            {/* Approval Chain Preview */}
            <div style={{ background: '#fff', padding: 22, borderRadius: 18, boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}>
              <h3 style={{ margin: '0 0 14px', color: '#0b2e6f', fontSize: 15, letterSpacing: 0.4 }}>
                APPROVAL CHAIN
              </h3>
              <ChainRow n="1" label="You submit" state="current" />
              <ChainRow n="2" label="Section Head" state="upcoming" />
              <ChainRow n="3" label="Office In-Charge" state="upcoming" />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
                Notifications will be emailed at each step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ k, v, capitalize }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
      <span style={{ color: '#64748b' }}>{k}</span>
      <span style={{ color: '#0b2e6f', fontWeight: 600, textTransform: capitalize ? 'capitalize' : 'none' }}>
        {v || '—'}
      </span>
    </div>
  );
}

function ChainRow({ n, label, state }) {
  const colors = {
    current: { dot: '#0d6efd', text: '#0b2e6f', bg: '#dbeafe' },
    upcoming: { dot: '#cbd5e1', text: '#64748b', bg: '#f8fafc' },
  };
  const c = colors[state] || colors.upcoming;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: c.bg, color: c.dot,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 12
      }}>{n}</div>
      <span style={{ fontSize: 13, color: c.text, fontWeight: state === 'current' ? 700 : 500 }}>
        {label}
      </span>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 16, color: '#0b2e6f', fontSize: 13 };
const inp = { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' };

export default NewRequest;