package com.ntc.backend.repository;

import com.ntc.backend.entity.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;  // ← Import Spring's JpaRepository
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordResetRequest, Long> {

    List<PasswordResetRequest> findByStatus(String status);

    long countByStatus(String status);
}