package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveNotice;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.NoticeType;
import com.ntc.backend.repository.LeaveNoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class NoticeService {

    private static final ZoneId NEPAL_ZONE = ZoneId.of("Asia/Kathmandu");
    private static final DateTimeFormatter NEPAL_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(NEPAL_ZONE);

    @Autowired private LeaveNoticeRepository noticeRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LeaveNotice generateNotice(LeaveRequest request, NoticeType type, String decisionByRole, String remarks) {
        var existing = noticeRepository.findByLeaveRequest(request);
        if (existing.isPresent()) return existing.get();

        LeaveNotice n = new LeaveNotice();
        n.setReferenceNumber(request.getReferenceNumber());
        n.setLeaveRequest(request);
        n.setNoticeType(type);
        n.setFinalDecisionByRole(decisionByRole);
        n.setDecisionRemarks(remarks);
        n.setDecisionDate(Instant.now());

        Staff staff = request.getStaff();

        StringBuilder sb = new StringBuilder();
        sb.append("staffId=").append(nz(staff.getStaffId())).append("\n");
        sb.append("username=").append(nz(staff.getUsername())).append("\n");
        sb.append("fullName=").append(nz(staff.getFullName())).append("\n");
        sb.append("email=").append(nz(staff.getEmail())).append("\n");
        sb.append("phone=").append(nz(staff.getPhone())).append("\n");
        sb.append("department=").append(nz(staff.getDepartment())).append("\n");
        sb.append("branch=").append(nz(staff.getBranch())).append("\n");
        sb.append("role=").append(staff.getRole() != null ? staff.getRole().name() : "").append("\n");
        n.setStaffSnapshot(sb.toString());

        if (staff.getSectionHead() != null) {
            Staff sh = staff.getSectionHead();
            StringBuilder h = new StringBuilder();
            h.append("staffId=").append(nz(sh.getStaffId())).append("\n");
            h.append("username=").append(nz(sh.getUsername())).append("\n");
            h.append("fullName=").append(nz(sh.getFullName())).append("\n");
            h.append("department=").append(nz(sh.getDepartment())).append("\n");
            h.append("branch=").append(nz(sh.getBranch())).append("\n");
            n.setSectionHeadSnapshot(h.toString());
        }

        if (staff.getOfficeIncharge() != null) {
            Staff oi = staff.getOfficeIncharge();
            StringBuilder o = new StringBuilder();
            o.append("staffId=").append(nz(oi.getStaffId())).append("\n");
            o.append("username=").append(nz(oi.getUsername())).append("\n");
            o.append("fullName=").append(nz(oi.getFullName())).append("\n");
            o.append("department=").append(nz(oi.getDepartment())).append("\n");
            o.append("branch=").append(nz(oi.getBranch())).append("\n");
            n.setOfficeInchargeSnapshot(o.toString());
        }

        StringBuilder s = new StringBuilder();
        s.append("category=").append(request.getCategory() != null
                ? request.getCategory().name().replace("_", " ")
                : "PERSONAL").append("\n");
        s.append("leaveType=").append(request.getLeaveType() != null
                ? request.getLeaveType().prettyLabel()
                : "").append("\n");
        if (request.getCustomLeaveType() != null && !request.getCustomLeaveType().isBlank()) {
            s.append("customLeaveType=").append(nz(request.getCustomLeaveType())).append("\n");
        }
        s.append("leaveStartTime=")
                .append(request.getLeaveStartTime() != null ? NEPAL_FMT.format(request.getLeaveStartTime()) : "")
                .append("\n");
        s.append("returnDateTime=")
                .append(request.getReturnDateTime() != null ? NEPAL_FMT.format(request.getReturnDateTime()) : "")
                .append("\n");
        s.append("durationDays=").append(request.getDurationDays() != null
                ? request.getDurationDays()
                : "—").append("\n");
        s.append("reason=").append(nz(request.getReason())).append("\n");
        n.setLeaveSummary(s.toString());

        n.setStaffSignature(request.getStaffSignature());
        n.setSectionHeadSignature(
                request.getSectionHeadSignature() != null
                        ? request.getSectionHeadSignature()
                        : request.getSectionHeadRejectSignature()
        );
        n.setOfficeInchargeSignature(
                request.getOfficeInchargeSignature() != null
                        ? request.getOfficeInchargeSignature()
                        : request.getOfficeInchargeRejectSignature()
        );

        n.setStaffSignatureImage(request.getStaffSignatureImage());
        n.setSectionHeadSignatureImage(request.getSectionHeadSignatureImage());
        n.setOfficeInchargeSignatureImage(request.getOfficeInchargeSignatureImage());

        return noticeRepository.save(n);
    }

    private String nz(String s) {
        return s == null ? "" : s.replace("\n", " ").trim();
    }
}