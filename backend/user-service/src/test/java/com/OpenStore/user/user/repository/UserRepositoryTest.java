package com.OpenStore.user.user.repository;

import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User saved;

    @BeforeEach
    void setUp() {
        saved = userRepository.save(User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .phoneNumber("1234567890")
                .password("hashed")
                .role(UserRole.CLIENT)
                .enabled(true)
                .build());
    }

    @Test
    void findByEmail_returns_user_when_exists() {
        Optional<User> result = userRepository.findByEmail("carlos@test.com");
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Carlos");
    }

    @Test
    void findByEmail_returns_empty_when_not_exists() {
        Optional<User> result = userRepository.findByEmail("unknown@test.com");
        assertThat(result).isEmpty();
    }

    @Test
    void findById_returns_user_when_exists() {
        Optional<User> result = userRepository.findById(saved.getId());
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("carlos@test.com");
    }

    @Test
    void findByPhoneNumber_returns_user_when_exists() {
        Optional<User> result = userRepository.findByPhoneNumber("1234567890");
        assertThat(result).isPresent();
    }

    @Test
    void disabled_flag_is_persisted() {
        saved.setEnabled(false);
        userRepository.save(saved);

        Optional<User> result = userRepository.findById(saved.getId());
        assertThat(result).isPresent();
        assertThat(result.get().isEnabled()).isFalse();
    }

    @Test
    void email_must_be_unique() {
        User duplicate = User.builder()
                .name("Other")
                .email("carlos@test.com")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();

        org.junit.jupiter.api.Assertions.assertThrows(
                Exception.class, () -> userRepository.saveAndFlush(duplicate)
        );
    }
}
