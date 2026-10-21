package com.ocop.dto.gis;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UpdateProducerLocationRequest {

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    private String district;
    private String ward;
    private String addressDetail;

    @NotNull(message = "Vĩ độ (latitude) không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Kinh độ (longitude) không được để trống")
    private BigDecimal longitude;

    public UpdateProducerLocationRequest() {}

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public String getAddressDetail() {
        return addressDetail;
    }

    public void setAddressDetail(String addressDetail) {
        this.addressDetail = addressDetail;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }
}
