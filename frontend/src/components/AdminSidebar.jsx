import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, LogOut, Key,
  BarChart3, Bell, Settings as SettingsIcon
} from 'lucide-react';

function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard',        icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Staff Management', icon: <Users size={20} />,           path: '/admin/staff-management' },
    { label: 'Requests',         icon: <FileText size={20} />,        path: '/admin/field-requests' },
    { label: 'Notices',          icon: <Bell size={20} />,            path: '/admin/notices' },
    { label: 'Password Reset',   icon: <Key size={20} />,             path: '/admin/password-reset' },
    { label: 'Reports',          icon: <BarChart3 size={20} />,       path: '/admin/reports' },
    { label: 'Settings',         icon: <SettingsIcon size={20} />,    path: '/admin/settings' },
  ];

  return (
    <div style={{
      width: 250, height: '100vh', background: '#0b2e6f', color: 'white',
      display: 'flex', flexDirection: 'column', padding: '20px 0',
      position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2554a0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: '#0d6efd',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14,
          }}>NTC</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Admin Panel</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Nepal Telecom</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 0' }}>
        {menuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', padding: '12px 20px',
              color: 'white', textDecoration: 'none', gap: 12, fontSize: 15,
              borderLeft: active ? '3px solid #ffd166' : '3px solid transparent',
              background: active ? '#1a4a8a' : 'transparent',
              transition: '0.2s',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1a4a8a'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon}<span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #2554a0' }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
          Signed in as<br />
          <span style={{ color: 'white', opacity: 1, fontWeight: 600 }}>
            {user?.email || 'Administrator'}
          </span>
        </div>
        <button onClick={() => { logout(); navigate('/staff/login'); }} style={{
          display: 'flex', alignItems: 'center', gap: 12,
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