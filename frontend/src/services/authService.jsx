import api from './api';

// ---------- Admin ----------
export const adminLogin = (email, password) =>
  api.post('/admin/login', { email, password });

export const createStaff = (staffData) =>
  api.post('/admin/staff', staffData);

export const getAllStaff = () =>
  api.get('/admin/staff');

export const getLeaveRequests = (status) =>
  api.get('/admin/requests', { params: { status } });

export const updateRequestStatus = (id, status, adminRemarks) =>
  api.put(`/admin/requests/${id}/status`, { status, adminRemarks });

// ---------- Staff ----------
export const staffLogin = (staffId, password) =>
  api.post('/login', { staffId, password });

export const resetPassword = (staffId, oldPassword, newPassword) =>
  api.post('/staff/reset-password', { staffId, oldPassword, newPassword });

export const submitLeaveRequest = (staffId, reason, returnDateTime, leaveType) =>
  api.post('/staff/leave-request', { staffId, reason, returnDateTime, leaveType });

export const getMyRequests = (staffId) =>
  api.get(`/staff/requests/${staffId}`);

export const cancelMyRequest = (id) =>
  api.put(`/staff/requests/${id}/cancel`);

// ---------- Section Head ----------
export const getSectionHeadRequests = () =>
  api.get('/section-head/requests');

export const getSectionHeadHistory = () =>
  api.get('/section-head/history');

export const approveBySectionHead = (id, signature, notes = '') =>
  api.put(`/section-head/requests/${id}/approve`, { requestId: id, signature, notes });

export const rejectBySectionHead = (id, reason) =>
  api.put(`/section-head/requests/${id}/reject`, { requestId: id, rejectionReason: reason });

export const createStaffBySectionHead = (data) =>
  api.post('/section-head/staff', data);

export const getMyStaff = () =>                                  // <-- NEW
  api.get('/section-head/my-staff', { params: { _t: Date.now() } });

// ---------- Department Head ----------
export const getDeptHeadRequests = () =>
  api.get('/department-head/requests');

export const getDeptHeadHistory = () =>
  api.get('/department-head/history');

export const approveByDeptHead = (id, signature, notes = '') =>
  api.put(`/department-head/requests/${id}/approve`, { requestId: id, signature, notes });

export const rejectByDeptHead = (id, reason) =>
  api.put(`/department-head/requests/${id}/reject`, { requestId: id, rejectionReason: reason });

export const createStaffByDeptHead = (data) =>
  api.post('/department-head/staff', data);

export const getMySectionHeads = () =>                            // <-- NEW
  api.get('/department-head/my-section-heads', { params: { _t: Date.now() } });

// ---------- Profile ----------
export const getMyProfile = () =>
  api.get('/profile/me', { params: { _t: Date.now() } });

export const uploadMySignature = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/profile/signature', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteMySignature = () =>
  api.delete('/profile/signature');

export const getSignatureBlob = async (staffId) => {
  const res = await api.get(`/profile/signature/${staffId}`, {
    responseType: 'blob',
    params: { _t: Date.now() },
  });
  return URL.createObjectURL(res.data);
};

// ---------- Dashboard (admin) ----------
export const getDashboardStats = () =>
  api.get('/dashboard');