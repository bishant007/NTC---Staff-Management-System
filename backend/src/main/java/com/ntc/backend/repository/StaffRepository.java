package com.ntc.backend.repository;

import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.StaffRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByStaffId(String staffId);
    Optional<Staff> findByUsername(String username);
    Optional<Staff> findByEmail(String email);

    long countByIsFirstLogin(boolean isFirstLogin);
    long countByRole(StaffRole role);

    List<Staff> findByRole(StaffRole role);
    List<Staff> findBySectionHead(Staff sectionHead);
    List<Staff> findBySectionHeadId(Long sectionHeadId);
    List<Staff> findByOfficeInchargeId(Long officeInchargeId);

    @Query("SELECT MAX(CAST(SUBSTRING(s.staffId, 5) AS long)) FROM Staff s WHERE s.staffId LIKE 'NTC-%'")
    Long findMaxNumericStaffId();
}