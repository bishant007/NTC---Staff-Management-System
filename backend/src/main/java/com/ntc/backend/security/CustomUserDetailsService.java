package com.ntc.backend.security;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Try staff by staffId
        Optional<Staff> staffOpt = staffRepository.findByStaffId(username);
        if (staffOpt.isPresent()) {
            Staff staff = staffOpt.get();
            System.out.println("🔍 Loaded staff: " + staff.getStaffId() + " role: " + staff.getRole()); // <-- DEBUG
            return new User(
                    staff.getStaffId(),
                    staff.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + staff.getRole().name()))
            );
        }

        // 2. Try admin by email (admin login uses email)
        Optional<Admin> adminOpt = adminRepository.findByEmail(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return new User(
                    admin.getEmail(),
                    admin.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}