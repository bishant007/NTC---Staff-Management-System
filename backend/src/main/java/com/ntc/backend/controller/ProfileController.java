package com.ntc.backend.controller;

import com.ntc.backend.dto.ApiResponse;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired private StaffRepository staffRepository;

    @Value("${file.upload-dir:uploads/signatures}")
    private String uploadDir;

    @GetMapping("/me")
    public ApiResponse me(Authentication auth) {
        Staff s = staffRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        return new ApiResponse(true, "OK", s);
    }

    @PostMapping("/signature")
    public ApiResponse uploadSignature(@RequestParam("file") MultipartFile file, Authentication auth) {
        try {
            Staff s = staffRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Staff not found"));

            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String filename = s.getUsername() + "-" + System.currentTimeMillis() + ".png";
            Path path = Paths.get(uploadDir, filename);
            Files.write(path, file.getBytes());

            s.setSignaturePath(path.toString());
            s.setSignatureUploadedAt(Instant.now());
            staffRepository.save(s);
            return new ApiResponse(true, "Signature uploaded");
        } catch (Exception e) {
            return new ApiResponse(false, "Upload failed: " + e.getMessage());
        }
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
        File f = new File(s.getSignaturePath());
        if (!f.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                .body(new FileSystemResource(f));
    }
}