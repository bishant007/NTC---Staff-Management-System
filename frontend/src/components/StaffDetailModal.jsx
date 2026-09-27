import React, { useEffect, useState } from 'react';
import { getSignatureBlob } from '../services/authService';

export default function StaffDetailModal({ staff, onClose }) {
  const [sigUrl, setSigUrl] = useState(null);
  const [sigLoading, setSigLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!staff?.hasSignature) { setSigLoading(false); return; }
      try {
        const url = await getSignatureBlob(staff.staffId);
        setSigUrl(url);
      } catch { setSigUrl(null); }
      finally { setSigLoading(false); }
    })();
  }, [staff]);

  const initials = staff?.fullName?.split(' ').map(s => s[0]).slice(0, 2).join('') || 'U';
  const roleLabel = staff?.role?.replace('_', ' ') || '—';

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={card}>
        {/* HERO */}
        <div style={hero}>
          <div style={avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>{staff.fullName}</h2>
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, marginTop: 4 }}>
              {staff.staffId} · {staff.email}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Badge label={roleLabel} color="rgba(255,255,255,.2)" />
              {staff.department && <Badge label={staff.department} color="rgba(255,255,255,.2)" />}
              {staff.branch && <Badge label={staff.branch} color="rgba(255,255,255,.2)" />}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {/* CONTACT + ORG */}
        <div style={{ padding: '20px 24px' }}>
          <SectionTitle>Contact Information</SectionTitle>
          <div style={grid2}>
            <InfoRow icon="✉" label="Email" value={staff.email} />
            <InfoRow icon="☎" label="Phone" value={staff.phone} />
            <InfoRow icon="🏢" label="Department" value={staff.department} />
            <InfoRow icon="📍" label="Branch" value={staff.branch} />
          </div>

          <SectionTitle style={{ marginTop: 22 }}>Reporting Chain</SectionTitle>
          <div style={grid2}>
            <InfoRow icon="👔" label="Section Head" value={staff.sectionHeadName || '—'} />
            <InfoRow icon="🏛" label="Office In-Charge" value={staff.officeInchargeName || '—'} />
          </div>

          <SectionTitle style={{ marginTop: 22 }}>Digital Signature</SectionTitle>
          <div style={{
            border: '2px dashed #cfe0fc', borderRadius: 12,
            padding: 16, background: '#f8fbff', textAlign: 'center',
          }}>
            {sigLoading ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading signature…</div>
            ) : sigUrl ? (
              <img src={sigUrl} alt="signature"
                style={{ maxHeight: 90, maxWidth: '100%' }} />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '14px 0' }}>
                No signature on file
              </div>
            )}
          </div>
          {staff.hasSignature ? (
            <div style={{ marginTop: 10, fontSize: 12, color: '#166534', fontWeight: 600 }}>
              ✓ Signature verified on file
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              ⚠️ User cannot submit/approve until signature is uploaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: '#0b2e6f',
      letterSpacing: 1.2, textTransform: 'uppercase',
      marginBottom: 12, ...style,
    }}>{children}</div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', background: '#f8fafc',
      borderRadius: 10, border: '1px solid #e5edf8',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, border: '1px solid #e5edf8',
      }}>{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{
          fontSize: 13.5, color: '#0b2e6f', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '4px 10px',
      borderRadius: 20, color: '#fff', background: color,
      letterSpacing: 0.3,
    }}>{label}</span>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 9999, padding: 20, overflowY: 'auto',
};
const card = {
  background: '#fff', borderRadius: 18, width: 620,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 80px rgba(0,0,0,0.35)',
};
const hero = {
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '22px 24px',
  background: 'linear-gradient(135deg,#0b2e6f,#0d6efd)',
  position: 'relative',
};
const avatar = {
  width: 62, height: 62, borderRadius: 16,
  background: 'rgba(255,255,255,.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: 1,
  flexShrink: 0,
};
const closeBtn = {
  position: 'absolute', top: 14, right: 16,
  background: 'rgba(255,255,255,.15)', border: 'none',
  color: '#fff', fontSize: 20, cursor: 'pointer',
  width: 32, height: 32, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1,
};
const grid2 = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
};