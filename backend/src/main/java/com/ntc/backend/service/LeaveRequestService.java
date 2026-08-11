package com.ntc.backend.service;

import com.ntc.backend.dto.LeaveRequestDTO;
import com.ntc.backend.entity.LeaveRequest;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class LeaveRequestService {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private StaffRepository staffRepository;

    public LeaveRequest submitRequest(LeaveRequestDTO dto) {
        Staff staff = staffRepository.findByStaffId(dto.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // Validate returnDateTime is after current time
        if (dto.getReturnDateTime().isBefore(Instant.now())) {
            throw new RuntimeException("Return date/time must be in the future");
        }

        LeaveRequest request = new LeaveRequest();
        request.setStaff(staff);
        request.setReason(dto.getReason());
        request.setLeaveStartTime(Instant.now());  // server time
        request.setReturnDateTime(dto.getReturnDateTime());
        request.setStatus(RequestStatus.PENDING);

        return leaveRequestRepository.save(request);
    }
}