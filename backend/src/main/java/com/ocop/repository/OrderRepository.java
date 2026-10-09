package com.ocop.repository;

import com.ocop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.product.producer.id = :producerId ORDER BY o.createdAt DESC")
    List<Order> findOrdersByProducerId(@Param("producerId") Long producerId);
}

