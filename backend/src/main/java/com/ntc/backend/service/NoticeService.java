package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveNotice;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.NoticeType;
import com.ntc.backend.repository.LeaveNoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class NoticeService {

    @Autowired private LeaveNoticeRepository noticeRepository;

    @Transactional
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

        // Snapshot: staff (key=value lines, no JSON library needed)
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

        // Snapshot: section head
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

        // Snapshot: office incharge
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

        // Snapshot: leave summary
        StringBuilder s = new StringBuilder();
        s.append("leaveType=").append(request.getLeaveType() != null ? request.getLeaveType().name() : "").append("\n");
        s.append("leaveStartTime=").append(request.getLeaveStartTime() != null ? request.getLeaveStartTime().toString() : "").append("\n");
        s.append("returnDateTime=").append(request.getReturnDateTime() != null ? request.getReturnDateTime().toString() : "").append("\n");
        s.append("reason=").append(nz(request.getReason())).append("\n");
        n.setLeaveSummary(s.toString());

        // Signatures
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

        return noticeRepository.save(n);
    }

    /** Null-safe trim. */
    private String nz(String s) {
        return s == null ? "" : s.replace("\n", " ").trim();
    }
}