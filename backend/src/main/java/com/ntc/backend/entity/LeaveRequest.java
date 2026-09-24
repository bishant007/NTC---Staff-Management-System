package com.ntc.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ntc.backend.enums.LeaveType;
import com.ntc.backend.enums.RequestStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_number", unique = true)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    @JsonIgnore
    private Staff staff;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "leave_start_time", nullable = false)
    private Instant leaveStartTime;

    @Column(name = "return_date_time", nullable = false)
    private Instant returnDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING_SECTION_HEAD;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    // Staff submission signature
    @Column(name = "staff_signature", columnDefinition = "TEXT")
    private String staffSignature;
    @Column(name = "staff_signed_at")
    private Instant staffSignedAt;

    // Section Head forward
    @Column(name = "section_head_signature", columnDefinition = "TEXT")
    private String sectionHeadSignature;
    @Column(name = "section_head_approved_at")
    private Instant sectionHeadApprovedAt;
    @Column(name = "section_head_notes", columnDefinition = "TEXT")
    private String sectionHeadNotes;

    // Section Head reject
    @Column(name = "section_head_reject_signature", columnDefinition = "TEXT")
    private String sectionHeadRejectSignature;
    @Column(name = "section_head_rejected_at")
    private Instant sectionHeadRejectedAt;

    // Office Incharge final approve
    @Column(name = "office_incharge_signature", columnDefinition = "TEXT")
    private String officeInchargeSignature;
    @Column(name = "office_incharge_approved_at")
    private Instant officeInchargeApprovedAt;
    @Column(name = "office_incharge_notes", columnDefinition = "TEXT")
    private String officeInchargeNotes;

    // Office Incharge reject
    @Column(name = "office_incharge_reject_signature", columnDefinition = "TEXT")
    private String officeInchargeRejectSignature;
    @Column(name = "office_incharge_rejected_at")
    private Instant officeInchargeRejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "admin_remarks", columnDefinition = "TEXT")
    private String adminRemarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public LeaveRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public Staff getStaff() { return staff; }
    public void setStaff(Staff staff) { this.staff = staff; }

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

    public String getStaffSignature() { return staffSignature; }
    public void setStaffSignature(String staffSignature) { this.staffSignature = staffSignature; }

    public Instant getStaffSignedAt() { return staffSignedAt; }
    public void setStaffSignedAt(Instant staffSignedAt) { this.staffSignedAt = staffSignedAt; }

    public String getSectionHeadSignature() { return sectionHeadSignature; }
    public void setSectionHeadSignature(String sectionHeadSignature) { this.sectionHeadSignature = sectionHeadSignature; }

    public Instant getSectionHeadApprovedAt() { return sectionHeadApprovedAt; }
    public void setSectionHeadApprovedAt(Instant sectionHeadApprovedAt) { this.sectionHeadApprovedAt = sectionHeadApprovedAt; }

    public String getSectionHeadNotes() { return sectionHeadNotes; }
    public void setSectionHeadNotes(String sectionHeadNotes) { this.sectionHeadNotes = sectionHeadNotes; }

    public String getSectionHeadRejectSignature() { return sectionHeadRejectSignature; }
    public void setSectionHeadRejectSignature(String s) { this.sectionHeadRejectSignature = s; }

    public Instant getSectionHeadRejectedAt() { return sectionHeadRejectedAt; }
    public void setSectionHeadRejectedAt(Instant t) { this.sectionHeadRejectedAt = t; }

    public String getOfficeInchargeSignature() { return officeInchargeSignature; }
    public void setOfficeInchargeSignature(String officeInchargeSignature) { this.officeInchargeSignature = officeInchargeSignature; }

    public Instant getOfficeInchargeApprovedAt() { return officeInchargeApprovedAt; }
    public void setOfficeInchargeApprovedAt(Instant officeInchargeApprovedAt) { this.officeInchargeApprovedAt = officeInchargeApprovedAt; }

    public String getOfficeInchargeNotes() { return officeInchargeNotes; }
    public void setOfficeInchargeNotes(String officeInchargeNotes) { this.officeInchargeNotes = officeInchargeNotes; }

    public String getOfficeInchargeRejectSignature() { return officeInchargeRejectSignature; }
    public void setOfficeInchargeRejectSignature(String s) { this.officeInchargeRejectSignature = s; }

    public Instant getOfficeInchargeRejectedAt() { return officeInchargeRejectedAt; }
    public void setOfficeInchargeRejectedAt(Instant t) { this.officeInchargeRejectedAt = t; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAdminRemarks() { return adminRemarks; }
    public void setAdminRemarks(String adminRemarks) { this.adminRemarks = adminRemarks; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}