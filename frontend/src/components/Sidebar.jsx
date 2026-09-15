import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, LogOut, Key, BarChart3, Settings,
  Clock, UserCog, PlusCircle, ClipboardList, User, History
} from 'lucide-react';

function Sidebar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
          { label: 'Staff Management', icon: <Users size={20} />, path: '/admin/staff-management' },
          { label: 'Field Requests', icon: <FileText size={20} />, path: '/admin/field-requests' },
          { label: 'Password Reset', icon: <Key size={20} />, path: '/admin/password-reset' },
          { label: 'Reports', icon: <BarChart3 size={20} />, path: '/admin/reports' },
          { label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
        ];
      case 'section_head':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/section-head/dashboard' },
          { label: 'Pending Approvals', icon: <Clock size={20} />, path: '/section-head/pending' },
          { label: 'Approval History', icon: <History size={20} />, path: '/section-head/history' },
          { label: 'My Staff', icon: <Users size={20} />, path: '/section-head/my-staff' },
          { label: 'My Leave', icon: <FileText size={20} />, path: '/staff/new-request' },
          { label: 'My Profile', icon: <User size={20} />, path: '/profile' },
        ];
      case 'department_head':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/department-head/dashboard' },
          { label: 'Pending Approvals', icon: <Clock size={20} />, path: '/department-head/pending' },
          { label: 'Approval History', icon: <History size={20} />, path: '/department-head/history' },
          { label: 'Section Heads', icon: <UserCog size={20} />, path: '/department-head/section-heads' },
          { label: 'My Leave', icon: <FileText size={20} />, path: '/staff/new-request' },
          { label: 'My Profile', icon: <User size={20} />, path: '/profile' },
        ];
      case 'staff':
        return [
          { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/staff/dashboard' },
          { label: 'New Request', icon: <PlusCircle size={20} />, path: '/staff/new-request' },
          { label: 'My Requests', icon: <ClipboardList size={20} />, path: '/staff/my-requests' },
          { label: 'My Profile', icon: <User size={20} />, path: '/profile' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div style={{
      width: 250, height: '100vh', background: '#0b2e6f', color: 'white',
      display: 'flex', flexDirection: 'column', padding: '20px 0',
      position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto',
    }}>
      <div style={{ padding: '0 20px 30px', borderBottom: '1px solid #2554a0' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>NTC Staff System</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, opacity: 0.7 }}>
          {user?.fullName || user?.email}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.5, textTransform: 'capitalize' }}>
          {role?.replace('_', ' ')}
        </p>
      </div>

      <nav style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 20px',
                color: 'white', textDecoration: 'none', transition: '0.2s',
                gap: '12px', fontSize: 15,
                borderLeft: active ? '3px solid #ffd166' : '3px solid transparent',
                background: active ? '#1a4a8a' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#1a4a8a'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid #2554a0' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'transparent', border: 'none', color: 'white',
            fontSize: 15, cursor: 'pointer', padding: '10px 0', width: '100%',
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;