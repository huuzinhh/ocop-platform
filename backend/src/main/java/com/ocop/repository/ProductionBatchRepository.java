package com.ocop.repository;

import com.ocop.entity.ProductionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionBatchRepository extends JpaRepository<ProductionBatch, Long> {

    Optional<ProductionBatch> findByBatchCode(String batchCode);

    List<ProductionBatch> findByProductId(Long productId);

    @Query("SELECT b FROM ProductionBatch b WHERE b.product.producer.id = :producerId ORDER BY b.createdAt DESC")
    List<ProductionBatch> findByProducerId(@Param("producerId") Long producerId);

    List<ProductionBatch> findAllByOrderByCreatedAtDesc();
}
