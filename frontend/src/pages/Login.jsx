import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { staffLogin } from "../services/authService";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ staffId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const newErrors = { staffId: "", password: "" };
    let isValid = true;

    if (staffId.trim() === "") {
      newErrors.staffId = "Please enter your Staff ID";
      isValid = false;
    }
    if (password.trim() === "") {
      newErrors.password = "Please enter your Password";
      isValid = false;
    }

    setErrors(newErrors);
    setLoginError("");

    if (!isValid) return;

    try {
      setLoading(true);
      const res = await staffLogin(staffId, password);

      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        const role = userData.role || "staff";
        login(userData, token, role);

        if (userData.isFirstLogin) {
          navigate("/staff/reset-password");
          return;
        }

        switch (role) {
          case "section_head":
            navigate("/section-head/dashboard");
            break;
          case "department_head":
            navigate("/department-head/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/staff/dashboard");
        }
      } else {
        setLoginError(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      setLoginError("Unable to connect to the server.");
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
          boxShadow:
            "8px 8px 0px rgba(13,110,253,.25), 0 25px 50px rgba(13,42,94,.25)",
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
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(13,42,94,.35), rgba(13,42,94,.65))",
            }}
          />
          <div style={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 1 }}>
            <img src={logo} alt="NTC" style={{ width: "110px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))" }} />
          </div>
          <h1 style={{ color: "#fff", fontSize: "48px", letterSpacing: "4px", marginBottom: "30px", fontWeight: "700", textShadow: "0 4px 0px #0a4fc4, 0 8px 16px rgba(0,0,0,.4)", zIndex: 1 }}>
            NTC
          </h1>
        </div>

        {/* RIGHT PANEL */}
        <div
          style={{
            width: "65%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#eef4ff",
          }}
        >
          <div
            style={{
              width: "420px",
              padding: "36px",
              background: "#fff",
              borderRadius: "18px",
              border: "3px solid #cfe0fc",
              boxShadow: "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
            }}
          >
            <h1 style={{ textAlign: "left", color: "#0b2e6f", fontSize: "34px", fontWeight: "700", marginBottom: "8px" }}>
              Welcome back
            </h1>
            <p style={{ textAlign: "left", color: "#5b7bab", marginBottom: "32px", fontSize: "15px" }}>
              Login to submit your field visit request
            </p>

            <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Staff ID</label>
            <input
              type="text"
              placeholder="Enter your Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: errors.staffId ? "2px solid #e5484d" : "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
                boxShadow: errors.staffId ? "inset 0 2px 4px rgba(229,72,77,.15)" : "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            {errors.staffId && <p style={{ color: "#e5484d", marginTop: "6px", marginBottom: "16px", fontSize: "13px", fontWeight: "600" }}>{errors.staffId}</p>}
            {!errors.staffId && <div style={{ height: "20px" }} />}

            <label style={{ fontWeight: "600", color: "#0b2e6f", fontSize: "14px" }}>Password</label>
            <input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: errors.password ? "2px solid #e5484d" : "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
                boxShadow: errors.password ? "inset 0 2px 4px rgba(229,72,77,.15)" : "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            {errors.password && <p style={{ color: "#e5484d", marginTop: "6px", marginBottom: "16px", fontSize: "13px", fontWeight: "600" }}>{errors.password}</p>}
            {!errors.password && <div style={{ height: "20px" }} />}

            {loginError && <p style={{ color: "#e5484d", textAlign: "left", marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>{loginError}</p>}

            <button
              onClick={handleLogin}
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
                transition: "all .1s ease",
                marginTop: "8px",
                boxShadow: loading ? "none" : "0 4px 0px #0a4fc4, 0 8px 16px rgba(13,110,253,.35)",
                transform: "translateY(0)",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div style={{ marginTop: "26px", textAlign: "center" }}>
              <p style={{ color: "#5b7bab", fontSize: "13px", marginBottom: "4px" }}>Forgot your Staff ID or Password?</p>
              <button
                onClick={() => navigate("/contact-admin")}
                style={{ background: "transparent", border: "none", color: "#0d6efd", fontWeight: "700", fontSize: "14px", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Contact Administrator
              </button>
              <p style={{ marginTop: "14px", color: "#93a9c9", fontSize: "12px", lineHeight: "18px" }}>
                Your account is created by the Administrator. If you forgot your Staff ID or Password, please contact the Administrator to receive a temporary password.
              </p>
            </div>

            <hr style={{ marginTop: "24px", marginBottom: "18px", border: "none", borderTop: "2px solid #e1ecfd" }} />
            <p style={{ textAlign: "center", color: "#a9c0e0", fontSize: "12px", lineHeight: "18px" }}>
              © 2026 Nepal Telecom · All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;