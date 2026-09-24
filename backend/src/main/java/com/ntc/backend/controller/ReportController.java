package com.ntc.backend.controller;

import com.ntc.backend.dto.LeaveRequestResponseDTO;
import com.ntc.backend.enums.RequestStatus;
import com.ntc.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired private ReportService reportService;

    @GetMapping("/admin")
    public List<LeaveRequestResponseDTO> admin(@RequestParam(required = false) RequestStatus status) {
        return reportService.adminReport(status);
    }

    @GetMapping("/office-incharge")
    public List<LeaveRequestResponseDTO> officeIncharge(Authentication auth) {
        return reportService.officeInchargeReport(auth.getName());
    }

    @GetMapping("/section-head")
    public List<LeaveRequestResponseDTO> sectionHead(Authentication auth) {
        return reportService.sectionHeadReport(auth.getName());
    }
}