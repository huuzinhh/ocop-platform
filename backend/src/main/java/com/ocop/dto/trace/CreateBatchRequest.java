package com.ocop.dto.trace;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class CreateBatchRequest {

    @NotNull(message = "Sản phẩm không được để trống")
    private Long productId;

    private String batchCode; // Nếu trống sẽ tự sinh mã

    @NotNull(message = "Ngày sản xuất không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate manufactureDate;

    @NotNull(message = "Hạn sử dụng không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    @NotNull(message = "Số lượng đóng gói không được để trống")
    @Min(value = 1, message = "Số lượng lô tối thiểu là 1")
    private Integer quantity;

    public CreateBatchRequest() {}

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getBatchCode() {
        return batchCode;
    }

    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }

    public LocalDate getManufactureDate() {
        return manufactureDate;
    }

    public void setManufactureDate(LocalDate manufactureDate) {
        this.manufactureDate = manufactureDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
