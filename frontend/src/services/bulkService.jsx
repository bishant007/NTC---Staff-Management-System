import api from './api';

// ---- Section Head ----
export const getUnassignedStaffForSH = () =>
  api.get('/section-head/bulk/unassigned-staff');

export const bulkAssignStaffToSH = (staffIds) =>
  api.post('/section-head/bulk/assign-staff', { staffIds });

export const bulkUnassignStaffFromSH = (staffIds) =>
  api.post('/section-head/bulk/unassign-staff', { staffIds });

// ---- Office Incharge ----
export const getUnassignedSHsForOI = () =>
  api.get('/office-incharge/bulk/unassigned-section-heads');

export const getUnassignedStaffForOI = () =>
  api.get('/office-incharge/bulk/unassigned-staff');

export const getMySHsForOI = () =>
  api.get('/office-incharge/bulk/my-section-heads');

export const getStaffUnderMySHs = () =>
  api.get('/office-incharge/bulk/staff-under-my-shs');

export const bulkAssignSHsToOI = (staffIds) =>
  api.post('/office-incharge/bulk/assign-section-heads', { staffIds });

export const bulkUnassignSHsFromOI = (staffIds) =>
  api.post('/office-incharge/bulk/unassign-section-heads', { staffIds });

export const bulkAssignStaffToSHByOI = (staffIds, sectionHeadId) =>
  api.post('/office-incharge/bulk/assign-staff-to-sh', { staffIds, sectionHeadId });

export const bulkUnassignStaffFromSHByOI = (staffIds) =>
  api.post('/office-incharge/bulk/unassign-staff-from-sh', { staffIds });

// ---- Admin ----
export const getUnassignedForAdmin = (role, unassignedFrom) =>
  api.get('/admin/bulk/unassigned', {
    params: { ...(role && { role }), ...(unassignedFrom && { unassignedFrom }) },
  });

export const adminBulkAssign = (staffIds, sectionHeadId, officeInchargeId) =>
  api.post('/admin/bulk/assign', {
    staffIds,
    ...(sectionHeadId && { sectionHeadId }),
    ...(officeInchargeId && { officeInchargeId }),
  });

export const adminBulkUnassign = (staffIds, clearSectionHead, clearOfficeIncharge) =>
  api.post('/admin/bulk/unassign', {
    staffIds,
    ...(clearSectionHead && { clearSectionHead: true }),
    ...(clearOfficeIncharge && { clearOfficeIncharge: true }),
  });