package com.OpenStore.auth;

import com.OpenStore.user.UserApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(classes = UserApplication.class)
@ActiveProfiles("test")
class AuthApplicationTests {

	@Test
	void contextLoads() {
	}

}
