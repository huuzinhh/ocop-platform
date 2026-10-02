package com.ocop.dto.order;

import jakarta.validation.constraints.NotBlank;

public class MockPaymentRequest {

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod; // MOCK_VNPAY, MOCK_MOMO, COD

    public MockPaymentRequest() {}

    public MockPaymentRequest(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
