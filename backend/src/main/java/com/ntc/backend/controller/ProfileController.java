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
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    @Autowired private StaffRepository staffRepository;
    @Autowired private FileStorageService fileStorageService;

    @GetMapping("/me")
    public ApiResponse me(Authentication auth) {
        Staff me = staffRepository.findByStaffId(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));

        Map<String, Object> data = new HashMap<>();
        data.put("staffId", me.getStaffId());
        data.put("fullName", me.getFullName());
        data.put("email", me.getEmail());
        data.put("phone", me.getPhone());
        data.put("department", me.getDepartment());
        data.put("branch", me.getBranch());
        data.put("role", me.getRole().name().toLowerCase());
        data.put("hasSignature", me.getSignaturePath() != null);
        data.put("signatureUploadedAt", me.getSignatureUploadedAt());

        if (me.getSectionHead() != null) {
            Map<String, Object> sh = new HashMap<>();
            sh.put("fullName", me.getSectionHead().getFullName());
            sh.put("staffId", me.getSectionHead().getStaffId());
            sh.put("email", me.getSectionHead().getEmail());
            sh.put("department", me.getSectionHead().getDepartment());
            data.put("sectionHead", sh);
        }
        if (me.getDepartmentHead() != null) {
            Map<String, Object> dh = new HashMap<>();
            dh.put("fullName", me.getDepartmentHead().getFullName());
            dh.put("staffId", me.getDepartmentHead().getStaffId());
            dh.put("email", me.getDepartmentHead().getEmail());
            dh.put("department", me.getDepartmentHead().getDepartment());
            data.put("departmentHead", dh);
        }
        return new ApiResponse(true, "OK", data);
    }

    @PostMapping("/signature")
    public ApiResponse uploadSignature(@RequestParam("file") MultipartFile file, Authentication auth) {
        Staff me = staffRepository.findByStaffId(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));

        // Delete old one if present
        if (me.getSignaturePath() != null) {
            fileStorageService.deleteSignature(me.getSignaturePath());
        }

        String filename = fileStorageService.storeSignature(file, me.getStaffId());
        me.setSignaturePath(filename);
        me.setSignatureUploadedAt(Instant.now());
        staffRepository.save(me);

        return new ApiResponse(true, "Signature uploaded successfully");
    }

    @GetMapping("/signature/{staffId}")
    public ResponseEntity<Resource> getSignature(@PathVariable String staffId) {
        Staff staff = staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (staff.getSignaturePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Resource res = fileStorageService.loadSignature(staff.getSignaturePath());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(res);
    }

    @DeleteMapping("/signature")
    public ApiResponse deleteSignature(Authentication auth) {
        Staff me = staffRepository.findByStaffId(auth.getName())
                .orElseThrow(() -> new RuntimeException("Not found"));
        if (me.getSignaturePath() != null) {
            fileStorageService.deleteSignature(me.getSignaturePath());
            me.setSignaturePath(null);
            me.setSignatureUploadedAt(null);
            staffRepository.save(me);
        }
        return new ApiResponse(true, "Signature removed");
    }
}