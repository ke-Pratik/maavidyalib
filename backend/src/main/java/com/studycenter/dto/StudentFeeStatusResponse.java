package com.studycenter.dto;

import com.studycenter.entity.FeeRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFeeStatusResponse {

    private Long regNo;
    private String studentName;
    private Boolean isActive;
    private int totalMonths;
    private BigDecimal totalFee;
    private BigDecimal totalPaid;
    private BigDecimal totalBalance;
    private String overallStatus;
    private List<FeeRecord> monthlyRecords;
}