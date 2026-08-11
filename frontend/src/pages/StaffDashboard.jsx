import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { submitLeaveRequest } from "../services/authService";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function StaffDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reason, setReason] = useState("");
  const [returnDateTime, setReturnDateTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await submitLeaveRequest(user.staffId, reason, returnDateTime);
      if (res.data.success) {
        setMessage("✅ Leave request submitted successfully!");
        setReason("");
        setReturnDateTime("");
      } else {
        setMessage("❌ " + (res.data.message || "Submission failed"));
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
    setSubmitting(false);
  };

  return (
    <div
      style={{
        background: "#dbe7f7",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        padding: "30px 0",
      }}
    >
      <div
        style={{
          width: "1150px",
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
        <div style={{ width: "65%", display: "flex", justifyContent: "center", alignItems: "center", background: "#eef4ff", padding: "30px 40px" }}>
          <div style={{ width: "100%", maxWidth: "520px" }}>
            <h1 style={{ color: "#0b2e6f", fontSize: "32px", marginBottom: "6px" }}>Staff Dashboard</h1>
            <p style={{ color: "#5b7bab", fontSize: "15px", marginBottom: "20px" }}>
              Submit your field visit request
            </p>

            {/* Profile Info */}
            <div
              style={{
                background: "#fff",
                padding: "20px 24px",
                borderRadius: "16px",
                border: "2px solid #cfe0fc",
                boxShadow: "inset 0 2px 4px rgba(13,110,253,.05), 3px 3px 0px #dceafe",
                marginBottom: "24px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 20px",
              }}
            >
              <p><strong>Name:</strong> {user?.fullName}</p>
              <p><strong>ID:</strong> {user?.staffId}</p>
              <p><strong>Department:</strong> {user?.department}</p>
              <p><strong>Branch:</strong> {user?.branch}</p>
              <p style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <strong>Current Time:</strong> {currentTime.toLocaleString()}
              </p>
            </div>

            {/* Leave Form */}
            <div
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "16px",
                border: "2px solid #cfe0fc",
                boxShadow: "inset 0 2px 4px rgba(13,110,253,.05), 3px 3px 0px #dceafe",
              }}
            >
              <h2 style={{ fontSize: "20px", color: "#0b2e6f", marginBottom: "16px" }}>New Leave Request</h2>
              {message && <p style={{ marginBottom: "16px", fontWeight: "600", color: message.startsWith("✅") ? "green" : "#e5484d" }}>{message}</p>}
              <form onSubmit={handleSubmit}>
                <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Reason for Leave</label>
                <textarea
                  rows={4}
                  placeholder="Describe your situation, reason, and when you plan to return..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border: "2px solid #a9c6f5",
                    fontSize: "15px",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    background: "#f4f8ff",
                    boxShadow: "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                    transition: "all .15s ease",
                  }}
                  required
                />
                <div style={{ height: "16px" }} />

                <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Expected Return Date & Time</label>
                <input
                  type="datetime-local"
                  value={returnDateTime}
                  onChange={(e) => setReturnDateTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
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
                  required
                />
                <div style={{ height: "24px" }} />

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: submitting ? "#a9c6f5" : "linear-gradient(180deg, #3b8dfd, #0d6efd)",
                    color: "white",
                    border: "2px solid #0a4fc4",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 0px #0a4fc4, 0 8px 16px rgba(13,110,253,.35)",
                    transform: "translateY(0)",
                    transition: "all .1s ease",
                  }}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>

            {/* Back to Login / Logout – optional */}
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("role");
                  window.location.href = "/staff/login";
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#dc3545",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  textDecoration: "underline",
                }}
              >
                Logout
              </button>
            </div>

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

export default StaffDashboard;