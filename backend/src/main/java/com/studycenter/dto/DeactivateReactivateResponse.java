package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeactivateReactivateResponse {

    private String message;
    private Long regNo;
    private String name;
    private Boolean isActive;
    private String deactivationDate;
    private String remarks;
    private int bookingsCancelled;
}