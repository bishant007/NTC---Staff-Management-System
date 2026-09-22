import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public
import AdminLogin from "./pages/AdminLogin";
import StaffLogin from "./pages/Login";
import ContactAdmin from "./pages/ContactAdmin";

// Shared
import ProfilePage from "./components/ProfilePage";

// Staff
import StaffResetPassword from "./pages/StaffResetPassword";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NewRequest from "./pages/staff/NewRequest";
import MyRequests from "./pages/staff/MyRequests";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import FieldRequests from "./pages/admin/FieldRequests";
import PasswordResetRequests from "./pages/admin/PasswordResetRequests";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// Section Head
import SectionHeadDashboard from "./pages/section-head/SectionHeadDashboard";
import SectionHeadPending from "./pages/section-head/PendingApprovals";
import SectionHeadHistory from "./pages/section-head/ApprovalHistory";
import MyStaff from "./pages/section-head/MyStaff";

// Department Head
import DeptHeadDashboard from "./pages/dept-head/DeptHeadDashboard";
import DeptHeadPending from "./pages/dept-head/PendingApprovals";
import DeptHeadHistory from "./pages/dept-head/ApprovalHistory";
import SectionHeads from "./pages/dept-head/SectionHeads";

const ALL_STAFF_ROLES = ["staff", "section_head", "department_head"];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/ntc-system">
        <Routes>

          {/* Public */}
          <Route path="/" element={<Navigate to="/staff/login" />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/contact-admin" element={<ContactAdmin />} />

          {/* Shared */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Staff */}
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

          <Route
            path="/staff/new-request"
            element={
              <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}>
                <NewRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff/my-requests"
            element={
              <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
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

          <Route
            path="/admin/password-reset"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PasswordResetRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Section Head */}
          <Route
            path="/section-head/dashboard"
            element={
              <ProtectedRoute allowedRoles={["section_head"]}>
                <SectionHeadDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/section-head/pending"
            element={
              <ProtectedRoute allowedRoles={["section_head"]}>
                <SectionHeadPending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/section-head/history"
            element={
              <ProtectedRoute allowedRoles={["section_head"]}>
                <SectionHeadHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/section-head/my-staff"
            element={
              <ProtectedRoute allowedRoles={["section_head"]}>
                <MyStaff />
              </ProtectedRoute>
            }
          />

          {/* Department Head */}
          <Route
            path="/department-head/dashboard"
            element={
              <ProtectedRoute allowedRoles={["department_head"]}>
                <DeptHeadDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/department-head/pending"
            element={
              <ProtectedRoute allowedRoles={["department_head"]}>
                <DeptHeadPending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/department-head/history"
            element={
              <ProtectedRoute allowedRoles={["department_head"]}>
                <DeptHeadHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/department-head/section-heads"
            element={
              <ProtectedRoute allowedRoles={["department_head"]}>
                <SectionHeads />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;