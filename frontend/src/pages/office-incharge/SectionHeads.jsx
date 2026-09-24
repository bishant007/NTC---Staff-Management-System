import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { getMySectionHeads } from '../../services/authService';

function SectionHeads() {
  const [list, setList] = useState([]);
  useEffect(() => {
    (async () => { try { const r = await getMySectionHeads(); setList(r.data || []); } catch (e) {} })();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f' }}>My Section Heads</h1>
        <div style={{ background: '#fff', padding: 20, borderRadius: 14 }}>
          {list.length === 0 ? <p style={{ color: '#888' }}>No Section Heads assigned.</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ background: '#f8fafc' }}>
                <th style={th}>Staff ID</th><th style={th}>Username</th><th style={th}>Name</th>
                <th style={th}>Email</th><th style={th}>Department</th>
              </tr></thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>{s.staffId}</td><td style={td}>{s.username}</td>
                    <td style={td}>{s.fullName}</td><td style={td}>{s.email}</td>
                    <td style={td}>{s.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}

const th = { padding: 10, textAlign: 'left', fontSize: 13, color: '#334155' };
const td = { padding: 10, color: '#0b2e6f' };

export default SectionHeads;