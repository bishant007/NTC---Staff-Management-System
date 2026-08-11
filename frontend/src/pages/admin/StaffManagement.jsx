import { useState } from "react";
import { createStaff } from "../../services/authService";

function StaffManagement() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    department: "",
    branch: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await createStaff(form);
      if (res.data.success) {
        setMessage("✅ Staff created! Credentials sent to email.");
        setForm({ fullName: "", phone: "", email: "", department: "", branch: "" });
      } else {
        setMessage("❌ " + (res.data.message || "Creation failed"));
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 30, maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          padding: "30px 35px",
          borderRadius: "18px",
          border: "3px solid #cfe0fc",
          boxShadow: "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
        }}
      >
        <h2 style={{ color: "#0b2e6f", fontSize: "28px", marginBottom: "6px" }}>Create New Staff</h2>
        <p style={{ color: "#5b7bab", marginBottom: "24px", fontSize: "15px" }}>
          Fill in the details. The system will generate a unique Staff ID and send credentials via email.
        </p>

        {message && <p style={{ marginBottom: "16px", fontWeight: "600", color: message.startsWith("✅") ? "green" : "#e5484d" }}>{message}</p>}

        <form onSubmit={handleSubmit}>
          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Full Name</label>
          <input
            type="text"
            name="fullName"
            placeholder="John Doe"
            value={form.fullName}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <div style={{ height: "16px" }} />

          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Phone</label>
          <input
            type="text"
            name="phone"
            placeholder="98XXXXXXXX"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <div style={{ height: "16px" }} />

          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Email</label>
          <input
            type="email"
            name="email"
            placeholder="staff@ntc.net.np"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <div style={{ height: "16px" }} />

          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Department</label>
          <input
            type="text"
            name="department"
            placeholder="IT"
            value={form.department}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <div style={{ height: "16px" }} />

          <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Branch</label>
          <input
            type="text"
            name="branch"
            placeholder="Kathmandu"
            value={form.branch}
            onChange={handleChange}
            style={inputStyle}
            required
          />
          <div style={{ height: "24px" }} />

          <button
            type="submit"
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
            {loading ? "Creating..." : "Create Staff"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
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
};

export default StaffManagement;