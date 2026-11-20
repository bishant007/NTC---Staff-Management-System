import React, { useEffect, useState } from 'react';
import { getSignatureByFilename } from '../services/authService';
import { formatNepalDateTime } from '../utils/date';
import { leaveTypeLabel } from '../utils/leaveTypes';
import PrintableRequest from './PrintableRequest';

export default function RequestDetail({ request, viewerRole, children }) {
  const [shSigUrl, setShSigUrl] = useState(null);
  const [oiSigUrl, setOiSigUrl] = useState(null);
  const [staffSigUrl, setStaffSigUrl] = useState(null);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    (async () => {
      if (request.staffSignatureImage) {
        try { setStaffSigUrl(await getSignatureByFilename(request.staffSignatureImage)); } catch {}
      }
      if (request.sectionHeadSignatureImage) {
        try { setShSigUrl(await getSignatureByFilename(request.sectionHeadSignatureImage)); } catch {}
      }
      if (request.officeInchargeSignatureImage) {
        try { setOiSigUrl(await getSignatureByFilename(request.officeInchargeSignatureImage)); } catch {}
      }
    })();
  }, [request.staffSignatureImage, request.sectionHeadSignatureImage, request.officeInchargeSignatureImage]);

  const fmt = (v) => formatNepalDateTime(v);
  const statusInfo = statusMeta(request.status);
  const leaveTypeText = request.leaveTypeLabel || leaveTypeLabel(request.leaveType);

  return (
    <div style={{
      background: '#fff', borderRadius: 14, marginBottom: 14,
      boxShadow: '0 4px 16px rgba(0,0,0,.06)',
      border: '1px solid #e5edf8', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 20px',
        background: statusInfo.headerBg,
        borderBottom: `1px solid ${statusInfo.headerBorder}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: '#fff', border: `1px solid ${statusInfo.headerBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {iconForLeaveType(request.leaveType)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0b2e6f', fontSize: 15 }}>
              {leaveTypeText}
            </div>
            {request.customLeaveType && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>
                “{request.customLeaveType}”
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
              {request.referenceNumber || `LR-${String(request.id).padStart(6, '0')}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <CategoryBadge category={request.category} />
          <StatusBadge status={request.status} />
          <button onClick={() => setShowPrint(true)} style={{
            padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1',
            borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12,
            color: '#0b2e6f',
          }}>🖨️ Print</button>
        </div>
      </div>

      {request.status === 'ON_HOLD' && (
        <div style={{
          margin: '14px 20px 0', padding: 14,
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, borderLeft: '3px solid #f59e0b',
        }}>
          <div style={{
            fontWeight: 700, color: '#92400e', fontSize: 12,
            letterSpacing: 0.5, marginBottom: 4,
          }}>
            ⏸ ON HOLD — DECISION PENDING
          </div>
          <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            Held by <strong>{request.heldByName || '—'}</strong>
            {request.heldByRole ? ` (${request.heldByRole.replace('_', ' ')})` : ''}
            {request.heldAt ? ` at ${fmt(request.heldAt)}` : ''}.
          </div>
          {request.holdUntil && (
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>
              Decision required by <strong>{fmt(request.holdUntil)}</strong> (NPT).
              If no decision is made, the request will be <strong>automatically rejected</strong>.
            </div>
          )}
          {request.holdReason && (
            <div style={{
              marginTop: 8, fontSize: 12, color: '#78350f',
              fontStyle: 'italic', paddingLeft: 10,
              borderLeft: '2px solid #fcd34d',
            }}>
              Reason: {request.holdReason}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#64748b' }}>Reason:</span>{' '}
            <span style={{ color: '#0f172a' }}>{request.reason}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', background: '#f8fafc',
            border: '1px solid #e5edf8', borderRadius: 10,
            fontSize: 13, color: '#0b2e6f', fontWeight: 600,
          }}>
            <span>📅</span>
            <span>{fmt(request.leaveStartTime)}</span>
            <span style={{ color: '#94a3b8' }}>→</span>
            <span>{fmt(request.returnDateTime)}</span>
            {request.durationDays && (
              <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
                {request.durationDays} day{request.durationDays === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '4px 20px 20px' }}>
        <TimelineRow
          dotColor="#0d6efd"
          title="Applicant"
          name={request.staffName}
          sub={`${request.staffId || ''}${request.staffDepartment ? ' · ' + request.staffDepartment : ''}${request.staffBranch ? ' · ' + request.staffBranch : ''}`}
          when={`Submitted ${fmt(request.createdAt)}`}
          sigUrl={staffSigUrl}
        />

        {request.sectionHeadApprovedAt && (
          <TimelineRow
            dotColor={request.status === 'REJECTED' && !request.officeInchargeApprovedAt ? '#dc3545' : '#16a34a'}
            title="Section Head"
            name={request.sectionHeadName}
            sub={request.sectionHeadStaffId}
            when={`${request.status === 'REJECTED' && !request.officeInchargeApprovedAt ? 'Rejected' : 'Referred'} ${fmt(request.sectionHeadApprovedAt)}`}
            notes={request.sectionHeadNotes}
            sigUrl={shSigUrl}
          />
        )}

        {request.officeInchargeApprovedAt && (
          <TimelineRow
            dotColor={request.status === 'REJECTED' ? '#dc3545' : '#16a34a'}
            title="Office In-Charge"
            name={request.officeInchargeName}
            sub={request.officeInchargeStaffId}
            when={`${request.status === 'REJECTED' ? 'Rejected' : 'Approved'} ${fmt(request.officeInchargeApprovedAt)}`}
            notes={request.officeInchargeNotes}
            sigUrl={oiSigUrl}
          />
        )}

        {request.status?.startsWith('PENDING') && (
          <TimelineRow
            dotColor="#cbd5e1"
            title={nextApproverLabel(request.status)}
            name="Awaiting action"
            sub=""
            when={`Pending ${fmt(request.updatedAt || request.createdAt)}`}
            sigUrl={null}
            muted
          />
        )}

        {request.status === 'ON_HOLD' && (
          <TimelineRow
            dotColor="#f59e0b"
            title="On Hold"
            name={request.heldByName || '—'}
            sub={request.heldByRole?.replace('_', ' ')}
            when={`Held ${fmt(request.heldAt)} · decide by ${fmt(request.holdUntil)}`}
            notes={request.holdReason}
            sigUrl={null}
          />
        )}

        {request.status === 'CANCELLED' && (
          <TimelineRow dotColor="#94a3b8" title="Cancelled" name="Withdrawn by applicant"
            sub="" when={fmt(request.updatedAt || request.createdAt)} sigUrl={null} muted />
        )}
      </div>

      {request.rejectionReason && (
        <div style={{
          margin: '0 20px 20px', padding: 14, background: '#fef2f2',
          borderRadius: 10, borderLeft: '3px solid #dc3545',
        }}>
          <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 4, fontSize: 12, letterSpacing: 0.5 }}>
            REJECTION REASON
          </div>
          <div style={{ fontSize: 13, color: '#7f1d1d' }}>{request.rejectionReason}</div>
        </div>
      )}

      {children}

      {showPrint && <PrintableRequest request={request} onClose={() => setShowPrint(false)} />}
    </div>
  );
}

function TimelineRow({ dotColor, title, name, sub, when, notes, sigUrl, muted }) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingTop: 16, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: dotColor, border: '2px solid #fff',
          boxShadow: `0 0 0 2px ${dotColor}33`, marginTop: 4, zIndex: 1,
        }} />
        <div style={{ flex: 1, width: 2, background: '#e5edf8', marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: muted ? '#94a3b8' : '#64748b',
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
        }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: muted ? '#94a3b8' : '#0b2e6f' }}>
              {name || '—'}
            </div>
            {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{when}</div>
            {notes && (
              <div style={{
                marginTop: 6, padding: '6px 10px', background: '#f8fafc',
                borderLeft: '2px solid #cbd5e1', borderRadius: 4,
                fontSize: 12, color: '#334155', fontStyle: 'italic',
              }}>
                "{notes}"
              </div>
            )}
          </div>
          {sigUrl && (
            <div style={{
              border: '1px dashed #cbd5e1', borderRadius: 8,
              padding: 6, background: '#fff', flexShrink: 0,
            }}>
              <img src={sigUrl} alt="signature"
                style={{ maxHeight: 38, maxWidth: 100, display: 'block' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  if (!category) return null;
  const isOffice = category === 'OFFICE_WORK';
  return (
    <span style={{
      padding: '5px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
      background: isOffice ? '#dbeafe' : '#ede9fe',
      color: isOffice ? '#1e40af' : '#6b21a8',
      letterSpacing: 0.5, whiteSpace: 'nowrap',
    }}>
      {isOffice ? '💼 OFFICE WORK' : '🏖️ PERSONAL'}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = {
    PENDING_SECTION_HEAD:    { bg: '#fef3c7', fg: '#92400e', label: 'PENDING · SECTION HEAD' },
    PENDING_OFFICE_INCHARGE: { bg: '#dbeafe', fg: '#1e40af', label: 'PENDING · OFFICE IN-CHARGE' },
    PENDING_SELF_APPROVAL:   { bg: '#e0e7ff', fg: '#3730a3', label: 'PENDING · SELF' },
    ON_HOLD:                 { bg: '#fef3c7', fg: '#92400e', label: '⏸ ON HOLD' },
    APPROVED:                { bg: '#d1fae5', fg: '#065f46', label: 'APPROVED' },
    REJECTED:                { bg: '#fee2e2', fg: '#991b1b', label: 'REJECTED' },
    CANCELLED:               { bg: '#e5e7eb', fg: '#374151', label: 'CANCELLED' },
  };
  const c = m[status] || { bg: '#f1f5f9', fg: '#475569', label: status || '—' };
  return (
    <span style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800,
      background: c.bg, color: c.fg, letterSpacing: 0.5, whiteSpace: 'nowrap',
    }}>{c.label}</span>
  );
}

function statusMeta(status) {
  if (status === 'APPROVED') return { headerBg: '#f0fdf4', headerBorder: '#bbf7d0' };
  if (status === 'REJECTED') return { headerBg: '#fef2f2', headerBorder: '#fecaca' };
  if (status === 'CANCELLED') return { headerBg: '#f8fafc', headerBorder: '#e2e8f0' };
  if (status === 'PENDING_SECTION_HEAD') return { headerBg: '#fffbeb', headerBorder: '#fde68a' };
  if (status === 'PENDING_OFFICE_INCHARGE') return { headerBg: '#eff6ff', headerBorder: '#bfdbfe' };
  if (status === 'PENDING_SELF_APPROVAL') return { headerBg: '#eef2ff', headerBorder: '#c7d2fe' };
  if (status === 'ON_HOLD') return { headerBg: '#fffbeb', headerBorder: '#fde68a' };
  return { headerBg: '#f8fafc', headerBorder: '#e2e8f0' };
}

function iconForLeaveType(type) {
  const m = {
    FULL_DAY: '🗓️', HALF_DAY: '⏱️', AFTER_HOUR: '🌆',
    MULTI_DAY: '📆', SICK: '🤒', CASUAL: '☕', EMERGENCY: '🚨',
    PERSONAL_OTHER: '✍️',
    FIELD_VISIT: '🚗', OFFICIAL_MEETING: '🤝',
    TRAINING: '🎓', CLIENT_VISIT: '👥', OFFICE_OTHER: '✍️',
  };
  return m[type] || '📋';
}

function nextApproverLabel(status) {
  if (status === 'PENDING_SECTION_HEAD') return 'Section Head';
  if (status === 'PENDING_OFFICE_INCHARGE') return 'Office In-Charge';
  if (status === 'PENDING_SELF_APPROVAL') return 'Self Approval';
  return 'Next';
}