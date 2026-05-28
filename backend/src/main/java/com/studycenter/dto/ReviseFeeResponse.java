package com.studycenter.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviseFeeResponse {
    private String     message;
    private Long       feeId;
    private Long       regNo;
    private BigDecimal oldFinalFee;
    private BigDecimal newFinalFee;
    private BigDecimal oldBalance;
    private BigDecimal newBalance;
    private String     oldStatus;
    private String     newStatus;
    private BigDecimal walletCreditAdded;
    private String     overpaidNote;

    // ── Next-month preview ──────────────────────────
    private BigDecimal monthlyFee;          // unchanged in revise
    private BigDecimal newMonthlyDiscount;  // full-month discount value
    private BigDecimal nextMonthFee;        // monthlyFee − newMonthlyDiscount
}
