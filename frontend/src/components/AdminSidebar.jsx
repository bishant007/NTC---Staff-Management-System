import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  KeyRound,
  BarChart3,
  Settings,
  LogOut,
  ShieldUser,
} from "lucide-react";

function AdminSidebar({ activePage, setActivePage }) {
  const { logout } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "staff", label: "Staff Management", icon: <Users size={18} /> },
    { id: "requests", label: "Field Requests", icon: <ClipboardList size={18} /> },
    { id: "password", label: "Password Reset", icon: <KeyRound size={18} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <div
      style={{
        width: "270px",
        background: "#0b2e6f",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 30, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,.15)" }}>
        <ShieldUser size={55} />
        <h2 style={{ marginTop: 15 }}>NTC Admin</h2>
        <p style={{ opacity: 0.7 }}>Administration Panel</p>
      </div>

      <div style={{ flex: 1, marginTop: 20 }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              padding: "16px 25px",
              cursor: "pointer",
              background: activePage === item.id ? "#0d6efd" : "transparent",
              transition: ".3s",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,.15)" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: 14,
            border: "none",
            borderRadius: 10,
            background: "#dc3545",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;