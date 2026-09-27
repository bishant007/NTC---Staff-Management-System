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
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired private StaffRepository staffRepository;
    @Autowired private AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String credential) throws UsernameNotFoundException {

        // ---------- Staff lookup: username → staffId → email ----------
        Optional<Staff> staffOpt = staffRepository.findByUsername(credential);
        if (staffOpt.isEmpty()) staffOpt = staffRepository.findByStaffId(credential);
        if (staffOpt.isEmpty()) staffOpt = staffRepository.findByEmail(credential);

        if (staffOpt.isPresent()) {
            Staff s = staffOpt.get();
            return new User(
                    s.getUsername(),
                    s.getPassword(),
                    Collections.singletonList(
                            new SimpleGrantedAuthority("ROLE_" + s.getRole().name()))
            );
        }

        // ---------- Admin lookup: username → email ----------
        Optional<Admin> adminOpt = adminRepository.findByUsername(credential);
        if (adminOpt.isEmpty()) adminOpt = adminRepository.findByEmail(credential);

        if (adminOpt.isPresent()) {
            Admin a = adminOpt.get();
            return new User(
                    a.getUsername(),
                    a.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        throw new UsernameNotFoundException("User not found: " + credential);
    }
}