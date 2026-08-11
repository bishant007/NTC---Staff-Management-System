import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminLogin } from "../services/authService";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin(email, password);

      console.log("Login response:", res);
      console.log("Response data:", res.data);

      if (res.data.success) {
        const { token, email: userEmail } = res.data.data;
        console.log("Token:", token);
        console.log("Email:", userEmail);
        
        login({ email: userEmail }, token, "admin");
        navigate("/admin/dashboard");
      } else {
        setLoginError(res.data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error response:", error.response);
      
      if (error.response?.status === 401) {
        setLoginError("Invalid email or password");
      } else if (error.response?.status === 404) {
        setLoginError("Server endpoint not found");
      } else {
        setLoginError("Unable to connect to the server");
      }
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
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              zIndex: 1,
            }}
          >
            <img
              src={logo}
              alt="NTC"
              style={{
                width: "110px",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,.4))",
              }}
            />
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "48px",
              letterSpacing: "4px",
              marginBottom: "30px",
              fontWeight: "700",
              textShadow: "0 4px 0px #0a4fc4, 0 8px 16px rgba(0,0,0,.4)",
              zIndex: 1,
            }}
          >
            NTC
          </h1>
        </div>

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
              boxShadow:
                "6px 6px 0px #cfe0fc, 0 20px 40px rgba(13,110,253,.15)",
            }}
          >
            <h1
              style={{
                textAlign: "left",
                color: "#0b2e6f",
                fontSize: "34px",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Admin Login
            </h1>

            <p
              style={{
                textAlign: "left",
                color: "#5b7bab",
                marginBottom: "32px",
                fontSize: "15px",
              }}
            >
              Access the administration panel
            </p>

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Email Address
            </label>

            <input
              type="email"
              placeholder="admin@ntc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                boxShadow:
                  "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            <div style={{ height: "20px" }} />

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                boxShadow:
                  "inset 0 2px 4px rgba(13,110,253,.1), 3px 3px 0px #dceafe",
                transition: "all .15s ease",
              }}
            />
            <div style={{ height: "20px" }} />

            {loginError && (
              <p
                style={{
                  color: "#e5484d",
                  textAlign: "left",
                  marginBottom: "16px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {loginError}
              </p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading
                  ? "#a9c6f5"
                  : "linear-gradient(180deg, #3b8dfd, #0d6efd)",
                color: "white",
                border: "2px solid #0a4fc4",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all .1s ease",
                marginTop: "8px",
                boxShadow: loading
                  ? "none"
                  : "0 4px 0px #0a4fc4, 0 8px 16px rgba(13,110,253,.35)",
                transform: "translateY(0)",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div style={{ marginTop: "26px", textAlign: "center" }}>
              <p
                style={{
                  color: "#5b7bab",
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
              >
                Access restricted to administrators only.
              </p>
              <button
                type="button"
                onClick={() => navigate("/staff/login")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0d6efd",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                ← Staff Login
              </button>
            </div>

            <hr
              style={{
                marginTop: "24px",
                marginBottom: "18px",
                border: "none",
                borderTop: "2px solid #e1ecfd",
              }}
            />

            <p
              style={{
                textAlign: "center",
                color: "#a9c0e0",
                fontSize: "12px",
              }}
            >
              © 2026 Nepal Telecom · All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;