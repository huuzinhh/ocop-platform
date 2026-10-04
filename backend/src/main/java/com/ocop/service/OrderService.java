package com.ocop.service;

import com.ocop.dto.order.CreateOrderRequest;
import com.ocop.dto.order.MockPaymentRequest;
import com.ocop.dto.order.OrderDto;
import com.ocop.entity.*;
import com.ocop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + new Random().nextInt(9000);
        return "OCOP-" + datePart + "-" + rand;
    }

    public OrderDto createOrderFromCart(String username, CreateOrderRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Giỏ hàng của bạn đang trống"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng trống, không thể tạo đơn hàng");
        }

        // 1. Tính tổng tiền và kiểm tra tồn kho
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' không đủ số lượng tồn kho (còn " + product.getStockQuantity() + ")");
            }
            totalAmount = totalAmount.add(item.getTotalPrice());
        }

        // 2. Tạo đối tượng Order
        Order order = new Order();
        order.setOrderCode(generateOrderCode());
        order.setUser(user);
        order.setTotalAmount(totalAmount);
        order.setShippingFee(BigDecimal.ZERO); // Miễn phí vận chuyển xúc tiến OCOP
        order.setStatus("PENDING");
        order.setRecipientName(request.getRecipientName());
        order.setRecipientPhone(request.getRecipientPhone());
        order.setShippingAddress(request.getShippingAddress());
        order.setNote(request.getNote());

        Order savedOrder = orderRepository.save(order);

        // 3. Tạo OrderItems và trừ tồn kho sản phẩm
        for (CartItem item : cart.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    product,
                    null, // batchId có thể gán sau khi xuất kho
                    product.getName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getTotalPrice()
            );
            savedOrder.getItems().add(orderItem);
        }

        // 4. Tạo bản ghi Payment khởi tạo
        String method = request.getPaymentMethod() != null ? request.getPaymentMethod() : "MOCK_VNPAY";
        Payment payment = new Payment(savedOrder, method, totalAmount);
        if ("COD".equalsIgnoreCase(method)) {
            payment.setStatus("PENDING");
        }
        savedOrder.setPayment(payment);

        // 5. Tạo bản ghi Shipment khởi tạo
        String trackingCode = "GHTK-" + savedOrder.getOrderCode();
        Shipment shipment = new Shipment(savedOrder, trackingCode);
        savedOrder.setShipment(shipment);

        // 6. Xóa giỏ hàng sau khi đặt hàng thành công
        cart.getItems().clear();
        cartRepository.save(cart);

        return OrderDto.fromEntity(savedOrder);
    }

    public List<OrderDto> getUserOrders(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return orders.stream().map(OrderDto::fromEntity).collect(Collectors.toList());
    }

    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(OrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public OrderDto getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderCode));
        return OrderDto.fromEntity(order);
    }

    public OrderDto mockPay(String username, String orderCode, MockPaymentRequest request) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderCode));

        Payment payment = order.getPayment();
        if (payment == null) {
            payment = new Payment(order, request.getPaymentMethod(), order.getTotalAmount());
            order.setPayment(payment);
        }

        String method = request.getPaymentMethod() != null ? request.getPaymentMethod() : payment.getPaymentMethod();
        payment.setPaymentMethod(method);
        payment.setStatus("SUCCESS");
        payment.setPaymentTime(LocalDateTime.now());
        payment.setTransactionRef("MOCK-" + method + "-TX" + (100000 + new Random().nextInt(900000)));

        order.setStatus("CONFIRMED");
        if (order.getShipment() != null) {
            order.getShipment().setStatus("IN_TRANSIT");
        }

        orderRepository.save(order);
        return OrderDto.fromEntity(order);
    }

    public OrderDto updateOrderStatus(String orderCode, String newStatus) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + orderCode));

        order.setStatus(newStatus.toUpperCase());
        if ("DELIVERED".equalsIgnoreCase(newStatus) && order.getShipment() != null) {
            order.getShipment().setStatus("DELIVERED");
        }
        orderRepository.save(order);
        return OrderDto.fromEntity(order);
    }
}
