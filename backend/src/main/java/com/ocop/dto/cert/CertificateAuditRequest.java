package com.ocop.dto.cert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CertificateAuditRequest {

    @NotBlank(message = "Hành động thẩm định không được để trống (APPROVE hoặc REJECT)")
    @Pattern(regexp = "APPROVE|REJECT", message = "Hành động chỉ có thể là APPROVE hoặc REJECT")
    private String action;

    private String rejectionReason;

    public CertificateAuditRequest() {}

    public CertificateAuditRequest(String action, String rejectionReason) {
        this.action = action;
        this.rejectionReason = rejectionReason;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
