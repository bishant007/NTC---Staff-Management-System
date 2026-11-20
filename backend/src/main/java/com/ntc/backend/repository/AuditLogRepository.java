package com.ntc.backend.repository;

import com.ntc.backend.entity.AuditLog;
import com.ntc.backend.enums.AuditAction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:actor IS NULL OR a.actorUsername LIKE %:actor%) AND " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:from IS NULL OR a.timestamp >= :from) AND " +
            "(:to IS NULL OR a.timestamp <= :to)")
    List<AuditLog> search(@Param("actor") String actor,
                          @Param("action") AuditAction action,
                          @Param("from") Instant from,
                          @Param("to") Instant to,
                          Pageable pageable);

    List<AuditLog> findByActionOrderByTimestampDesc(AuditAction action);

    long countByAction(AuditAction action);
}