package com.ocop.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateUserStatusRequest {

    @NotBlank(message = "Trạng thái người dùng không được để trống")
    @Pattern(regexp = "ACTIVE|LOCKED", message = "Trạng thái chỉ có thể là ACTIVE hoặc LOCKED")
    private String status;

    public UpdateUserStatusRequest() {}

    public UpdateUserStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
