package com.ntc.backend.service;

import com.ntc.backend.dto.StaffCreateDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StaffService {

    @Autowired private StaffRepository staffRepository;
    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;

    private static final List<RequestStatus> PENDING_STATUSES = List.of(
            RequestStatus.PENDING_SECTION_HEAD,
            RequestStatus.PENDING_OFFICE_INCHARGE,
            RequestStatus.PENDING_SELF_APPROVAL
    );

    /* ============================================================
       CREATE
       ============================================================ */

    @Transactional
    public synchronized Map<String, Object> createStaffWithCredentials(
            StaffCreateDTO dto, String creatorUsername) {

        if (staffRepository.findByEmail(dto.getEmail()).isPresent())
            throw new RuntimeException("Email already registered");

        Staff creator = null;
        if (creatorUsername != null) {
            creator = staffRepository.findByUsername(creatorUsername)
                    .orElseThrow(() -> new RuntimeException("Creator not found"));
        }

        StaffRole role = dto.getRole() != null ? dto.getRole() : StaffRole.STAFF;

        if (creator != null) {
            switch (creator.getRole()) {
                case SECTION_HEAD -> {
                    if (role != StaffRole.STAFF)
                        throw new RuntimeException("Section Heads can only create STAFF accounts");
                }
                case OFFICE_INCHARGE -> {
                    if (role == StaffRole.OFFICE_INCHARGE)
                        throw new RuntimeException("Office In-Charge cannot create another Office In-Charge");
                }
                case STAFF -> throw new RuntimeException("Staff cannot create accounts");
            }
        }

        // ---------- Resolve Staff ID ----------
        String staffId;
        String manual = dto.getStaffId();
        if (manual != null && !manual.isBlank()) {
            String trimmed = manual.trim();
            if (staffRepository.findByStaffId(trimmed).isPresent())
                throw new RuntimeException("Staff ID already taken: " + trimmed);
            staffId = trimmed;
        } else {
            staffId = generateStaffId();
        }

        // ---------- Username ----------
        String username = generateUsername(dto.getFullName(), role);

        Staff staff = new Staff();
        staff.setFullName(dto.getFullName());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(dto.getDepartment());
        staff.setBranch(dto.getBranch());
        staff.setRole(role);
        staff.setUsername(username);
        staff.setStaffId(staffId);
        staff.setActive(true);

        String rawPassword = RandomStringUtils.randomAlphanumeric(12);
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setFirstLogin(true);

        // ---------- Reporting chain ----------
        Staff sectionHead = null;
        Staff officeIncharge = null;

        if (dto.getSectionHeadId() != null && !dto.getSectionHeadId().isBlank())
            sectionHead = staffRepository.findByStaffId(dto.getSectionHeadId())
                    .orElseThrow(() -> new RuntimeException("Section head not found"));

        if (dto.getOfficeInchargeId() != null && !dto.getOfficeInchargeId().isBlank())
            officeIncharge = staffRepository.findByStaffId(dto.getOfficeInchargeId())
                    .orElseThrow(() -> new RuntimeException("Office In-Charge not found"));

        if (creator != null) {
            if (creator.getRole() == StaffRole.SECTION_HEAD && sectionHead == null) {
                sectionHead = creator;
                if (officeIncharge == null) officeIncharge = creator.getOfficeIncharge();
            }
            if (creator.getRole() == StaffRole.OFFICE_INCHARGE && officeIncharge == null) {
                officeIncharge = creator;
            }
            staff.setCreatedBy(creator);
        }

        if (officeIncharge == null && sectionHead != null) {
            officeIncharge = sectionHead.getOfficeIncharge();
        }

        staff.setSectionHead(sectionHead);
        staff.setOfficeIncharge(officeIncharge);

        Staff saved = staffRepository.save(staff);

        try { leaveBalanceService.initializeBalances(saved); } catch (Exception ignored) {}
        try {
            emailService.sendStaffCredentials(
                    saved.getEmail(), saved.getFullName(),
                    saved.getStaffId(), saved.getUsername(),
                    rawPassword, saved.getRole().name());
        } catch (Exception e) {
            System.out.println("Email failed: " + e.getMessage());
        }

        System.out.println("════════════════════════════════════════════════════");
        System.out.println("🔑 NEW ACCOUNT CREATED");
        System.out.println("   Name:     " + saved.getFullName());
        System.out.println("   Staff ID: " + saved.getStaffId());
        System.out.println("   Username: " + saved.getUsername());
        System.out.println("   Email:    " + saved.getEmail());
        System.out.println("   Password: " + rawPassword);
        System.out.println("   Role:     " + saved.getRole());
        System.out.println("════════════════════════════════════════════════════");

        Map<String, Object> res = new HashMap<>();
        res.put("staffId", saved.getStaffId());
        res.put("username", saved.getUsername());
        res.put("fullName", saved.getFullName());
        res.put("email", saved.getEmail());
        res.put("tempPassword", rawPassword);
        res.put("role", saved.getRole().name());
        return res;
    }

    /* ============================================================
       DELETE / DEACTIVATE / ACTIVATE
       ============================================================ */

    /** Checks whether the target can be hard-deleted, and returns diagnostics. */
    @Transactional(readOnly = true)
    public Map<String, Object> checkDeleteEligibility(String targetStaffId, String requesterUsername) {
        Staff target = staffRepository.findByStaffId(targetStaffId)
                .orElseThrow(() -> new RuntimeException("Target not found"));
        Staff requester = staffRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        checkDeletePermission(requester, target);

        long pending = leaveRequestRepository.countByStaffAndStatusIn(target, PENDING_STATUSES);
        long total   = leaveRequestRepository.countByStaff(target);
        long subs    = staffRepository.countBySectionHeadId(target.getId())
                + staffRepository.countByOfficeInchargeId(target.getId());

        boolean canHardDelete = pending == 0 && total == 0 && subs == 0;

        String reason = null;
        if (!canHardDelete) {
            if (pending > 0) reason = "User has " + pending + " pending leave request(s). Cancel them first.";
            else if (total > 0) reason = "User has leave history (" + total + " request(s)). Use deactivate to preserve records.";
            else if (subs > 0) reason = "User is currently assigned as Section Head or Office In-Charge for " + subs + " other staff.";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("canHardDelete", canHardDelete);
        result.put("reason", reason);
        result.put("pendingRequests", pending);
        result.put("totalRequests", total);
        result.put("subordinateCount", subs);
        result.put("active", target.isActive());
        result.put("targetName", target.getFullName());
        result.put("targetStaffId", target.getStaffId());
        return result;
    }

    @Transactional
    public void deleteStaff(String targetStaffId, String requesterUsername) {
        Staff target = staffRepository.findByStaffId(targetStaffId)
                .orElseThrow(() -> new RuntimeException("Target not found"));
        Staff requester = staffRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        checkDeletePermission(requester, target);
        checkCanHardDelete(target);

        staffRepository.delete(target);
        System.out.println("🗑  HARD DELETED: " + target.getStaffId() + " (" + target.getFullName() + ") by " + requesterUsername);
    }

    @Transactional
    public void deactivateStaff(String targetStaffId, String requesterUsername) {
        Staff target = staffRepository.findByStaffId(targetStaffId)
                .orElseThrow(() -> new RuntimeException("Target not found"));
        Staff requester = staffRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        checkDeletePermission(requester, target);

        if (!target.isActive())
            throw new RuntimeException("User is already deactivated");

        target.setActive(false);
        target.setDeletedAt(Instant.now());
        staffRepository.save(target);

        try {
            emailService.sendAccountDeactivated(target.getEmail(), target.getFullName());
        } catch (Exception ignored) {}

        System.out.println("🚫 DEACTIVATED: " + target.getStaffId() + " (" + target.getFullName() + ") by " + requesterUsername);
    }

    @Transactional
    public void activateStaff(String targetStaffId, String requesterUsername) {
        Staff target = staffRepository.findByStaffId(targetStaffId)
                .orElseThrow(() -> new RuntimeException("Target not found"));
        Staff requester = staffRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        checkDeletePermission(requester, target);

        if (target.isActive())
            throw new RuntimeException("User is already active");

        target.setActive(true);
        target.setDeletedAt(null);
        staffRepository.save(target);

        System.out.println("✅ REACTIVATED: " + target.getStaffId() + " (" + target.getFullName() + ") by " + requesterUsername);
    }

    /* ============================================================
       PERMISSION & SAFETY CHECKS
       ============================================================ */

    private void checkDeletePermission(Staff requester, Staff target) {
        if (requester.getId().equals(target.getId()))
            throw new RuntimeException("You cannot delete or deactivate your own account");

        switch (requester.getRole()) {
            case OFFICE_INCHARGE -> {
                if (target.getRole() == StaffRole.OFFICE_INCHARGE)
                    throw new RuntimeException("Office In-Charge cannot delete another Office In-Charge");
                if (target.getOfficeIncharge() == null
                        || !target.getOfficeIncharge().getId().equals(requester.getId()))
                    throw new RuntimeException("This user is not under your scope");
            }
            case SECTION_HEAD -> {
                if (target.getRole() != StaffRole.STAFF)
                    throw new RuntimeException("Section Heads can only delete Staff accounts");
                if (target.getSectionHead() == null
                        || !target.getSectionHead().getId().equals(requester.getId()))
                    throw new RuntimeException("This staff is not assigned to you");
            }
            case STAFF -> throw new RuntimeException("Staff cannot delete accounts");
            // ADMIN: no restriction
        }
    }

    private void checkCanHardDelete(Staff target) {
        long pending = leaveRequestRepository.countByStaffAndStatusIn(target, PENDING_STATUSES);
        if (pending > 0)
            throw new RuntimeException("Cannot delete: user has " + pending
                    + " pending leave request(s). Cancel them first.");

        long total = leaveRequestRepository.countByStaff(target);
        if (total > 0)
            throw new RuntimeException("Cannot delete: user has " + total
                    + " leave request(s) on record. Use deactivate to preserve history.");

        if (staffRepository.countBySectionHeadId(target.getId()) > 0)
            throw new RuntimeException("Cannot delete: user is assigned as Section Head for other staff");

        if (staffRepository.countByOfficeInchargeId(target.getId()) > 0)
            throw new RuntimeException("Cannot delete: user is assigned as Office In-Charge for other staff");
    }

    /* ============================================================
       HELPERS
       ============================================================ */

    private String generateStaffId() {
        Long max = staffRepository.findMaxNumericStaffId();
        long next = (max == null ? 10000L : max) + 1;
        String candidate = "NTC-" + next;
        while (staffRepository.findByStaffId(candidate).isPresent()) {
            next++;
            candidate = "NTC-" + next;
        }
        return candidate;
    }

    private String generateUsername(String fullName, StaffRole role) {
        String first = "user";
        if (fullName != null && !fullName.isBlank()) {
            String[] parts = fullName.trim().split("\\s+");
            String cleaned = parts[0].toLowerCase().replaceAll("[^a-z0-9]", "");
            if (!cleaned.isEmpty()) first = cleaned;
        }
        String suffix = switch (role) {
            case STAFF           -> "staff";
            case SECTION_HEAD    -> "sh";
            case OFFICE_INCHARGE -> "oi";
        };
        String base = first + "." + suffix;
        String candidate = base + "@ntc.com";
        int n = 2;
        while (staffRepository.findByUsername(candidate).isPresent()
                || staffRepository.findByEmail(candidate).isPresent()) {
            candidate = base + n + "@ntc.com";
            n++;
        }
        return candidate;
    }
}