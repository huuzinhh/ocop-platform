package com.ocop.dto.user;

public class UserStatsDto {

    private long totalUsers;
    private long adminCount;
    private long producerCount;
    private long customerCount;
    private long activeCount;
    private long lockedCount;

    public UserStatsDto() {}

    public UserStatsDto(long totalUsers, long adminCount, long producerCount, long customerCount, long activeCount, long lockedCount) {
        this.totalUsers = totalUsers;
        this.adminCount = adminCount;
        this.producerCount = producerCount;
        this.customerCount = customerCount;
        this.activeCount = activeCount;
        this.lockedCount = lockedCount;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getAdminCount() {
        return adminCount;
    }

    public void setAdminCount(long adminCount) {
        this.adminCount = adminCount;
    }

    public long getProducerCount() {
        return producerCount;
    }

    public void setProducerCount(long producerCount) {
        this.producerCount = producerCount;
    }

    public long getCustomerCount() {
        return customerCount;
    }

    public void setCustomerCount(long customerCount) {
        this.customerCount = customerCount;
    }

    public long getActiveCount() {
        return activeCount;
    }

    public void setActiveCount(long activeCount) {
        this.activeCount = activeCount;
    }

    public long getLockedCount() {
        return lockedCount;
    }

    public void setLockedCount(long lockedCount) {
        this.lockedCount = lockedCount;
    }
}
