package com.ntc.backend.service;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.entity.UserSession;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.repository.UserSessionRepository;
import com.ntc.backend.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);
    private static final SecureRandom RNG = new SecureRandom();
    private static final ZoneId NEPAL_ZONE = ZoneId.of("Asia/Kathmandu");
    private static final DateTimeFormatter NEPAL_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(NEPAL_ZONE);

    @Autowired private UserSessionRepository repo;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuditLogService auditLogService;
    @Autowired private EmailService emailService;
    @Autowired private StaffRepository staffRepository;
    @Autowired private AdminRepository adminRepository;

    @Value("${jwt.refresh.expiration.days:30}")
    private int refreshDays;

    /** Creates a new session; returns the freshly-minted access + refresh tokens. */
    @Transactional
    public IssuedTokens startSession(String userType, Long userId, String username,
                                     String role, String ip, String userAgent) {
        String sessionId = UUID.randomUUID().toString();
        String refreshToken = generateRefreshToken();

        UserSession s = new UserSession();
        s.setSessionId(sessionId);
        s.setUserType(userType);
        s.setUserId(userId);
        s.setUsername(username);
        s.setRefreshTokenHash(passwordEncoder.encode(refreshToken));
        s.setIpAddress(ip);
        s.setUserAgent(trim(userAgent, 500));
        s.setCreatedAt(Instant.now());
        s.setLastUsedAt(Instant.now());
        s.setExpiresAt(Instant.now().plusSeconds(refreshDays * 24L * 3600));
        s.setRevoked(false);
        repo.save(s);

        String access = jwtUtil.generateToken(username, role, sessionId);
        log.info("Session started: user={} type={} sessionId={} ip={}", username, userType, sessionId, ip);

        try {
            auditLogService.record(username, AuditAction.SESSION_STARTED,
                    "SESSION", sessionId, username,
                    "New login from " + (ip == null ? "unknown" : ip));
        } catch (Exception ignored) {}

        try {
            notifyIfNewDevice(userType, userId, username, ip, userAgent);
        } catch (Exception e) {
            log.debug("New-device email skipped: {}", e.getMessage());
        }

        return new IssuedTokens(access, refreshToken, sessionId);
    }

    /**
     * Fire a "new sign-in" alert only if this IP has NOT been seen before for this user.
     * We look at historical sessions (any state) to decide.
     */
    private void notifyIfNewDevice(String userType, Long userId, String username,
                                   String ip, String userAgent) {
        if (ip == null) return;

        long historical = repo.findByUserTypeAndUserIdOrderByCreatedAtDesc(userType, userId)
                .stream().filter(s -> ip.equals(s.getIpAddress())).count();
        if (historical > 1) return; // same IP as before — no alert

        String email = lookupEmail(userType, userId);
        String name  = lookupName(userType, userId);
        if (email == null) return;

        emailService.sendNewLoginAlert(email, name, ip,
                userAgent == null ? "" : userAgent,
                NEPAL_FMT.format(Instant.now()) + " (NPT)");
    }

    private String lookupEmail(String type, Long id) {
        if ("STAFF".equals(type)) return staffRepository.findById(id).map(Staff::getEmail).orElse(null);
        if ("ADMIN".equals(type)) return adminRepository.findById(id).map(Admin::getEmail).orElse(null);
        return null;
    }

    private String lookupName(String type, Long id) {
        if ("STAFF".equals(type)) return staffRepository.findById(id).map(Staff::getFullName).orElse("User");
        if ("ADMIN".equals(type)) return adminRepository.findById(id).map(Admin::getFullName).orElse("Admin");
        return "User";
    }

    @Transactional
    public IssuedTokens refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return null;
        List<UserSession> candidates = repo.findAll();
        Instant now = Instant.now();

        for (UserSession s : candidates) {
            if (!passwordEncoder.matches(refreshToken, s.getRefreshTokenHash())) continue;

            if (s.isRevoked()) {
                log.warn("Refresh token reuse detected for user={}. Revoking ALL sessions.", s.getUsername());
                repo.revokeAllForUser(s.getUserType(), s.getUserId(), now, "REUSE_DETECTED");
                try {
                    auditLogService.record(s.getUsername(), AuditAction.SESSION_REUSE_DETECTED,
                            "SESSION", s.getSessionId(), s.getUsername(),
                            "Token reuse detected — all sessions revoked");
                } catch (Exception ignored) {}
                return null;
            }
            if (s.getExpiresAt().isBefore(now)) {
                log.info("Refresh token expired for user={}", s.getUsername());
                return null;
            }

            s.setRevoked(true);
            s.setRevokedAt(now);
            s.setRevokedReason("ROTATED");
            repo.save(s);

            String newRefresh = generateRefreshToken();
            UserSession next = new UserSession();
            next.setSessionId(UUID.randomUUID().toString());
            next.setUserType(s.getUserType());
            next.setUserId(s.getUserId());
            next.setUsername(s.getUsername());
            next.setRefreshTokenHash(passwordEncoder.encode(newRefresh));
            next.setIpAddress(s.getIpAddress());
            next.setUserAgent(s.getUserAgent());
            next.setCreatedAt(now);
            next.setLastUsedAt(now);
            next.setExpiresAt(s.getExpiresAt());
            next.setRevoked(false);
            repo.save(next);

            String role = "ADMIN".equals(s.getUserType()) ? "ADMIN" : "STAFF";
            String access = jwtUtil.generateToken(s.getUsername(), role, next.getSessionId());
            log.info("Token rotated for user={} oldSession={} newSession={}",
                    s.getUsername(), s.getSessionId(), next.getSessionId());
            return new IssuedTokens(access, newRefresh, next.getSessionId());
        }
        return null;
    }

    public boolean isSessionValid(String sessionId) {
        if (sessionId == null) return false;
        Optional<UserSession> os = repo.findBySessionId(sessionId);
        if (os.isEmpty()) return false;
        UserSession s = os.get();
        if (s.isRevoked()) return false;
        return s.getExpiresAt().isAfter(Instant.now());
    }

    @Transactional
    public void touch(String sessionId) {
        repo.findBySessionId(sessionId).ifPresent(s -> {
            s.setLastUsedAt(Instant.now());
            repo.save(s);
        });
    }

    @Transactional
    public void revokeSession(String sessionId, String reason) {
        repo.findBySessionId(sessionId).ifPresent(s -> {
            s.setRevoked(true);
            s.setRevokedAt(Instant.now());
            s.setRevokedReason(reason);
            repo.save(s);
            try {
                auditLogService.record(s.getUsername(), AuditAction.SESSION_REVOKED,
                        "SESSION", sessionId, s.getUsername(),
                        "Session revoked: " + reason);
            } catch (Exception ignored) {}
        });
    }

    @Transactional
    public int revokeAllForUser(String userType, Long userId, String reason) {
        int n = repo.revokeAllForUser(userType, userId, Instant.now(), reason);
        if (n > 0) {
            try {
                String email = lookupEmail(userType, userId);
                String name  = lookupName(userType, userId);
                if (email != null) {
                    emailService.sendSessionRevoked(email, name,
                            n + " active session(s) ended. Reason: " + reason);
                }
            } catch (Exception ignored) {}

            try {
                auditLogService.record("SYSTEM", AuditAction.SESSION_REVOKED,
                        "USER", String.valueOf(userId), null,
                        "Bulk revoke: " + n + " session(s) — " + reason);
            } catch (Exception ignored) {}
        }
        return n;
    }

    @Transactional
    public int revokeOtherSessions(String userType, Long userId, String keepSessionId, String reason) {
        return repo.revokeAllExcept(userType, userId, keepSessionId, Instant.now(), reason);
    }

    public List<UserSession> listActive(String userType, Long userId) {
        return repo.findActiveByUser(userType, userId, Instant.now());
    }

    private String generateRefreshToken() {
        byte[] buf = new byte[48];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    private String trim(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    public static class IssuedTokens {
        public final String accessToken;
        public final String refreshToken;
        public final String sessionId;
        public IssuedTokens(String a, String r, String s) {
            this.accessToken = a; this.refreshToken = r; this.sessionId = s;
        }
    }
}