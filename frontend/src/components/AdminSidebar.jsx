import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, LogOut, Key, BarChart3, Bell } from 'lucide-react';

function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Staff Management', icon: <Users size={20} />, path: '/admin/staff-management' },
    { label: 'Requests', icon: <FileText size={20} />, path: '/admin/field-requests' },
    { label: 'Notices', icon: <Bell size={20} />, path: '/admin/notices' },
    { label: 'Password Reset', icon: <Key size={20} />, path: '/admin/password-reset' },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports' },
  ];
  return (
    <div style={{
      width: 250, height: '100vh', background: '#0b2e6f', color: 'white',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0,
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #2554a0' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>NTC Admin</h2>
      </div>
      <nav style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} style={{
            display: 'flex', alignItems: 'center', padding: '12px 20px',
            color: 'white', textDecoration: 'none', gap: '12px', fontSize: 15,
          }}>
            {item.icon}<span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '20px', borderTop: '1px solid #2554a0' }}>
        <button onClick={() => { logout(); navigate('/staff/login'); }} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'transparent', border: 'none', color: 'white',
          fontSize: 15, cursor: 'pointer', padding: '10px 0', width: '100%',
        }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;