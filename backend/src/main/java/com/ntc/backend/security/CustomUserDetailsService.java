package com.ntc.backend.security;

import com.ntc.backend.entity.Admin;
import com.ntc.backend.entity.Staff;
import com.ntc.backend.repository.AdminRepository;
import com.ntc.backend.repository.StaffRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private StaffRepository staffRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try Staff first (by staffId)
        Staff staff = staffRepository.findByStaffId(username).orElse(null);
        if (staff != null) {
            return new User(
                    staff.getStaffId(),
                    staff.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_STAFF"))
            );
        }

        // Then Admin (by email)
        Admin admin = adminRepository.findByEmail(username).orElse(null);
        if (admin != null) {
            return new User(
                    admin.getEmail(),
                    admin.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}