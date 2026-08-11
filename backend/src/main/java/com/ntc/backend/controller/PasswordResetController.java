package com.ntc.backend.controller;

import com.ntc.backend.dto.PasswordResetRequestDTO;
import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/password-reset")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ApiResponse requestReset(@RequestBody PasswordResetRequestDTO dto) {
        try {
            // Send to admin
            String adminEmail = "admin@ntc.com";
            String subject = "Password Reset Request - " + dto.getFullName();
            String body = "Name: " + dto.getFullName() +
                    "\nEmail: " + dto.getEmail() +
                    "\nPhone: " + dto.getPhone() +
                    "\nMessage: " + (dto.getMessage() != null ? dto.getMessage() : "None");
            emailService.sendHtmlEmail(adminEmail, subject, "<pre>" + body + "</pre>");

            // Confirm to staff
            emailService.sendHtmlEmail(dto.getEmail(), "Request Received",
                    "<h2>Your password reset request has been submitted.</h2><p>An admin will contact you soon.</p>");

            return new ApiResponse(true, "Request submitted successfully");
        } catch (Exception e) {
            return new ApiResponse(false, "Failed: " + e.getMessage());
        }
    }
}