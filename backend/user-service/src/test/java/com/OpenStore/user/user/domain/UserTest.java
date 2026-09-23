package com.OpenStore.user.user.domain;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    void getUsername_returns_email() {
        User user = User.builder()
                .email("carlos@test.com")
                .build();
        assertThat(user.getUsername()).isEqualTo("carlos@test.com");
    }

    @Test
    void getAuthorities_returns_role_with_prefix() {
        User user = User.builder().role(UserRole.ADMIN).build();
        Collection<? extends GrantedAuthority> authorities = user.getAuthorities();
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_ADMIN");
    }

    @Test
    void enabled_is_true_by_default() {
        User user = User.builder().build();
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void isAccountNonExpired_isAccountNonLocked_isCredentialsNonExpired_are_true() {
        User user = User.builder().build();
        assertThat(user.isAccountNonExpired()).isTrue();
        assertThat(user.isAccountNonLocked()).isTrue();
        assertThat(user.isCredentialsNonExpired()).isTrue();
    }

    @Test
    void equals_and_hashCode_based_on_id() {
        UUID uuid = UUID.randomUUID();
        User user1 = User.builder().id(uuid).name("A").email("a@test.com").role(UserRole.CLIENT).build();
        User user2 = User.builder().id(uuid).name("B").email("b@test.com").role(UserRole.OWNER).build();

        assertThat(user1).isEqualTo(user2);
        assertThat(user1.hashCode()).isEqualTo(user2.hashCode());
    }

    @Test
    void users_with_different_ids_are_not_equal() {
        User user1 = User.builder().id(UUID.randomUUID()).build();
        User user2 = User.builder().id(UUID.randomUUID()).build();

        assertThat(user1).isNotEqualTo(user2);
    }
}
