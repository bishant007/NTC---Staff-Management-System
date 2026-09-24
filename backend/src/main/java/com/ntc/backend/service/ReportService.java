package com.ntc.backend.service;

import com.ntc.backend.dto.LeaveRequestResponseDTO;
import com.ntc.backend.dto.NoticeDTO;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.repository.LeaveNoticeRepository;
import com.ntc.backend.repository.LeaveRequestRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired private LeaveRequestRepository leaveRequestRepository;
    @Autowired private LeaveNoticeRepository noticeRepository;
    @Autowired private StaffRepository staffRepository;

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> adminReport(RequestStatus status) {
        List<com.ntc.backend.entity.LeaveRequest> list = (status != null)
                ? leaveRequestRepository.findByStatus(status)
                : leaveRequestRepository.findAll();
        return list.stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> officeInchargeReport(String username) {
        Staff oi = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Office Incharge not found"));
        return leaveRequestRepository.findByStaffOfficeInchargeId(oi.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponseDTO> sectionHeadReport(String username) {
        Staff sh = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Section Head not found"));
        return leaveRequestRepository.findByStaffSectionHeadId(sh.getId())
                .stream().map(LeaveRequestResponseDTO::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoticeDTO> allNotices() {
        return noticeRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(NoticeDTO::from).collect(Collectors.toList());
    }
}