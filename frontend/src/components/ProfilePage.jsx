import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
  getMyProfile, uploadMySignature, deleteMySignature, getSignatureBlob
} from '../services/authService';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [sigUrl, setSigUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef();

  const load = async () => {
    try {
      const res = await getMyProfile();
      setProfile(res.data.data);
      if (res.data.data.hasSignature) {
        try {
          const url = await getSignatureBlob(res.data.data.staffId);
          setSigUrl(url);
        } catch { setSigUrl(null); }
      } else setSigUrl(null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMessage('');
    try {
      await uploadMySignature(file);
      setMessage('✅ Signature uploaded successfully');
      await load();
    } catch (err) {
      setMessage('❌ Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your signature?')) return;
    try {
      await deleteMySignature();
      setMessage('✅ Signature removed');
      await load();
    } catch { setMessage('❌ Delete failed'); }
  };

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f' }}>My Profile</h1>

        {message && (
          <p style={{ fontWeight: 600, color: message.startsWith('✅') ? 'green' : '#dc3545' }}>
            {message}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Personal Information</h2>
            <InfoRow label="Full Name" value={profile?.fullName} />
            <InfoRow label="Staff ID" value={profile?.staffId} />
            <InfoRow label="Email" value={profile?.email} />
            <InfoRow label="Phone" value={profile?.phone} />
            <InfoRow label="Department" value={profile?.department} />
            <InfoRow label="Branch" value={profile?.branch} />
            <InfoRow label="Role" value={profile?.role?.replace('_', ' ')} capitalize />
          </div>

          <div style={{ background: '#fff', padding: 24, borderRadius: 16 }}>
            <h2 style={{ marginTop: 0 }}>Digital Signature</h2>
            <p style={{ color: '#666', fontSize: 14 }}>
              Upload a clear image of your signature (PNG/JPG). It will be shown
              alongside your approvals on leave requests.
            </p>

            {sigUrl ? (
              <>
                <div style={{
                  border: '2px dashed #cfe0fc', borderRadius: 12, padding: 20,
                  textAlign: 'center', background: '#f8fbff', marginTop: 16
                }}>
                  <img src={sigUrl} alt="signature" style={{ maxHeight: 120, maxWidth: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={btnStyle('#0d6efd')}>
                    {uploading ? 'Uploading...' : 'Replace Signature'}
                  </button>
                  <button onClick={handleDelete} style={btnStyle('#dc3545')}>Remove</button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  border: '2px dashed #cfe0fc', borderRadius: 12, padding: 40,
                  textAlign: 'center', color: '#888', marginTop: 16
                }}>No signature uploaded yet</div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ ...btnStyle('#0d6efd'), marginTop: 16 }}>
                  {uploading ? 'Uploading...' : 'Upload Signature'}
                </button>
              </>
            )}

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </div>

          {/* Reporting chain — only shown when relevant */}
          {(profile?.sectionHead || profile?.departmentHead) && (
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, gridColumn: '1 / -1' }}>
              <h2 style={{ marginTop: 0 }}>Reporting Chain</h2>
              <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
                Who your leave requests are routed to.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                {profile.sectionHead && (
                  <HeadCard
                    title="Section Head"
                    name={profile.sectionHead.fullName}
                    staffId={profile.sectionHead.staffId}
                    email={profile.sectionHead.email}
                    department={profile.sectionHead.department}
                    color="#6b21a8"
                  />
                )}
                {profile.departmentHead && (
                  <HeadCard
                    title="Department Head"
                    name={profile.departmentHead.fullName}
                    staffId={profile.departmentHead.staffId}
                    email={profile.departmentHead.email}
                    department={profile.departmentHead.department}
                    color="#9d174d"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ width: 140, fontWeight: 600, color: '#555' }}>{label}</div>
      <div style={{ color: '#0b2e6f', textTransform: capitalize ? 'capitalize' : 'none' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function HeadCard({ title, name, staffId, email, department, color }) {
  return (
    <div style={{
      padding: 16, borderRadius: 12, background: '#f8fbff',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#0b2e6f', marginTop: 6 }}>{name}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{staffId}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{email}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{department}</div>
    </div>
  );
}

function btnStyle(bg) {
  return {
    padding: '10px 20px', background: bg, color: 'white',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 600, fontSize: 14,
  };
}

export default ProfilePage;