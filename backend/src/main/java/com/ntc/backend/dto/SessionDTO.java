package com.ntc.backend.dto;

import com.ntc.backend.entity.UserSession;
import java.time.Instant;

public class SessionDTO {
    public Long id;
    public String sessionId;
    public String ipAddress;
    public String userAgent;
    public Instant createdAt;
    public Instant lastUsedAt;
    public Instant expiresAt;
    public boolean current;

    public static SessionDTO from(UserSession s, String currentSessionId) {
        SessionDTO d = new SessionDTO();
        d.id = s.getId();
        d.sessionId = s.getSessionId();
        d.ipAddress = s.getIpAddress();
        d.userAgent = s.getUserAgent();
        d.createdAt = s.getCreatedAt();
        d.lastUsedAt = s.getLastUsedAt();
        d.expiresAt = s.getExpiresAt();
        d.current = currentSessionId != null && currentSessionId.equals(s.getSessionId());
        return d;
    }
}