package com.ntc.backend.dto;

import com.ntc.backend.entity.LeaveRequest;

import java.time.Instant;

public class LeaveRequestResponseDTO {
    public Long id;
    public String referenceNumber;
    public String staffId;
    public String staffName;
    public String staffUsername;
    public String staffEmail;
    public String staffDepartment;
    public String staffBranch;
    public String staffRole;

    public String reason;
    public Instant leaveStartTime;
    public Instant returnDateTime;
    public String status;
    public String leaveType;

    public String staffSignature;
    public Instant staffSignedAt;

    public String sectionHeadSignature;
    public Instant sectionHeadApprovedAt;
    public String sectionHeadNotes;
    public String sectionHeadName;
    public String sectionHeadStaffId;

    public String officeInchargeSignature;
    public Instant officeInchargeApprovedAt;
    public String officeInchargeNotes;
    public String officeInchargeName;
    public String officeInchargeStaffId;

    public String rejectionReason;
    public Instant createdAt;
    public Instant updatedAt;
    public boolean hasNotice;

    // Snapshot of signature images at time of action
    public String staffSignatureImage;
    public String sectionHeadSignatureImage;
    public String officeInchargeSignatureImage;

    public static LeaveRequestResponseDTO from(LeaveRequest r) {
        LeaveRequestResponseDTO d = new LeaveRequestResponseDTO();
        d.id = r.getId();
        d.referenceNumber = r.getReferenceNumber();
        if (r.getStaff() != null) {
            d.staffId = r.getStaff().getStaffId();
            d.staffName = r.getStaff().getFullName();
            d.staffUsername = r.getStaff().getUsername();
            d.staffEmail = r.getStaff().getEmail();
            d.staffDepartment = r.getStaff().getDepartment();
            d.staffBranch = r.getStaff().getBranch();
            d.staffRole = r.getStaff().getRole() != null ? r.getStaff().getRole().name() : null;
            if (r.getStaff().getSectionHead() != null) {
                d.sectionHeadName = r.getStaff().getSectionHead().getFullName();
                d.sectionHeadStaffId = r.getStaff().getSectionHead().getStaffId();
            }
            if (r.getStaff().getOfficeIncharge() != null) {
                d.officeInchargeName = r.getStaff().getOfficeIncharge().getFullName();
                d.officeInchargeStaffId = r.getStaff().getOfficeIncharge().getStaffId();
            }
        }
        d.reason = r.getReason();
        d.leaveStartTime = r.getLeaveStartTime();
        d.returnDateTime = r.getReturnDateTime();
        d.status = r.getStatus() != null ? r.getStatus().name() : null;
        d.leaveType = r.getLeaveType() != null ? r.getLeaveType().name() : null;
        d.staffSignature = r.getStaffSignature();
        d.staffSignedAt = r.getStaffSignedAt();
        d.sectionHeadSignature = r.getSectionHeadSignature();
        d.sectionHeadApprovedAt = r.getSectionHeadApprovedAt();
        d.sectionHeadNotes = r.getSectionHeadNotes();
        d.officeInchargeSignature = r.getOfficeInchargeSignature();
        d.officeInchargeApprovedAt = r.getOfficeInchargeApprovedAt();
        d.officeInchargeNotes = r.getOfficeInchargeNotes();
        d.rejectionReason = r.getRejectionReason();
        d.createdAt = r.getCreatedAt();
        d.updatedAt = r.getUpdatedAt();
        d.staffSignatureImage = r.getStaffSignatureImage();
        d.sectionHeadSignatureImage = r.getSectionHeadSignatureImage();
        d.officeInchargeSignatureImage = r.getOfficeInchargeSignatureImage();
        return d;
    }
}