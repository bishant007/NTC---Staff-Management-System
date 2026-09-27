package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.PasswordResetRequestDTO;
import com.ntc.backend.entity.PasswordResetRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.PasswordResetRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.EmailService;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/password-reset")
public class PasswordResetController {

    @Autowired private EmailService emailService;
    @Autowired private PasswordResetRepository repo;
    @Autowired private StaffRepository staffRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ==================== Staff submits request ====================
    @PostMapping
    public ApiResponse requestReset(@RequestBody PasswordResetRequestDTO dto) {
        try {
            PasswordResetRequest r = new PasswordResetRequest();
            r.setFullName(dto.getFullName());
            r.setEmail(dto.getEmail());
            r.setPhone(dto.getPhone());
            r.setMessage(dto.getMessage());
            r.setStatus("PENDING");
            r.setCreatedAt(LocalDateTime.now());
            repo.save(r);

            try {
                emailService.sendHtmlEmail(
                        "admin@bharat.com",
                        "Password Reset Request - " + dto.getFullName(),
                        "Name: " + dto.getFullName() + "<br/>Email: " + dto.getEmail()
                                + "<br/>Phone: " + dto.getPhone()
                                + "<br/>Message: " + (dto.getMessage() != null ? dto.getMessage() : "None")
                );
            } catch (Exception ignored) {}
            try {
                emailService.sendHtmlEmail(dto.getEmail(), "Request Received",
                        "<h2>Your password reset request has been received.</h2>"
                                + "<p>An administrator will process it shortly.</p>");
            } catch (Exception ignored) {}

            return new ApiResponse(true, "Request submitted successfully");
        } catch (Exception e) {
            return new ApiResponse(false, "Failed: " + e.getMessage());
        }
    }

    // ==================== Admin: list (optional ?status=PENDING) ====================
    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String status) {
        return repo.findAll().stream()
                .filter(r -> status == null || status.isBlank()
                        || status.equalsIgnoreCase(r.getStatus()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    // ==================== Admin: approve → generate temp password ====================
    @PutMapping("/{id}/approve")
    @Transactional
    public ApiResponse approve(@PathVariable Long id) {
        PasswordResetRequest r = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!"PENDING".equalsIgnoreCase(r.getStatus())) {
            return new ApiResponse(false, "Request already handled");
        }

        Staff staff = staffRepository.findByEmail(r.getEmail()).orElse(null);
        if (staff == null) {
            return new ApiResponse(false,
                    "No account found for email: " + r.getEmail() + ". Reject instead.");
        }

        String temp = RandomStringUtils.randomAlphanumeric(12);
        System.out.println("════════════════════════════════════════════════════");
        System.out.println("🔑 PASSWORD RESET APPROVED");
        System.out.println("   Name:     " + staff.getFullName());
        System.out.println("   Staff ID: " + staff.getStaffId());
        System.out.println("   Username: " + staff.getUsername());
        System.out.println("   Email:    " + staff.getEmail());
        System.out.println("   New PW:   " + temp);
        System.out.println("════════════════════════════════════════════════════");

        staff.setPassword(passwordEncoder.encode(temp));
        staff.setFirstLogin(true);
        staffRepository.save(staff);

        r.setStatus("APPROVED");
        repo.save(r);

        // ===== Send fresh credentials (now with username) =====
        try {
            emailService.sendStaffCredentials(
                    staff.getEmail(),
                    staff.getFullName(),
                    staff.getStaffId(),
                    staff.getUsername(),
                    temp,
                    staff.getRole() != null ? staff.getRole().name() : "STAFF"
            );
        } catch (Exception ignored) {}

        Map<String, Object> data = new HashMap<>();
        data.put("staffId", staff.getStaffId());
        data.put("username", staff.getUsername());
        data.put("fullName", staff.getFullName());
        data.put("email", staff.getEmail());
        data.put("tempPassword", temp);
        data.put("role", staff.getRole() != null ? staff.getRole().name() : "STAFF");
        return new ApiResponse(true, "Password reset. Share the credentials with the user.", data);
    }

    // ==================== Admin: reject ====================
    @PutMapping("/{id}/reject")
    @Transactional
    public ApiResponse reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        PasswordResetRequest r = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        if (!"PENDING".equalsIgnoreCase(r.getStatus())) {
            return new ApiResponse(false, "Request already handled");
        }
        r.setStatus("REJECTED");
        if (body != null && body.get("reason") != null) {
            r.setMessage((r.getMessage() == null ? "" : r.getMessage() + " | ")
                    + "Rejection: " + body.get("reason"));
        }
        repo.save(r);
        return new ApiResponse(true, "Request rejected");
    }

    private Map<String, Object> toMap(PasswordResetRequest r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("staffId", r.getStaffId());
        m.put("fullName", r.getFullName());
        m.put("email", r.getEmail());
        m.put("phone", r.getPhone());
        m.put("message", r.getMessage());
        m.put("status", r.getStatus());
        m.put("createdAt", r.getCreatedAt());
        return m;
    }
}