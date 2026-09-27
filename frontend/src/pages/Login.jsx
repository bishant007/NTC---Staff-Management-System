import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { unifiedLogin } from "../services/authService";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = { username: "", password: "" };
    let valid = true;
    if (!username.trim()) { errs.username = "Please enter your username or Staff ID"; valid = false; }
    if (!password.trim()) { errs.password = "Please enter your password"; valid = false; }
    setErrors(errs); setLoginError("");
    if (!valid) return;

    try {
      setLoading(true);
      const res = await unifiedLogin(username, password);
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        const role = userData.role || "staff";
        login(userData, token, role);

        if (userData.isFirstLogin) { navigate("/staff/reset-password"); return; }

        switch (role) {
          case "admin": navigate("/admin/dashboard"); break;
          case "section_head": navigate("/section-head/dashboard"); break;
          case "office_incharge": navigate("/office-incharge/dashboard"); break;
          default: navigate("/staff/dashboard");
        }
      } else {
        setLoginError(res.data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#dbe7f7", height: "100vh", display: "flex",
      justifyContent: "center", alignItems: "center", fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      <div style={{
        width: 1050, height: 660, background: "#fff", borderRadius: 20, overflow: "hidden",
        display: "flex", border: "3px solid #fff",
        boxShadow: "8px 8px 0px rgba(13,110,253,.25), 0 25px 50px rgba(13,42,94,.25)",
      }}>
        <div style={{
          width: "38%", backgroundImage: `url(${bg})`, backgroundSize: "cover",
          backgroundPosition: "center", display: "flex", flexDirection: "column",
          justifyContent: "space-between", alignItems: "center", padding: "35px 0",
          borderRight: "3px solid #0d6efd", position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(13,42,94,.35), rgba(13,42,94,.65))" }} />
          <div style={{ display: "flex", justifyContent: "center", width: "100%", zIndex: 1 }}>
            <img src={logo} alt="NTC" style={{ width: 110, filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))" }} />
          </div>
          <h1 style={{
            color: "#fff", fontSize: 48, letterSpacing: 4, marginBottom: 30,
            fontWeight: 700, textShadow: "0 4px 0px #0a4fc4, 0 8px 16px rgba(0,0,0,.4)", zIndex: 1,
          }}>NTC</h1>
        </div>

        <div style={{ width: "62%", display: "flex", justifyContent: "center", alignItems: "center", background: "#eef4ff" }}>
          <form onSubmit={handleSubmit} style={{
            width: 420, padding: 36, background: "#fff", borderRadius: 18,
            border: "3px solid #cfe0fc", boxShadow: "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
          }}>
            <h1 style={{ color: "#0b2e6f", fontSize: 32, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
            <p style={{ color: "#5b7bab", marginBottom: 28, fontSize: 15 }}>Login to the NTC Leave Management Portal</p>

            <label style={lbl}>Username or Staff ID</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. bishant.staff@ntc.com or NTC-10001" style={inp(!!errors.username)} autoFocus />
            {errors.username && <p style={err}>{errors.username}</p>}
            {!errors.username && <div style={{ height: 16 }} />}

            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...inp(!!errors.password), paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#64748b', padding: 6,
                }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <p style={err}>{errors.password}</p>}
            {!errors.password && <div style={{ height: 16 }} />}

            {loginError && <p style={err}>{loginError}</p>}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: 14,
              background: loading ? "#a9c6f5" : "linear-gradient(180deg, #3b8dfd, #0d6efd)",
              color: "#fff", border: "2px solid #0a4fc4", borderRadius: 10,
              fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 0px #0a4fc4, 0 8px 16px rgba(13,110,253,.35)",
              marginTop: 6,
            }}>{loading ? "Logging in..." : "Login"}</button>

            <div style={{ marginTop: 22, textAlign: "center" }}>
              <button type="button" onClick={() => navigate("/contact-admin")} style={{
                background: "transparent", border: "none", color: "#0d6efd",
                fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "underline",
              }}>Forgot password? Contact Administrator</button>
              <p style={{ marginTop: 14, color: "#a9c0e0", fontSize: 12 }}>
                © 2026 Nepal Telecom · All Rights Reserved.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const lbl = { display: 'block', fontWeight: 600, color: "#0b2e6f", fontSize: 14 };
const inp = (err) => ({
  width: "100%", padding: "13px 14px", marginTop: 6, borderRadius: 10,
  border: err ? "2px solid #e5484d" : "2px solid #a9c6f5",
  fontSize: 15, outline: "none", boxSizing: "border-box", background: "#f4f8ff",
  boxShadow: err ? "inset 0 2px 4px rgba(229,72,77,.15)" : "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
});
const err = { color: "#e5484d", marginTop: 6, marginBottom: 6, fontSize: 13, fontWeight: 600 };

export default Login;