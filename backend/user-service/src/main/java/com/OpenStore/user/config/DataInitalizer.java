package com.OpenStore.user.config;

import com.OpenStore.user.user.domain.SubscriptionPlan;
import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;
import com.OpenStore.user.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.UUID;

@Configuration
public class DataInitalizer {

	@Bean
	CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			createIfMissing(
					userRepository,
					passwordEncoder,
					"OpenStore User",
					"user@openstore.local",
					"+0000000001",
					UserRole.USER,
					null,
					UUID.randomUUID()
			);

			createIfMissing(
					userRepository,
					passwordEncoder,
					"OpenStore Admin",
					"admin@openstore.local",
					"+0000000002",
					UserRole.ADMIN,
					null,
					null
			);

			createIfMissing(
					userRepository,
					passwordEncoder,
					"OpenStore Owner",
					"owner@openstore.local",
					"+0000000003",
					UserRole.OWNER,
					SubscriptionPlan.FREE,
					null
			);
		};
	}

	private void createIfMissing(UserRepository userRepository,
								 PasswordEncoder passwordEncoder,
								 String name,
								 String email,
								 String phone,
								 UserRole role,
								 SubscriptionPlan subscription,
								 UUID shopId) {
		if (userRepository.findByEmail(email).isPresent()) {
			return;
		}

		User user = User.builder()
				.name(name)
				.email(email)
				.phoneNumber(phone)
				.password(passwordEncoder.encode("OpenStore123"))
				.role(role)
				.subscription(subscription)
				.shopId(shopId)
				.enabled(true)
				.emailVerified(true)
				.build();

		userRepository.save(user);
	}
}
