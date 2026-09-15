package com.ntc.backend.config;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (adminRepository.findByEmail("admin@ntc.com").isEmpty()) {
            Admin admin = new Admin();
            admin.setAdminId("ADMIN-001");
            admin.setFullName("System Administrator");
            admin.setEmail("admin@ntc.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            adminRepository.save(admin);
            System.out.println("✅ Default admin created: admin@ntc.com / admin123");
        }
    }
}