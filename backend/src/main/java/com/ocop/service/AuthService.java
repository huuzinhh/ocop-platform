package com.ocop.service;

import com.ocop.dto.auth.*;
import com.ocop.entity.Producer;
import com.ocop.entity.Role;
import com.ocop.entity.User;
import com.ocop.repository.ProducerRepository;
import com.ocop.repository.RoleRepository;
import com.ocop.repository.UserRepository;
import com.ocop.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        String username = authentication.getName();
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return new AuthResponse(jwt, UserDto.fromEntity(user));
    }

    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập '" + request.getUsername() + "' đã tồn tại trong hệ thống");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Địa chỉ email '" + request.getEmail() + "' đã được đăng ký");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setStatus("ACTIVE");

        // Phân quyền dựa trên lựa chọn khi đăng ký
        Set<Role> roles = new HashSet<>();
        boolean isProducer = "PRODUCER".equalsIgnoreCase(request.getRole());
        String roleName = isProducer ? "ROLE_PRODUCER" : "ROLE_CUSTOMER";

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy role: " + roleName));
        roles.add(role);
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Tự động khởi tạo hồ sơ Nhà sản xuất (Producer) nếu chọn vai trò PRODUCER
        if (isProducer) {
            Producer producer = new Producer();
            producer.setUser(savedUser);
            producer.setName(request.getFullName() != null && !request.getFullName().trim().isEmpty() 
                    ? request.getFullName().trim() : "Cơ sở " + savedUser.getUsername());
            producer.setCode("PROD-" + savedUser.getUsername().toUpperCase() + "-" + (System.currentTimeMillis() % 100000));
            producer.setDescription("Cơ sở sản xuất đặc sản OCOP " + savedUser.getFullName());
            producer.setContactEmail(savedUser.getEmail());
            producer.setPhone(savedUser.getPhone());
            producer.setIsVerified(true);
            producerRepository.save(producer);
        }

        return UserDto.fromEntity(savedUser);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + username));
        return UserDto.fromEntity(user);
    }
}
