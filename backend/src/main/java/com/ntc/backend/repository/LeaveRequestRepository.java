package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByStatus(RequestStatus status);
    long countByStatus(RequestStatus status);
    long countByCreatedAtBetween(Instant start, Instant end);
    List<LeaveRequest> findByStaff(Staff staff);
}