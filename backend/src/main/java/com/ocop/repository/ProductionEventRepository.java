package com.ocop.repository;

import com.ocop.entity.ProductionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionEventRepository extends JpaRepository<ProductionEvent, Long> {

    List<ProductionEvent> findByBatchIdOrderByEventTimestampAsc(Long batchId);
}
