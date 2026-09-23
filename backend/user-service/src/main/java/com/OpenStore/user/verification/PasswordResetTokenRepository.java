package com.OpenStore.user.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(UUID token);

    Optional<PasswordResetToken> findByCode(String code);

    boolean existsByCodeAndUsedFalse(String code);

    @Transactional
    void deleteByUser_Id(UUID userId);
}
