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
public class StudentReactivateRequest {

    @NotNull(message = "Registration number is required")
    private Long regNo;

    private String remarks;
}