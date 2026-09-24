package com.ntc.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired private JavaMailSender mailSender;

    private String wrap(String title, String bodyHtml) {
        return "<div style=\"font-family:Arial,sans-serif;max-width:640px;margin:auto;"
                + "border:1px solid #dbe7f7;border-radius:12px;overflow:hidden\">"
                + "<div style=\"background:linear-gradient(135deg,#0b2e6f,#0d6efd);padding:24px;color:#fff\">"
                +   "<h1 style=\"margin:0;font-size:22px;letter-spacing:2px\">NEPAL TELECOM</h1>"
                +   "<p style=\"margin:6px 0 0;font-size:13px;opacity:.85\">NTC Staff Leave Management</p>"
                + "</div>"
                + "<div style=\"padding:28px;background:#fff;color:#1e293b;font-size:15px;line-height:1.6\">"
                +   "<h2 style=\"margin-top:0;color:#0b2e6f\">" + title + "</h2>"
                +   bodyHtml
                + "</div>"
                + "<div style=\"background:#eef4ff;padding:16px;text-align:center;color:#5b7bab;font-size:12px\">"
                +   "© 2026 Nepal Telecom · All Rights Reserved"
                + "</div></div>";
    }

    public void sendStaffCredentials(String to, String fullName, String username, String tempPassword, String role) {
        String body = "<p>Dear <b>" + fullName + "</b>,</p>"
                + "<p>Your NTC Staff Leave Management account has been created.</p>"
                + "<table style=\"border-collapse:collapse;margin:16px 0\">"
                +   "<tr><td style=\"padding:8px 16px;background:#f4f8ff;font-weight:700\">Username</td>"
                +       "<td style=\"padding:8px 16px;border:1px solid #dbe7f7\">" + username + "</td></tr>"
                +   "<tr><td style=\"padding:8px 16px;background:#f4f8ff;font-weight:700\">Temporary Password</td>"
                +       "<td style=\"padding:8px 16px;border:1px solid #dbe7f7\"><code>" + tempPassword + "</code></td></tr>"
                +   "<tr><td style=\"padding:8px 16px;background:#f4f8ff;font-weight:700\">Role</td>"
                +       "<td style=\"padding:8px 16px;border:1px solid #dbe7f7\">" + role + "</td></tr>"
                + "</table>"
                + "<p>Please log in and change your password immediately.</p>"
                + "<p style=\"margin-top:24px\">Regards,<br/>NTC Administration</p>";
        sendHtmlEmail(to, "NTC Staff Account Credentials", wrap("Welcome to NTC", body));
    }

    public void sendRequestStatusUpdate(String to, String fullName, String refNo, String status, String remarks) {
        String body = "<p>Dear <b>" + fullName + "</b>,</p>"
                + "<p>Your leave request <b>" + refNo + "</b> has been updated.</p>"
                + "<p><b>Status:</b> " + status + "</p>"
                + (remarks != null && !remarks.isBlank() ? "<p><b>Remarks:</b> " + remarks + "</p>" : "")
                + "<p>Thank you.</p>";
        sendHtmlEmail(to, "Leave Request Update — " + refNo, wrap("Leave Request Update", body));
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(message, true, "UTF-8");
            h.setTo(to);
            h.setSubject(subject);
            h.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}