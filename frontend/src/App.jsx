import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import UnifiedLogin from "./pages/Login";
import ContactAdmin from "./pages/ContactAdmin";
import ProfilePage from "./components/ProfilePage";

import StaffResetPassword from "./pages/StaffResetPassword";
import StaffDashboard from "./pages/staff/StaffDashboard";
import NewRequest from "./pages/staff/NewRequest";
import MyRequests from "./pages/staff/MyRequests";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import FieldRequests from "./pages/admin/FieldRequests";
import PasswordResetRequests from "./pages/admin/PasswordResetRequests";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import Notices from "./pages/admin/Notices";

import SectionHeadDashboard from "./pages/section-head/SectionHeadDashboard";
import SectionHeadPending from "./pages/section-head/PendingApprovals";
import SectionHeadHistory from "./pages/section-head/ApprovalHistory";
import MyStaff from "./pages/section-head/MyStaff";

import OfficeInchargeDashboard from "./pages/office-incharge/OfficeInchargeDashboard";
import OfficeInchargePending from "./pages/office-incharge/PendingApprovals";
import OfficeInchargeHistory from "./pages/office-incharge/ApprovalHistory";
import MySectionHeads from "./pages/office-incharge/SectionHeads";

const ALL_STAFF_ROLES = ["staff", "section_head", "office_incharge"];

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/ntc-system">
        <Routes>
          <Route path="/" element={<Navigate to="/staff/login" />} />
          <Route path="/staff/login" element={<UnifiedLogin />} />
          <Route path="/admin/login" element={<UnifiedLogin />} />
          <Route path="/contact-admin" element={<ContactAdmin />} />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}><ProfilePage /></ProtectedRoute>} />

          <Route path="/staff/reset-password" element={
            <ProtectedRoute allowedRoles={["staff"]}><StaffResetPassword /></ProtectedRoute>} />
          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={["staff"]}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/new-request" element={
            <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}><NewRequest /></ProtectedRoute>} />
          <Route path="/staff/my-requests" element={
            <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}><MyRequests /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/staff-management" element={
            <ProtectedRoute allowedRoles={["admin"]}><StaffManagement /></ProtectedRoute>} />
          <Route path="/admin/field-requests" element={
            <ProtectedRoute allowedRoles={["admin"]}><FieldRequests /></ProtectedRoute>} />
          <Route path="/admin/password-reset" element={
            <ProtectedRoute allowedRoles={["admin"]}><PasswordResetRequests /></ProtectedRoute>} />
          <Route path="/admin/notices" element={
            <ProtectedRoute allowedRoles={["admin"]}><Notices /></ProtectedRoute>} />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={["admin"]}><Reports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={["admin"]}><Settings /></ProtectedRoute>} />

          {/* Section Head */}
          <Route path="/section-head/dashboard" element={
            <ProtectedRoute allowedRoles={["section_head"]}><SectionHeadDashboard /></ProtectedRoute>} />
          <Route path="/section-head/pending" element={
            <ProtectedRoute allowedRoles={["section_head"]}><SectionHeadPending /></ProtectedRoute>} />
          <Route path="/section-head/history" element={
            <ProtectedRoute allowedRoles={["section_head"]}><SectionHeadHistory /></ProtectedRoute>} />
          <Route path="/section-head/my-staff" element={
            <ProtectedRoute allowedRoles={["section_head"]}><MyStaff /></ProtectedRoute>} />

          {/* Office Incharge */}
          <Route path="/office-incharge/dashboard" element={
            <ProtectedRoute allowedRoles={["office_incharge"]}><OfficeInchargeDashboard /></ProtectedRoute>} />
          <Route path="/office-incharge/pending" element={
            <ProtectedRoute allowedRoles={["office_incharge"]}><OfficeInchargePending /></ProtectedRoute>} />
          <Route path="/office-incharge/history" element={
            <ProtectedRoute allowedRoles={["office_incharge"]}><OfficeInchargeHistory /></ProtectedRoute>} />
          <Route path="/office-incharge/section-heads" element={
            <ProtectedRoute allowedRoles={["office_incharge"]}><MySectionHeads /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;