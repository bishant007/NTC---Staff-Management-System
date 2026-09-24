package com.ntc.backend.repository;

import com.ntc.backend.entity.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRepository extends JpaRepository<PasswordResetRequest, Long> {
}