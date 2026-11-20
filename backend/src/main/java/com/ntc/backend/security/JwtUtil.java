package com.ntc.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration.ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /* ============================================================
       Legacy API — kept so nothing that already depends on it breaks
       ============================================================ */

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * @deprecated Use {@link #generateToken(String, String, String)} instead —
     *             the session-aware variant embeds a JWT id (jti) so the token
     *             can be revoked server-side. Kept only for any leftover callers.
     */
    @Deprecated
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities().iterator().next().getAuthority());
        return createToken(claims, userDetails.getUsername(), UUID.randomUUID().toString());
    }

    private String createToken(Map<String, Object> claims, String subject, String sessionId) {
        return Jwts.builder()
                .setClaims(claims)
                .setId(sessionId)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /* ============================================================
       Session-aware API (new)
       ============================================================ */

    /**
     * Generates an access token bound to a specific session.
     *
     * @param username  login username (JWT subject)
     * @param role      plain role string like "ADMIN", "STAFF", "SECTION_HEAD", "OFFICE_INCHARGE"
     *                  (do NOT prefix with "ROLE_")
     * @param sessionId the session's public id — becomes the `jti` claim
     */
    public String generateToken(String username, String role, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username, sessionId);
    }

    /** Extract the session id (jti) from a token. */
    public String getSessionId(String token) {
        return extractAllClaims(token).getId();
    }

    /** Extract the plain role claim ("ADMIN", "STAFF", ...). */
    public String getRole(String token) {
        Object r = extractAllClaims(token).get("role");
        return r == null ? null : r.toString();
    }

    /** Alias for {@link #extractUsername(String)} for readability in new code. */
    public String getUsername(String token) {
        return extractUsername(token);
    }

    /** Quick validity check — signature + expiry only. Session state must be checked separately. */
    public boolean validate(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}