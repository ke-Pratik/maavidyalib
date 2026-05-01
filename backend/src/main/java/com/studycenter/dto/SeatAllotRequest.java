package com.studycenter.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatAllotRequest {

    @NotNull(message = "seatNo is required")
    private Integer seatNo;

    @NotNull(message = "regNo is required")
    private Long regNo;

    @NotNull(message = "startTime is required (HH:mm)")
    private String startTime;

    @NotNull(message = "endTime is required (HH:mm)")
    private String endTime;
}