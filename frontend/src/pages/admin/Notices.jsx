import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { getAllNotices } from '../../services/authService';
import { downloadNoticePdf } from '../../utils/noticePdf';

function Notices() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await getAllNotices();
        setItems(r.data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f' }}>Leave Notices</h1>
        <div style={{ background: '#fff', padding: 20, borderRadius: 14 }}>
          {items.length === 0 ? (
            <p style={{ color: '#888' }}>No notices generated yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={th}>Ref</th>
                  <th style={th}>Type</th>
                  <th style={th}>Decision By</th>
                  <th style={th}>Date</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ ...td, fontSize: 12, color: '#0d6efd', fontWeight: 700 }}>{n.referenceNumber}</td>
                    <td style={td}>{n.noticeType}</td>
                    <td style={td}>{n.finalDecisionByRole}</td>
                    <td style={td}>{new Date(n.createdAt).toLocaleString()}</td>
                    <td style={td}>
                      <button onClick={() => downloadNoticePdf(n)} style={dlBtn}>
                        📄 Download PDF
                      </button>
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

export default Notices;