package com.ntc.backend.dto;

import com.ntc.backend.entity.Staff;

public class StaffResponseDTO {
    private Long id;
    private String staffId;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String branch;
    private String role;
    private String sectionHeadStaffId;
    private String departmentHeadStaffId;

    public static StaffResponseDTO from(Staff s) {
        StaffResponseDTO d = new StaffResponseDTO();
        d.id = s.getId();
        d.staffId = s.getStaffId();
        d.fullName = s.getFullName();
        d.email = s.getEmail();
        d.phone = s.getPhone();
        d.department = s.getDepartment();
        d.branch = s.getBranch();
        d.role = s.getRole().name();
        if (s.getSectionHead() != null) d.sectionHeadStaffId = s.getSectionHead().getStaffId();
        if (s.getDepartmentHead() != null) d.departmentHeadStaffId = s.getDepartmentHead().getStaffId();
        return d;
    }

    // getters only (no setters needed for read-only DTO)
    public Long getId() { return id; }
    public String getStaffId() { return staffId; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getDepartment() { return department; }
    public String getBranch() { return branch; }
    public String getRole() { return role; }
    public String getSectionHeadStaffId() { return sectionHeadStaffId; }
    public String getDepartmentHeadStaffId() { return departmentHeadStaffId; }
}