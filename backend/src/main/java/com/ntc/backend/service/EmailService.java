package com.ntc.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendStaffCredentials(String to, String staffId, String tempPassword) {
        String subject = "NTC Staff Account Credentials";
        String html = "<h2>Welcome to NTC Staff Portal</h2>" +
                "<p><b>Staff ID:</b> " + staffId + "</p>" +
                "<p><b>Temporary Password:</b> " + tempPassword + "</p>" +
                "<p>Please login and reset your password immediately.</p>" +
                "<p>Regards,<br/>NTC Administration</p>";
        sendHtmlEmail(to, subject, html);
    }

    public void sendRequestStatusUpdate(String to, String staffId, String status, String remarks) {
        String subject = "Leave Request Update";
        String html = "<h2>Leave Request Status Update</h2>" +
                "<p>Staff ID: <b>" + staffId + "</b></p>" +
                "<p>Status: <b>" + status + "</b></p>" +
                (remarks != null ? "<p>Admin Remarks: " + remarks + "</p>" : "") +
                "<p>Thank you.</p>";
        sendHtmlEmail(to, subject, html);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}