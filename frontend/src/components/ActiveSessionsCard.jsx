import React, { useEffect, useState } from 'react';
import { listMySessions, revokeSession, revokeOtherSessions } from '../services/authService';
import { formatNepalDateTime } from '../utils/date';

export default function ActiveSessionsCard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMySessions();
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async (id) => {
    if (!window.confirm('End this session? The device will be signed out immediately.')) return;
    try {
      await revokeSession(id);
      setMessage('✅ Session revoked');
      load();
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.message || e.message));
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm('End all OTHER sessions? You will stay logged in on this device.')) return;
    try {
      const res = await revokeOtherSessions();
      setMessage('✅ ' + (res.data?.message || 'Other sessions revoked'));
      load();
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.message || e.message));
    }
  };

  const deviceLabel = (ua) => {
    if (!ua) return 'Unknown device';
    if (/edg/i.test(ua) && /windows/i.test(ua)) return '🖥 Edge on Windows';
    if (/chrome/i.test(ua) && /windows/i.test(ua)) return '🖥 Chrome on Windows';
    if (/firefox/i.test(ua) && /windows/i.test(ua)) return '🖥 Firefox on Windows';
    if (/safari/i.test(ua) && /mac/i.test(ua)) return '🍎 Safari on Mac';
    if (/chrome/i.test(ua) && /linux/i.test(ua)) return '🐧 Chrome on Linux';
    if (/android/i.test(ua)) return '📱 Android';
    if (/iphone|ipad/i.test(ua)) return '📱 iOS';
    return ua.substring(0, 40);
  };

  return (
    <div style={{
      background: '#fff', padding: 24, borderRadius: 18,
      boxShadow: '0 6px 20px rgba(0,0,0,.05)', marginTop: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🖥️</span>
        <h2 style={{ margin: 0, color: '#0b2e6f', fontSize: 17 }}>Active Sessions</h2>
        <button onClick={handleRevokeOthers} style={{
          marginLeft: 'auto', padding: '8px 14px', background: '#f1f5f9',
          border: '1px solid #cbd5e1', color: '#334155', borderRadius: 8,
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
        }}>Sign out other devices</button>
      </div>

      <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
        Devices currently signed in to your account. Revoke anything you don't recognize.
      </p>

      {message && (
        <p style={{
          fontWeight: 600, marginBottom: 12, padding: 10, borderRadius: 8,
          background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
          color: message.startsWith('✅') ? '#166534' : '#991b1b', fontSize: 13,
        }}>{message}</p>
      )}

      {loading ? <p style={{ color: '#94a3b8' }}>Loading sessions…</p> :
        sessions.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No active sessions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, borderRadius: 12,
                background: s.current ? '#f0f9ff' : '#f8fafc',
                border: s.current ? '2px solid #0d6efd' : '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: s.current ? '#dbeafe' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>💻</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, color: '#0b2e6f', fontSize: 14,
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    {deviceLabel(s.userAgent)}
                    {s.current && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, background: '#0d6efd',
                        color: '#fff', padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5,
                      }}>THIS DEVICE</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    IP: {s.ipAddress || 'unknown'} · Started: {formatNepalDateTime(s.createdAt)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Last active: {formatNepalDateTime(s.lastUsedAt)}
                  </div>
                </div>
                {!s.current && (
                  <button onClick={() => handleRevoke(s.id)} style={{
                    padding: '8px 14px', background: '#fee2e2', color: '#991b1b',
                    border: '1px solid #fecaca', borderRadius: 8,
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  }}>Revoke</button>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}