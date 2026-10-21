package com.ocop.service;

import com.ocop.dto.cert.CertificateAuditRequest;
import com.ocop.dto.cert.CertificateDetailDto;
import com.ocop.dto.cert.CertificateStatsDto;
import com.ocop.entity.OcopCertificate;
import com.ocop.entity.Producer;
import com.ocop.entity.Product;
import com.ocop.repository.OcopCertificateRepository;
import com.ocop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OcopCertificateService {

    @Autowired
    private OcopCertificateRepository certificateRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<CertificateDetailDto> getCertificates(String status) {
        List<OcopCertificate> certificates;

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            certificates = certificateRepository.findByStatus(status.trim().toUpperCase());
        } else {
            certificates = certificateRepository.findAll();
        }

        LocalDate today = LocalDate.now();
        List<CertificateDetailDto> dtos = new ArrayList<>();

        for (OcopCertificate cert : certificates) {
            // Tự động đánh dấu hết hạn nếu đã qua ngày expiryDate mà không phải bị từ chối
            if (cert.getExpiryDate() != null && cert.getExpiryDate().isBefore(today) && !"REJECTED".equalsIgnoreCase(cert.getStatus())) {
                if (!"EXPIRED".equalsIgnoreCase(cert.getStatus())) {
                    cert.setStatus("EXPIRED");
                    certificateRepository.save(cert);
                }
            }
            dtos.add(mapToDto(cert));
        }

        // Sắp xếp: PENDING lên đầu tiên, sau đó theo ID giảm dần (mới nhất)
        dtos.sort(Comparator.comparing((CertificateDetailDto d) -> "PENDING".equalsIgnoreCase(d.getStatus()) ? 0 : 1)
                .thenComparing(CertificateDetailDto::getCertificateId, Comparator.reverseOrder()));

        return dtos;
    }

    public CertificateStatsDto getCertificateStats() {
        List<OcopCertificate> all = certificateRepository.findAll();
        LocalDate today = LocalDate.now();

        long total = all.size();
        long pending = 0;
        long approved = 0;
        long rejected = 0;
        long expired = 0;

        for (OcopCertificate cert : all) {
            String status = cert.getStatus() != null ? cert.getStatus().toUpperCase() : "PENDING";
            if (cert.getExpiryDate() != null && cert.getExpiryDate().isBefore(today) && !"REJECTED".equals(status)) {
                expired++;
            } else if ("APPROVED".equals(status)) {
                approved++;
            } else if ("REJECTED".equals(status)) {
                rejected++;
            } else {
                pending++;
            }
        }

        return new CertificateStatsDto(total, pending, approved, rejected, expired);
    }

    @Transactional
    public CertificateDetailDto auditCertificate(Long certId, String adminUsername, CertificateAuditRequest request) {
        OcopCertificate cert = certificateRepository.findById(certId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ chứng nhận OCOP ID: " + certId));

        String action = request.getAction().toUpperCase();
        if ("APPROVE".equals(action)) {
            cert.setStatus("APPROVED");
            cert.setVerifiedBy(adminUsername != null ? adminUsername : "admin");
            cert.setVerifiedAt(LocalDateTime.now());
            cert.setRejectionReason(null);

            // Cập nhật đồng bộ xếp hạng sao trên sản phẩm nếu có
            if (cert.getProduct() != null && cert.getStarRating() != null) {
                Product product = cert.getProduct();
                product.setOcopStarRating(cert.getStarRating());
                productRepository.save(product);
            }
        } else if ("REJECT".equals(action)) {
            cert.setStatus("REJECTED");
            cert.setVerifiedBy(adminUsername != null ? adminUsername : "admin");
            cert.setVerifiedAt(LocalDateTime.now());
            cert.setRejectionReason(request.getRejectionReason() != null && !request.getRejectionReason().trim().isEmpty()
                    ? request.getRejectionReason().trim()
                    : "Hồ sơ chứng nhận không đáp ứng tiêu chuẩn thẩm định OCOP");
        } else {
            throw new IllegalArgumentException("Hành động không hợp lệ: " + action + ". Chỉ chấp nhận APPROVE hoặc REJECT");
        }

        OcopCertificate saved = certificateRepository.save(cert);
        return mapToDto(saved);
    }

    private CertificateDetailDto mapToDto(OcopCertificate cert) {
        CertificateDetailDto dto = new CertificateDetailDto();
        dto.setCertificateId(cert.getId());
        dto.setCertificateCode(cert.getCertificateCode());
        dto.setStarRating(cert.getStarRating());
        dto.setIssuedDate(cert.getIssuedDate());
        dto.setExpiryDate(cert.getExpiryDate());
        dto.setIssuingAuthority(cert.getIssuingAuthority());
        dto.setDocumentUrl(cert.getDocumentUrl());
        dto.setIsSampleData(cert.getIsSampleData());
        dto.setStatus(cert.getStatus() != null ? cert.getStatus() : "PENDING");
        dto.setVerifiedAt(cert.getVerifiedAt());
        dto.setVerifiedBy(cert.getVerifiedBy());
        dto.setRejectionReason(cert.getRejectionReason());

        Product product = cert.getProduct();
        if (product != null) {
            dto.setProductId(product.getId());
            dto.setProductName(product.getName());
            dto.setProductThumbnail(product.getThumbnail());
            dto.setProductPrice(product.getPrice());
            dto.setProductStatus(product.getStatus());

            Producer producer = product.getProducer();
            if (producer != null) {
                dto.setProducerId(producer.getId());
                dto.setProducerName(producer.getName());
                dto.setProducerCode(producer.getCode());
                if (producer.getLocation() != null) {
                    dto.setProducerProvince(producer.getLocation().getProvince());
                }
            }
        }

        return dto;
    }
}
