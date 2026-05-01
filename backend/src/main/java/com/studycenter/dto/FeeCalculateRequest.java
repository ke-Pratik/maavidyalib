package com.studycenter.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeCalculateRequest {

    @NotNull(message = "regNo is required")
    private Long regNo;

    @NotNull(message = "inTime is required (HH:mm)")
    private String inTime;

    @NotNull(message = "outTime is required (HH:mm)")
    private String outTime;

    @NotNull(message = "feeMonth is required (1-12)")
    private Integer feeMonth;

    @NotNull(message = "feeYear is required")
    private Integer feeYear;

    private LocalDate joiningDateInMonth;

    private BigDecimal discountAmount;

    private String remarks;
}