package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.PasswordResetRequestDTO;
import com.ntc.backend.entity.PasswordResetRequest;
import com.ntc.backend.repository.PasswordResetRepository;
import com.ntc.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/password-reset")
public class PasswordResetController {

    @Autowired private EmailService emailService;
    @Autowired private PasswordResetRepository repo;

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

            String subject = "Password Reset Request - " + dto.getFullName();
            String body = "Name: " + dto.getFullName() + "<br/>Email: " + dto.getEmail()
                    + "<br/>Phone: " + dto.getPhone()
                    + "<br/>Message: " + (dto.getMessage() != null ? dto.getMessage() : "None");
            try { emailService.sendHtmlEmail("admin@bharat.com", subject, body); } catch (Exception ignored) {}
            try { emailService.sendHtmlEmail(dto.getEmail(), "Request Received",
                    "<h2>Your password reset request has been received.</h2>"); } catch (Exception ignored) {}

            return new ApiResponse(true, "Request submitted successfully");
        } catch (Exception e) {
            return new ApiResponse(false, "Failed: " + e.getMessage());
        }
    }

    @GetMapping
    public List<PasswordResetRequest> list() {
        return repo.findAll();
    }
}