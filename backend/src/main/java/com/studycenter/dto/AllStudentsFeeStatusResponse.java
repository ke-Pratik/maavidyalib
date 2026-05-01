package com.studycenter.dto;

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
public class AllStudentsFeeStatusResponse {

    private int month;
    private int year;
    private int totalStudents;
    private long paidCount;
    private long pendingCount;
    private long partialCount;
    private BigDecimal totalFeeExpected;
    private BigDecimal totalCollected;
    private BigDecimal totalBalance;
    private List<StudentFeeDetail> students;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentFeeDetail {
        private Long regNo;
        private String studentName;
        private String timeSlot;
        private BigDecimal finalFee;
        private BigDecimal paidAmount;
        private BigDecimal balanceAmount;
        private String paymentStatus;
        private String paymentMode;
        private String receiptNumber;
    }
}