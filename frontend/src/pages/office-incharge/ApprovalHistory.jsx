import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import RequestDetail from '../../components/RequestDetail';
import {
  getOfficeInchargeHistory, getNoticeByRequest, getSignatureBase64
} from '../../services/authService';
import { downloadNoticePdf } from '../../utils/noticePdf';

function ApprovalHistory() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await getOfficeInchargeHistory();
        setItems(r.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const download = async (requestId) => {
    setBusy(requestId);
    try {
      const res = await getNoticeByRequest(requestId);
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

  const filtered = items.filter(r => {
    if (filter !== 'ALL' && r.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (r.staffName || '').toLowerCase().includes(s)
          || (r.referenceNumber || '').toLowerCase().includes(s);
    }
    return true;
  });

  const counts = {
    ALL: items.length,
    APPROVED: items.filter(r => r.status === 'APPROVED').length,
    REJECTED: items.filter(r => r.status === 'REJECTED').length,
    CANCELLED: items.filter(r => r.status === 'CANCELLED').length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Approval History</h1>
        <p style={{ color: '#5b7bab', marginTop: 0, marginBottom: 20 }}>
          Click any row to view full details, print, or download as PDF.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
          <MiniStat label="Total" value={counts.ALL} color="#0d6efd" />
          <MiniStat label="Approved" value={counts.APPROVED} color="#16a34a" />
          <MiniStat label="Rejected" value={counts.REJECTED} color="#dc3545" />
          <MiniStat label="Cancelled" value={counts.CANCELLED} color="#64748b" />
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 12, display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search by staff or reference number"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 320, background: '#f8fafc' }} />
          {['ALL', 'APPROVED', 'REJECTED', 'CANCELLED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? '#0d6efd' : '#f1f5f9',
              color: filter === f ? '#fff' : '#334155',
              fontWeight: 600, fontSize: 12,
            }}>{f}</button>
          ))}
        </div>

        <div style={{ background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
          {filtered.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 30 }}>No history yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={th}>Ref</th><th style={th}>Staff</th><th style={th}>Type</th>
                  <th style={th}>From</th><th style={th}>Until</th>
                  <th style={th}>Status</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}
                    onClick={() => setSelected(r)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <td style={{ ...td, fontSize: 12, color: '#0d6efd', fontWeight: 700 }}>{r.referenceNumber}</td>
                    <td style={td}>{r.staffName}</td>
                    <td style={td}>{r.leaveType?.replace(/_/g, ' ')}</td>
                    <td style={td}>{new Date(r.leaveStartTime).toLocaleDateString()}</td>
                    <td style={td}>{new Date(r.returnDateTime).toLocaleDateString()}</td>
                    <td style={td}><StatusPill status={r.status} /></td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelected(r)} style={{ ...actionBtn, background: '#f1f5f9', color: '#0b2e6f', marginRight: 6 }}>View</button>
                      {(r.status === 'APPROVED' || r.status === 'REJECTED') && (
                        <button onClick={() => download(r.id)} disabled={busy === r.id} style={actionBtn}>
                          {busy === r.id ? '...' : '📄 PDF'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
              <RequestDetail request={selected} viewerRole="office_incharge" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', padding: 14, borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const m = {
    PENDING_SECTION_HEAD:    { bg: '#fef3c7', fg: '#92400e' },
    PENDING_OFFICE_INCHARGE: { bg: '#dbeafe', fg: '#1e40af' },
    APPROVED:                { bg: '#d1fae5', fg: '#065f46' },
    REJECTED:                { bg: '#fee2e2', fg: '#991b1b' },
    CANCELLED:               { bg: '#e5e7eb', fg: '#374151' },
  };
  const c = m[status] || m.CANCELLED;
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800,
      background: c.bg, color: c.fg, whiteSpace: 'nowrap', letterSpacing: 0.5,
    }}>{status?.replace(/_/g, ' ')}</span>
  );
}

const th = { padding: 12, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700, letterSpacing: 0.3 };
const td = { padding: 12, color: '#0b2e6f' };
const actionBtn = {
  padding: '6px 14px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};

export default ApprovalHistory;