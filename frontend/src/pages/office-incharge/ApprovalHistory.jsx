import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { getOfficeInchargeHistory, getNoticeByRequest } from '../../services/authService';
import { downloadNoticePdf } from '../../utils/noticePdf';

function ApprovalHistory() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);

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
      downloadNoticePdf(res.data);
    } catch (e) {
      alert('Notice not available for this request yet.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f' }}>Approval History</h1>
        <div style={{ background: '#fff', padding: 20, borderRadius: 14 }}>
          {items.length === 0 ? (
            <p style={{ color: '#888' }}>No history yet.</p>
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
                {items.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ ...td, fontSize: 12, color: '#0d6efd', fontWeight: 700 }}>{r.referenceNumber}</td>
                    <td style={td}>{r.staffName}</td>
                    <td style={td}>{r.leaveType?.replace(/_/g, ' ')}</td>
                    <td style={td}>{new Date(r.leaveStartTime).toLocaleDateString()}</td>
                    <td style={td}>{new Date(r.returnDateTime).toLocaleDateString()}</td>
                    <td style={td}>{r.status?.replace(/_/g, ' ')}</td>
                    <td style={td}>
                      {(r.status === 'APPROVED' || r.status === 'REJECTED') && (
                        <button
                          onClick={() => download(r.id)}
                          disabled={busy === r.id}
                          style={dlBtn}
                        >
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
      </div>
    </div>
  );
}

const th = { padding: 10, textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: 10, color: '#0b2e6f' };
const dlBtn = {
  padding: '5px 12px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
};

export default ApprovalHistory;