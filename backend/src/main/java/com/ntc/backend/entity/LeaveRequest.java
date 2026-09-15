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

    // ===== Section Head approval =====
    @Column(name = "section_head_signature")
    private String sectionHeadSignature;

    @Column(name = "section_head_approved_at")
    private Instant sectionHeadApprovedAt;

    @Column(name = "section_head_notes", columnDefinition = "TEXT")
    private String sectionHeadNotes;

    // ===== Department Head approval =====
    @Column(name = "department_head_signature")
    private String departmentHeadSignature;

    @Column(name = "department_head_approved_at")
    private Instant departmentHeadApprovedAt;

    @Column(name = "department_head_notes", columnDefinition = "TEXT")
    private String departmentHeadNotes;

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

    // ---------- getters and setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getSectionHeadSignature() { return sectionHeadSignature; }
    public void setSectionHeadSignature(String sectionHeadSignature) { this.sectionHeadSignature = sectionHeadSignature; }

    public Instant getSectionHeadApprovedAt() { return sectionHeadApprovedAt; }
    public void setSectionHeadApprovedAt(Instant sectionHeadApprovedAt) { this.sectionHeadApprovedAt = sectionHeadApprovedAt; }

    public String getSectionHeadNotes() { return sectionHeadNotes; }
    public void setSectionHeadNotes(String sectionHeadNotes) { this.sectionHeadNotes = sectionHeadNotes; }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}