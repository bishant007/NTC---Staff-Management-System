import React, { useEffect, useState } from 'react';
import { getSignatureByFilename } from '../services/authService';

export default function PrintableRequest({ request, onClose }) {
  const [shSig, setShSig] = useState(null);
  const [oiSig, setOiSig] = useState(null);
  const [staffSig, setStaffSig] = useState(null);

  useEffect(() => {
    (async () => {
      if (request.staffSignatureImage)
        try { setStaffSig(await getSignatureByFilename(request.staffSignatureImage)); } catch {}
      if (request.sectionHeadSignatureImage)
        try { setShSig(await getSignatureByFilename(request.sectionHeadSignatureImage)); } catch {}
      if (request.officeInchargeSignatureImage)
        try { setOiSig(await getSignatureByFilename(request.officeInchargeSignatureImage)); } catch {}
    })();
  }, [request]);

  const fmt = (v) => v ? new Date(v).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—';

  const handlePrint = () => window.print();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 9999, overflowY: 'auto', padding: '30px 0'
    }}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute !important; left: 0 !important; top: 0 !important;
                        width: 100% !important; box-shadow: none !important;
                        border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 820 }}>
        {/* Toolbar */}
        <div className="no-print" style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 12
        }}>
          <button onClick={handlePrint} style={btnPrimary}>🖨️ Print / Save as PDF</button>
          <button onClick={onClose} style={btnSecondary}>✕ Close</button>
        </div>

        {/* Printable Document */}
        <div id="print-area" style={{
          background: '#fff', padding: '40px 50px', color: '#000',
          fontFamily: "'Segoe UI', Arial, sans-serif", boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Letterhead */}
          <div style={{ borderBottom: '2px solid #0b2e6f', paddingBottom: 14, marginBottom: 24, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 24, color: '#0b2e6f', letterSpacing: 2 }}>
              NEPAL TELECOM
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555' }}>
              Leave Application & Approval Record
            </p>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 20 }}>
            <div><strong>Reference No:</strong> LR-{String(request.id).padStart(6, '0')}</div>
            <div><strong>Generated:</strong> {fmt(new Date().toISOString())}</div>
          </div>

          {/* Status Banner */}
          <div style={{
            display: 'inline-block', padding: '6px 16px', marginBottom: 24,
            background: request.status === 'APPROVED' ? '#d1fae5'
              : request.status === 'REJECTED' ? '#fee2e2'
              : request.status === 'CANCELLED' ? '#e5e7eb' : '#fef3c7',
            color: request.status === 'APPROVED' ? '#065f46'
              : request.status === 'REJECTED' ? '#991b1b'
              : request.status === 'CANCELLED' ? '#374151' : '#92400e',
            fontWeight: 700, fontSize: 12, borderRadius: 20,
            letterSpacing: 1, textTransform: 'uppercase'
          }}>
            {request.status.replace(/_/g, ' ')}
          </div>

          {/* Section I — Applicant */}
          <Section title="I. APPLICANT DETAILS">
            <Row label="Full Name" value={request.staffName} />
            <Row label="Staff ID" value={request.staffId} />
            <Row label="Email" value={request.staffEmail} />
            <Row label="Department" value={request.staffDepartment} />
            <Row label="Branch" value={request.staffBranch} />
          </Section>

          {/* Section II — Leave Details */}
          <Section title="II. LEAVE DETAILS">
            <Row label="Leave Type" value={request.leaveType?.replace(/_/g, ' ')} />
            <Row label="Start Date & Time" value={fmt(request.leaveStartTime)} />
            <Row label="Expected Return" value={fmt(request.returnDateTime)} />
            <Row label="Reason" value={request.reason} multiline />
          </Section>

          {/* Section III — Applicant Signature */}
          <Section title="III. APPLICANT DECLARATION">
            <p style={{ fontSize: 13, color: '#333', margin: '0 0 12px', lineHeight: 1.6 }}>
              I hereby declare that the information provided above is true and correct
              to the best of my knowledge, and I formally request the above leave.
            </p>
            <SignatureBlock
              name={request.staffName}
              staffId={request.staffId}
              when={request.createdAt}
              sigUrl={staffSig}
              roleLabel="Applicant"
            />
          </Section>

          {/* Section IV — Section Head Referral */}
          {request.sectionHeadApprovedAt && (
            <Section title="IV. SECTION HEAD REFERRAL">
              <p style={{ fontSize: 13, color: '#333', margin: '0 0 12px', lineHeight: 1.6 }}>
                {request.status === 'REJECTED' && !request.officeInchargeApprovedAt
                  ? 'Rejected at Section Head level.'
                  : 'Reviewed and referred to Office In-Charge for final decision.'}
              </p>
              <SignatureBlock
                name={request.sectionHeadName}
                staffId={request.sectionHeadStaffId}
                when={request.sectionHeadApprovedAt}
                sigUrl={shSig}
                roleLabel="Section Head"
              />
              {request.sectionHeadNotes && (
                <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderLeft: '3px solid #64748b' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>REMARKS:</div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{request.sectionHeadNotes}</div>
                </div>
              )}
            </Section>
          )}

          {/* Section V — Office In-Charge */}
          {request.officeInchargeApprovedAt && (
            <Section title="V. OFFICE IN-CHARGE DECISION">
              <p style={{ fontSize: 13, color: '#333', margin: '0 0 12px', lineHeight: 1.6 }}>
                Final decision by Office In-Charge.
              </p>
              <SignatureBlock
                name={request.officeInchargeName}
                staffId={request.officeInchargeStaffId}
                when={request.officeInchargeApprovedAt}
                sigUrl={oiSig}
                roleLabel="Office In-Charge"
              />
              {request.officeInchargeNotes && (
                <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderLeft: '3px solid #64748b' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>REMARKS:</div>
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{request.officeInchargeNotes}</div>
                </div>
              )}
            </Section>
          )}

          {/* Rejection */}
          {request.rejectionReason && (
            <Section title="REJECTION NOTICE">
              <p style={{ fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.6 }}>
                <strong>Reason:</strong> {request.rejectionReason}
              </p>
            </Section>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 40, paddingTop: 12, borderTop: '1px solid #cbd5e1',
            fontSize: 10, color: '#94a3b8', textAlign: 'center'
          }}>
            This is a computer-generated document. Digital signatures verify the authenticity of each approval.
            Nepal Telecom · NTC-Staff-System
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: '#0b2e6f',
        letterSpacing: 1, marginBottom: 10,
        borderBottom: '1px solid #cbd5e1', paddingBottom: 4
      }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, multiline }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', fontSize: 13 }}>
      <div style={{ width: 180, fontWeight: 600, color: '#475569' }}>{label}</div>
      <div style={{ flex: 1, color: '#0f172a', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function SignatureBlock({ name, staffId, when, sigUrl, roleLabel }) {
  const fmt = (v) => v ? new Date(v).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—';

  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
      <div style={{ flex: 1, borderBottom: '1px solid #475569', minHeight: 60, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
        {sigUrl
          ? <img src={sigUrl} alt="signature" style={{ maxHeight: 55, maxWidth: '100%' }} />
          : <span style={{ fontSize: 11, color: '#94a3b8' }}>no signature on file</span>}
      </div>
      <div style={{ flex: 1, fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
          {roleLabel}
        </div>
        <div style={{ color: '#334155', marginTop: 2 }}>{name}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>{staffId}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>Signed: {fmt(when)}</div>
      </div>
    </div>
  );
}

const btnPrimary = {
  padding: '10px 22px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
};
const btnSecondary = {
  padding: '10px 22px', background: '#fff', color: '#0f172a',
  border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14
};