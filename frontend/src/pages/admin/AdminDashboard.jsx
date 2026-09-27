import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../services/authService";

function DashboardCard({ title, value, subtitle, icon, color, bg, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        background: "#ffffff", borderRadius: 18, padding: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 12px 30px rgba(0,0,0,.08)",
        border: "1px solid #edf2f7", transition: "0.3s",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,.14)";
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.08)";
      }}
    >
      <div>
        <p style={{ margin: 0, color: "#777", fontSize: 14, fontWeight: 600 }}>{title}</p>
        <h1 style={{ margin: "12px 0 6px", fontSize: 38, color: "#222", fontWeight: 700 }}>{value}</h1>
        <p style={{ margin: 0, color, fontWeight: 600, fontSize: 13 }}>{subtitle}</p>
      </div>
      <div style={{
        width: 66, height: 66, borderRadius: 18, background: bg,
        display: "flex", justifyContent: "center", alignItems: "center", fontSize: 30
      }}>
        {icon}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [d, setD] = useState({
    totalUsers: 0, totalStaff: 0, totalSectionHeads: 0, totalOfficeIncharge: 0,
    activeUsers: 0, fieldRequests: 0, pendingRequests: 0,
    todayRequests: 0, passwordReset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = async () => {
    try {
      const res = await getDashboardStats();
      setD({ ...d, ...res.data });
      setLoadError(null);
    } catch (err) {
      console.log(err);
      setLoadError("Could not reach the server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const v = isLoading ? "…" : (n) => n;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4ff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: "30px" }}>

        {/* Top Bar */}
        <div style={{
          height: 72, background: "#fff", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "0 28px", boxShadow: "0 2px 12px rgba(0,0,0,.06)",
          borderRadius: 12, marginBottom: 24,
        }}>
          <h2 style={{ margin: 0, color: "#0b2e6f", fontSize: 20 }}>NTC-Staff-System</h2>
          <div style={{ textAlign: "right", fontSize: 14 }}>
            <strong>{user?.email || "Administrator"}</strong>
            <br />
            <small style={{ color: "#64748b" }}>Admin Panel</small>
          </div>
        </div>

        {/* Welcome Banner */}
        <div style={{
          background: "linear-gradient(135deg,#0b2e6f,#0d6efd)",
          borderRadius: 20, padding: "30px 40px", color: "white",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 28, boxShadow: "0 20px 40px rgba(13,110,253,.25)",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>Welcome back</h1>
            <p style={{ marginTop: 10, fontSize: 15, opacity: 0.9 }}>
              Overview of accounts, requests, and password resets across Nepal Telecom.
            </p>
            {loadError && (
              <p style={{
                marginTop: 12, fontSize: 12, background: "rgba(255,255,255,.15)",
                display: "inline-block", padding: "6px 12px", borderRadius: 8
              }}>
                {loadError} — showing last known values.
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: "bold" }}>Administrator</div>
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>Nepal Telecom</div>
          </div>
        </div>

        {/* Primary Cards */}
        <h3 style={{ color: "#0b2e6f", marginTop: 0, marginBottom: 14, fontSize: 16, letterSpacing: 0.5 }}>
          USERS
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 28 }}>
          <DashboardCard title="Total Users"    value={isLoading ? "…" : d.totalUsers}
            subtitle="All accounts"             icon="👥" color="#1e40af" bg="#dbeafe"
            onClick={() => navigate('/admin/staff-management')} />
          <DashboardCard title="Staff"          value={isLoading ? "…" : d.totalStaff}
            subtitle="Regular employees"        icon="👨‍💼" color="#0e7490" bg="#cffafe"
            onClick={() => navigate('/admin/staff-management?role=STAFF')} />
          <DashboardCard title="Section Heads"  value={isLoading ? "…" : d.totalSectionHeads}
            subtitle="First-level approvers"    icon="🧑‍💼" color="#7c3aed" bg="#ede9fe"
            onClick={() => navigate('/admin/staff-management?role=SECTION_HEAD')} />
          <DashboardCard title="Office In-Charge" value={isLoading ? "…" : d.totalOfficeIncharge}
            subtitle="Final approvers"          icon="🏢" color="#9d174d" bg="#fce7f3"
            onClick={() => navigate('/admin/staff-management?role=DEPARTMENT_HEAD')} />
        </div>

        <h3 style={{ color: "#0b2e6f", marginTop: 0, marginBottom: 14, fontSize: 16, letterSpacing: 0.5 }}>
          ACTIVITY
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          <DashboardCard title="Field Requests" value={isLoading ? "…" : d.fieldRequests}
            subtitle="Total requests"           icon="📋" color="#ea580c" bg="#ffedd5"
            onClick={() => navigate('/admin/field-requests')} />
          <DashboardCard title="Pending Approval" value={isLoading ? "…" : d.pendingRequests}
            subtitle="Awaiting action"          icon="⏳" color="#dc2626" bg="#fee2e2"
            onClick={() => navigate('/admin/field-requests?status=PENDING')} />
          <DashboardCard title="Today's Requests" value={isLoading ? "…" : d.todayRequests}
            subtitle="Submitted today"          icon="📅" color="#7c3aed" bg="#ede9fe"
            onClick={() => navigate('/admin/field-requests')} />
        </div>

        <h3 style={{ color: "#0b2e6f", marginTop: 28, marginBottom: 14, fontSize: 16, letterSpacing: 0.5 }}>
          ATTENTION
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          <DashboardCard title="Active Users" value={isLoading ? "…" : d.activeUsers}
            subtitle="Logged in at least once"  icon="✅" color="#16a34a" bg="#dcfce7"
            onClick={() => navigate('/admin/staff-management')} />
          <DashboardCard title="Password Reset" value={isLoading ? "…" : d.passwordReset}
            subtitle="Pending requests"         icon="🔑" color="#0891b2" bg="#cffafe"
            onClick={() => navigate('/admin/password-reset')} />
          <DashboardCard title="Reports" value="View" subtitle="Analytics & exports"
            icon="📊" color="#0d6efd" bg="#dbeafe"
            onClick={() => navigate('/admin/reports')} />
          <DashboardCard title="Notices" value="View" subtitle="Generated notices"
            icon="🔔" color="#f59e0b" bg="#fef3c7"
            onClick={() => navigate('/admin/notices')} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;