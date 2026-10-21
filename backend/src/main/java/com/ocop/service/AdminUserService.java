package com.ocop.service;

import com.ocop.dto.user.UserDetailDto;
import com.ocop.dto.user.UserStatsDto;
import com.ocop.entity.Producer;
import com.ocop.entity.Role;
import com.ocop.entity.User;
import com.ocop.repository.OrderRepository;
import com.ocop.repository.ProducerRepository;
import com.ocop.repository.ProductRepository;
import com.ocop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<UserDetailDto> getUsers(String roleFilter, String statusFilter, String search) {
        List<User> allUsers = userRepository.findAll();
        List<UserDetailDto> result = new ArrayList<>();

        String searchKeyword = search != null ? search.trim().toLowerCase() : null;
        String targetRole = roleFilter != null && !roleFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(roleFilter.trim())
                ? roleFilter.trim().toUpperCase() : null;
        String targetStatus = statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter.trim())
                ? statusFilter.trim().toUpperCase() : null;

        for (User user : allUsers) {
            Set<String> roleNames = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

            // Lọc theo Role
            if (targetRole != null) {
                boolean matchRole = false;
                for (String r : roleNames) {
                    if (r.equalsIgnoreCase(targetRole) || r.equalsIgnoreCase("ROLE_" + targetRole)) {
                        matchRole = true;
                        break;
                    }
                }
                if (!matchRole) continue;
            }

            // Lọc theo Status
            String userStatus = user.getStatus() != null ? user.getStatus().toUpperCase() : "ACTIVE";
            if (targetStatus != null && !userStatus.equals(targetStatus)) {
                continue;
            }

            // Lọc theo Từ khóa tìm kiếm
            if (searchKeyword != null && !searchKeyword.isEmpty()) {
                String un = user.getUsername() != null ? user.getUsername().toLowerCase() : "";
                String em = user.getEmail() != null ? user.getEmail().toLowerCase() : "";
                String fn = user.getFullName() != null ? user.getFullName().toLowerCase() : "";
                String ph = user.getPhone() != null ? user.getPhone() : "";
                if (!un.contains(searchKeyword) && !em.contains(searchKeyword) && !fn.contains(searchKeyword) && !ph.contains(searchKeyword)) {
                    continue;
                }
            }

            result.add(mapToDto(user, roleNames));
        }

        // Sắp xếp: ID giảm dần (mới nhất lên trước)
        result.sort(Comparator.comparing(UserDetailDto::getId, Comparator.reverseOrder()));
        return result;
    }

    public UserStatsDto getUserStats() {
        List<User> allUsers = userRepository.findAll();

        long total = allUsers.size();
        long adminCount = 0;
        long producerCount = 0;
        long customerCount = 0;
        long activeCount = 0;
        long lockedCount = 0;

        for (User user : allUsers) {
            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            if (roles.contains("ROLE_ADMIN")) {
                adminCount++;
            } else if (roles.contains("ROLE_PRODUCER")) {
                producerCount++;
            } else {
                customerCount++;
            }

            String st = user.getStatus() != null ? user.getStatus().toUpperCase() : "ACTIVE";
            if ("LOCKED".equals(st)) {
                lockedCount++;
            } else {
                activeCount++;
            }
        }

        return new UserStatsDto(total, adminCount, producerCount, customerCount, activeCount, lockedCount);
    }

    @Transactional
    public UserDetailDto updateUserStatus(Long userId, String newStatus, String currentAdminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng ID: " + userId));

        if (user.getUsername().equalsIgnoreCase(currentAdminUsername)) {
            throw new RuntimeException("Bạn không thể tự khóa tài khoản Admin đang đăng nhập của chính mình");
        }

        if (user.getId() == 1L && "LOCKED".equalsIgnoreCase(newStatus)) {
            throw new RuntimeException("Không được phép khóa tài khoản Quản trị viên cấp cao nhất (Root Admin)");
        }

        user.setStatus(newStatus.toUpperCase());
        User saved = userRepository.save(user);

        Set<String> roleNames = saved.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return mapToDto(saved, roleNames);
    }

    @Transactional
    public Producer verifyProducer(Long producerId, Boolean isVerified) {
        Producer producer = producerRepository.findById(producerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ cơ sở sản xuất ID: " + producerId));

        producer.setIsVerified(isVerified != null ? isVerified : true);
        return producerRepository.save(producer);
    }

    private UserDetailDto mapToDto(User user, Set<String> roleNames) {
        UserDetailDto dto = new UserDetailDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setStatus(user.getStatus() != null ? user.getStatus().toUpperCase() : "ACTIVE");
        dto.setRoles(roleNames);
        dto.setCreatedAt(user.getCreatedAt());

        // Kiểm tra xem user này có phải là Nhà sản xuất không
        Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
        if (producer != null) {
            dto.setProducerId(producer.getId());
            dto.setProducerName(producer.getName());
            dto.setProducerCode(producer.getCode());
            dto.setIsProducerVerified(producer.getIsVerified());
            dto.setProductCount(productRepository.findByProducerId(producer.getId()).size());
        } else {
            dto.setOrderCount(orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).size());
        }

        return dto;
    }
}
