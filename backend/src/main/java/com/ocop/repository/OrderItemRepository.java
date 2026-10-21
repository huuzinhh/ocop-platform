package com.ocop.repository;

import com.ocop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    @Query("SELECT COUNT(i) FROM OrderItem i WHERE i.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);
}
