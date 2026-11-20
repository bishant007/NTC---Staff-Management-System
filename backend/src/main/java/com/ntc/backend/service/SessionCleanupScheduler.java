package com.ntc.backend.service;

import com.ntc.backend.repository.UserSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class SessionCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupScheduler.class);

    @Autowired private UserSessionRepository repo;

    /** Runs daily at 02:30 Nepal time — purges sessions expired/revoked > 30 days ago. */
    @Scheduled(cron = "0 30 2 * * *", zone = "Asia/Kathmandu")
    @Transactional
    public void purgeOldSessions() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        int n = repo.purgeOlderThan(cutoff);
        if (n > 0) log.info("Purged {} stale session records", n);
    }
}