package com.ntc.backend.dto;

import com.ntc.backend.enums.StaffRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class StaffCreateDTO {

    @NotBlank private String fullName;
    @NotBlank private String phone;
    @NotBlank @Email private String email;
    @NotBlank private String department;
    @NotBlank private String branch;

    /** Optional manually-entered Staff ID. Blank → auto-generate. */
    private String staffId;

    private StaffRole role;

    private String sectionHeadId;
    private String officeInchargeId;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public StaffRole getRole() { return role; }
    public void setRole(StaffRole role) { this.role = role; }

    public String getSectionHeadId() { return sectionHeadId; }
    public void setSectionHeadId(String sectionHeadId) { this.sectionHeadId = sectionHeadId; }

    public String getOfficeInchargeId() { return officeInchargeId; }
    public void setOfficeInchargeId(String officeInchargeId) { this.officeInchargeId = officeInchargeId; }
}