import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AdminLogin from "./pages/AdminLogin"; // we'll create this
import StaffLogin from "./pages/Login";      // reuse your existing Login (modified)
import StaffResetPassword from "./pages/StaffResetPassword";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import FieldRequests from "./pages/admin/FieldRequests";
import ContactAdmin from "./pages/ContactAdmin"; // keep your existing

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/staff/login" />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/contact-admin" element={<ContactAdmin />} />

          {/* Staff Routes */}
          <Route
            path="/staff/reset-password"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffResetPassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={["staff"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff-management"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/field-requests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FieldRequests />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;