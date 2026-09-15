import React, { useEffect, useState } from 'react';
import { getSignatureBlob } from '../services/authService';

export default function RequestDetail({ request, viewerRole, children }) {
  const [shSigUrl, setShSigUrl] = useState(null);
  const [dhSigUrl, setDhSigUrl] = useState(null);

  useEffect(() => {
    (async () => {
      if (request.sectionHeadStaffId) {
        try { setShSigUrl(await getSignatureBlob(request.sectionHeadStaffId)); } catch {}
      }
      if (request.departmentHeadStaffId) {
        try { setDhSigUrl(await getSignatureBlob(request.departmentHeadStaffId)); } catch {}
      }
    })();
  }, [request.sectionHeadStaffId, request.departmentHeadStaffId]);

  const fmt = (v) => v ? new Date(v).toLocaleString() : '—';

  return (
    <div style={{
      background: '#fff', padding: 20, borderRadius: 12, marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #0d6efd'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, color: '#0b2e6f' }}>
          {request.leaveType?.replace(/_/g, ' ')}
        </h3>
        <span style={statusPill(request.status)}>{request.status?.replace(/_/g, ' ')}</span>
      </div>

      <div style={{ marginTop: 12, fontSize: 14, color: '#333', lineHeight: 1.7 }}>
        <div><strong>Staff:</strong> {request.staffName} <span style={{ color: '#888' }}>({request.staffId})</span></div>
        <div><strong>Email:</strong> {request.staffEmail}</div>
        <div><strong>Department:</strong> {request.staffDepartment} · <strong>Branch:</strong> {request.staffBranch}</div>
        <div style={{ marginTop: 8 }}><strong>Reason:</strong> {request.reason}</div>
        <div><strong>Start:</strong> {fmt(request.leaveStartTime)}</div>
        <div><strong>Return:</strong> {fmt(request.returnDateTime)}</div>
        <div><strong>Submitted:</strong> {fmt(request.createdAt)}</div>
      </div>

      {/* Section Head approval block — shown to dept head + on history views */}
      {request.sectionHeadApprovedAt && (
        <div style={{
          marginTop: 16, padding: 14, background: '#f4f8ff',
          borderRadius: 10, borderLeft: '3px solid #16a34a'
        }}>
          <div style={{ fontWeight: 700, color: '#0b2e6f', marginBottom: 6 }}>
            Section Head Approval
          </div>
          <div style={{ fontSize: 14 }}>
            <div><strong>By:</strong> {request.sectionHeadName} <span style={{ color: '#888' }}>({request.sectionHeadStaffId})</span></div>
            <div><strong>Signed as:</strong> <em>{request.sectionHeadSignature || '—'}</em></div>
            <div><strong>When:</strong> {fmt(request.sectionHeadApprovedAt)}</div>
            {request.sectionHeadNotes && (
              <div><strong>Notes:</strong> {request.sectionHeadNotes}</div>
            )}
            {shSigUrl && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Signature:</div>
                <img src={shSigUrl} alt="SH signature" style={{ maxHeight: 60, marginTop: 4 }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dept Head approval block */}
      {request.departmentHeadApprovedAt && (
        <div style={{
          marginTop: 12, padding: 14, background: '#f0fdf4',
          borderRadius: 10, borderLeft: '3px solid #16a34a'
        }}>
          <div style={{ fontWeight: 700, color: '#0b2e6f', marginBottom: 6 }}>
            Department Head Approval
          </div>
          <div style={{ fontSize: 14 }}>
            <div><strong>By:</strong> {request.departmentHeadName} <span style={{ color: '#888' }}>({request.departmentHeadStaffId})</span></div>
            <div><strong>Signed as:</strong> <em>{request.departmentHeadSignature || '—'}</em></div>
            <div><strong>When:</strong> {fmt(request.departmentHeadApprovedAt)}</div>
            {request.departmentHeadNotes && (
              <div><strong>Notes:</strong> {request.departmentHeadNotes}</div>
            )}
            {dhSigUrl && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Signature:</div>
                <img src={dhSigUrl} alt="DH signature" style={{ maxHeight: 60, marginTop: 4 }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection reason */}
      {request.rejectionReason && (
        <div style={{
          marginTop: 12, padding: 14, background: '#fef2f2',
          borderRadius: 10, borderLeft: '3px solid #dc3545'
        }}>
          <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>Rejection Reason</div>
          <div style={{ fontSize: 14 }}>{request.rejectionReason}</div>
        </div>
      )}

      {children}
    </div>
  );
}

function statusPill(status) {
  const colors = {
    PENDING_SECTION_HEAD:   { bg: '#fef3c7', fg: '#92400e' },
    PENDING_DEPARTMENT_HEAD:{ bg: '#dbeafe', fg: '#1e40af' },
    APPROVED:               { bg: '#d1fae5', fg: '#065f46' },
    REJECTED:               { bg: '#fee2e2', fg: '#991b1b' },
    ON_HOLD:                { bg: '#e5e7eb', fg: '#374151' },
  };
  const c = colors[status] || colors.ON_HOLD;
  return {
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: c.bg, color: c.fg, whiteSpace: 'nowrap',
  };
}