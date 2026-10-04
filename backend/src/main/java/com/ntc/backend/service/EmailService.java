package com.ntc.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired private JavaMailSender mailSender;

    /** Comes from secrets file — must match the authenticated SMTP account. */
    @Value("${spring.mail.username}")
    private String fromAddress;

    /** Friendly display name shown to recipients in their inbox. */
    @Value("${mail.from.name:NTC Leave Management}")
    private String fromName;

    // Brand palette
    private static final String NAVY     = "#0b2e6f";
    private static final String BLUE     = "#0d6efd";
    private static final String BLUE_DK  = "#0a4fc4";
    private static final String SKY      = "#eef4ff";
    private static final String SKY_2    = "#f4f8ff";
    private static final String BORDER   = "#dbe7f7";
    private static final String TEXT     = "#1e293b";
    private static final String MUTED    = "#64748b";
    private static final String SUCCESS  = "#16a34a";
    private static final String WARN     = "#f59e0b";
    private static final String FONT     = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    /* =========================================================
       PUBLIC API
       ========================================================= */

    public void sendStaffCredentials(String to,
                                     String fullName,
                                     String staffId,
                                     String username,
                                     String tempPassword,
                                     String role) {

        String roleLabel = prettyRole(role);
        String subject  = "Welcome to Nepal Telecom — Your Account is Ready";

        String body = ""
                + para("Dear <strong style=\"color:" + NAVY + ";\">" + esc(fullName) + "</strong>,")
                + para("Your <strong>NTC Staff Leave Management</strong> account has been created. "
                + "You can now access the portal using the credentials below.")

                + credentialsCard(staffId, username, tempPassword, roleLabel)

                + ctaButton("https://localhost:5173/staff/login", "Log In to Your Account")

                + divider()
                + noticeBlock("🔒", "First-time login",
                "You will be prompted to <strong>set a new password</strong> on your first login. "
                        + "Choose something strong and unique — at least 8 characters.")

                + noticeBlock("✍", "Digital signature",
                "Before submitting or approving any leave request, upload your "
                        + "<strong>digital signature</strong> from <em>My Profile → Digital Signature</em>. "
                        + "It will be applied automatically to every action you take.")

                + para("If you did not request this account or believe this email was sent in error, "
                + "please contact the NTC Administrator immediately.")
                + para("Warm regards,<br/><strong>NTC Administration</strong><br/>"
                + "<span style=\"color:" + MUTED + ";font-size:13px;\">Nepal Telecom</span>");

        sendHtmlEmail(to, subject, wrap(subject, body));
    }

    public void sendRequestStatusUpdate(String to,
                                        String fullName,
                                        String refNo,
                                        String status,
                                        String remarks) {

        String subject = "Leave Request Update — " + refNo;
        String body = ""
                + para("Dear <strong style=\"color:" + NAVY + ";\">" + esc(fullName) + "</strong>,")
                + para("Your leave request <strong>" + esc(refNo) + "</strong> has been updated.")
                + statusCard(status, remarks)
                + ctaButton("https://localhost:5173/staff/my-requests", "View Your Request")
                + para("Thank you,<br/><strong>NTC Administration</strong>");

        sendHtmlEmail(to, subject, wrap(subject, body));
    }

    public void sendAccountDeactivated(String to, String fullName) {
        String subject = "Your NTC account has been deactivated";
        String body = ""
                + para("Dear <strong style=\"color:" + NAVY + ";\">" + esc(fullName) + "</strong>,")
                + para("Your <strong>NTC Staff Leave Management</strong> account has been "
                + "<strong style=\"color:#dc2626;\">deactivated</strong> by an administrator.")
                + divider()
                + noticeBlock("🚫", "What this means",
                "You can no longer log in to the portal. Any historical requests and approvals "
                        + "you made remain on record.")
                + noticeBlock("📞", "Need to reactivate?",
                "If this was a mistake or your access needs to be restored, please contact "
                        + "your NTC Administrator or the Office In-Charge.")
                + para("Regards,<br/><strong>NTC Administration</strong><br/>"
                + "<span style=\"color:" + MUTED + ";font-size:13px;\">Nepal Telecom</span>");
        sendHtmlEmail(to, subject, wrap(subject, body));
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(message, true, "UTF-8");

            // ⭐ The From address MUST match spring.mail.username, otherwise
            // Google Workspace / Microsoft 365 reject the send.
            h.setFrom(fromAddress, fromName);

            h.setTo(to);
            h.setSubject(subject);
            h.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /* =========================================================
       LAYOUT PIECES
       ========================================================= */

    private String wrap(String subject, String bodyHtml) {
        return "<!DOCTYPE html>"
                + "<html><head><meta charset=\"UTF-8\"/><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"/>"
                + "<title>" + esc(subject) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:#eef4ff;font-family:" + FONT + ";color:" + TEXT + ";\">"
                + "<div style=\"display:none;max-height:0;overflow:hidden;mso-hide:all;\">"
                + "Your NTC Staff Leave Management account is ready — sign in with the credentials inside."
                + "</div>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background:#eef4ff;padding:32px 16px;\"><tr><td align=\"center\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:600px;width:100%;background:#ffffff;border-radius:16px;"
                + "overflow:hidden;box-shadow:0 8px 24px rgba(11,46,111,.08);\">"
                + header()
                + "<tr><td style=\"padding:32px 40px 8px 40px;\">" + bodyHtml + "</td></tr>"
                + "<tr><td style=\"height:12px;\"></td></tr>"
                + footer()
                + "</table></td></tr></table></body></html>";
    }

    private String header() {
        return "<tr><td style=\"background:linear-gradient(135deg," + NAVY + " 0%," + BLUE + " 100%);"
                + "padding:32px 40px;text-align:center;\">"
                + "<div style=\"display:inline-block;padding:8px 16px;border:2px solid rgba(255,255,255,.35);"
                + "border-radius:10px;font-size:14px;font-weight:800;color:#ffffff;letter-spacing:3px;\">"
                + "NTC"
                + "</div>"
                + "<h1 style=\"margin:16px 0 4px 0;color:#ffffff;font-size:22px;font-weight:800;"
                + "letter-spacing:2px;\">NEPAL TELECOM</h1>"
                + "<p style=\"margin:0;color:rgba(255,255,255,.85);font-size:13px;letter-spacing:.5px;\">"
                + "Staff Leave Management Portal"
                + "</p></td></tr>";
    }

    private String footer() {
        return "<tr><td style=\"background:" + SKY + ";padding:24px 40px;text-align:center;\">"
                + "<p style=\"margin:0 0 8px 0;font-size:12px;color:" + MUTED + ";\">"
                + "&copy; 2026 Nepal Telecom &middot; All Rights Reserved</p>"
                + "<p style=\"margin:0;font-size:11px;color:#94a3b8;line-height:1.6;\">"
                + "This is an automated message — please do not reply directly.<br/>"
                + "For assistance, contact your NTC Administrator."
                + "</p></td></tr>";
    }

    private String credentialsCard(String staffId, String username,
                                   String tempPassword, String roleLabel) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:8px 0 20px 0;border:1px solid " + BORDER + ";border-radius:12px;"
                + "background:" + SKY_2 + ";overflow:hidden;\">"
                + "<tr><td style=\"background:" + BLUE + ";padding:10px 20px;\">"
                + "<span style=\"color:#ffffff;font-size:11px;font-weight:800;letter-spacing:1.5px;\">"
                + "YOUR LOGIN CREDENTIALS"
                + "</span></td></tr>"
                + credRow("Staff ID",  staffId,      true)
                + credRow("Username",  username,     true)
                + credRow("Password",  tempPassword, true)
                + credRow("Role",      roleLabel,    false)
                + "</table>";
    }

    private String credRow(String label, String value, boolean monospace) {
        String valueStyle = monospace
                ? "font-family:'SF Mono',Monaco,Menlo,Consolas,monospace;font-weight:700;"
                + "background:#ffffff;border:1px solid " + BORDER + ";padding:8px 12px;"
                + "border-radius:6px;font-size:14px;color:" + NAVY + ";display:inline-block;"
                + "letter-spacing:.5px;word-break:break-all;"
                : "font-weight:700;color:" + NAVY + ";font-size:14px;";

        return "<tr><td style=\"padding:14px 20px;border-bottom:1px solid #e8eefb;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr>"
                + "<td style=\"font-size:12px;font-weight:700;color:" + MUTED + ";"
                + "letter-spacing:.6px;text-transform:uppercase;width:110px;vertical-align:middle;\">"
                + label + "</td>"
                + "<td style=\"vertical-align:middle;\">"
                + "<span style=\"" + valueStyle + "\">" + esc(value) + "</span>"
                + "</td>"
                + "</tr></table>"
                + "</td></tr>";
    }

    private String statusCard(String status, String remarks) {
        String color = "#dbeafe";
        String fg    = "#1e40af";
        String s     = status == null ? "" : status.toUpperCase();

        if (s.contains("APPROVED")) { color = "#d1fae5"; fg = "#065f46"; }
        else if (s.contains("REJECTED")) { color = "#fee2e2"; fg = "#991b1b"; }
        else if (s.contains("PENDING")) { color = "#fef3c7"; fg = "#92400e"; }
        else if (s.contains("CANCEL")) { color = "#e5e7eb"; fg = "#374151"; }

        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:8px 0 20px 0;border-radius:12px;background:" + SKY_2 + ";"
                + "border:1px solid " + BORDER + ";\"><tr><td style=\"padding:18px 22px;\">"
                + "<div style=\"display:inline-block;padding:6px 14px;border-radius:20px;"
                + "background:" + color + ";color:" + fg + ";font-size:11px;font-weight:800;"
                + "letter-spacing:1px;\">" + esc(s.replace("_", " ")) + "</div>"
                + (remarks != null && !remarks.isBlank()
                ? "<p style=\"margin:14px 0 0 0;font-size:14px;color:" + TEXT + ";line-height:1.6;\">"
                + "<strong style=\"color:" + MUTED + ";font-size:12px;letter-spacing:.5px;\">"
                + "REMARKS</strong><br/>" + esc(remarks) + "</p>"
                : "")
                + "</td></tr></table>";
    }

    private String ctaButton(String url, String label) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:24px auto 28px auto;\"><tr><td align=\"center\" "
                + "style=\"background:" + BLUE + ";border-radius:10px;"
                + "box-shadow:0 4px 0 " + BLUE_DK + ";\">"
                + "<a href=\"" + url + "\" target=\"_blank\" "
                + "style=\"display:inline-block;padding:14px 32px;color:#ffffff;"
                + "text-decoration:none;font-size:15px;font-weight:700;letter-spacing:.3px;\">"
                + esc(label) + " &rarr;"
                + "</a></td></tr></table>";
    }

    private String noticeBlock(String emoji, String title, String text) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:0 0 16px 0;\"><tr>"
                + "<td style=\"width:44px;vertical-align:top;padding-top:2px;\">"
                + "<div style=\"width:36px;height:36px;border-radius:10px;background:" + SKY + ";"
                + "text-align:center;line-height:36px;font-size:16px;\">" + emoji + "</div></td>"
                + "<td style=\"vertical-align:top;\">"
                + "<p style=\"margin:0 0 2px 0;font-size:14px;font-weight:700;color:" + NAVY + ";\">"
                + title + "</p>"
                + "<p style=\"margin:0;font-size:13px;color:" + MUTED + ";line-height:1.6;\">"
                + text + "</p></td></tr></table>";
    }

    private String divider() {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"margin:8px 0 20px 0;\"><tr>"
                + "<td style=\"border-top:1px solid " + BORDER + ";\"></td>"
                + "</tr></table>";
    }

    private String para(String html) {
        return "<p style=\"margin:0 0 16px 0;font-size:15px;color:" + TEXT + ";line-height:1.65;\">"
                + html + "</p>";
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    private String prettyRole(String role) {
        if (role == null) return "";
        return switch (role) {
            case "STAFF"           -> "Staff";
            case "SECTION_HEAD"    -> "Section Head";
            case "OFFICE_INCHARGE" -> "Office In-Charge";
            default                -> role.replace("_", " ");
        };
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}