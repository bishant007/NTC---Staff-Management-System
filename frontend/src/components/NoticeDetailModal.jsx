import React, { useEffect, useState } from 'react';
import { getSignatureByFilename } from '../services/authService';

const parseSnapshot = (str) => {
  const out = {};
  if (!str) return out;
  str.split('\n').forEach(line => {
    if (!line.trim()) return;
    const i = line.indexOf('=');
    if (i === -1) return;
    out[line.substring(0, i)] = line.substring(i + 1);
  });
  return out;
};

const humanize = (k) => {
  const s = k.replace(/([a-z])([A-Z])/g, '$1 $2');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function NoticeDetailModal({ notice, onClose, onDownloadPdf }) {
  const [sigs, setSigs] = useState({ staff: null, sh: null, oi: null });

  useEffect(() => {
    (async () => {
      if (notice.staffSignatureImage) {
        try {
          const url = await getSignatureByFilename(notice.staffSignatureImage);
          setSigs(p => ({ ...p, staff: url }));
        } catch {}
      }
      if (notice.sectionHeadSignatureImage) {
        try {
          const url = await getSignatureByFilename(notice.sectionHeadSignatureImage);
          setSigs(p => ({ ...p, sh: url }));
        } catch {}
      }
      if (notice.officeInchargeSignatureImage) {
        try {
          const url = await getSignatureByFilename(notice.officeInchargeSignatureImage);
          setSigs(p => ({ ...p, oi: url }));
        } catch {}
      }
    })();
  }, [notice]);

  const fmt = (v) => v ? new Date(v).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—';

  const staffSnap = parseSnapshot(notice.staffSnapshot);
  const shSnap = parseSnapshot(notice.sectionHeadSnapshot);
  const oiSnap = parseSnapshot(notice.officeInchargeSnapshot);
  const leaveSnap = parseSnapshot(notice.leaveSummary);

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => onDownloadPdf && onDownloadPdf(notice)} style={btnPrimary}>
            📄 Download PDF
          </button>
          <button onClick={onClose} style={btnSecondary}>✕ Close</button>
        </div>

        <div style={{ background: '#fff', padding: '36px 44px', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Letterhead */}
          <div style={{ borderBottom: '2px solid #0b2e6f', paddingBottom: 12, marginBottom: 22, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 22, color: '#0b2e6f', letterSpacing: 2 }}>NEPAL TELECOM</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Leave Approval Notice</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            <div><b>Reference No.:</b> {notice.referenceNumber}</div>
            <div><b>Decision Date:</b> {fmt(notice.decisionDate)}</div>
          </div>

          <div style={{
            display: 'inline-block', padding: '6px 14px', marginBottom: 20,
            background: '#d1fae5', color: '#065f46',
            fontWeight: 700, fontSize: 12, borderRadius: 20, letterSpacing: 1,
          }}>
            {notice.noticeType?.replace(/_/g, ' ')} · {notice.finalDecisionByRole}
          </div>

          <SnapSection title="STAFF DETAILS" data={staffSnap} />
          <SnapSection title="SECTION HEAD" data={shSnap} />
          <SnapSection title="OFFICE IN-CHARGE" data={oiSnap} />
          <SnapSection title="LEAVE SUMMARY" data={leaveSnap} />

          <div style={{ marginTop: 22 }}>
            <SectionTitle>Decision Remarks</SectionTitle>
            <p style={{ fontSize: 13, color: '#334155', margin: '6px 0 0' }}>
              {notice.decisionRemarks || '—'}
            </p>
          </div>

          <SectionTitle style={{ marginTop: 26 }}>Signatures</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 8 }}>
            <SigBox label="Applicant" name={staffSnap.fullName} sigUrl={sigs.staff} typed={notice.staffSignature} />
            <SigBox label="Section Head" name={shSnap.fullName} sigUrl={sigs.sh} typed={notice.sectionHeadSignature} />
            <SigBox label="Office In-Charge" name={oiSnap.fullName} sigUrl={sigs.oi} typed={notice.officeInchargeSignature} />
          </div>

          <div style={{ marginTop: 26, paddingTop: 12, borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
            This is a system-generated document. Verify at the NTC Staff Portal.
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapSection({ title, data }) {
  const keys = Object.keys(data);
  if (keys.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginTop: 8 }}>
        {keys.map(k => (
          <div key={k} style={{ display: 'flex', fontSize: 13, padding: '4px 0' }}>
            <div style={{ width: 110, color: '#64748b', fontWeight: 600 }}>{humanize(k)}</div>
            <div style={{ flex: 1, color: '#0f172a' }}>{data[k] || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: '#0b2e6f',
      letterSpacing: 1, borderBottom: '1px solid #cbd5e1',
      paddingBottom: 4, ...style,
    }}>{children}</div>
  );
}

function SigBox({ label, name, sigUrl, typed }) {
  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, minHeight: 110 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      {sigUrl ? (
        <img src={sigUrl} alt={label} style={{ maxHeight: 55, maxWidth: '100%', marginBottom: 6 }} />
      ) : (
        <div style={{ fontSize: 13, fontStyle: 'italic', color: '#0b2e6f', minHeight: 55 }}>
          {typed || '—'}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{name || '—'}</div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
  zIndex: 9999, overflowY: 'auto', padding: '30px 20px',
};
const btnPrimary = {
  padding: '10px 22px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
};
const btnSecondary = {
  padding: '10px 22px', background: '#fff', color: '#0f172a',
  border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
};