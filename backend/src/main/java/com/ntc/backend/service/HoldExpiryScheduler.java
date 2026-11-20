package com.ntc.backend.service;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.enums.NoticeType;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class HoldExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(HoldExpiryScheduler.class);
    private static final ZoneId NEPAL_ZONE = ZoneId.of("Asia/Kathmandu");
    private static final DateTimeFormatter NEPAL_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(NEPAL_ZONE);

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private NoticeService noticeService;
    @Autowired private EmailService emailService;
    @Autowired private AuditLogService auditLogService;

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void autoRejectExpiredHolds() {
        Instant now = Instant.now();
        List<LeaveRequest> onHold = leaveRequestRepository.findByStatus(RequestStatus.ON_HOLD);

        for (LeaveRequest r : onHold) {
            if (r.getHoldUntil() == null) continue;
            if (!r.getHoldUntil().isBefore(now)) continue;
            try {
                autoRejectOne(r.getId());
            } catch (Exception e) {
                log.error("Auto-reject failed for request id {}: {}", r.getId(), e.getMessage(), e);
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void autoRejectOne(Long requestId) {
        LeaveRequest r = leaveRequestRepository.findById(requestId).orElse(null);
        if (r == null) return;
        if (r.getStatus() != RequestStatus.ON_HOLD) return;
        if (r.getHoldUntil() == null || !r.getHoldUntil().isBefore(Instant.now())) return;

        String holdTimeStr = NEPAL_FMT.format(r.getHoldUntil()) + " (NPT)";
        String reason = "Auto-rejected: hold period expired on " + holdTimeStr + " without a decision.";

        String prevHeldByRole = r.getHeldByRole();
        LeaveRequestService.clearHold(r);
        r.setStatus(RequestStatus.REJECTED);
        r.setRejectionReason(reason);

        if ("OFFICE_INCHARGE".equals(prevHeldByRole)) {
            r.setOfficeInchargeRejectedAt(Instant.now());
        } else if ("SECTION_HEAD".equals(prevHeldByRole)) {
            r.setSectionHeadRejectedAt(Instant.now());
        } else {
            r.setOfficeInchargeRejectedAt(Instant.now());
        }

        leaveRequestRepository.save(r);

        try {
            emailService.sendHoldExpired(
                    r.getStaff().getEmail(),
                    r.getStaff().getFullName(),
                    r.getReferenceNumber(),
                    holdTimeStr);
        } catch (Exception e) {
            log.warn("Auto-reject notification email failed for {}: {}", r.getReferenceNumber(), e.getMessage());
        }

        try {
            noticeService.generateNotice(r, NoticeType.REJECTION,
                    prevHeldByRole != null ? prevHeldByRole : "SYSTEM", reason);
        } catch (Exception e) {
            log.warn("Auto-reject notice generation failed for {}: {}", r.getReferenceNumber(), e.getMessage());
        }

        try {
            auditLogService.record("SYSTEM", AuditAction.LEAVE_AUTO_REJECTED,
                    "LEAVE_REQUEST", String.valueOf(r.getId()), r.getReferenceNumber(),
                    "Auto-rejected after hold expiry");
        } catch (Exception ignored) {}

        log.info("Auto-rejected expired hold: {} (ref {})", r.getId(), r.getReferenceNumber());
    }
}