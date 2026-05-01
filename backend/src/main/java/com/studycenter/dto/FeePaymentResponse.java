package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeePaymentResponse {

    private String message;
    private Long feeId;
    private Long regNo;
    private String studentName;
    private String receiptNumber;
    private int feeMonth;
    private int feeYear;
    private BigDecimal finalFee;
    private BigDecimal amountPaidNow;
    private BigDecimal totalPaidSoFar;
    private BigDecimal balanceRemaining;
    private String paymentStatus;
    private String paymentMode;
    private String paymentDate;
}