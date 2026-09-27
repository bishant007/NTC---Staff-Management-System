import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import {
  getAllStaff, getLeaveRequests, getAllNotices,
} from '../../services/authService';
import {
  downloadUserDirectoryPdf, downloadLeaveLedgerPdf, downloadApprovalTimelinePdf,
} from '../../utils/reportPdf';

function Reports() {
  const [tab, setTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, r, n] = await Promise.all([
          getAllStaff(),
          getLeaveRequests(),
          getAllNotices(),
        ]);
        setUsers(u.data || []);
        setRequests(r.data || []);
        setNotices(n.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef4ff' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: 30 }}>
        <h1 style={{ color: '#0b2e6f', marginBottom: 4 }}>Reports & Analytics</h1>
        <p style={{ color: '#5b7bab', marginTop: 0 }}>
          Detailed, printable reports covering users, leave activity, and approvals across the system.
        </p>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 24 }}>
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
            User Directory ({users.length})
          </TabBtn>
          <TabBtn active={tab === 'ledger'} onClick={() => setTab('ledger')}>
            Leave Ledger ({requests.length})
          </TabBtn>
          <TabBtn active={tab === 'timeline'} onClick={() => setTab('timeline')}>
            Approval Timeline ({notices.length})
          </TabBtn>
        </div>

        {loading ? <p>Loading...</p> : (
          <>
            {tab === 'users' && <UserDirectory users={users} />}
            {tab === 'ledger' && <LeaveLedger requests={requests} />}
            {tab === 'timeline' && <ApprovalTimeline notices={notices} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- User Directory ---------------- */
function UserDirectory({ users }) {
  const [role, setRole] = useState('');
  const [dept, setDept] = useState('');

  const depts = [...new Set(users.map(u => u.department).filter(Boolean))];

  const filtered = users.filter(u => {
    if (role && u.role !== role) return false;
    if (dept && u.department !== dept) return false;
    return true;
  });

  const byRole = {
    STAFF: users.filter(u => u.role === 'STAFF').length,
    SECTION_HEAD: users.filter(u => u.role === 'SECTION_HEAD').length,
    OFFICE_INCHARGE: users.filter(u => u.role === 'OFFICE_INCHARGE').length,
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        <MiniStat label="Total Users" value={users.length} color="#0d6efd" />
        <MiniStat label="Staff" value={byRole.STAFF} color="#0e7490" />
        <MiniStat label="Section Heads" value={byRole.SECTION_HEAD} color="#7c3aed" />
        <MiniStat label="Office In-Charge" value={byRole.OFFICE_INCHARGE} color="#9d174d" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
          <option value="">All roles</option>
          <option value="STAFF">Staff</option>
          <option value="SECTION_HEAD">Section Head</option>
          <option value="OFFICE_INCHARGE">Office In-Charge</option>
        </select>
        <select value={dept} onChange={e => setDept(e.target.value)} style={inp}>
          <option value="">All departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={() => downloadUserDirectoryPdf(filtered)} style={exportBtn}>
          📄 Export PDF ({filtered.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={th}>Staff ID</th><th style={th}>Name</th><th style={th}>Email</th>
              <th style={th}>Role</th><th style={th}>Dept</th><th style={th}>Branch</th>
              <th style={th}>Section Head</th><th style={th}>Office In-Charge</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ ...td, fontWeight: 700, color: '#0d6efd' }}>{u.staffId}</td>
                <td style={td}>{u.fullName}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.role?.replace('_', ' ')}</td>
                <td style={td}>{u.department}</td>
                <td style={td}>{u.branch}</td>
                <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{u.sectionHeadName || '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{u.officeInchargeName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Leave Ledger ---------------- */
function LeaveLedger({ requests }) {
  const [status, setStatus] = useState('');
  const filtered = requests.filter(r => !status || r.status === status);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
        <MiniStat label="Total" value={requests.length} color="#0d6efd" />
        <MiniStat label="Approved" value={requests.filter(r => r.status === 'APPROVED').length} color="#16a34a" />
        <MiniStat label="Rejected" value={requests.filter(r => r.status === 'REJECTED').length} color="#dc3545" />
        <MiniStat label="Cancelled" value={requests.filter(r => r.status === 'CANCELLED').length} color="#64748b" />
        <MiniStat label="Pending" value={requests.filter(r => r.status?.startsWith('PENDING')).length} color="#f59e0b" />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
          <option value="">All statuses</option>
          <option value="PENDING_SECTION_HEAD">Pending Section Head</option>
          <option value="PENDING_OFFICE_INCHARGE">Pending Office Incharge</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button onClick={() => downloadLeaveLedgerPdf(filtered)} style={exportBtn}>
          📄 Export PDF ({filtered.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={th}>Ref No.</th><th style={th}>Staff</th><th style={th}>Type</th>
              <th style={th}>Start</th><th style={th}>Return</th>
              <th style={th}>Section Head</th><th style={th}>Office In-Charge</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontSize: 12 }}>{r.referenceNumber || '—'}</td>
                <td style={td}>{r.staffName}</td>
                <td style={td}>{r.leaveType?.replace(/_/g, ' ')}</td>
                <td style={td}>{r.leaveStartTime ? new Date(r.leaveStartTime).toLocaleDateString() : '—'}</td>
                <td style={td}>{r.returnDateTime ? new Date(r.returnDateTime).toLocaleDateString() : '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{r.sectionHeadName || '—'}</td>
                <td style={{ ...td, fontSize: 12, color: '#64748b' }}>{r.officeInchargeName || '—'}</td>
                <td style={td}>{r.status?.replace(/_/g, ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Approval Timeline ---------------- */
function ApprovalTimeline({ notices }) {
  const filtered = [...notices].sort((a, b) =>
    new Date(b.decisionDate || b.createdAt) - new Date(a.decisionDate || a.createdAt));

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <MiniStat label="Total Notices" value={notices.length} color="#0d6efd" />
        <MiniStat label="Approvals" value={notices.filter(n => n.noticeType === 'APPROVAL').length} color="#16a34a" />
        <MiniStat label="Rejections" value={notices.filter(n => n.noticeType === 'REJECTION').length} color="#dc3545" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => downloadApprovalTimelinePdf(filtered)} style={exportBtn}>
          📄 Export PDF ({filtered.length})
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={th}>Ref No.</th><th style={th}>Type</th>
              <th style={th}>Decision By</th><th style={th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(n => (
              <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ ...td, fontWeight: 700, color: '#0d6efd', fontSize: 12 }}>{n.referenceNumber}</td>
                <td style={td}>{n.noticeType}</td>
                <td style={td}>{n.finalDecisionByRole}</td>
                <td style={td}>
                  {n.decisionDate ? new Date(n.decisionDate).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Reusable ---------------- */
function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', cursor: 'pointer',
      borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: active ? '#0d6efd' : '#fff',
      color: active ? '#fff' : '#0b2e6f',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    }}>{children}</button>
  );
}

const th = { padding: 10, textAlign: 'left', fontSize: 12, color: '#334155', fontWeight: 700 };
const td = { padding: 10, color: '#0b2e6f', verticalAlign: 'top' };
const inp = { padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const exportBtn = {
  padding: '9px 18px', background: '#0d6efd', color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer',
  fontWeight: 700, fontSize: 13, marginLeft: 'auto',
};

export default Reports;