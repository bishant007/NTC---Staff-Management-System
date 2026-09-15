package com.ntc.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads/signatures}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    public void init() {
        try {
            root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + uploadDir, e);
        }
    }

    /**
     * Store the signature file for a given staff.
     * Returns the relative filename stored in DB.
     */
    public String storeSignature(MultipartFile file, String staffId) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Signature file is empty");
        }
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = staffId + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
        try {
            Path target = root.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store signature", e);
        }
    }

    public Resource loadSignature(String filename) {
        try {
            Path file = root.resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Signature not found");
        } catch (Exception e) {
            throw new RuntimeException("Could not load signature", e);
        }
    }

    public void deleteSignature(String filename) {
        if (filename == null) return;
        try {
            Path file = root.resolve(filename).normalize();
            Files.deleteIfExists(file);
        } catch (IOException ignored) {}
    }
}