package com.ocop.dto.stats;

import java.math.BigDecimal;

public class DateRevenueDto {
    private String date; // dd/MM
    private BigDecimal revenue = BigDecimal.ZERO;
    private Integer orderCount = 0;
    private Integer unitsSold = 0;

    public DateRevenueDto() {}

    public DateRevenueDto(String date, BigDecimal revenue, Integer orderCount, Integer unitsSold) {
        this.date = date;
        this.revenue = revenue;
        this.orderCount = orderCount;
        this.unitsSold = unitsSold;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public Integer getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(Integer orderCount) {
        this.orderCount = orderCount;
    }

    public Integer getUnitsSold() {
        return unitsSold;
    }

    public void setUnitsSold(Integer unitsSold) {
        this.unitsSold = unitsSold;
    }
}
