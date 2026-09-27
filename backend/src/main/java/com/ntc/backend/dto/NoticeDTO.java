package com.ntc.backend.dto;

import com.ntc.backend.entity.LeaveNotice;
import java.time.Instant;

public class NoticeDTO {
    public Long id;
    public String referenceNumber;
    public Long leaveRequestId;
    public String noticeType;
    public String finalDecisionByRole;
    public String staffSnapshot;
    public String sectionHeadSnapshot;
    public String officeInchargeSnapshot;
    public String leaveSummary;
    public String decisionRemarks;

    // Typed-name signatures (fallback / human-readable)
    public String staffSignature;
    public String sectionHeadSignature;
    public String officeInchargeSignature;

    // NEW: Image filename snapshots for the PDF
    public String staffSignatureImage;
    public String sectionHeadSignatureImage;
    public String officeInchargeSignatureImage;

    public Instant decisionDate;
    public Instant createdAt;

    public static NoticeDTO from(LeaveNotice n) {
        NoticeDTO d = new NoticeDTO();
        d.id = n.getId();
        d.referenceNumber = n.getReferenceNumber();
        d.leaveRequestId = n.getLeaveRequest() != null ? n.getLeaveRequest().getId() : null;
        d.noticeType = n.getNoticeType() != null ? n.getNoticeType().name() : null;
        d.finalDecisionByRole = n.getFinalDecisionByRole();
        d.staffSnapshot = n.getStaffSnapshot();
        d.sectionHeadSnapshot = n.getSectionHeadSnapshot();
        d.officeInchargeSnapshot = n.getOfficeInchargeSnapshot();
        d.leaveSummary = n.getLeaveSummary();
        d.decisionRemarks = n.getDecisionRemarks();
        d.staffSignature = n.getStaffSignature();
        d.sectionHeadSignature = n.getSectionHeadSignature();
        d.officeInchargeSignature = n.getOfficeInchargeSignature();

        // NEW — will fail to compile until LeaveNotice has these getters
        d.staffSignatureImage = n.getStaffSignatureImage();
        d.sectionHeadSignatureImage = n.getSectionHeadSignatureImage();
        d.officeInchargeSignatureImage = n.getOfficeInchargeSignatureImage();

        d.decisionDate = n.getDecisionDate();
        d.createdAt = n.getCreatedAt();
        return d;
    }
}