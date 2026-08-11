import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resetPassword } from "../services/authService";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function StaffResetPassword() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(user.staffId, oldPassword, newPassword);
      if (res.data.success) {
        setSuccess("Password reset successful! You can now login.");
        setTimeout(() => navigate("/staff/dashboard"), 2000);
      } else {
        setError(res.data.message || "Reset failed");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#dbe7f7",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "1150px",
          height: "720px",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          display: "flex",
          border: "3px solid #ffffff",
          boxShadow: "8px 8px 0px rgba(13,110,253,.25), 0 25px 50px rgba(13,42,94,.25)",
        }}
      >
        {/* LEFT PANEL */}
        <div
          style={{
            width: "35%",
            backgroundImage: `url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "35px 0",
            borderRight: "3px solid #0d6efd",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,42,94,.35), rgba(13,42,94,.65))" }} />
          <div style={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 1 }}>
            <img src={logo} alt="NTC" style={{ width: "110px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))" }} />
          </div>
          <h1 style={{ color: "#fff", fontSize: "48px", letterSpacing: "4px", marginBottom: "30px", fontWeight: "700", textShadow: "0 4px 0px #0a4fc4, 0 8px 16px rgba(0,0,0,.4)", zIndex: 1 }}>
            NTC
          </h1>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: "65%", display: "flex", justifyContent: "center", alignItems: "center", background: "#eef4ff" }}>
          <div
            style={{
              width: "440px",
              padding: "36px",
              background: "#fff",
              borderRadius: "18px",
              border: "3px solid #cfe0fc",
              boxShadow: "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
            }}
          >
            <h1 style={{ textAlign: "left", color: "#0b2e6f", fontSize: "30px", fontWeight: "700", marginBottom: "8px" }}>
              Reset Password
            </h1>
            <p style={{ textAlign: "left", color: "#5b7bab", marginBottom: "28px", fontSize: "15px" }}>
              You are required to change your temporary password.
            </p>

            {error && <p style={{ color: "#e5484d", marginBottom: "16px", fontWeight: "600" }}>{error}</p>}
            {success && <p style={{ color: "green", marginBottom: "16px", fontWeight: "600" }}>{success}</p>}

            <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Current Password</label>
            <input
              type="password"
              placeholder="Enter temporary password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
                boxShadow: "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            <div style={{ height: "20px" }} />

            <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
                boxShadow: "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            <div style={{ height: "20px" }} />

            <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
                boxShadow: "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            <div style={{ height: "24px" }} />

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading ? "#a9c6f5" : "linear-gradient(180deg, #3b8dfd, #0d6efd)",
                color: "white",
                border: "2px solid #0a4fc4",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 0px #0a4fc4, 0 8px 16px rgba(13,110,253,.35)",
                transform: "translateY(0)",
                transition: "all .1s ease",
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <hr style={{ marginTop: "30px", marginBottom: "18px", border: "none", borderTop: "2px solid #e1ecfd" }} />
            <p style={{ textAlign: "center", color: "#a9c0e0", fontSize: "12px" }}>
              © 2026 Nepal Telecom · All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffResetPassword;