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
    public String staffSignature;
    public String sectionHeadSignature;
    public String officeInchargeSignature;
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
        d.decisionDate = n.getDecisionDate();
        d.createdAt = n.getCreatedAt();
        return d;
    }
}