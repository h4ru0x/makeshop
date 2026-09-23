package com.OpenStore.user.user.domain;

import com.OpenStore.user.user.dto.UpdateUserRequest;
import com.OpenStore.user.user.dto.UserResponse;
import com.OpenStore.user.user.repository.UserRepository;
import com.OpenStore.user.verification.PasswordResetTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository resetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .name("Carlos")
                .email("carlos@test.com")
                .phoneNumber("1234567890")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();
    }

    @Test
    void loadUserByUsername_returns_user_when_found() {
        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(user));

        var result = userService.loadUserByUsername("carlos@test.com");

        assertThat(result.getUsername()).isEqualTo("carlos@test.com");
    }

    @Test
    void loadUserByUsername_throws_when_not_found() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.loadUserByUsername("unknown@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void findAll_returns_mapped_responses() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> result = userService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("carlos@test.com");
    }

    @Test
    void findById_returns_response_when_found() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UserResponse result = userService.findById(user.getId());

        assertThat(result.getId()).isEqualTo(user.getId());
    }

    @Test
    void findById_throws_when_not_found() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(id))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void update_changes_name_and_phoneNumber() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UpdateUserRequest request = new UpdateUserRequest();
        request.setName("Nuevo Nombre");
        request.setPhoneNumber("9999999999");

        UserResponse result = userService.update(user.getId(), request);

        assertThat(result.getName()).isEqualTo("Nuevo Nombre");
        assertThat(result.getPhoneNumber()).isEqualTo("9999999999");
    }

    @Test
    void update_ignores_null_fields() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UpdateUserRequest request = new UpdateUserRequest();
        request.setName(null);
        request.setPhoneNumber(null);

        UserResponse result = userService.update(user.getId(), request);

        assertThat(result.getName()).isEqualTo("Carlos");
        assertThat(result.getPhoneNumber()).isEqualTo("1234567890");
    }

    @Test
    void delete_disables_user() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        userService.delete(user.getId());

        assertThat(user.isEnabled()).isFalse();
        verify(userRepository).save(user);
    }
}
