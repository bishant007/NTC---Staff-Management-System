package com.ntc.backend.dto;

import com.ntc.backend.entity.Staff;

public class StaffResponseDTO {
    public Long id;
    public String staffId;
    public String username;
    public String fullName;
    public String email;
    public String phone;
    public String department;
    public String branch;
    public String role;
    public String sectionHeadStaffId;
    public String sectionHeadName;
    public String officeInchargeStaffId;
    public String officeInchargeName;
    public boolean hasSignature;

    public static StaffResponseDTO from(Staff s) {
        StaffResponseDTO d = new StaffResponseDTO();
        d.id = s.getId();
        d.staffId = s.getStaffId();
        d.username = s.getUsername();
        d.fullName = s.getFullName();
        d.email = s.getEmail();
        d.phone = s.getPhone();
        d.department = s.getDepartment();
        d.branch = s.getBranch();
        d.role = s.getRole() != null ? s.getRole().name() : null;
        if (s.getSectionHead() != null) {
            d.sectionHeadStaffId = s.getSectionHead().getStaffId();
            d.sectionHeadName = s.getSectionHead().getFullName();
        }
        if (s.getOfficeIncharge() != null) {
            d.officeInchargeStaffId = s.getOfficeIncharge().getStaffId();
            d.officeInchargeName = s.getOfficeIncharge().getFullName();
        }
        d.hasSignature = s.getSignaturePath() != null;
        return d;
    }
}