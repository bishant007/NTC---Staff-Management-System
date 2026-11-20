package com.ntc.backend.controller;

import com.ntc.backend.entity.AuditLog;
import com.ntc.backend.enums.AuditAction;
import com.ntc.backend.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired private AuditLogService auditLogService;

    @GetMapping
    public List<AuditLog> list(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "200") int limit) {
        if ((actor == null || actor.isBlank()) && action == null && from == null && to == null) {
            return auditLogService.recent(limit);
        }
        return auditLogService.search(actor, action, from, to, limit);
    }
}