package com.tradeweb.mt5.filter;

import com.tradeweb.mt5.entity.Mt5Integration;
import com.tradeweb.mt5.service.Mt5SyncService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class EaTokenAuthenticationFilter extends OncePerRequestFilter {

    public static final String INTEGRATION_ATTR = "currentIntegration";
    private final Mt5SyncService syncService;

    public EaTokenAuthenticationFilter(Mt5SyncService syncService) {
        this.syncService = syncService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Only enforce for MT5 EA sync endpoints
        if (uri.startsWith("/api/v1/mt5/sync/")) {
            String token = extractBearerToken(request);
            if (!StringUtils.hasText(token)) {
                sendUnauthorized(response, "Missing Bearer token in Authorization header");
                return;
            }

            Optional<Mt5Integration> integrationOpt = syncService.authenticateToken(token);
            if (integrationOpt.isEmpty()) {
                sendUnauthorized(response, "Invalid, expired or revoked MT5 synchronization token");
                return;
            }

            Mt5Integration integration = integrationOpt.get();
            request.setAttribute(INTEGRATION_ATTR, integration);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    integration,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_MT5_EA"))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(String.format("{\"errorCode\":\"INVALID_EA_TOKEN\",\"message\":\"%s\",\"status\":401}", message));
    }
}
