package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import com.ntc.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private FileStorageService fileStorageService;

    @GetMapping("/me")
    public ApiResponse me(Authentication auth) {
        Staff s = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return new ApiResponse(true, "OK", s);
    }

    @PostMapping("/signature")
    public ApiResponse uploadSignature(@RequestParam("file") MultipartFile file, Authentication auth) {
        Staff me = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // ⚠️ Do NOT delete old signature — historical leave requests reference it
        String filename = fileStorageService.storeSignature(file, me.getStaffId());
        me.setSignaturePath(filename);
        me.setSignatureUploadedAt(Instant.now());
        staffRepository.save(me);

        return new ApiResponse(true, "Signature uploaded successfully");
    }

    @DeleteMapping("/signature")
    public ApiResponse deleteSignature(Authentication auth) {
        Staff s = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        s.setSignaturePath(null);
        s.setSignatureUploadedAt(null);
        staffRepository.save(s);
        return new ApiResponse(true, "Signature removed");
    }

    @GetMapping("/signature/{staffId}")
    public ResponseEntity<Resource> getSignature(@PathVariable String staffId) {
        Staff s = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (s.getSignaturePath() == null) return ResponseEntity.notFound().build();
        try {
            Resource res = fileStorageService.loadSignature(s.getSignaturePath());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                    .body(res);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/signature-file/{filename}")
    public ResponseEntity<Resource> getSignatureFile(@PathVariable String filename) {
        Resource res = fileStorageService.loadSignature(filename);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(res);
    }
}