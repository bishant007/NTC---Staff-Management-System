package com.ntc.backend.dto;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.LeaveType;
import com.ntc.backend.enums.RequestStatus;

import java.time.Instant;

public class LeaveRequestResponseDTO {

    private Long id;
    private String reason;
    private Instant leaveStartTime;
    private Instant returnDateTime;
    private RequestStatus status;
    private LeaveType leaveType;
    private Instant createdAt;
    private Instant updatedAt;

    // Staff info
    private String staffName;
    private String staffId;
    private String staffEmail;
    private String staffDepartment;
    private String staffBranch;

    // Section Head info
    private String sectionHeadName;
    private String sectionHeadStaffId;
    private String sectionHeadSignature;
    private Instant sectionHeadApprovedAt;
    private String sectionHeadNotes;

    // Department Head info
    private String departmentHeadName;
    private String departmentHeadStaffId;
    private String departmentHeadSignature;
    private Instant departmentHeadApprovedAt;
    private String departmentHeadNotes;

    private String rejectionReason;
    private String adminRemarks;

    public LeaveRequestResponseDTO() {}

    /**
     * Convert entity -> DTO. Must be called inside a transaction because it
     * touches lazy-loaded Staff relations.
     */
    public static LeaveRequestResponseDTO from(LeaveRequest r) {
        LeaveRequestResponseDTO d = new LeaveRequestResponseDTO();
        d.id = r.getId();
        d.reason = r.getReason();
        d.leaveStartTime = r.getLeaveStartTime();
        d.returnDateTime = r.getReturnDateTime();
        d.status = r.getStatus();
        d.leaveType = r.getLeaveType();
        d.createdAt = r.getCreatedAt();
        d.updatedAt = r.getUpdatedAt();

        d.sectionHeadSignature = r.getSectionHeadSignature();
        d.sectionHeadApprovedAt = r.getSectionHeadApprovedAt();
        d.sectionHeadNotes = r.getSectionHeadNotes();

        d.departmentHeadSignature = r.getDepartmentHeadSignature();
        d.departmentHeadApprovedAt = r.getDepartmentHeadApprovedAt();
        d.departmentHeadNotes = r.getDepartmentHeadNotes();

        d.rejectionReason = r.getRejectionReason();
        d.adminRemarks = r.getAdminRemarks();

        Staff s = r.getStaff();
        if (s != null) {
            d.staffName = s.getFullName();
            d.staffId = s.getStaffId();
            d.staffEmail = s.getEmail();
            d.staffDepartment = s.getDepartment();
            d.staffBranch = s.getBranch();

            Staff sh = s.getSectionHead();
            if (sh != null) {
                d.sectionHeadName = sh.getFullName();
                d.sectionHeadStaffId = sh.getStaffId();
            }
            Staff dh = s.getDepartmentHead();
            if (dh != null) {
                d.departmentHeadName = dh.getFullName();
                d.departmentHeadStaffId = dh.getStaffId();
            }
        }
        return d;
    }

    // ---------- getters and setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Instant getLeaveStartTime() { return leaveStartTime; }
    public void setLeaveStartTime(Instant leaveStartTime) { this.leaveStartTime = leaveStartTime; }

    public Instant getReturnDateTime() { return returnDateTime; }
    public void setReturnDateTime(Instant returnDateTime) { this.returnDateTime = returnDateTime; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStaffEmail() { return staffEmail; }
    public void setStaffEmail(String staffEmail) { this.staffEmail = staffEmail; }

    public String getStaffDepartment() { return staffDepartment; }
    public void setStaffDepartment(String staffDepartment) { this.staffDepartment = staffDepartment; }

    public String getStaffBranch() { return staffBranch; }
    public void setStaffBranch(String staffBranch) { this.staffBranch = staffBranch; }

    public String getSectionHeadName() { return sectionHeadName; }
    public void setSectionHeadName(String sectionHeadName) { this.sectionHeadName = sectionHeadName; }

    public String getSectionHeadStaffId() { return sectionHeadStaffId; }
    public void setSectionHeadStaffId(String sectionHeadStaffId) { this.sectionHeadStaffId = sectionHeadStaffId; }

    public String getSectionHeadSignature() { return sectionHeadSignature; }
    public void setSectionHeadSignature(String sectionHeadSignature) { this.sectionHeadSignature = sectionHeadSignature; }

    public Instant getSectionHeadApprovedAt() { return sectionHeadApprovedAt; }
    public void setSectionHeadApprovedAt(Instant sectionHeadApprovedAt) { this.sectionHeadApprovedAt = sectionHeadApprovedAt; }

    public String getSectionHeadNotes() { return sectionHeadNotes; }
    public void setSectionHeadNotes(String sectionHeadNotes) { this.sectionHeadNotes = sectionHeadNotes; }

    public String getDepartmentHeadName() { return departmentHeadName; }
    public void setDepartmentHeadName(String departmentHeadName) { this.departmentHeadName = departmentHeadName; }

    public String getDepartmentHeadStaffId() { return departmentHeadStaffId; }
    public void setDepartmentHeadStaffId(String departmentHeadStaffId) { this.departmentHeadStaffId = departmentHeadStaffId; }

    public String getDepartmentHeadSignature() { return departmentHeadSignature; }
    public void setDepartmentHeadSignature(String departmentHeadSignature) { this.departmentHeadSignature = departmentHeadSignature; }

    public Instant getDepartmentHeadApprovedAt() { return departmentHeadApprovedAt; }
    public void setDepartmentHeadApprovedAt(Instant departmentHeadApprovedAt) { this.departmentHeadApprovedAt = departmentHeadApprovedAt; }

    public String getDepartmentHeadNotes() { return departmentHeadNotes; }
    public void setDepartmentHeadNotes(String departmentHeadNotes) { this.departmentHeadNotes = departmentHeadNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAdminRemarks() { return adminRemarks; }
    public void setAdminRemarks(String adminRemarks) { this.adminRemarks = adminRemarks; }
}