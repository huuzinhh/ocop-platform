package com.ocop.dto.stats;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ProducerDashboardDto {

    private Long producerId;
    private String producerName;
    private String producerCode;

    // Các chỉ số tổng quan
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Integer totalOrders = 0;
    private Integer completedOrders = 0;
    private Integer processingOrders = 0;
    private Integer cancelledOrders = 0;
    private Integer totalUnitsSold = 0;
    private Integer totalProducts = 0;
    private Integer totalBatches = 0;

    // Doanh thu theo 7 ngày gần nhất
    private List<DateRevenueDto> revenueTimeline = new ArrayList<>();

    // Danh sách sản phẩm bán chạy nhất
    private List<TopSellingProductDto> topSellingProducts = new ArrayList<>();

    // Phân bổ đơn hàng theo trạng thái
    private Map<String, Integer> orderStatusDistribution = new HashMap<>();

    public ProducerDashboardDto() {}

    public Long getProducerId() {
        return producerId;
    }

    public void setProducerId(Long producerId) {
        this.producerId = producerId;
    }

    public String getProducerName() {
        return producerName;
    }

    public void setProducerName(String producerName) {
        this.producerName = producerName;
    }

    public String getProducerCode() {
        return producerCode;
    }

    public void setProducerCode(String producerCode) {
        this.producerCode = producerCode;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Integer getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(Integer completedOrders) {
        this.completedOrders = completedOrders;
    }

    public Integer getProcessingOrders() {
        return processingOrders;
    }

    public void setProcessingOrders(Integer processingOrders) {
        this.processingOrders = processingOrders;
    }

    public Integer getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(Integer cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public Integer getTotalUnitsSold() {
        return totalUnitsSold;
    }

    public void setTotalUnitsSold(Integer totalUnitsSold) {
        this.totalUnitsSold = totalUnitsSold;
    }

    public Integer getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(Integer totalProducts) {
        this.totalProducts = totalProducts;
    }

    public Integer getTotalBatches() {
        return totalBatches;
    }

    public void setTotalBatches(Integer totalBatches) {
        this.totalBatches = totalBatches;
    }

    public List<DateRevenueDto> getRevenueTimeline() {
        return revenueTimeline;
    }

    public void setRevenueTimeline(List<DateRevenueDto> revenueTimeline) {
        this.revenueTimeline = revenueTimeline;
    }

    public List<TopSellingProductDto> getTopSellingProducts() {
        return topSellingProducts;
    }

    public void setTopSellingProducts(List<TopSellingProductDto> topSellingProducts) {
        this.topSellingProducts = topSellingProducts;
    }

    public Map<String, Integer> getOrderStatusDistribution() {
        return orderStatusDistribution;
    }

    public void setOrderStatusDistribution(Map<String, Integer> orderStatusDistribution) {
        this.orderStatusDistribution = orderStatusDistribution;
    }
}
