package com.studycenter.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatAvailabilityResponse {

    private int seatNo;
    private String zone;
    private boolean genderAllowed;

    @JsonProperty("isAvailable")
    private boolean isAvailable;
    private String message;
    private List<String> existingBookings;
}