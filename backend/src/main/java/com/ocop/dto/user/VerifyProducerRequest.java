package com.ocop.dto.user;

public class VerifyProducerRequest {

    private Boolean isVerified = true;

    public VerifyProducerRequest() {}

    public VerifyProducerRequest(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
}
