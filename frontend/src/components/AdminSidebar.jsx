import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, LogOut, Key, BarChart3, Settings } from 'lucide-react';

function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { label: 'Staff Management', icon: <Users size={20} />, path: '/admin/staff-management' },
    { label: 'Field Requests', icon: <FileText size={20} />, path: '/admin/field-requests' },
    { label: 'Password Reset', icon: <Key size={20} />, path: '/admin/password-reset' },
    { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
  ];

  return (
    <div style={{
      width: 250,
      height: '100vh',
      background: '#0b2e6f',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #2554a0' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>NTC Admin</h2>
      </div>
      <nav style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 20px',
              color: 'white',
              textDecoration: 'none',
              gap: '12px',
              fontSize: 15,
              borderLeft: '3px solid transparent',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#1a4a8a'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding: '20px', borderTop: '1px solid #2554a0' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 15,
            cursor: 'pointer',
            padding: '10px 0',
            width: '100%',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;