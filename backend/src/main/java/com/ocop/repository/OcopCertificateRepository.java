package com.ocop.repository;

import com.ocop.entity.OcopCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OcopCertificateRepository extends JpaRepository<OcopCertificate, Long> {
    Optional<OcopCertificate> findByProductId(Long productId);
    Optional<OcopCertificate> findByCertificateCode(String certificateCode);
    List<OcopCertificate> findByStatus(String status);
    long countByStatus(String status);
}
