import api from './api';

export const adminLogin = (email, password) =>
  api.post('/admin/login', { email, password });

export const staffLogin = (staffId, password) =>
  api.post('/login', { staffId, password });

export const resetPassword = (staffId, oldPassword, newPassword) =>
  api.post('/staff/reset-password', { staffId, oldPassword, newPassword });

export const createStaff = (staffData) =>
  api.post('/admin/staff', staffData);

export const getLeaveRequests = (status) =>
  api.get('/admin/requests', { params: { status } });

export const updateRequestStatus = (id, status, adminRemarks) =>
  api.put(`/admin/requests/${id}/status`, { status, adminRemarks });

export const submitLeaveRequest = (staffId, reason, returnDateTime) =>
  api.post('/staff/leave-request', { staffId, reason, returnDateTime });