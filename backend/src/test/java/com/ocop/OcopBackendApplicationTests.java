package com.ocop;

import com.ocop.entity.User;
import com.ocop.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class OcopBackendApplicationTests {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Test
    void contextLoads() {
        // Kiểm tra Spring Application Context nạp thành công các Bean, JPA Repository và kết nối DB
    }

    @Test
    void syncAndVerifyDemoPasswords() {
        String rawPassword = "123456";
        String encoded = passwordEncoder.encode(rawPassword);
        System.out.println(">>> GENERATED REAL BCRYPT HASH FOR 123456: " + encoded);

        assertTrue(passwordEncoder.matches(rawPassword, encoded));

        List<User> users = userRepository.findAll();
        for (User u : users) {
            u.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(u);
            System.out.println("Updated password for user: " + u.getUsername());
        }
    }
}
