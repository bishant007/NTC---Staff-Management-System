package com.ntc.backend.service;

import com.ntc.backend.dto.LeaveRequestDTO;
import com.ntc.backend.dto.LeaveRequestResponseDTO;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.enums.LeaveCategory;
import com.ntc.backend.enums.LeaveType;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {

    private static final Logger log = LoggerFactory.getLogger(LeaveRequestService.class);

    public static final ZoneId NEPAL_ZONE = ZoneId.of("Asia/Kathmandu");
    private static final DateTimeFormatter NEPAL_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(NEPAL_ZONE);
    private static final DateTimeFormatter NEPAL_TIME_FMT =
            DateTimeFormatter.ofPattern("hh:mm a");

    public static final LocalTime WORK_HOURS_START = LocalTime.of(6, 0);
    public static final LocalTime WORK_HOURS_END   = LocalTime.of(22, 0);
    public static final long MIN_LEAD_SECONDS = 60;

    private static final int MAX_REF_ATTEMPTS = 5;

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private StaffRepository staffRepository;
    @Autowired private EmailService emailService;
    @Autowired private AdminRepository adminRepository;
    @Autowired private AuditLogService auditLogService;
    @Autowired private PlatformTransactionManager txManager;

    // ============================================================
    // SUBMIT — outer retry wrapper
    // ============================================================
    public LeaveRequestResponseDTO submitRequest(LeaveRequestDTO dto) {
        TransactionTemplate tt = new TransactionTemplate(txManager);
        tt.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        tt.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);

        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_REF_ATTEMPTS; attempt++) {
            try {
                return tt.execute(status -> submitInTransaction(dto));
            } catch (RuntimeException e) {
                if (!isDuplicateReferenceError(e)) throw e;
                lastError = e;
                log.warn("Reference number collision on attempt {}/{} — retrying",
                        attempt, MAX_REF_ATTEMPTS);
                try { Thread.sleep(50L * attempt); }
                catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
            }
        }
        throw new RuntimeException(
                "Could not generate a unique reference number after " + MAX_REF_ATTEMPTS
                        + " attempts. Please try submitting again.",
                lastError);
    }

    /** Runs inside a transaction created by the caller (TransactionTemplate). */
    private LeaveRequestResponseDTO submitInTransaction(LeaveRequestDTO dto) {
        Staff staff = staffRepository.findByStaffId(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (staff.getSignaturePath() == null || staff.getSignaturePath().isBlank())
            throw new RuntimeException(
                    "You must upload your digital signature before submitting a leave request. " +
                            "Go to My Profile → Digital Signature.");

        LeaveCategory cat = dto.getCategory() != null ? dto.getCategory() : LeaveCategory.PERSONAL;
        LeaveType lt = dto.getLeaveType();
        if (lt == null) throw new RuntimeException("Leave type is required");

        if (cat == LeaveCategory.OFFICE_WORK && !lt.isOfficeWork())
            throw new RuntimeException("Leave type '" + lt.prettyLabel()
                    + "' is not valid under the Office Work category.");
        if (cat == LeaveCategory.PERSONAL && !lt.isPersonal())
            throw new RuntimeException("Leave type '" + lt.prettyLabel()
                    + "' is only valid under the Office Work category.");

        String customText = null;
        if (lt.requiresCustomText()) {
            String raw = dto.getCustomLeaveType() == null ? "" : dto.getCustomLeaveType().trim();
            if (raw.isEmpty())
                throw new RuntimeException("Please describe the leave type when 'Other' is selected.");
            if (raw.length() > 200)
                throw new RuntimeException("Custom leave description is too long (max 200 characters).");
            customText = raw;
        }

        RequestStatus initialStatus;
        switch (staff.getRole()) {
            case SECTION_HEAD -> {
                if (staff.getOfficeIncharge() == null)
                    throw new RuntimeException("You have no Office In-Charge assigned. Contact admin.");
                initialStatus = RequestStatus.PENDING_OFFICE_INCHARGE;
            }
            case OFFICE_INCHARGE -> initialStatus = RequestStatus.PENDING_SELF_APPROVAL;
            default -> {
                if (staff.getSectionHead() == null)
                    throw new RuntimeException("You are not assigned to a Section Head yet.");
                initialStatus = RequestStatus.PENDING_SECTION_HEAD;
            }
        }

        Instant startInstant  = dto.getStartDateTime().atZone(NEPAL_ZONE).toInstant();
        Instant returnInstant = dto.getReturnDateTime().atZone(NEPAL_ZONE).toInstant();

        if (startInstant.isBefore(Instant.now().plusSeconds(MIN_LEAD_SECONDS)))
            throw new RuntimeException(
                    "Leave start time must be at least 1 minute in the future.");

        LocalTime startLocalTime  = startInstant.atZone(NEPAL_ZONE).toLocalTime();
        LocalTime returnLocalTime = returnInstant.atZone(NEPAL_ZONE).toLocalTime();

        if (startLocalTime.isBefore(WORK_HOURS_START) || startLocalTime.isAfter(WORK_HOURS_END))
            throw new RuntimeException("Leave start time must be between "
                    + WORK_HOURS_START.format(NEPAL_TIME_FMT) + " and "
                    + WORK_HOURS_END.format(NEPAL_TIME_FMT)
                    + " (Nepal Time). You selected " + startLocalTime.format(NEPAL_TIME_FMT) + ".");

        if (returnLocalTime.isBefore(WORK_HOURS_START) || returnLocalTime.isAfter(WORK_HOURS_END))
            throw new RuntimeException("Return time must be between "
                    + WORK_HOURS_START.format(NEPAL_TIME_FMT) + " and "
                    + WORK_HOURS_END.format(NEPAL_TIME_FMT)
                    + " (Nepal Time). You selected " + returnLocalTime.format(NEPAL_TIME_FMT) + ".");

        if (!returnInstant.isAfter(startInstant))
            throw new RuntimeException("Return date/time must be after start date/time");

        double hours = (returnInstant.toEpochMilli() - startInstant.toEpochMilli()) / 3_600_000.0;
        double durationDays = Math.max(0.5, Math.round((hours / 24.0) * 2.0) / 2.0);

        List<LeaveRequest> active = leaveRequestRepository.findActiveByStaff(staff);
        for (LeaveRequest existing : active) {
            boolean overlaps = !existing.getLeaveStartTime().isAfter(returnInstant)
                    && !startInstant.isAfter(existing.getReturnDateTime());
            if (overlaps) {
                throw new RuntimeException("Overlap with existing request " + existing.getReferenceNumber()
                        + " (" + NEPAL_FMT.format(existing.getLeaveStartTime())
                        + " → " + NEPAL_FMT.format(existing.getReturnDateTime()) + ")");
            }
        }

        LeaveRequest r = new LeaveRequest();
        r.setStaff(staff);
        r.setReason(dto.getReason());
        r.setLeaveStartTime(startInstant);
        r.setReturnDateTime(returnInstant);
        r.setLeaveType(lt);
        r.setCustomLeaveType(customText);
        r.setCategory(cat);
        r.setDurationDays(durationDays);
        r.setStatus(initialStatus);
        r.setReferenceNumber(generateReferenceNumber());
        r.setStaffSignature(staff.getFullName());
        r.setStaffSignatureImage(staff.getSignaturePath());
        r.setStaffSignedAt(Instant.now());

        // saveAndFlush → immediately surface duplicate-key so the outer retry loop can catch it
        LeaveRequest saved = leaveRequestRepository.saveAndFlush(r);

        try {
            auditLogService.record(staff.getUsername(), AuditAction.LEAVE_SUBMITTED,
                    "LEAVE_REQUEST", String.valueOf(saved.getId()), saved.getReferenceNumber(),
                    "Submitted " + saved.getCategory() + " leave (" + saved.getLeaveType()
                            + (customText != null ? " — " + customText : "")
                            + "), " + durationDays + " day(s)");
        } catch (Exception ignored) {}

        return LeaveRequestResponseDTO.from(saved);
    }

    /**
     * MAX-based generator — handles deleted requests, cancelled requests, and gaps.
     * Extra safety: checks `existsByReferenceNumber` before returning.
     */
    private synchronized String generateReferenceNumber() {
        int year = LocalDate.now(NEPAL_ZONE).getYear();
        String prefix = "NTC/LEAVE/" + year + "/";

        Long max = leaveRequestRepository.findMaxSequenceForPrefix(prefix);
        long next = (max == null || max < 0) ? 1L : max + 1L;

        String candidate = prefix + String.format("%04d", next);
        int safety = 0;
        while (leaveRequestRepository.existsByReferenceNumber(candidate) && safety < 500) {
            next++;
            candidate = prefix + String.format("%04d", next);
            safety++;
        }
        return candidate;
    }

    /** Returns true if the exception chain contains a duplicate-key on reference_number. */
    private boolean isDuplicateReferenceError(Throwable e) {
        Throwable c = e;
        while (c != null) {
            if (c instanceof org.springframework.dao.DataIntegrityViolationException) {
                String msg = String.valueOf(c.getMessage()).toLowerCase();
                if (msg.contains("reference_number") || msg.contains("uk6dxcnylq16q9bih710k5j5y7d"))
                    return true;
            }
            if (c instanceof java.sql.SQLIntegrityConstraintViolationException) return true;
            c = c.getCause();
        }
        return false;
    }

    // ============================================================
    // CANCEL
    // ============================================================
    @Transactional
    public void cancelRequest(Long requestId, String requesterUsername) {
        LeaveRequest r = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!r.getStaff().getUsername().equals(requesterUsername))
            throw new RuntimeException("You can only cancel your own requests");

        // Idempotency: already cancelled → success
        if (r.getStatus() == RequestStatus.CANCELLED) return;

        if (r.getStatus() != RequestStatus.PENDING_SECTION_HEAD
                && r.getStatus() != RequestStatus.PENDING_OFFICE_INCHARGE
                && r.getStatus() != RequestStatus.PENDING_SELF_APPROVAL
                && r.getStatus() != RequestStatus.ON_HOLD)
            throw new RuntimeException("Only pending or on-hold requests can be cancelled");

        clearHold(r);
        r.setStatus(RequestStatus.CANCELLED);
        leaveRequestRepository.save(r);

        try {
            auditLogService.record(requesterUsername, AuditAction.LEAVE_CANCELLED,
                    "LEAVE_REQUEST", String.valueOf(r.getId()), r.getReferenceNumber(),
                    "Cancelled by applicant");
        } catch (Exception ignored) {}
    }

    // ============================================================
    // HOLD
    // ============================================================
    @Transactional
    public LeaveRequestResponseDTO holdRequest(Long requestId, String username, Instant holdUntil, String reason) {
        LeaveRequest r = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        Staff actor = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (actor.getRole() != StaffRole.SECTION_HEAD && actor.getRole() != StaffRole.OFFICE_INCHARGE)
            throw new RuntimeException("Only Section Heads and Office In-Charges can place requests on hold");

        // Idempotency: if already on hold, just return the state
        if (r.getStatus() == RequestStatus.ON_HOLD) {
            log.info("Request {} already on hold — ignoring duplicate call", r.getReferenceNumber());
            return LeaveRequestResponseDTO.from(r);
        }

        RequestStatus effective = effectiveStatus(r);
        Staff owner = r.getStaff();

        if (actor.getRole() == StaffRole.SECTION_HEAD) {
            if (effective != RequestStatus.PENDING_SECTION_HEAD)
                throw new RuntimeException("This request is not awaiting Section Head decision");
            if (owner.getSectionHead() == null || !owner.getSectionHead().getId().equals(actor.getId()))
                throw new RuntimeException("You are not the assigned Section Head for this staff");
        } else {
            if (effective != RequestStatus.PENDING_OFFICE_INCHARGE
                    && effective != RequestStatus.PENDING_SELF_APPROVAL)
                throw new RuntimeException("This request is not awaiting Office In-Charge decision");
            if (!owner.getId().equals(actor.getId())) {
                if (owner.getOfficeIncharge() == null
                        || !owner.getOfficeIncharge().getId().equals(actor.getId()))
                    throw new RuntimeException("You are not the assigned Office In-Charge for this staff");
            }
        }

        if (holdUntil == null || holdUntil.isBefore(Instant.now()))
            throw new RuntimeException("Hold time must be in the future");
        if (reason == null || reason.trim().isEmpty())
            throw new RuntimeException("A reason is required when placing a request on hold");

        r.setPreHoldStatus(effective.name());
        r.setStatus(RequestStatus.ON_HOLD);
        r.setHoldUntil(holdUntil);
        r.setHoldReason(reason);
        r.setHeldByRole(actor.getRole().name());
        r.setHeldById(actor.getId());
        r.setHeldByName(actor.getFullName());
        r.setHeldAt(Instant.now());

        LeaveRequest saved = leaveRequestRepository.save(r);

        final String holdStr = NEPAL_FMT.format(holdUntil) + " (NPT)";

        try {
            emailService.sendRequestOnHold(
                    owner.getEmail(), owner.getFullName(),
                    r.getReferenceNumber(),
                    actor.getFullName(), actor.getRole().name().replace("_", " "),
                    holdStr, reason);
        } catch (Exception e) { log.warn("Staff hold-email failed: {}", e.getMessage()); }

        try {
            final String ref = r.getReferenceNumber();
            final String staffName = owner.getFullName();
            final String staffId = owner.getStaffId();
            final String actorName = actor.getFullName();
            final String actorRole = actor.getRole().name().replace("_", " ");

            adminRepository.findAll().forEach(admin -> {
                try {
                    emailService.sendRequestStatusUpdate(
                            admin.getEmail(),
                            admin.getFullName() != null ? admin.getFullName() : "Administrator",
                            ref,
                            "Leave Request ON HOLD — Decision Needed",
                            "Leave request " + ref + " for " + staffName + " (" + staffId + ") "
                                    + "has been placed ON HOLD by " + actorName + " (" + actorRole + ").\n\n"
                                    + "Hold time: " + holdStr + "\n"
                                    + "Reason: " + reason + "\n\n"
                                    + "If no decision is made by " + holdStr + ", the request will be "
                                    + "automatically REJECTED.");
                } catch (Exception e) {
                    log.warn("Admin hold-email failed for {}: {}", admin.getEmail(), e.getMessage());
                }
            });
        } catch (Exception e) { log.warn("Admin hold broadcast failed: {}", e.getMessage()); }

        try {
            auditLogService.record(username, AuditAction.LEAVE_HELD,
                    "LEAVE_REQUEST", String.valueOf(saved.getId()), saved.getReferenceNumber(),
                    "Held until " + holdStr + " — " + reason);
        } catch (Exception ignored) {}

        return LeaveRequestResponseDTO.from(saved);
    }

    public static RequestStatus effectiveStatus(LeaveRequest r) {
        if (r.getStatus() == RequestStatus.ON_HOLD && r.getPreHoldStatus() != null) {
            try { return RequestStatus.valueOf(r.getPreHoldStatus()); }
            catch (IllegalArgumentException ignored) { }
        }
        return r.getStatus();
    }

    static void clearHold(LeaveRequest r) {
        r.setHoldUntil(null);
        r.setHoldReason(null);
        r.setHeldByRole(null);
        r.setHeldById(null);
        r.setHeldByName(null);
        r.setHeldAt(null);
        r.setPreHoldStatus(null);
    }

    // ============================================================
    // QUERIES
    // ============================================================
    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getMyRequests(String staffId) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return leaveRequestRepository.findByStaff(staff).stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getPendingForSectionHead(String username) {
        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        Map<Long, LeaveRequest> merged = new LinkedHashMap<>();
        for (LeaveRequest r : leaveRequestRepository
                .findByStatusAndStaffSectionHeadId(RequestStatus.PENDING_SECTION_HEAD, head.getId()))
            merged.put(r.getId(), r);
        for (LeaveRequest r : leaveRequestRepository
                .findByStatusAndHeldById(RequestStatus.ON_HOLD, head.getId()))
            if ("SECTION_HEAD".equals(r.getHeldByRole())) merged.put(r.getId(), r);
        return merged.values().stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getPendingForOfficeIncharge(String username) {
        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        Map<Long, LeaveRequest> merged = new LinkedHashMap<>();
        for (LeaveRequest r : leaveRequestRepository
                .findByStatusAndStaffOfficeInchargeId(RequestStatus.PENDING_OFFICE_INCHARGE, oi.getId()))
            merged.put(r.getId(), r);
        for (LeaveRequest r : leaveRequestRepository
                .findByStatusAndStaffId(RequestStatus.PENDING_SELF_APPROVAL, oi.getId()))
            merged.put(r.getId(), r);
        for (LeaveRequest r : leaveRequestRepository
                .findByStatusAndHeldById(RequestStatus.ON_HOLD, oi.getId()))
            if ("OFFICE_INCHARGE".equals(r.getHeldByRole())) merged.put(r.getId(), r);
        return merged.values().stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    /**
     * Section Head history — now includes BOTH:
     *   (a) all leave requests submitted by staff assigned to this SH, and
     *   (b) the SH's own leave requests.
     * This keeps per-staff totals complete on the frontend for every role.
     */
    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForSectionHead(String username) {
        Staff head = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section head not found"));
        Map<Long, LeaveRequest> merged = new LinkedHashMap<>();
        for (LeaveRequest r : leaveRequestRepository.findByStaffSectionHeadId(head.getId()))
            merged.put(r.getId(), r);
        for (LeaveRequest r : leaveRequestRepository.findByStaff(head))
            merged.put(r.getId(), r);
        return merged.values().stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getHistoryForOfficeIncharge(String username) {
        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        Map<Long, LeaveRequest> merged = new LinkedHashMap<>();
        for (LeaveRequest r : leaveRequestRepository.findByStaffOfficeInchargeId(oi.getId()))
            merged.put(r.getId(), r);
        for (LeaveRequest r : leaveRequestRepository.findByStaff(oi))
            merged.put(r.getId(), r);
        return merged.values().stream()
                .map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> getAllRequests(RequestStatus status) {
        List<LeaveRequest> list = (status != null)
                ? leaveRequestRepository.findByStatus(status)
                : leaveRequestRepository.findAll();
        return list.stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }
}