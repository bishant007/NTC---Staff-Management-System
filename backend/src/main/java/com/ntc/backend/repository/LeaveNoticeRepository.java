package com.ntc.backend.repository;

import com.ntc.backend.entity.LeaveNotice;
import com.ntc.backend.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveNoticeRepository extends JpaRepository<LeaveNotice, Long> {
    Optional<LeaveNotice> findByLeaveRequest(LeaveRequest leaveRequest);
    Optional<LeaveNotice> findByLeaveRequestId(Long leaveRequestId);   // NEW
    Optional<LeaveNotice> findByReferenceNumber(String referenceNumber);
    List<LeaveNotice> findAllByOrderByCreatedAtDesc();
}