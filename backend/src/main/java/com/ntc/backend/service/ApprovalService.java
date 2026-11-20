package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.enums.NoticeType;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;

@Service
public class ApprovalService {

    private static final Logger log = LoggerFactory.getLogger(ApprovalService.class);

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;
    @Autowired private NoticeService noticeService;
    @Autowired private AuditLogService auditLogService;

    // ============ SECTION HEAD — APPROVE ============
    @Transactional
    public void approveBySectionHead(Long requestId, String signature, String notes, String username) {
        LeaveRequest r = get(requestId);

        // Idempotency: already forwarded → success
        if (r.getStatus() == RequestStatus.PENDING_OFFICE_INCHARGE
                && r.getSectionHeadApprovedAt() != null) {
            log.info("Request {} already forwarded by SH — ignoring duplicate call", r.getReferenceNumber());
            return;
        }
        // Idempotency: already decided → error
        if (r.getStatus() == RequestStatus.APPROVED || r.getStatus() == RequestStatus.REJECTED
                || r.getStatus() == RequestStatus.CANCELLED) {
            throw new RuntimeException("This request has already been finalized.");
        }

        RequestStatus effective = LeaveRequestService.effectiveStatus(r);
        if (effective != RequestStatus.PENDING_SECTION_HEAD)
            throw new RuntimeException("Request is not pending for Section Head");

        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        if (head.getSignaturePath() == null || head.getSignaturePath().isBlank())
            throw new RuntimeException("You must upload your digital signature before approving. Go to My Profile.");

        Staff owner = r.getStaff();
        if (owner.getSectionHead() == null || !owner.getSectionHead().getId().equals(head.getId()))
            throw new RuntimeException("You are not the assigned Section Head for this staff");

        LeaveRequestService.clearHold(r);
        r.setSectionHeadSignature(signature != null ? signature : head.getFullName());
        r.setSectionHeadSignatureImage(head.getSignaturePath());
        r.setSectionHeadNotes(notes);
        r.setSectionHeadApprovedAt(Instant.now());
        r.setStatus(RequestStatus.PENDING_OFFICE_INCHARGE);
        leaveRequestRepository.save(r);

        final String ownerEmail = owner.getEmail();
        final String ownerName  = owner.getFullName();
        final String ref        = r.getReferenceNumber();
        final Long   reqId      = r.getId();

        try {
            auditLogService.record(username, AuditAction.LEAVE_APPROVED_SECTION_HEAD,
                    "LEAVE_REQUEST", String.valueOf(reqId), ref, "Forwarded to Office In-Charge");
        } catch (Exception ignored) {}

        afterCommit("SH-approve:email", () ->
                emailService.sendRequestStatusUpdate(ownerEmail, ownerName, ref,
                        "Forwarded to Office Incharge",
                        "Your request has been reviewed and forwarded by the Section Head."));
    }

    // ============ SECTION HEAD — REJECT ============
    @Transactional
    public void rejectBySectionHead(Long requestId, String signature, String reason, String username) {
        LeaveRequest r = get(requestId);

        if (r.getStatus() == RequestStatus.REJECTED) {
            log.info("Request {} already rejected — ignoring duplicate call", r.getReferenceNumber());
            return;
        }
        if (r.getStatus() == RequestStatus.APPROVED || r.getStatus() == RequestStatus.CANCELLED)
            throw new RuntimeException("This request has already been finalized.");

        RequestStatus effective = LeaveRequestService.effectiveStatus(r);
        if (effective != RequestStatus.PENDING_SECTION_HEAD)
            throw new RuntimeException("Request is not pending for Section Head");

        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        if (head.getSignaturePath() == null || head.getSignaturePath().isBlank())
            throw new RuntimeException("You must upload your digital signature before rejecting. Go to My Profile.");

        Staff owner = r.getStaff();
        if (owner.getSectionHead() == null || !owner.getSectionHead().getId().equals(head.getId()))
            throw new RuntimeException("You are not the assigned Section Head for this staff");

        LeaveRequestService.clearHold(r);
        r.setSectionHeadRejectSignature(signature);
        r.setSectionHeadSignatureImage(head.getSignaturePath());
        r.setSectionHeadRejectedAt(Instant.now());
        r.setRejectionReason(reason);
        r.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(r);

        owner.getSectionHead();
        owner.getOfficeIncharge();

        final LeaveRequest savedR    = r;
        final String       ownerEmail = owner.getEmail();
        final String       ownerName  = owner.getFullName();
        final String       ref        = r.getReferenceNumber();

        try {
            auditLogService.record(username, AuditAction.LEAVE_REJECTED_SECTION_HEAD,
                    "LEAVE_REQUEST", String.valueOf(r.getId()), ref, "Rejected: " + reason);
        } catch (Exception ignored) {}

        afterCommit("SH-reject:notice", () ->
                noticeService.generateNotice(savedR, NoticeType.REJECTION, "SECTION_HEAD", reason));
        afterCommit("SH-reject:email", () ->
                emailService.sendRequestStatusUpdate(ownerEmail, ownerName, ref, "REJECTED",
                        "Rejected by Section Head. Reason: " + reason));
    }

    // ============ OFFICE IN-CHARGE — APPROVE ============
    @Transactional
    public void approveByOfficeIncharge(Long requestId, String signature, String notes, String username) {
        LeaveRequest r = get(requestId);

        // Idempotency: already approved → success (this is the fix for the double-click 500)
        if (r.getStatus() == RequestStatus.APPROVED && r.getOfficeInchargeApprovedAt() != null) {
            log.info("Request {} already approved — ignoring duplicate call", r.getReferenceNumber());
            return;
        }
        if (r.getStatus() == RequestStatus.REJECTED || r.getStatus() == RequestStatus.CANCELLED)
            throw new RuntimeException("This request has already been finalized.");

        RequestStatus effective = LeaveRequestService.effectiveStatus(r);
        if (effective != RequestStatus.PENDING_OFFICE_INCHARGE
                && effective != RequestStatus.PENDING_SELF_APPROVAL)
            throw new RuntimeException("Request is not pending for Office Incharge");

        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        if (oi.getSignaturePath() == null || oi.getSignaturePath().isBlank())
            throw new RuntimeException("You must upload your digital signature before approving. Go to My Profile.");

        Staff owner = r.getStaff();
        if (!owner.getId().equals(oi.getId())) {
            if (owner.getOfficeIncharge() == null || !owner.getOfficeIncharge().getId().equals(oi.getId()))
                throw new RuntimeException("You are not the assigned Office Incharge for this staff");
        }

        LeaveRequestService.clearHold(r);
        r.setOfficeInchargeSignature(signature);
        r.setOfficeInchargeSignatureImage(oi.getSignaturePath());
        r.setOfficeInchargeNotes(notes);
        r.setOfficeInchargeApprovedAt(Instant.now());
        r.setStatus(RequestStatus.APPROVED);
        leaveRequestRepository.save(r);

        owner.getSectionHead();
        owner.getOfficeIncharge();

        final LeaveRequest savedR     = r;
        final Staff        savedOwner = owner;
        final String       ownerEmail = owner.getEmail();
        final String       ownerName  = owner.getFullName();
        final String       ref        = r.getReferenceNumber();

        try {
            auditLogService.record(username, AuditAction.LEAVE_APPROVED_OFFICE_INCHARGE,
                    "LEAVE_REQUEST", String.valueOf(r.getId()), ref, "Final approval");
        } catch (Exception ignored) {}

        afterCommit("OI-approve:balance", () -> leaveBalanceService.deductForRequest(savedR));
        afterCommit("OI-approve:notice", () ->
                noticeService.generateNotice(savedR, NoticeType.APPROVAL, "OFFICE_INCHARGE", notes));
        afterCommit("OI-approve:email", () ->
                emailService.sendRequestStatusUpdate(ownerEmail, ownerName, ref, "APPROVED",
                        "Your leave request has been approved by the Office Incharge."));
    }

    // ============ OFFICE IN-CHARGE — REJECT ============
    @Transactional
    public void rejectByOfficeIncharge(Long requestId, String signature, String reason, String username) {
        LeaveRequest r = get(requestId);

        if (r.getStatus() == RequestStatus.REJECTED) {
            log.info("Request {} already rejected — ignoring duplicate call", r.getReferenceNumber());
            return;
        }
        if (r.getStatus() == RequestStatus.APPROVED || r.getStatus() == RequestStatus.CANCELLED)
            throw new RuntimeException("This request has already been finalized.");

        RequestStatus effective = LeaveRequestService.effectiveStatus(r);
        if (effective != RequestStatus.PENDING_OFFICE_INCHARGE
                && effective != RequestStatus.PENDING_SELF_APPROVAL)
            throw new RuntimeException("Request is not pending for Office Incharge");

        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        if (oi.getSignaturePath() == null || oi.getSignaturePath().isBlank())
            throw new RuntimeException("You must upload your digital signature before rejecting. Go to My Profile.");

        Staff owner = r.getStaff();
        if (!owner.getId().equals(oi.getId())) {
            if (owner.getOfficeIncharge() == null || !owner.getOfficeIncharge().getId().equals(oi.getId()))
                throw new RuntimeException("You are not the assigned Office Incharge for this staff");
        }

        LeaveRequestService.clearHold(r);
        r.setOfficeInchargeRejectSignature(signature);
        r.setOfficeInchargeSignatureImage(oi.getSignaturePath());
        r.setOfficeInchargeRejectedAt(Instant.now());
        r.setRejectionReason(reason);
        r.setStatus(RequestStatus.REJECTED);
        leaveRequestRepository.save(r);

        owner.getSectionHead();
        owner.getOfficeIncharge();

        final LeaveRequest savedR     = r;
        final String       ownerEmail = owner.getEmail();
        final String       ownerName  = owner.getFullName();
        final String       ref        = r.getReferenceNumber();

        try {
            auditLogService.record(username, AuditAction.LEAVE_REJECTED_OFFICE_INCHARGE,
                    "LEAVE_REQUEST", String.valueOf(r.getId()), ref, "Rejected: " + reason);
        } catch (Exception ignored) {}

        afterCommit("OI-reject:notice", () ->
                noticeService.generateNotice(savedR, NoticeType.REJECTION, "OFFICE_INCHARGE", reason));
        afterCommit("OI-reject:email", () ->
                emailService.sendRequestStatusUpdate(ownerEmail, ownerName, ref, "REJECTED",
                        "Rejected by Office Incharge. Reason: " + reason));
    }

    private LeaveRequest get(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
    }

    private void afterCommit(String label, Runnable task) {
        try {
            if (!TransactionSynchronizationManager.isSynchronizationActive()) {
                safeRun(label, task);
                return;
            }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { safeRun(label, task); }
            });
        } catch (Exception e) {
            log.error("[afterCommit] registration failed for {}: {}", label, e.getMessage());
        }
    }

    private void safeRun(String label, Runnable task) {
        try { task.run(); }
        catch (Throwable t) { log.error("[afterCommit] {} failed: {}", label, t.getMessage(), t); }
    }
}