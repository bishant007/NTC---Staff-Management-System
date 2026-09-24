package com.ntc.backend.config;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private AdminRepository adminRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin("ADMIN-001", "admin@bharat.com", "Bharat Bandhu Paudel", "Super@admin");
        seedAdmin("ADMIN-002", "admin@nirmal.com", "Nirmal Raj Chataut", "test@1234");
    }

    private void seedAdmin(String adminId, String username, String fullName, String password) {
        if (adminRepository.findByUsername(username).isEmpty()) {
            Admin a = new Admin();
            a.setAdminId(adminId);
            a.setUsername(username);
            a.setEmail(username);
            a.setFullName(fullName);
            a.setPassword(passwordEncoder.encode(password));
            a.setRole("ADMIN");
            adminRepository.save(a);
            System.out.println("✅ Seeded admin: " + username + " / " + password);
        }
    }
}