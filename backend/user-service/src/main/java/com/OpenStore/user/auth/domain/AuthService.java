package com.OpenStore.user.auth.domain;

import com.OpenStore.user.auth.dto.AuthResponse;
import com.OpenStore.user.auth.dto.LoginRequest;
import com.OpenStore.user.auth.dto.RegisterRequest;
import com.OpenStore.user.auth.dto.ShopRegisterRequest;
import com.OpenStore.user.config.JwtUtil;
import com.OpenStore.user.user.domain.SubscriptionPlan;
import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;
import com.OpenStore.user.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return createOwnerUser(request);
    }

    @Transactional
    public AuthResponse registerShopUser(UUID shopId, ShopRegisterRequest request) {
        if (shopId == null) {
            throw new IllegalArgumentException("Shop id is required");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        String generatedName = request.getEmail().split("@")[0];
        User user = User.builder()
                .name(generatedName)
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .phoneNumber(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .shopId(shopId)
                .emailVerified(true)
                .build();

        userRepository.save(user);

        return toResponse(user, jwtUtil.generateToken(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = findByIdentifier(request.getIdentifier());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        return toResponse(user, jwtUtil.generateToken(user));
    }

    public AuthResponse loginShopUser(UUID shopId, LoginRequest request) {
        User user = findByIdentifier(request.getIdentifier());

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.OWNER) {
            throw new IllegalStateException("Ningun admin u owner se puede logear en su propia tienda");
        }

        if (user.getRole() != UserRole.USER) {
            throw new IllegalStateException("Solo usuarios de tienda pueden usar este endpoint");
        }

        if (user.getShopId() == null || !user.getShopId().equals(shopId)) {
            throw new IllegalStateException("Usuario no pertenece a la tienda indicada");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        return toResponse(user, jwtUtil.generateToken(user));
    }

    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private AuthResponse createOwnerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .phoneNumber(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.OWNER)
                .subscription(SubscriptionPlan.FREE)
                .emailVerified(true)
                .build();

        userRepository.save(user);

        return toResponse(user, jwtUtil.generateToken(user));
    }

    private User findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Identifier is required");
        }

        String value = identifier.trim();

        if (value.contains("@")) {
            return userRepository.findByEmail(value.toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        }

        try {
            UUID id = UUID.fromString(value);
            return userRepository.findById(id)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        } catch (IllegalArgumentException ignored) {
            return userRepository.findByNameIgnoreCase(value)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        }
    }

    private AuthResponse toResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
