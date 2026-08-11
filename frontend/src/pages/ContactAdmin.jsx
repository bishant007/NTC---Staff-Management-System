import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import bg from "../assets/background.png";

function ContactAdmin() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;

    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
    };

    if (fullName.trim() === "") {
      newErrors.fullName = "Full Name is required";
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.trim() === "") {
      newErrors.email = "Office Email is required";
      valid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    const phoneRegex = /^(97|98)\d{8}$/;

    if (phone.trim() === "") {
      newErrors.phone = "Phone Number is required";
      valid = false;
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone =
        "Phone number must start with 97 or 98 and contain exactly 10 digits";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };
const handleSubmit = async () => {
  setSuccess("");
  setServerError("");

  if (!validate()) return;

  try {
    setLoading(true);

    const response = await fetch(
      "http://localhost:8081/api/password-reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  staffId: "",
  fullName: fullName,
  email: email,
  phone: phone,
  message: message,
}),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      setSuccess("Your password reset request has been submitted successfully.");

      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } else {
      setServerError(data.message || "Failed to submit request.");
    }
  } catch (error) {
    console.error(error);
    setServerError("Unable to connect to the server.");
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
              width: "500px",
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
                color: "#0b2e6f",
                fontSize: "30px",
                marginBottom: "8px",
              }}
            >
              Contact Administrator
            </h1>

            <p
              style={{
                color: "#5b7bab",
                marginBottom: "28px",
                fontSize: "15px",
                lineHeight: "24px",
              }}
            >
              Forgot your password?
              <br />
              Complete the form below to request a password reset.
              <br />
              <br />
              <strong>Note:</strong> If you forgot your Staff ID, please visit
              the Administrator in person for identity verification.
            </p>
                        {/* Full Name */}

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border:
                  errors.fullName !== ""
                    ? "2px solid #e5484d"
                    : "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
              }}
            />

            {errors.fullName && (
              <p
                style={{
                  color: "#e5484d",
                  marginTop: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {errors.fullName}
              </p>
            )}

            {!errors.fullName && <div style={{ height: "20px" }} />}

            {/* Office Email */}

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Office Email
            </label>

            <input
              type="email"
              placeholder="example@ntc.net.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border:
                  errors.email !== ""
                    ? "2px solid #e5484d"
                    : "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
              }}
            />

            {errors.email && (
              <p
                style={{
                  color: "#e5484d",
                  marginTop: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {errors.email}
              </p>
            )}

            {!errors.email && <div style={{ height: "20px" }} />}

            {/* Phone Number */}

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Phone Number
            </label>

            <input
              type="text"
              placeholder="98XXXXXXXX"
              value={phone}
              maxLength={10}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPhone(value);
              }}
              style={{
                width: "100%",
                padding: "13px 14px",
                marginTop: "6px",
                borderRadius: "10px",
                border:
                  errors.phone !== ""
                    ? "2px solid #e5484d"
                    : "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
              }}
            />

            {errors.phone && (
              <p
                style={{
                  color: "#e5484d",
                  marginTop: "6px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {errors.phone}
              </p>
            )}

            {!errors.phone && <div style={{ height: "20px" }} />}

            {/* Message */}

            <label
              style={{
                fontWeight: "600",
                color: "#0b2e6f",
                fontSize: "14px",
              }}
            >
              Message (Optional)
            </label>

            <textarea
              rows={4}
              placeholder="Describe your password issue..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "6px",
                borderRadius: "10px",
                border: "2px solid #a9c6f5",
                fontSize: "15px",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                background: "#f4f8ff",
              }}
            />

            {success && (
              <p
                style={{
                  color: "green",
                  marginTop: "15px",
                  fontWeight: "600",
                }}
              >
                {success}
              </p>
            )}

            {serverError && (
              <p
                style={{
                  color: "#e5484d",
                  marginTop: "15px",
                  fontWeight: "600",
                }}
              >
                {serverError}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "24px",
                background: loading
                  ? "#a9c6f5"
                  : "linear-gradient(180deg,#3b8dfd,#0d6efd)",
                color: "white",
                border: "2px solid #0a4fc4",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>

            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: "14px",
                background: "#ffffff",
                color: "#0d6efd",
                border: "2px solid #0d6efd",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ← Back to Login
            </button>

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

export default ContactAdmin;