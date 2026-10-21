package com.ocop.service;

import com.ocop.dto.stats.DateRevenueDto;
import com.ocop.dto.stats.ProducerDashboardDto;
import com.ocop.dto.stats.TopSellingProductDto;
import com.ocop.entity.*;
import com.ocop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatsService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private ProductionBatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    public ProducerDashboardDto getProducerDashboard(String username, Long targetProducerId) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));

        Producer producer = null;
        if (isAdmin && targetProducerId != null) {
            producer = producerRepository.findById(targetProducerId).orElse(null);
        } else if (!isAdmin) {
            producer = producerRepository.findByUserId(user.getId()).orElse(null);
        }

        // Nếu là Admin và không chỉ định cơ sở cụ thể, tính toán cho toàn sàn
        if (producer == null && isAdmin) {
            return getPlatformAdminDashboard();
        }

        ProducerDashboardDto dto = new ProducerDashboardDto();
        if (producer == null) {
            return dto;
        }

        Long producerId = producer.getId();
        dto.setProducerId(producerId);
        dto.setProducerName(producer.getName());
        dto.setProducerCode(producer.getCode());

        // Lấy danh sách các đơn hàng có sản phẩm của cơ sở
        List<Order> orders = orderRepository.findOrdersByProducerId(producerId);
        dto.setTotalOrders(orders.size());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalUnitsSold = 0;
        int completedOrders = 0;
        int processingOrders = 0;
        int cancelledOrders = 0;

        Map<Long, Integer> productQtySoldMap = new HashMap<>();
        Map<Long, BigDecimal> productRevenueMap = new HashMap<>();
        Map<String, Integer> statusDistribution = new HashMap<>();

        // Chuẩn bị khung 7 ngày gần nhất
        LocalDate today = LocalDate.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");
        Map<String, BigDecimal> dailyRevenueMap = new LinkedHashMap<>();
        Map<String, Integer> dailyOrdersMap = new HashMap<>();
        Map<String, Integer> dailyUnitsMap = new HashMap<>();

        for (int i = 6; i >= 0; i--) {
            String dateKey = today.minusDays(i).format(dtf);
            dailyRevenueMap.put(dateKey, BigDecimal.ZERO);
            dailyOrdersMap.put(dateKey, 0);
            dailyUnitsMap.put(dateKey, 0);
        }

        for (Order order : orders) {
            String status = order.getStatus() != null ? order.getStatus() : "PENDING";
            statusDistribution.merge(status, 1, Integer::sum);

            if ("DELIVERED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                completedOrders++;
            } else if ("CANCELLED".equalsIgnoreCase(status)) {
                cancelledOrders++;
            } else {
                processingOrders++;
            }

            boolean isCancelled = "CANCELLED".equalsIgnoreCase(status);
            String orderDateStr = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().format(dtf) : null;

            BigDecimal orderProducerSubtotal = BigDecimal.ZERO;
            int orderProducerUnits = 0;

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null && item.getProduct().getProducer() != null &&
                            producerId.equals(item.getProduct().getProducer().getId())) {
                        Long pid = item.getProduct().getId();
                        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                        BigDecimal lineTotal = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;

                        if (!isCancelled) {
                            totalRevenue = totalRevenue.add(lineTotal);
                            totalUnitsSold += qty;
                            orderProducerSubtotal = orderProducerSubtotal.add(lineTotal);
                            orderProducerUnits += qty;

                            productQtySoldMap.merge(pid, qty, Integer::sum);
                            productRevenueMap.merge(pid, lineTotal, BigDecimal::add);
                        }
                    }
                }
            }

            if (!isCancelled && orderDateStr != null && dailyRevenueMap.containsKey(orderDateStr)) {
                dailyRevenueMap.merge(orderDateStr, orderProducerSubtotal, BigDecimal::add);
                dailyUnitsMap.merge(orderDateStr, orderProducerUnits, Integer::sum);
                if (orderProducerUnits > 0) {
                    dailyOrdersMap.merge(orderDateStr, 1, Integer::sum);
                }
            }
        }

        dto.setTotalRevenue(totalRevenue);
        dto.setTotalUnitsSold(totalUnitsSold);
        dto.setCompletedOrders(completedOrders);
        dto.setProcessingOrders(processingOrders);
        dto.setCancelledOrders(cancelledOrders);
        dto.setOrderStatusDistribution(statusDistribution);

        // Timeline doanh thu
        List<DateRevenueDto> timeline = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : dailyRevenueMap.entrySet()) {
            String date = entry.getKey();
            timeline.add(new DateRevenueDto(date, entry.getValue(),
                    dailyOrdersMap.getOrDefault(date, 0),
                    dailyUnitsMap.getOrDefault(date, 0)));
        }
        dto.setRevenueTimeline(timeline);

        // Top sản phẩm bán chạy nhất
        List<Product> producerProducts = productRepository.findByProducerId(producerId);
        dto.setTotalProducts(producerProducts.size());
        dto.setTotalBatches(batchRepository.findByProducerId(producerId).size());

        List<TopSellingProductDto> topList = new ArrayList<>();
        for (Product p : producerProducts) {
            int sold = productQtySoldMap.getOrDefault(p.getId(), 0);
            BigDecimal rev = productRevenueMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            topList.add(new TopSellingProductDto(
                    p.getId(),
                    p.getName(),
                    p.getThumbnail(),
                    p.getOcopStarRating(),
                    p.getUnit(),
                    sold,
                    rev,
                    p.getStockQuantity()
            ));
        }

        // Sắp xếp theo số lượng bán giảm dần, sau đó theo doanh thu giảm dần
        topList.sort((a, b) -> {
            int cmp = b.getQuantitySold().compareTo(a.getQuantitySold());
            return cmp != 0 ? cmp : b.getTotalRevenue().compareTo(a.getTotalRevenue());
        });

        dto.setTopSellingProducts(topList.stream().limit(6).collect(Collectors.toList()));

        return dto;
    }

    private ProducerDashboardDto getPlatformAdminDashboard() {
        ProducerDashboardDto dto = new ProducerDashboardDto();
        dto.setProducerName("Toàn Hệ Thống Sàn OCOP Việt Nam (Admin)");
        dto.setProducerCode("ALL_PLATFORM");

        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        dto.setTotalOrders(orders.size());

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalUnitsSold = 0;
        int completedOrders = 0;
        int processingOrders = 0;
        int cancelledOrders = 0;

        Map<Long, Integer> productQtySoldMap = new HashMap<>();
        Map<Long, BigDecimal> productRevenueMap = new HashMap<>();
        Map<String, Integer> statusDistribution = new HashMap<>();

        LocalDate today = LocalDate.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM");
        Map<String, BigDecimal> dailyRevenueMap = new LinkedHashMap<>();
        Map<String, Integer> dailyOrdersMap = new HashMap<>();
        Map<String, Integer> dailyUnitsMap = new HashMap<>();

        for (int i = 6; i >= 0; i--) {
            String dateKey = today.minusDays(i).format(dtf);
            dailyRevenueMap.put(dateKey, BigDecimal.ZERO);
            dailyOrdersMap.put(dateKey, 0);
            dailyUnitsMap.put(dateKey, 0);
        }

        for (Order order : orders) {
            String status = order.getStatus() != null ? order.getStatus() : "PENDING";
            statusDistribution.merge(status, 1, Integer::sum);

            if ("DELIVERED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                completedOrders++;
            } else if ("CANCELLED".equalsIgnoreCase(status)) {
                cancelledOrders++;
            } else {
                processingOrders++;
            }

            boolean isCancelled = "CANCELLED".equalsIgnoreCase(status);
            String orderDateStr = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate().format(dtf) : null;
            BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            int orderUnits = 0;

            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        Long pid = item.getProduct().getId();
                        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                        BigDecimal lineTotal = item.getTotalPrice() != null ? item.getTotalPrice() : BigDecimal.ZERO;

                        if (!isCancelled) {
                            totalUnitsSold += qty;
                            orderUnits += qty;
                            productQtySoldMap.merge(pid, qty, Integer::sum);
                            productRevenueMap.merge(pid, lineTotal, BigDecimal::add);
                        }
                    }
                }
            }

            if (!isCancelled) {
                totalRevenue = totalRevenue.add(orderTotal);
                if (orderDateStr != null && dailyRevenueMap.containsKey(orderDateStr)) {
                    dailyRevenueMap.merge(orderDateStr, orderTotal, BigDecimal::add);
                    dailyUnitsMap.merge(orderDateStr, orderUnits, Integer::sum);
                    dailyOrdersMap.merge(orderDateStr, 1, Integer::sum);
                }
            }
        }

        dto.setTotalRevenue(totalRevenue);
        dto.setTotalUnitsSold(totalUnitsSold);
        dto.setCompletedOrders(completedOrders);
        dto.setProcessingOrders(processingOrders);
        dto.setCancelledOrders(cancelledOrders);
        dto.setOrderStatusDistribution(statusDistribution);

        List<DateRevenueDto> timeline = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : dailyRevenueMap.entrySet()) {
            String date = entry.getKey();
            timeline.add(new DateRevenueDto(date, entry.getValue(),
                    dailyOrdersMap.getOrDefault(date, 0),
                    dailyUnitsMap.getOrDefault(date, 0)));
        }
        dto.setRevenueTimeline(timeline);

        List<Product> allProducts = productRepository.findAll();
        dto.setTotalProducts(allProducts.size());
        dto.setTotalBatches(batchRepository.findAll().size());

        List<TopSellingProductDto> topList = new ArrayList<>();
        for (Product p : allProducts) {
            int sold = productQtySoldMap.getOrDefault(p.getId(), 0);
            BigDecimal rev = productRevenueMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            topList.add(new TopSellingProductDto(
                    p.getId(),
                    p.getName(),
                    p.getThumbnail(),
                    p.getOcopStarRating(),
                    p.getUnit(),
                    sold,
                    rev,
                    p.getStockQuantity()
            ));
        }

        topList.sort((a, b) -> {
            int cmp = b.getQuantitySold().compareTo(a.getQuantitySold());
            return cmp != 0 ? cmp : b.getTotalRevenue().compareTo(a.getTotalRevenue());
        });

        dto.setTopSellingProducts(topList.stream().limit(6).collect(Collectors.toList()));
        return dto;
    }
}
