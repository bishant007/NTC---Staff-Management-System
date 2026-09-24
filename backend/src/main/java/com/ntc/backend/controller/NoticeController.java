package com.ntc.backend.controller;

import com.ntc.backend.dto.NoticeDTO;
import com.ntc.backend.repository.LeaveNoticeRepository;
import com.ntc.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    @Autowired private LeaveNoticeRepository noticeRepository;
    @Autowired private ReportService reportService;

    @GetMapping
    public List<NoticeDTO> all() {
        return reportService.allNotices();
    }

    @GetMapping("/{id}")
    public NoticeDTO one(@PathVariable Long id) {
        return NoticeDTO.from(noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notice not found")));
    }

    @GetMapping("/by-request/{requestId}")
    public ResponseEntity<NoticeDTO> byRequest(@PathVariable Long requestId) {
        return noticeRepository.findByLeaveRequestId(requestId)
                .map(n -> ResponseEntity.ok(NoticeDTO.from(n)))
                .orElse(ResponseEntity.notFound().build());
    }
}