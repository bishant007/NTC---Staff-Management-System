import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { submitLeaveRequest } from '../../services/authService';

function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [returnDateTime, setReturnDateTime] = useState('');
  const [leaveType, setLeaveType] = useState('FULL_DAY');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (new Date(returnDateTime) <= new Date(startDateTime)) {
      setMessage('❌ Return date/time must be after start date/time');
      setSubmitting(false);
      return;
    }

    try {
      const res = await submitLeaveRequest(
        user.staffId, reason, startDateTime, returnDateTime, leaveType
      );
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>Submit Leave Request</h1>
        <p style={{ color: '#5b7bab' }}>Your request will be routed to your assigned approvers.</p>

        <div style={{ maxWidth: 640, background: '#fff', padding: 28, borderRadius: 16, marginTop: 20 }}>
          {message && <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545' }}>{message}</p>}
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

            <label style={lbl}>Reason</label>
            <textarea rows={4} value={reason} onChange={e => setReason(e.target.value)}
              required style={{ ...inp, resize: 'vertical' }} />

            <label style={lbl}>Leave Start Date & Time</label>
            <input type="datetime-local" value={startDateTime}
              onChange={e => setStartDateTime(e.target.value)} required style={inp} />

            <label style={lbl}>Expected Return Date & Time</label>
            <input type="datetime-local" value={returnDateTime}
              onChange={e => setReturnDateTime(e.target.value)} required style={inp} />

            <button type="submit" disabled={submitting} style={{
              width: '100%', padding: 14, marginTop: 20,
              background: submitting ? '#a9c6f5' : '#0d6efd',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 16, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 16, color: '#0b2e6f', fontSize: 14 };
const inp = { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc', fontSize: 15, boxSizing: 'border-box' };

export default NewRequest;