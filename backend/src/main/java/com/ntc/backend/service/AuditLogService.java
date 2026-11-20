package com.ntc.backend.service;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.AuditLog;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.AuditLogRepository;
import com.ntc.backend.repository.StaffRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.List;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    @Autowired private AuditLogRepository repo;
    @Autowired private StaffRepository staffRepository;
    @Autowired private AdminRepository adminRepository;

    /**
     * Record an audit event. Runs in its OWN transaction so a failure here
     * can never roll back the primary operation.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actorUsername, AuditAction action,
                       String targetType, String targetId, String targetName,
                       String details) {
        try {
            AuditLog a = new AuditLog();
            a.setAction(action);
            a.setTargetType(targetType);
            a.setTargetId(targetId);
            a.setTargetName(targetName);
            a.setDetails(details);
            a.setSuccess(true);

            if (actorUsername == null || actorUsername.isBlank() || "SYSTEM".equalsIgnoreCase(actorUsername)) {
                a.setActorType("SYSTEM");
                a.setActorUsername("SYSTEM");
                a.setActorName("System");
            } else {
                Staff s = staffRepository.findByUsername(actorUsername).orElse(null);
                if (s != null) {
                    a.setActorType("STAFF");
                    a.setActorId(s.getId());
                    a.setActorUsername(s.getUsername());
                    a.setActorName(s.getFullName());
                } else {
                    Admin adm = adminRepository.findByUsername(actorUsername)
                            .or(() -> adminRepository.findByEmail(actorUsername))
                            .orElse(null);
                    if (adm != null) {
                        a.setActorType("ADMIN");
                        a.setActorId(adm.getId());
                        a.setActorUsername(adm.getUsername());
                        a.setActorName(adm.getFullName());
                    } else {
                        a.setActorType("UNKNOWN");
                        a.setActorUsername(actorUsername);
                    }
                }
            }

            try {
                ServletRequestAttributes attrs =
                        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                if (attrs != null) {
                    HttpServletRequest req = attrs.getRequest();
                    String xff = req.getHeader("X-Forwarded-For");
                    a.setIpAddress(xff != null && !xff.isBlank()
                            ? xff.split(",")[0].trim()
                            : req.getRemoteAddr());
                    String ua = req.getHeader("User-Agent");
                    if (ua != null && ua.length() > 500) ua = ua.substring(0, 500);
                    a.setUserAgent(ua);
                }
            } catch (Exception ignored) {}

            repo.save(a);
        } catch (Exception e) {
            log.warn("Audit log failed [{}]: {}", action, e.getMessage());
        }
    }

    public List<AuditLog> search(String actor, AuditAction action, Instant from, Instant to, int limit) {
        return repo.search(
                (actor == null || actor.isBlank()) ? null : actor,
                action, from, to,
                PageRequest.of(0, Math.max(1, Math.min(limit, 1000)), Sort.by("timestamp").descending())
        );
    }

    public List<AuditLog> recent(int limit) {
        return repo.findAllByOrderByTimestampDesc(
                PageRequest.of(0, Math.max(1, Math.min(limit, 500)), Sort.by("timestamp").descending())
        );
    }
}