package com.ocop.service;

import com.ocop.dto.trace.CreateBatchRequest;
import com.ocop.dto.trace.CreateEventRequest;
import com.ocop.dto.trace.TraceResponseDto;
import com.ocop.entity.*;
import com.ocop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TraceService {

    @Autowired
    private ProductionBatchRepository batchRepository;

    @Autowired
    private ProductionEventRepository eventRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    public static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return Long.toHexString(System.currentTimeMillis()) + Long.toHexString(input.hashCode());
        }
    }

    public static String generateBlockchainTxHash(String rawDataHash) {
        String randomSeed = rawDataHash + ":" + System.nanoTime();
        return "0x" + sha256Hex(randomSeed);
    }

    public List<ProductionBatch> getProducerBatches(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (isAdmin) {
            return batchRepository.findAllByOrderByCreatedAtDesc();
        }

        Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
        if (producer == null) {
            return java.util.Collections.emptyList();
        }

        return batchRepository.findByProducerId(producer.getId());
    }

    @Transactional
    public ProductionBatch createBatch(String username, CreateBatchRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + request.getProductId()));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!isAdmin) {
            Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
            if (producer == null || product.getProducer() == null || !producer.getId().equals(product.getProducer().getId())) {
                throw new RuntimeException("Bạn không có quyền tạo lô sản xuất cho sản phẩm của cơ sở khác");
            }
        }

        String batchCode = request.getBatchCode();
        if (batchCode == null || batchCode.trim().isEmpty()) {
            String prodCode = product.getProducer() != null ? product.getProducer().getCode() : "OCOP";
            batchCode = "BATCH-" + prodCode + "-" + System.currentTimeMillis() % 100000;
        } else {
            batchCode = batchCode.trim().toUpperCase();
        }

        if (batchRepository.findByBatchCode(batchCode).isPresent()) {
            throw new RuntimeException("Mã lô sản xuất '" + batchCode + "' đã tồn tại trên hệ thống!");
        }

        // Tính mã băm SHA-256 chuỗi cung ứng
        String rawDataToHash = batchCode + ":" + product.getId() + ":" + request.getManufactureDate() +
                ":" + request.getExpiryDate() + ":" + request.getQuantity();
        String rawDataHash = sha256Hex(rawDataToHash);
        String blockchainTxHash = generateBlockchainTxHash(rawDataHash);

        String qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/?trace=" + batchCode;

        ProductionBatch batch = new ProductionBatch();
        batch.setProduct(product);
        batch.setBatchCode(batchCode);
        batch.setManufactureDate(request.getManufactureDate());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setQuantity(request.getQuantity());
        batch.setQrCodeUrl(qrCodeUrl);
        batch.setRawDataHash(rawDataHash);
        batch.setBlockchainTxHash(blockchainTxHash);
        batch.setBlockchainStatus("COMMITTED");
        batch.setCreatedAt(LocalDateTime.now());

        ProductionBatch savedBatch = batchRepository.save(batch);

        // Tự động tạo sự kiện khởi tạo lô sản xuất ban đầu
        ProductionEvent initialEvent = new ProductionEvent();
        initialEvent.setBatch(savedBatch);
        initialEvent.setEventType("PACKAGING");
        initialEvent.setEventName("Khởi tạo Lô & Dán Tem QR Truy Xuất OCOP");
        initialEvent.setDescription("Lô hàng được phân loại, kiểm định chất lượng và kích hoạt tem mã QR blockchain.");
        initialEvent.setActorName(product.getProducer() != null ? product.getProducer().getName() : "Bộ phận KCS");
        initialEvent.setLocation(product.getProducer() != null ? product.getProducer().getLocation() : null);
        initialEvent.setEventTimestamp(LocalDateTime.now());

        String eventHash = sha256Hex(savedBatch.getId() + ":PACKAGING:" + initialEvent.getEventName() + ":" + initialEvent.getEventTimestamp());
        initialEvent.setRawDataHash(eventHash);
        initialEvent.setBlockchainTxHash(generateBlockchainTxHash(eventHash));
        initialEvent.setCreatedAt(LocalDateTime.now());
        eventRepository.save(initialEvent);

        return savedBatch;
    }

    @Transactional
    public ProductionEvent addEvent(String username, Long batchId, CreateEventRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        ProductionBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lô sản xuất ID: " + batchId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!isAdmin) {
            Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
            if (producer == null || batch.getProduct() == null || batch.getProduct().getProducer() == null ||
                    !producer.getId().equals(batch.getProduct().getProducer().getId())) {
                throw new RuntimeException("Bạn không có quyền ghi nhật ký chuỗi cung ứng cho lô của cơ sở khác");
            }
        }

        Location location = null;
        if (request.getLocationId() != null) {
            location = locationRepository.findById(request.getLocationId()).orElse(null);
        }
        if (location == null && batch.getProduct() != null && batch.getProduct().getProducer() != null) {
            location = batch.getProduct().getProducer().getLocation();
        }

        LocalDateTime eventTime = request.getEventTimestamp() != null ? request.getEventTimestamp() : LocalDateTime.now();
        String rawData = batch.getId() + ":" + request.getEventType() + ":" + request.getEventName() + ":" + eventTime + ":" + request.getActorName();
        String rawHash = sha256Hex(rawData);
        String txHash = generateBlockchainTxHash(rawHash);

        ProductionEvent event = new ProductionEvent();
        event.setBatch(batch);
        event.setEventType(request.getEventType());
        event.setEventName(request.getEventName());
        event.setDescription(request.getDescription());
        event.setActorName(request.getActorName());
        event.setLocation(location);
        event.setEventTimestamp(eventTime);
        event.setRawDataHash(rawHash);
        event.setBlockchainTxHash(txHash);
        event.setCreatedAt(LocalDateTime.now());

        return eventRepository.save(event);
    }

    public List<ProductionEvent> getBatchEvents(Long batchId) {
        return eventRepository.findByBatchIdOrderByEventTimestampAsc(batchId);
    }

    public TraceResponseDto getTraceInfo(String batchCode) {
        if (batchCode == null || batchCode.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng cung cấp mã lô sản xuất OCOP");
        }

        ProductionBatch batch = batchRepository.findByBatchCode(batchCode.trim())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin nguồn gốc cho mã lô: " + batchCode));

        List<ProductionEvent> events = eventRepository.findByBatchIdOrderByEventTimestampAsc(batch.getId());
        return TraceResponseDto.fromEntity(batch, events);
    }
}
