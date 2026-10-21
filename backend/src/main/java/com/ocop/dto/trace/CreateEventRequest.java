package com.ocop.dto.trace;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class CreateEventRequest {

    @NotBlank(message = "Loại sự kiện không được để trống")
    private String eventType; // HARVEST, PROCESSING, QUALITY_INSPECTION, PACKAGING, TRANSPORT

    @NotBlank(message = "Tên hoạt động chuỗi cung ứng không được để trống")
    private String eventName;

    private String description;

    @NotBlank(message = "Người hoặc bộ phận thực hiện không được để trống")
    private String actorName;

    private Long locationId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime eventTimestamp;

    public CreateEventRequest() {}

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public Long getLocationId() {
        return locationId;
    }

    public void setLocationId(Long locationId) {
        this.locationId = locationId;
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    public void setEventTimestamp(LocalDateTime eventTimestamp) {
        this.eventTimestamp = eventTimestamp;
    }
}
