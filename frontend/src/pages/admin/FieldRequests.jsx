import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import RequestDetail from '../../components/RequestDetail';
import StaffLeaveStatsTable from '../../components/StaffLeaveStatsTable';
import {
  getLeaveRequests, getNoticeByRequest, getSignatureBase64
} from '../../services/authService';
import { downloadNoticePdf } from '../../utils/noticePdf';
import { downloadLeaveLedgerPdf } from '../../utils/reportPdf';
import { formatNepalDateTime } from '../../utils/date';
import { leaveTypeLabel } from '../../utils/leaveTypes';

function FieldRequests() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async (status) => {
    setLoading(true);
    try {
      const res = await getLeaveRequests(status || undefined);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialStatus = searchParams.get('status') || '';
    setFilter(initialStatus);
    setCategoryFilter(searchParams.get('category') || '');
    load(initialStatus || undefined);
    /* eslint-disable-next-line */
  }, []);

  const downloadPdf = async (reqId) => {
    setBusy(reqId);
    try {
      const res = await getNoticeByRequest(reqId);
      const notice = res.data;
      const [s, sh, oi] = await Promise.all([
        notice.staffSignatureImage ? getSignatureBase64(notice.staffSignatureImage).catch(() => null) : null,
        notice.sectionHeadSignatureImage ? getSignatureBase64(notice.sectionHeadSignatureImage).catch(() => null) : null,
        notice.officeInchargeSignatureImage ? getSignatureBase64(notice.officeInchargeSignatureImage).catch(() => null) : null,
      ]);
      downloadNoticePdf(notice, { staff: s, sh, oi });
    } catch {
      alert('Notice not available for this request yet.');
    } finally {
      setBusy(null);
    }
  };

  const filtered = requests.filter(r => {
    if (categoryFilter && (r.category || 'PERSONAL') !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${r.staffName || ''} ${r.staffId || ''} ${r.referenceNumber || ''}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const exportBulkPdf = () => {
    if (filtered.length === 0) {
      alert('No requests to export.');
      return;
    }
    downloadLeaveLedgerPdf(filtered, {
      statusFilter: filter || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      search: search || null,
      categoryFilter: categoryFilter || null,
    });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: '30px' }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Leave Requests</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Read-only monitoring view. Approvals are handled by Section Heads and the Office In-Charge.
        </p>

        {message && <p style={{ color: '#dc3545' }}>{message}</p>}

        <StaffLeaveStatsTable
          requests={requests}
          loading={loading}
          title="Leave Request History — All Staff"
          note="Per-staff totals across every account. Respects the status filter above."
        />

        <div style={{
          background: '#fff', padding: 16, borderRadius: 12,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
          marginTop: 18, marginBottom: 18
        }}>
          <input placeholder="Search staff / ref / name"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, minWidth: 220 }} />

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={inp}>
            <option value="">All categories</option>
            <option value="OFFICE_WORK">💼 Office Work</option>
            <option value="PERSONAL">🏖️ Personal</option>
          </select>

          <select value={filter} onChange={e => { setFilter(e.target.value); load(e.target.value); }} style={inp}>
            <option value="">All statuses</option>
            <option value="PENDING_SECTION_HEAD">Pending Section Head</option>
            <option value="PENDING_OFFICE_INCHARGE">Pending Office Incharge</option>
            <option value="PENDING_SELF_APPROVAL">Pending Self Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>From</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>To</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />
          </div>

          {(search || dateFrom || dateTo || filter || categoryFilter) && (
            <button onClick={() => {
              setSearch(''); setDateFrom(''); setDateTo(''); setFilter('');
              setCategoryFilter(''); load('');
            }}
              style={{
                padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#334155',
              }}>Clear</button>
          )}

          <button
            onClick={exportBulkPdf}
            disabled={filtered.length === 0}
            title="Download all filtered requests as a PDF report"
            style={{
              marginLeft: 'auto',
              padding: '9px 18px',
              background: filtered.length === 0 ? '#a9c6f5' : '#0d6efd',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
            }}>
            📄 Export Filtered ({filtered.length})
          </button>
        </div>

        {loading ? <p>Loading...</p> :
          filtered.length === 0 ? (
            <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', color: '#888' }}>
              No requests match your filters.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={th}>Ref No.</th>
                    <th style={th}>Staff</th>
                    <th style={th}>Category</th>
                    <th style={th}>Type</th>
                    <th style={th}>From</th>
                    <th style={th}>Until</th>
                    <th style={th}>Status</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(req => (
                    <tr key={req.id}
                      onClick={() => setSelected(req)}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                      <td style={{ ...td, fontSize: 12, color: '#0d6efd', fontWeight: 700 }}>
                        {req.referenceNumber || '—'}
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{req.staffName || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{req.staffId}</div>
                      </td>
                      <td style={td}>
                        <CategoryPill category={req.category} />
                      </td>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>
                          {req.leaveTypeLabel || leaveTypeLabel(req.leaveType)}
                        </div>
                        {req.customLeaveType && (
                          <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                            {req.customLeaveType}
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, fontSize: 13 }}>{formatNepalDateTime(req.leaveStartTime)}</td>
                      <td style={{ ...td, fontSize: 13 }}>{formatNepalDateTime(req.returnDateTime)}</td>
                      <td style={td}><StatusPill status={req.status} /></td>
                      <td style={td} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(req)} style={{ ...actionBtn, background: '#f1f5f9', color: '#0b2e6f', marginRight: 6 }}>
                          View
                        </button>
                        {(req.status === 'APPROVED' || req.status === 'REJECTED') && (
                          <button onClick={() => downloadPdf(req.id)} disabled={busy === req.id} style={actionBtn}>
                            {busy === req.id ? '...' : '📄 PDF'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        {selected && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            zIndex: 9999, overflowY: 'auto', padding: '40px 20px',
          }} onClick={() => setSelected(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button onClick={() => setSelected(null)} style={{
                  padding: '10px 20px', background: '#fff', color: '#0f172a',
                  border: '1px solid #cbd5e1', borderRadius: 8,
                  fontWeight: 700, cursor: 'pointer',
                }}>✕ Close</button>
              </div>
              <RequestDetail request={selected} viewerRole="admin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPill({ category }) {
  const isOffice = (category || 'PERSONAL') === 'OFFICE_WORK';
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isOffice ? '#dbeafe' : '#ede9fe',
      color: isOffice ? '#1e40af' : '#6b21a8',
      whiteSpace: 'nowrap',
    }}>{isOffice ? '💼 OFFICE' : '🏖️ PERSONAL'}</span>
  );
}

function StatusPill({ status }) {
  const m = {
    PENDING_SECTION_HEAD:    { bg: '#fef3c7', fg: '#92400e' },
    PENDING_OFFICE_INCHARGE: { bg: '#dbeafe', fg: '#1e40af' },
    PENDING_SELF_APPROVAL:   { bg: '#e0e7ff', fg: '#3730a3' },
    APPROVED:                { bg: '#d1fae5', fg: '#065f46' },
    REJECTED:                { bg: '#fee2e2', fg: '#991b1b' },
    CANCELLED:               { bg: '#e5e7eb', fg: '#374151' },
    ON_HOLD:                 { bg: '#fef3c7', fg: '#92400e' },
  };
  const c = m[status] || m.ON_HOLD;
  return <span style={{
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: c.bg, color: c.fg, whiteSpace: 'nowrap',
  }}>{status?.replace(/_/g, ' ')}</span>;
}

const th = { padding: '12px', textAlign: 'left', fontSize: 13, color: '#334155', fontWeight: 700 };
const td = { padding: '12px', color: '#0b2e6f', fontSize: 14, verticalAlign: 'top' };
const inp = { padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const actionBtn = { padding: '6px 14px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 };

export default FieldRequests;