package com.ntc.backend.service;

import com.ntc.backend.dto.StaffCreateDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.StaffRole;
import com.ntc.backend.repository.StaffRepository;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class StaffService {

    @Autowired private StaffRepository staffRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;
    @Autowired private LeaveBalanceService leaveBalanceService;

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

        // ---------- Enforce creation rules ----------
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

        // ---------- Generate Staff ID (sequential numeric) ----------
        String staffId = generateStaffId();

        // ---------- Generate Username (auto, unique, firstname.role@ntc.com) ----------
        String username = generateUsername(dto.getFullName(), role);

        // ---------- Build entity ----------
        Staff staff = new Staff();
        staff.setFullName(dto.getFullName());
        staff.setPhone(dto.getPhone());
        staff.setEmail(dto.getEmail());
        staff.setDepartment(dto.getDepartment());
        staff.setBranch(dto.getBranch());
        staff.setRole(role);
        staff.setUsername(username);
        staff.setStaffId(staffId);

        String rawPassword = RandomStringUtils.randomAlphanumeric(12);
        staff.setPassword(passwordEncoder.encode(rawPassword));
        staff.setFirstLogin(true);

        // ---------- Resolve reporting chain ----------
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
                    saved.getEmail(),
                    saved.getFullName(),
                    saved.getStaffId(),
                    saved.getUsername(),
                    rawPassword,
                    saved.getRole().name());
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

    // ------------------------------------------------------------

    /** NTC-10001, NTC-10002, ... */
    private String generateStaffId() {
        Long max = staffRepository.findMaxNumericStaffId();
        long next = (max == null ? 10000L : max) + 1;
        return "NTC-" + next;
    }

    /** bishant.staff@ntc.com / bishant.staff2@ntc.com / ... */
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