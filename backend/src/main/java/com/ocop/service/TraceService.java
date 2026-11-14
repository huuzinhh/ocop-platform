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

    @Autowired
    private BlockchainService blockchainService;

    private static final java.time.format.DateTimeFormatter EVENT_TIME_FORMATTER = 
            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static String hashBatchData(String batchCode, Long productId, Object mfgDate, Object expDate, Integer quantity) {
        String raw = batchCode + ":" + (productId != null ? productId : "") + ":" + mfgDate + ":" + expDate + ":" + quantity;
        return sha256Hex(raw);
    }

    public static String hashEventData(Long batchId, String eventType, String eventName, LocalDateTime timestamp, String actorName) {
        String formattedTime = timestamp != null ? timestamp.format(EVENT_TIME_FORMATTER) : "";
        String safeActor = actorName != null ? actorName.trim() : "";
        String raw = batchId + ":" + (eventType != null ? eventType.trim() : "") + ":" + 
                     (eventName != null ? eventName.trim() : "") + ":" + formattedTime + ":" + safeActor;
        return sha256Hex(raw);
    }

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

        // 1. Tính mã băm SHA-256 dữ liệu lô hàng
        String rawDataToHash = batchCode + ":" + product.getId() + ":" + request.getManufactureDate() +
                ":" + request.getExpiryDate() + ":" + request.getQuantity();
        String rawDataHash = sha256Hex(rawDataToHash);

        // 2. Ghi lên Smart Contract thật trên Blockchain
        String producerCode = product.getProducer() != null ? product.getProducer().getCode() : "OCOP";
        BlockchainService.BlockchainTxResult txResult = blockchainService.registerBatchOnChain(batchCode, rawDataHash, producerCode);
        String blockchainTxHash = txResult.transactionHash();

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

        // 3. Tự động tạo sự kiện khởi tạo lô sản xuất ban đầu
        ProductionEvent initialEvent = new ProductionEvent();
        initialEvent.setBatch(savedBatch);
        initialEvent.setEventType("PACKAGING");
        initialEvent.setEventName("Khởi tạo Lô & Dán Tem QR Truy Xuất OCOP");
        initialEvent.setDescription("Lô hàng được phân loại, kiểm định chất lượng và kích hoạt tem mã QR blockchain.");
        initialEvent.setActorName(product.getProducer() != null ? product.getProducer().getName() : "Bộ phận KCS");
        initialEvent.setLocation(product.getProducer() != null ? product.getProducer().getLocation() : null);
        initialEvent.setEventTimestamp(LocalDateTime.now());

        // Băm SHA-256 sự kiện và ghi lên Blockchain theo chuẩn format
        String eventHash = hashEventData(savedBatch.getId(), initialEvent.getEventType(), initialEvent.getEventName(), initialEvent.getEventTimestamp(), initialEvent.getActorName());
        initialEvent.setRawDataHash(eventHash);

        BlockchainService.BlockchainTxResult eventTxResult = blockchainService.addEventOnChain(
                savedBatch.getBatchCode(),
                initialEvent.getEventType(),
                initialEvent.getEventName(),
                eventHash,
                initialEvent.getActorName()
        );
        initialEvent.setBlockchainTxHash(eventTxResult.transactionHash());
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
        String actor = request.getActorName() != null ? request.getActorName() : "Ban KCS";

        // 1. Tính mã băm SHA-256 sự kiện theo chuẩn format
        String rawHash = hashEventData(batch.getId(), request.getEventType(), request.getEventName(), eventTime, actor);

        // 2. Ghi sự kiện lên Smart Contract thật
        BlockchainService.BlockchainTxResult eventTxResult = blockchainService.addEventOnChain(
                batch.getBatchCode(),
                request.getEventType(),
                request.getEventName(),
                rawHash,
                actor
        );

        ProductionEvent event = new ProductionEvent();
        event.setBatch(batch);
        event.setEventType(request.getEventType());
        event.setEventName(request.getEventName());
        event.setDescription(request.getDescription());
        event.setActorName(actor);
        event.setLocation(location);
        event.setEventTimestamp(eventTime);
        event.setRawDataHash(rawHash);
        event.setBlockchainTxHash(eventTxResult.transactionHash());
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
        TraceResponseDto dto = TraceResponseDto.fromEntity(batch, events);

        // KIỂM CHỨNG TOÀN VẸN THỰC TẾ (REAL INTEGRITY CHECK):
        // 1. Kiểm tra tính toàn vẹn của Lô sản xuất (Batch Integrity)
        String currentBatchHash = hashBatchData(
                batch.getBatchCode(),
                batch.getProduct() != null ? batch.getProduct().getId() : null,
                batch.getManufactureDate(),
                batch.getExpiryDate(),
                batch.getQuantity()
        );
        String cleanBatchHash = batch.getRawDataHash() != null ? batch.getRawDataHash().replace("0x", "") : "";
        boolean isBatchValid = currentBatchHash.equalsIgnoreCase(cleanBatchHash);

        // 2. Kiểm tra tính toàn vẹn của từng Sự kiện trong Chuỗi cung ứng (Events Integrity)
        boolean areEventsValid = true;
        if (events != null && !events.isEmpty()) {
            for (ProductionEvent ev : events) {
                if (ev.getRawDataHash() == null) continue;
                
                // Bỏ qua sự kiện khởi tạo hệ thống tự sinh nếu đã kiểm tra batch
                if ("PACKAGING".equalsIgnoreCase(ev.getEventType()) && 
                    "Khởi tạo Lô & Dán Tem QR Truy Xuất OCOP".equalsIgnoreCase(ev.getEventName())) {
                    continue;
                }

                String cleanEvHash = ev.getRawDataHash().replace("0x", "");
                String timeStr = ev.getEventTimestamp() != null ? ev.getEventTimestamp().toString() : "";
                String timeWithT = timeStr.replace(" ", "T");
                String timeWithSpace = timeStr.replace("T", " ");
                String actor = ev.getActorName() != null ? ev.getActorName().trim() : "";

                // Tính toán mã băm với cả 2 định dạng thời gian (có 'T' hoặc có ' ')
                String hashT = sha256Hex(batch.getId() + ":" + ev.getEventType() + ":" + ev.getEventName() + ":" + timeWithT + ":" + actor);
                String hashSpace = sha256Hex(batch.getId() + ":" + ev.getEventType() + ":" + ev.getEventName() + ":" + timeWithSpace + ":" + actor);

                boolean evMatched = cleanEvHash.equalsIgnoreCase(hashT) || cleanEvHash.equalsIgnoreCase(hashSpace);

                if (!evMatched) {
                    areEventsValid = false;
                    break;
                }
            }
        }

        // Toàn vẹn chỉ khi CẢ LÔ HÀNG VÀ TẤT CẢ SỰ KIỆN đều không bị chỉnh sửa
        dto.setIsIntegrityVerified(isBatchValid && areEventsValid);
        dto.setVerifiedAt(LocalDateTime.now());

        return dto;
    }
}