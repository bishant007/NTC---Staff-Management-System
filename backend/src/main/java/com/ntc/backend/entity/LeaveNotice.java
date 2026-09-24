package com.ntc.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ntc.backend.enums.NoticeType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "leave_notices")
public class LeaveNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_number", unique = true, nullable = false)
    private String referenceNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_request_id", unique = true, nullable = false)
    @JsonIgnore
    private LeaveRequest leaveRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "notice_type", nullable = false)
    private NoticeType noticeType;

    @Column(name = "final_decision_by_role", nullable = false)
    private String finalDecisionByRole;

    @Column(name = "staff_snapshot", columnDefinition = "TEXT")
    private String staffSnapshot;

    @Column(name = "section_head_snapshot", columnDefinition = "TEXT")
    private String sectionHeadSnapshot;

    @Column(name = "office_incharge_snapshot", columnDefinition = "TEXT")
    private String officeInchargeSnapshot;

    @Column(name = "leave_summary", columnDefinition = "TEXT")
    private String leaveSummary;

    @Column(name = "decision_remarks", columnDefinition = "TEXT")
    private String decisionRemarks;

    @Column(name = "staff_signature", columnDefinition = "TEXT")
    private String staffSignature;

    @Column(name = "section_head_signature", columnDefinition = "TEXT")
    private String sectionHeadSignature;

    @Column(name = "office_incharge_signature", columnDefinition = "TEXT")
    private String officeInchargeSignature;

    @Column(name = "decision_date")
    private Instant decisionDate;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public LeaveNotice() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public LeaveRequest getLeaveRequest() { return leaveRequest; }
    public void setLeaveRequest(LeaveRequest leaveRequest) { this.leaveRequest = leaveRequest; }

    public NoticeType getNoticeType() { return noticeType; }
    public void setNoticeType(NoticeType noticeType) { this.noticeType = noticeType; }

    public String getFinalDecisionByRole() { return finalDecisionByRole; }
    public void setFinalDecisionByRole(String finalDecisionByRole) { this.finalDecisionByRole = finalDecisionByRole; }

    public String getStaffSnapshot() { return staffSnapshot; }
    public void setStaffSnapshot(String staffSnapshot) { this.staffSnapshot = staffSnapshot; }

    public String getSectionHeadSnapshot() { return sectionHeadSnapshot; }
    public void setSectionHeadSnapshot(String sectionHeadSnapshot) { this.sectionHeadSnapshot = sectionHeadSnapshot; }

    public String getOfficeInchargeSnapshot() { return officeInchargeSnapshot; }
    public void setOfficeInchargeSnapshot(String officeInchargeSnapshot) { this.officeInchargeSnapshot = officeInchargeSnapshot; }

    public String getLeaveSummary() { return leaveSummary; }
    public void setLeaveSummary(String leaveSummary) { this.leaveSummary = leaveSummary; }

    public String getDecisionRemarks() { return decisionRemarks; }
    public void setDecisionRemarks(String decisionRemarks) { this.decisionRemarks = decisionRemarks; }

    public String getStaffSignature() { return staffSignature; }
    public void setStaffSignature(String staffSignature) { this.staffSignature = staffSignature; }

    public String getSectionHeadSignature() { return sectionHeadSignature; }
    public void setSectionHeadSignature(String sectionHeadSignature) { this.sectionHeadSignature = sectionHeadSignature; }

    public String getOfficeInchargeSignature() { return officeInchargeSignature; }
    public void setOfficeInchargeSignature(String officeInchargeSignature) { this.officeInchargeSignature = officeInchargeSignature; }

    public Instant getDecisionDate() { return decisionDate; }
    public void setDecisionDate(Instant decisionDate) { this.decisionDate = decisionDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}