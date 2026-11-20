import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { submitLeaveRequest, getMyProfile, getSignatureBlob } from '../../services/authService';
import { leaveTypesFor, isOtherType } from '../../utils/leaveTypes';
import {
  nepalLocalInputToIso,
  earliestStartLocalInput,
  isWithinWorkHours,
  workHoursLabel,
} from '../../utils/date';

function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reason, setReason] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [returnDateTime, setReturnDateTime] = useState('');
  const [category, setCategory] = useState('PERSONAL');
  const [leaveType, setLeaveType] = useState('FULL_DAY');
  const [customLeaveType, setCustomLeaveType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [profile, setProfile] = useState(null);
  const [checkingSig, setCheckingSig] = useState(true);
  const [sigUrl, setSigUrl] = useState(null);

  // Earliest allowed start time (refreshed on mount).
  const [minStart, setMinStart] = useState(earliestStartLocalInput(2));

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

  // Keep the min start time fresh if the user lingers on the page.
  useEffect(() => {
    const t = setInterval(() => setMinStart(earliestStartLocalInput(2)), 60_000);
    return () => clearInterval(t);
  }, []);

  const availableTypes = leaveTypesFor(category);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setLeaveType(newCat === 'OFFICE_WORK' ? 'FIELD_VISIT' : 'FULL_DAY');
    setCustomLeaveType('');
  };

  const durationDays = () => {
    if (!startDateTime || !returnDateTime) return null;
    const ms = new Date(returnDateTime) - new Date(startDateTime);
    if (ms <= 0) return null;
    const days = ms / (1000 * 60 * 60 * 24);
    return days >= 1 ? `${days.toFixed(1)} day${days >= 2 ? 's' : ''}` :
           `${(ms / (1000 * 60 * 60)).toFixed(1)} hours`;
  };

  /**
   * Client-side validation. Returns an error string or null if everything is OK.
   * Matches the backend rules exactly.
   */
  const validateTimes = () => {
    if (!startDateTime || !returnDateTime) return null;

    const startIso = nepalLocalInputToIso(startDateTime);
    const returnIso = nepalLocalInputToIso(returnDateTime);
    const startDate = new Date(startIso);
    const returnDate = new Date(returnIso);

    if (startDate.getTime() < Date.now() + 60_000) {
      return 'Leave start time must be at least 1 minute in the future.';
    }
    if (returnDate <= startDate) {
      return 'Return time must be after the leave start time.';
    }
    if (!isWithinWorkHours(startDateTime)) {
      return `Leave start time must be within ${workHoursLabel()} (Nepal Time).`;
    }
    if (!isWithinWorkHours(returnDateTime)) {
      return `Return time must be within ${workHoursLabel()} (Nepal Time).`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const validationError = validateTimes();
    if (validationError) {
      setMessage('❌ ' + validationError);
      return;
    }
    if (isOtherType(leaveType) && !customLeaveType.trim()) {
      setMessage('❌ Please describe the leave type when "Other" is selected.');
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
        category,
        customLeaveType: isOtherType(leaveType) ? customLeaveType.trim() : null,
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

  const validationError = validateTimes();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

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

              <label style={lbl}>Purpose / Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <CategoryTile
                  icon="💼"
                  title="Office Work"
                  subtitle="Field visits, official meetings, training"
                  active={category === 'OFFICE_WORK'}
                  onClick={() => handleCategoryChange('OFFICE_WORK')}
                  color="#0d6efd"
                />
                <CategoryTile
                  icon="🏖️"
                  title="Personal"
                  subtitle="General, casual, sick, personal leave"
                  active={category === 'PERSONAL'}
                  onClick={() => handleCategoryChange('PERSONAL')}
                  color="#7c3aed"
                />
              </div>

              <label style={lbl}>
                {category === 'OFFICE_WORK' ? 'Office Work Type' : 'Leave Type'}
              </label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} style={inp}>
                {availableTypes.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>

              {isOtherType(leaveType) && (
                <>
                  <label style={lbl}>
                    {category === 'OFFICE_WORK'
                      ? 'Describe the official work'
                      : 'Describe the type of leave'}
                  </label>
                  <input
                    type="text"
                    value={customLeaveType}
                    onChange={e => setCustomLeaveType(e.target.value)}
                    maxLength={200}
                    placeholder={category === 'OFFICE_WORK'
                      ? 'e.g., Site inspection at Pokhara branch'
                      : 'e.g., Family medical emergency'}
                    style={inp}
                    required
                  />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
                    {customLeaveType.length} / 200
                  </div>
                </>
              )}

              <div style={{
                marginTop: 18, padding: '10px 14px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 10, fontSize: 12, color: '#1e40af',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>🕒</span>
                <span>
                  Leave times must fall within <strong>{workHoursLabel()}</strong> (Nepal Time)
                  and start in the future.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>Leave Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    min={minStart}
                    onChange={e => setStartDateTime(e.target.value)}
                    required
                    style={{
                      ...inp,
                      borderColor: startDateTime && !isWithinWorkHours(startDateTime) ? '#e5484d' : '#cbd5e1',
                    }}
                  />
                  {startDateTime && !isWithinWorkHours(startDateTime) && (
                    <div style={{ fontSize: 11, color: '#e5484d', marginTop: 4, fontWeight: 600 }}>
                      Outside allowed hours ({workHoursLabel()})
                    </div>
                  )}
                </div>
                <div>
                  <label style={lbl}>Expected Return Date & Time</label>
                  <input
                    type="datetime-local"
                    value={returnDateTime}
                    min={startDateTime || minStart}
                    onChange={e => setReturnDateTime(e.target.value)}
                    required
                    style={{
                      ...inp,
                      borderColor: returnDateTime && !isWithinWorkHours(returnDateTime) ? '#e5484d' : '#cbd5e1',
                    }}
                  />
                  {returnDateTime && !isWithinWorkHours(returnDateTime) && (
                    <div style={{ fontSize: 11, color: '#e5484d', marginTop: 4, fontWeight: 600 }}>
                      Outside allowed hours ({workHoursLabel()})
                    </div>
                  )}
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
                placeholder={category === 'OFFICE_WORK'
                  ? 'Describe the official work / purpose of the visit'
                  : 'Describe the reason for your leave'} />

              {validationError && (
                <div style={{
                  marginTop: 16, padding: 12, background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 10,
                  fontSize: 13, color: '#991b1b', fontWeight: 600,
                }}>
                  ⚠️ {validationError}
                </div>
              )}

              <button type="submit" disabled={submitting || !!validationError} style={{
                width: '100%', padding: 16, marginTop: 24,
                background: (submitting || validationError) ? '#a9c6f5' : 'linear-gradient(180deg,#3b8dfd,#0d6efd)',
                color: '#fff', border: '2px solid #0a4fc4', borderRadius: 12,
                fontSize: 16, fontWeight: 700,
                cursor: (submitting || validationError) ? 'not-allowed' : 'pointer',
                boxShadow: (submitting || validationError) ? 'none' : '0 4px 0px #0a4fc4',
              }}>
                {submitting ? 'Submitting...' : '✓ Submit Leave Request'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                  <img src={sigUrl} alt="signature" style={{ maxHeight: 70, maxWidth: '100%' }} />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading signature...</div>
              )}
              <div style={{ marginTop: 12, padding: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                ✓ Verified
              </div>
            </div>

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

function CategoryTile({ icon, title, subtitle, active, onClick, color }) {
  return (
    <div onClick={onClick} style={{
      padding: 14, borderRadius: 12, cursor: 'pointer',
      border: active ? `2px solid ${color}` : '2px solid #e2e8f0',
      background: active ? `${color}11` : '#f8fafc',
      transition: '0.15s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: active ? color : '#0b2e6f', fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subtitle}</div>
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