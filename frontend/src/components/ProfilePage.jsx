import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
  getMyProfile, uploadMySignature, deleteMySignature, getSignatureBlob
} from '../services/authService';

function ProfilePage() {
  const { user } = useAuth();
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
    if (!window.confirm('Delete your signature? You will not be able to submit or approve requests until a new one is uploaded.')) return;
    try {
      await deleteMySignature();
      setMessage('✅ Signature removed');
      await load();
    } catch { setMessage('❌ Delete failed'); }
  };

  if (loading) return <div style={{ marginLeft: 250, padding: 30 }}>Loading...</div>;

  const initials = profile?.fullName?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'U';
  const roleLabel = profile?.role?.replace('_', ' ') || '—';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>

        {/* HERO */}
        <div style={hero}>
          <div style={avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>{profile.fullName}</h1>
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 14, marginTop: 4 }}>
              {profile.staffId} · {profile.email}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <HeroBadge label={roleLabel} />
              {profile.department && <HeroBadge label={profile.department} />}
              {profile.branch && <HeroBadge label={profile.branch} />}
              <HeroBadge
                label={profile.hasSignature ? '✍ Signature on file' : '⚠ No signature'}
                alt={profile.hasSignature ? 'success' : 'warn'}
              />
            </div>
          </div>
        </div>

        {message && (
          <p style={{
            fontWeight: 600, marginBottom: 16, padding: 12, borderRadius: 10,
            background: message.startsWith('✅') ? '#dcfce7' : '#fee2e2',
            color: message.startsWith('✅') ? '#166534' : '#991b1b',
          }}>{message}</p>
        )}

        {/* CONTENT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22 }}>
          <Card title="Personal Information" icon="👤">
            <InfoRow icon="🆔" label="Staff ID" value={profile.staffId} />
            <InfoRow icon="✉" label="Email" value={profile.email} />
            <InfoRow icon="☎" label="Phone" value={profile.phone} />
            <InfoRow icon="🏢" label="Department" value={profile.department} />
            <InfoRow icon="📍" label="Branch" value={profile.branch} />
            <InfoRow icon="🎯" label="Role" value={roleLabel} />
          </Card>

          <Card title="Digital Signature" icon="✍"
            accent={profile.hasSignature ? '#16a34a' : '#f59e0b'}>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 0, lineHeight: 1.6 }}>
              Your signature is used to authorize every leave request you submit
              and will appear on all printed approval records.
            </p>

            {sigUrl ? (
              <>
                <div style={sigPreview}>
                  <img src={sigUrl} alt="signature"
                    style={{ maxHeight: 110, maxWidth: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={btnPrimary}>
                    {uploading ? 'Uploading...' : 'Replace'}
                  </button>
                  <button onClick={handleDelete} style={btnDanger}>Remove</button>
                </div>
              </>
            ) : (
              <>
                <div style={sigEmpty}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>✍️</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>No signature uploaded yet</div>
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ ...btnPrimary, width: '100%', marginTop: 12 }}>
                  {uploading ? 'Uploading...' : 'Upload Signature'}
                </button>
              </>
            )}

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />

            <div style={{
              marginTop: 14, padding: 10, borderRadius: 8,
              background: profile.hasSignature ? '#f0fdf4' : '#fef3c7',
              color: profile.hasSignature ? '#166534' : '#92400e',
              fontSize: 12, fontWeight: 600,
            }}>
              {profile.hasSignature
                ? '✓ Verified — required for all actions'
                : '⚠ Required before submitting or approving requests'}
            </div>
          </Card>
        </div>

        {/* REPORTING CHAIN */}
        {(profile.sectionHead || profile.departmentHead) && (
          <Card title="Reporting Chain" icon="🔗" style={{ marginTop: 22 }}>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
              Who your leave requests are routed to for approval.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  title="Office In-Charge"
                  name={profile.departmentHead.fullName}
                  staffId={profile.departmentHead.staffId}
                  email={profile.departmentHead.email}
                  department={profile.departmentHead.department}
                  color="#9d174d"
                />
              )}
            </div>
          </Card>
        )}

        {/* SESSION */}
        <Card title="Session & Security" icon="🔒" style={{ marginTop: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <InfoRow icon="🎫" label="Session Type" value="JWT (24-hour expiry)" />
            <InfoRow icon="🔐" label="Password" value="Change via Settings" />
            <InfoRow icon="✍" label="Signature Uploaded"
              value={profile.hasSignature ? 'Yes' : 'No'} />
            <InfoRow icon="🎭" label="Access Level" value={roleLabel} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon, children, accent, style }) {
  return (
    <div style={{
      background: '#fff', padding: 24, borderRadius: 18,
      boxShadow: '0 6px 20px rgba(0,0,0,.05)',
      borderTop: accent ? `4px solid ${accent}` : 'none',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ margin: 0, color: '#0b2e6f', fontSize: 17 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#f0f5ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#0d6efd',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.3 }}>
          {label}
        </div>
        <div style={{
          fontSize: 14, color: '#0b2e6f', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value || '—'}</div>
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
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0b2e6f', marginTop: 8 }}>{name}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontFamily: 'monospace' }}>{staffId}</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{email}</div>
      {department && <div style={{ fontSize: 12, color: '#64748b' }}>{department}</div>}
    </div>
  );
}

function HeroBadge({ label, alt }) {
  const bg = alt === 'success' ? 'rgba(22,163,74,.35)'
    : alt === 'warn' ? 'rgba(245,158,11,.35)'
    : 'rgba(255,255,255,.2)';
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '5px 12px',
      borderRadius: 20, color: '#fff', background: bg,
      border: '1px solid rgba(255,255,255,.2)', letterSpacing: 0.3,
    }}>{label}</span>
  );
}

const hero = {
  background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
  borderRadius: 20, padding: '28px 32px', color: 'white',
  display: 'flex', alignItems: 'center', gap: 20,
  marginBottom: 24, boxShadow: '0 20px 40px rgba(13,110,253,.22)',
};
const avatar = {
  width: 78, height: 78, borderRadius: 20,
  background: 'rgba(255,255,255,.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: 1,
  flexShrink: 0, border: '2px solid rgba(255,255,255,.25)',
};
const sigPreview = {
  border: '2px dashed #cfe0fc', borderRadius: 12, padding: 20,
  textAlign: 'center', background: '#f8fbff', marginTop: 12,
};
const sigEmpty = {
  border: '2px dashed #cfe0fc', borderRadius: 12, padding: 30,
  textAlign: 'center', background: '#f8fbff', marginTop: 12,
};
const btnPrimary = {
  padding: '10px 22px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontWeight: 700, fontSize: 13,
};
const btnDanger = {
  padding: '10px 22px', background: '#dc3545', color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontWeight: 700, fontSize: 13,
};

export default ProfilePage;