import api from './api';

// ---- Auth ----
export const unifiedLogin = (username, password) =>
  api.post('/auth/login', { username, password });

// ---- Admin ----
export const createStaff = (data) => api.post('/admin/staff', data);
export const getAllStaff = () => api.get('/admin/staff');
export const getStaffByStaffId = (id) => api.get(`/admin/staff/${id}`);
export const updateStaff = (id, data) => api.put(`/admin/staff/${id}`, data);
export const getLeaveRequests = (status) =>
  api.get('/admin/requests', { params: { status } });
export const getDashboardStats = () => api.get('/dashboard');

// ---- Staff ----
export const resetPassword = (staffId, oldPassword, newPassword) =>
  api.post('/staff/reset-password', { staffId, oldPassword, newPassword });
export const submitLeaveRequest = (payload) =>
  api.post('/staff/leave-request', payload);
export const getMyRequests = (staffId) => api.get(`/staff/requests/${staffId}`);
export const cancelMyRequest = (id) => api.put(`/staff/requests/${id}/cancel`);

// ---- Section Head ----
export const getSectionHeadRequests = () => api.get('/section-head/requests');
export const getSectionHeadHistory = () => api.get('/section-head/history');
export const approveBySectionHead = (id, signature, notes = '') =>
  api.put(`/section-head/requests/${id}/approve`, { requestId: id, signature, notes });
export const rejectBySectionHead = (id, signature, reason) =>
  api.put(`/section-head/requests/${id}/reject`, { requestId: id, signature, rejectionReason: reason });
export const createStaffBySectionHead = (data) => api.post('/section-head/staff', data);
export const getMyStaff = () => api.get('/section-head/my-staff');

// ---- Office Incharge ----
export const getOfficeInchargeRequests = () => api.get('/office-incharge/requests');
export const getOfficeInchargeHistory = () => api.get('/office-incharge/history');
export const approveByOfficeIncharge = (id, signature, notes = '') =>
  api.put(`/office-incharge/requests/${id}/approve`, { requestId: id, signature, notes });
export const rejectByOfficeIncharge = (id, signature, reason) =>
  api.put(`/office-incharge/requests/${id}/reject`, { requestId: id, signature, rejectionReason: reason });
export const createStaffByOfficeIncharge = (data) => api.post('/office-incharge/staff', data);
export const getMySectionHeads = () => api.get('/office-incharge/my-section-heads');
export const getOfficeInchargeStaff = () => api.get('/office-incharge/my-staff');

// ---- Notices ----
export const getAllNotices = () => api.get('/notices');
export const getNotice = (id) => api.get(`/notices/${id}`);
export const getNoticeByRequest = (requestId) => api.get(`/notices/by-request/${requestId}`);

// ---- Reports ----
export const getAdminReport = (status) =>
  api.get('/reports/admin', { params: { status } });
export const getOfficeInchargeReport = () => api.get('/reports/office-incharge');
export const getSectionHeadReport = () => api.get('/reports/section-head');

// ---- Profile ----
export const getMyProfile = () => api.get('/profile/me');
export const uploadMySignature = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/profile/signature', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteMySignature = () => api.delete('/profile/signature');
export const getSignatureBlob = async (staffId) => {
  const res = await api.get(`/profile/signature/${staffId}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
};