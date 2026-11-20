package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.dto.LoginRequest;
import com.ntc.backend.dto.RefreshTokenRequest;
import com.ntc.backend.dto.SessionDTO;
import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.security.JwtUtil;
import com.ntc.backend.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private StaffRepository staffRepository;
    @Autowired private AdminRepository adminRepository;
    @Autowired private SessionService sessionService;

    /* ============================================================
       LOGIN — creates a session, returns access + refresh tokens
       ============================================================ */
    @PostMapping("/login")
    @Transactional
    public ApiResponse login(@RequestBody LoginRequest req, HttpServletRequest http) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            UserDetails ud = (UserDetails) auth.getPrincipal();
            String username = ud.getUsername();

            // ---- Admin? ----
            var adminOpt = adminRepository.findByUsername(username);
            if (adminOpt.isPresent()) {
                Admin a = adminOpt.get();
                var tokens = sessionService.startSession(
                        "ADMIN", a.getId(), a.getUsername(), "ADMIN",
                        clientIp(http), http.getHeader("User-Agent"));

                Map<String, Object> data = new HashMap<>();
                data.put("token", tokens.accessToken);
                data.put("refreshToken", tokens.refreshToken);
                data.put("sessionId", tokens.sessionId);
                data.put("username", a.getUsername());
                data.put("role", "admin");
                data.put("fullName", a.getFullName());
                data.put("email", a.getEmail());
                data.put("adminId", a.getAdminId());
                return new ApiResponse(true, "Login successful", data);
            }

            // ---- Staff ----
            Staff s = staffRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String rolePlain = s.getRole().name(); // STAFF / SECTION_HEAD / OFFICE_INCHARGE
            var tokens = sessionService.startSession(
                    "STAFF", s.getId(), s.getUsername(), rolePlain,
                    clientIp(http), http.getHeader("User-Agent"));

            Map<String, Object> data = new HashMap<>();
            data.put("token", tokens.accessToken);
            data.put("refreshToken", tokens.refreshToken);
            data.put("sessionId", tokens.sessionId);
            data.put("username", s.getUsername());
            data.put("role", rolePlain.toLowerCase());
            data.put("staffId", s.getStaffId());
            data.put("fullName", s.getFullName());
            data.put("email", s.getEmail());
            data.put("department", s.getDepartment());
            data.put("branch", s.getBranch());
            data.put("isFirstLogin", s.isFirstLogin());
            data.put("hasSignature", s.getSignaturePath() != null);

            return new ApiResponse(true, "Login successful", data);

        } catch (DisabledException e) {
            return new ApiResponse(false,
                    "Your account has been deactivated. Please contact your NTC Administrator.");
        } catch (Exception e) {
            if (e.getCause() instanceof DisabledException) {
                return new ApiResponse(false,
                        "Your account has been deactivated. Please contact your NTC Administrator.");
            }
            return new ApiResponse(false, "Invalid username, Staff ID, or password");
        }
    }

    /* ============================================================
       REFRESH — rotates refresh token, issues new access token
       ============================================================ */
    @PostMapping("/refresh")
    public ApiResponse refresh(@RequestBody RefreshTokenRequest req) {
        var tokens = sessionService.refresh(req.getRefreshToken());
        if (tokens == null) {
            return new ApiResponse(false, "Refresh token invalid or expired");
        }
        Map<String, Object> data = new HashMap<>();
        data.put("token", tokens.accessToken);
        data.put("refreshToken", tokens.refreshToken);
        data.put("sessionId", tokens.sessionId);
        return new ApiResponse(true, "Token refreshed", data);
    }

    /* ============================================================
       LOGOUT — revokes the caller's session
       ============================================================ */
    @PostMapping("/logout")
    public ApiResponse logout(@RequestHeader(value = "Authorization", required = false) String header) {
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String token = header.substring(7);
                String sessionId = jwtUtil.getSessionId(token);
                sessionService.revokeSession(sessionId, "USER_LOGOUT");
            } catch (Exception ignored) {
                // Malformed/expired token — nothing to revoke, still respond OK
            }
        }
        return new ApiResponse(true, "Logged out");
    }

    /* ============================================================
       SESSIONS — see & manage active devices
       ============================================================ */
    @GetMapping("/sessions")
    @Transactional(readOnly = true)
    public List<SessionDTO> listSessions(Authentication auth,
                                         @RequestHeader(value = "Authorization", required = false) String header) {
        String currentSessionId = extractSessionIdFromHeader(header);
        String username = auth == null ? null : auth.getName();
        if (username == null) return List.of();

        Staff staff = staffRepository.findByUsername(username).orElse(null);
        if (staff != null) {
            return sessionService.listActive("STAFF", staff.getId())
                    .stream()
                    .map(s -> SessionDTO.from(s, currentSessionId))
                    .collect(Collectors.toList());
        }
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            return sessionService.listActive("ADMIN", admin.getId())
                    .stream()
                    .map(s -> SessionDTO.from(s, currentSessionId))
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    @DeleteMapping("/sessions/others")
    @Transactional
    public ApiResponse revokeOtherSessions(Authentication auth,
                                           @RequestHeader(value = "Authorization", required = false) String header) {
        String currentSessionId = extractSessionIdFromHeader(header);
        String username = auth == null ? null : auth.getName();
        if (username == null) return new ApiResponse(false, "Not authenticated");

        Staff staff = staffRepository.findByUsername(username).orElse(null);
        if (staff != null) {
            int n = sessionService.revokeOtherSessions(
                    "STAFF", staff.getId(), currentSessionId, "USER_REVOKED_OTHERS");
            return new ApiResponse(true, n + " other session(s) revoked");
        }
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            int n = sessionService.revokeOtherSessions(
                    "ADMIN", admin.getId(), currentSessionId, "USER_REVOKED_OTHERS");
            return new ApiResponse(true, n + " other session(s) revoked");
        }
        return new ApiResponse(false, "User not found");
    }

    @DeleteMapping("/sessions/{id}")
    @Transactional
    public ApiResponse revokeOne(@PathVariable Long id, Authentication auth) {
        String username = auth == null ? null : auth.getName();
        if (username == null) return new ApiResponse(false, "Not authenticated");

        // Resolve the caller to make sure they own the session
        Staff staff = staffRepository.findByUsername(username).orElse(null);
        if (staff != null) {
            return sessionService.listActive("STAFF", staff.getId()).stream()
                    .filter(s -> s.getId().equals(id))
                    .findFirst()
                    .map(s -> {
                        sessionService.revokeSession(s.getSessionId(), "USER_REVOKED_DEVICE");
                        return new ApiResponse(true, "Session revoked");
                    })
                    .orElse(new ApiResponse(false, "Session not found"));
        }
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            return sessionService.listActive("ADMIN", admin.getId()).stream()
                    .filter(s -> s.getId().equals(id))
                    .findFirst()
                    .map(s -> {
                        sessionService.revokeSession(s.getSessionId(), "USER_REVOKED_DEVICE");
                        return new ApiResponse(true, "Session revoked");
                    })
                    .orElse(new ApiResponse(false, "Session not found"));
        }
        return new ApiResponse(false, "User not found");
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    private String extractSessionIdFromHeader(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        try { return jwtUtil.getSessionId(header.substring(7)); }
        catch (Exception e) { return null; }
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}