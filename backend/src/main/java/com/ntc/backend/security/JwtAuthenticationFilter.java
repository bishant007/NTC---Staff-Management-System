package com.ntc.backend.security;

import com.ntc.backend.service.SessionService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired private JwtUtil jwtUtil;
    @Autowired private SessionService sessionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtUtil.extractAllClaims(token);
            String sessionId = claims.getId();
            String username = claims.getSubject();
            String role = claims.get("role", String.class);

            // Session must still be valid (not revoked, not expired)
            if (sessionId != null && username != null && sessionService.isSessionValid(sessionId)) {
                String authority = "ROLE_" + (role == null ? "STAFF" : role.toUpperCase());
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null,
                                List.of(new SimpleGrantedAuthority(authority)));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);

                // fire-and-forget "last used" update — do not fail the request if this throws
                try { sessionService.touch(sessionId); } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            // Invalid token → leave SecurityContext empty → downstream returns 401
        }

        chain.doFilter(request, response);
    }
}