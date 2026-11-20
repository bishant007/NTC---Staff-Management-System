package com.ntc.backend.repository;

import com.ntc.backend.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    Optional<UserSession> findBySessionId(String sessionId);

    List<UserSession> findByUserTypeAndUserIdOrderByCreatedAtDesc(String userType, Long userId);

    List<UserSession> findByUserTypeAndUserIdAndRevokedFalse(String userType, Long userId);

    @Query("SELECT s FROM UserSession s WHERE s.userType = :type AND s.userId = :id " +
            "AND s.revoked = false AND s.expiresAt > :now ORDER BY s.lastUsedAt DESC")
    List<UserSession> findActiveByUser(@Param("type") String userType,
                                       @Param("id") Long userId,
                                       @Param("now") Instant now);

    long countByUserTypeAndUserIdAndRevokedFalseAndExpiresAtAfter(
            String userType, Long userId, Instant now);

    /** Bulk revoke all active sessions for a user. */
    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.revoked = true, s.revokedAt = :now, s.revokedReason = :reason " +
            "WHERE s.userType = :type AND s.userId = :id AND s.revoked = false")
    int revokeAllForUser(@Param("type") String userType,
                         @Param("id") Long userId,
                         @Param("now") Instant now,
                         @Param("reason") String reason);

    /** Revoke all sessions for a user EXCEPT the given session id. */
    @Modifying
    @Transactional
    @Query("UPDATE UserSession s SET s.revoked = true, s.revokedAt = :now, s.revokedReason = :reason " +
            "WHERE s.userType = :type AND s.userId = :id AND s.sessionId <> :keepId AND s.revoked = false")
    int revokeAllExcept(@Param("type") String userType,
                        @Param("id") Long userId,
                        @Param("keepId") String keepSessionId,
                        @Param("now") Instant now,
                        @Param("reason") String reason);

    /** Purge expired or revoked sessions older than a cutoff. */
    @Modifying
    @Transactional
    @Query("DELETE FROM UserSession s WHERE s.expiresAt < :cutoff OR " +
            "(s.revoked = true AND s.revokedAt < :cutoff)")
    int purgeOlderThan(@Param("cutoff") Instant cutoff);
}