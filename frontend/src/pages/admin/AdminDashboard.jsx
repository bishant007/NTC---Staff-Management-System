import { useState, useEffect } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../services/authService"; // use the service, not raw fetch

function DashboardCard({ title, value, subtitle, icon, color, bg }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 18,
        padding: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 12px 30px rgba(0,0,0,.08)",
        border: "1px solid #edf2f7",
        transition: "0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 18px 35px rgba(0,0,0,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,.08)";
      }}
    >
      <div>
        <p style={{ margin: 0, color: "#777", fontSize: 15, fontWeight: 600 }}>{title}</p>
        <h1 style={{ margin: "14px 0 6px", fontSize: 42, color: "#222" }}>{value}</h1>
        <p style={{ margin: 0, color: color, fontWeight: 600, fontSize: 14 }}>{subtitle}</p>
      </div>
      <div style={{ width: 70, height: 70, borderRadius: 18, background: bg, display: "flex", justifyContent: "center", alignItems: "center", fontSize: 34 }}>
        {icon}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalStaff: 0,
    activeStaff: 0,
    fieldRequests: 0,
    pendingRequests: 0,
    todayRequests: 0,
    passwordReset: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = async () => {
    try {
      const res = await getDashboardStats();
      const data = res.data;
      setDashboardData({
        totalStaff: data.totalStaff || 0,
        activeStaff: data.activeStaff || 0,
        fieldRequests: data.fieldRequests || 0,
        pendingRequests: data.pendingRequests || 0,
        todayRequests: data.todayRequests || 0,
        passwordReset: data.passwordReset || 0,
      });
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
    const interval = setInterval(() => loadDashboard(), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4ff" }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: 250, padding: "30px" }}>
        {/* Top Bar (optional – you already have it inside the content) */}
        <div
          style={{
            height: 80,
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 35px",
            boxShadow: "0 2px 12px rgba(0,0,0,.08)",
            borderRadius: 12,
            marginBottom: 30,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#0b2e6f" }}>NTC-Staff-System</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>{user?.email || "Administrator"}</strong>
            <br />
            <small>Admin Panel</small>
          </div>
        </div>

        {/* Welcome Banner */}
        <div
          style={{
            background: "linear-gradient(135deg,#0b2e6f,#0d6efd)",
            borderRadius: 20,
            padding: "30px 40px",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
            boxShadow: "0 20px 40px rgba(13,110,253,.25)",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 36 }}>Welcome back</h1>
            <p style={{ marginTop: 12, fontSize: 17, opacity: 0.9 }}>NTC-Staff-System</p>
            <p style={{ marginTop: 18, opacity: 0.8 }}>
              Manage staff accounts, field visit requests, password reset requests and reports from one dashboard.
            </p>
            {loadError && (
              <p style={{ marginTop: 14, fontSize: 13, background: "rgba(255,255,255,.15)", display: "inline-block", padding: "6px 14px", borderRadius: 8 }}>
                {loadError} — showing last known values.
              </p>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: "bold" }}>Administrator</div>
            <div style={{ marginTop: 10, fontSize: 15, opacity: 0.8 }}>Nepal Telecom</div>
            <button
              onClick={() => window.location.href = "/admin/field-requests"}
              style={{
                marginTop: 25,
                background: "#fff",
                color: "#0d6efd",
                border: "none",
                padding: "12px 25px",
                borderRadius: 10,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              View Requests
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "22px" }}>
          <DashboardCard title="Total Staff" value={isLoading ? "…" : dashboardData.totalStaff} subtitle="Registered Staff" icon="👨‍💼" color="#2563eb" bg="#dbeafe" />
          <DashboardCard title="Active Staff" value={isLoading ? "…" : dashboardData.activeStaff} subtitle="Currently Active" icon="✅" color="#16a34a" bg="#dcfce7" />
          <DashboardCard title="Field Requests" value={isLoading ? "…" : dashboardData.fieldRequests} subtitle="Total Requests" icon="📋" color="#ea580c" bg="#ffedd5" />
          <DashboardCard title="Pending Approval" value={isLoading ? "…" : dashboardData.pendingRequests} subtitle="Waiting Approval" icon="⏳" color="#dc2626" bg="#fee2e2" />
          <DashboardCard title="Today's Requests" value={isLoading ? "…" : dashboardData.todayRequests} subtitle="Submitted Today" icon="📅" color="#7c3aed" bg="#ede9fe" />
          <DashboardCard title="Password Reset" value={isLoading ? "…" : dashboardData.passwordReset} subtitle="Pending Reset" icon="🔑" color="#0891b2" bg="#cffafe" />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;