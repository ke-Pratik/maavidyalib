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
public class FeeCollectionResponse {

    private String period;
    private int totalStudents;
    private int paidCount;
    private int pendingCount;
    private int partialCount;
    private BigDecimal totalFeeExpected;
    private BigDecimal totalCollected;
    private BigDecimal totalBalance;
    private BigDecimal cashCollected;
    private BigDecimal onlineCollected;
}