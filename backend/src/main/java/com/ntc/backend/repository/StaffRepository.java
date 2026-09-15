package com.ntc.backend.repository;

import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.StaffRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByStaffId(String staffId);
    Optional<Staff> findByEmail(String email);
    long countByIsFirstLogin(boolean isFirstLogin);

    List<Staff> findByRole(StaffRole role);
    List<Staff> findByDepartmentAndBranchAndRole(String department, String branch, StaffRole role);

    // All staff assigned to a given section head
    List<Staff> findBySectionHead(Staff sectionHead);

    // All section heads assigned to a given department head
    List<Staff> findByDepartmentHead(Staff departmentHead);

    // NEW: find by the ID of the related section head / department head
    List<Staff> findBySectionHeadId(Long sectionHeadId);
    List<Staff> findByDepartmentHeadId(Long departmentHeadId);
}