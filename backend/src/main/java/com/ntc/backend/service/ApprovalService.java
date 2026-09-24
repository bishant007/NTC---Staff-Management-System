package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.NoticeType;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ApprovalService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;
    @Autowired private NoticeService noticeService;

    // ============ SECTION HEAD ============
    @Transactional
    public void approveBySectionHead(Long requestId, String signature, String notes, String username) {
        LeaveRequest r = get(requestId);
        if (r.getStatus() != RequestStatus.PENDING_SECTION_HEAD)
            throw new RuntimeException("Request is not pending for Section Head");

        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        Staff owner = r.getStaff();
        if (owner.getSectionHead() == null || !owner.getSectionHead().getId().equals(head.getId()))
            throw new RuntimeException("You are not the assigned Section Head for this staff");

        r.setSectionHeadSignature(signature);
        r.setSectionHeadNotes(notes);
        r.setSectionHeadApprovedAt(Instant.now());
        r.setStatus(RequestStatus.PENDING_OFFICE_INCHARGE);
        leaveRequestRepository.save(r);

        try {
            emailService.sendRequestStatusUpdate(owner.getEmail(), owner.getFullName(),
                    r.getReferenceNumber(), "Forwarded to Office Incharge",
                    "Your request has been reviewed and forwarded by the Section Head.");
        } catch (Exception ignored) {}
    }

    @Transactional
    public void rejectBySectionHead(Long requestId, String signature, String reason, String username) {
        LeaveRequest r = get(requestId);
        if (r.getStatus() != RequestStatus.PENDING_SECTION_HEAD)
            throw new RuntimeException("Request is not pending for Section Head");

        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        Staff owner = r.getStaff();
        if (owner.getSectionHead() == null || !owner.getSectionHead().getId().equals(head.getId()))
            throw new RuntimeException("You are not the assigned Section Head for this staff");

        r.setSectionHeadRejectSignature(signature);
        r.setSectionHeadRejectedAt(Instant.now());
        r.setRejectionReason(reason);
        r.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(r);

        noticeService.generateNotice(r, NoticeType.REJECTION, "SECTION_HEAD", reason);

        try {
            emailService.sendRequestStatusUpdate(owner.getEmail(), owner.getFullName(),
                    r.getReferenceNumber(), "REJECTED",
                    "Rejected by Section Head. Reason: " + reason);
        } catch (Exception ignored) {}
    }

    // ============ OFFICE INCHARGE ============
    @Transactional
    public void approveByOfficeIncharge(Long requestId, String signature, String notes, String username) {
        LeaveRequest r = get(requestId);
        if (r.getStatus() != RequestStatus.PENDING_OFFICE_INCHARGE
                && r.getStatus() != RequestStatus.PENDING_SELF_APPROVAL)
            throw new RuntimeException("Request is not pending for Office Incharge");

        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        Staff owner = r.getStaff();

        // For self-leave, owner == oi. For others, verify assigned.
        if (!owner.getId().equals(oi.getId())) {
            if (owner.getOfficeIncharge() == null || !owner.getOfficeIncharge().getId().equals(oi.getId()))
                throw new RuntimeException("You are not the assigned Office Incharge for this staff");
        }

        r.setOfficeInchargeSignature(signature);
        r.setOfficeInchargeNotes(notes);
        r.setOfficeInchargeApprovedAt(Instant.now());
        r.setStatus(RequestStatus.APPROVED);
        leaveRequestRepository.save(r);

        try { leaveBalanceService.deductLeave(owner, r.getLeaveType(), 1); } catch (Exception ignored) {}

        noticeService.generateNotice(r, NoticeType.APPROVAL, "OFFICE_INCHARGE", notes);

        try {
            emailService.sendRequestStatusUpdate(owner.getEmail(), owner.getFullName(),
                    r.getReferenceNumber(), "APPROVED",
                    "Your leave request has been approved by the Office Incharge.");
        } catch (Exception ignored) {}
    }

    @Transactional
    public void rejectByOfficeIncharge(Long requestId, String signature, String reason, String username) {
        LeaveRequest r = get(requestId);
        if (r.getStatus() != RequestStatus.PENDING_OFFICE_INCHARGE
                && r.getStatus() != RequestStatus.PENDING_SELF_APPROVAL)
            throw new RuntimeException("Request is not pending for Office Incharge");

        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        Staff owner = r.getStaff();

        if (!owner.getId().equals(oi.getId())) {
            if (owner.getOfficeIncharge() == null || !owner.getOfficeIncharge().getId().equals(oi.getId()))
                throw new RuntimeException("You are not the assigned Office Incharge for this staff");
        }

        r.setOfficeInchargeRejectSignature(signature);
        r.setOfficeInchargeRejectedAt(Instant.now());
        r.setRejectionReason(reason);
        r.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(r);

        noticeService.generateNotice(r, NoticeType.REJECTION, "OFFICE_INCHARGE", reason);

        try {
            emailService.sendRequestStatusUpdate(owner.getEmail(), owner.getFullName(),
                    r.getReferenceNumber(), "REJECTED",
                    "Rejected by Office Incharge. Reason: " + reason);
        } catch (Exception ignored) {}
    }

    private LeaveRequest get(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
    }
}