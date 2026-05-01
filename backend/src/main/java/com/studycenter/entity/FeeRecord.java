package com.studycenter.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "fee_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fee_id")
    private Long feeId;

    @Column(name = "reg_no", nullable = false)
    private Long regNo;

    @Column(name = "fee_month", nullable = false)
    private Integer feeMonth;

    @Column(name = "fee_year", nullable = false)
    private Integer feeYear;

    @Column(name = "in_time", nullable = false)
    private LocalTime inTime;

    @Column(name = "out_time", nullable = false)
    private LocalTime outTime;

    @Column(name = "total_days_in_month")
    private Integer totalDaysInMonth;

    @Column(name = "applicable_days")
    private Integer applicableDays;

    @Column(name = "joining_date_in_month")
    private LocalDate joiningDateInMonth;

    @Column(name = "monthly_fee")
    private BigDecimal monthlyFee;

    @Column(name = "prorated_fee")
    private BigDecimal proratedFee;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "final_fee")
    private BigDecimal finalFee;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount;

    @Column(name = "balance_amount")
    private BigDecimal balanceAmount;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "receipt_number")
    private String receiptNumber;

    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}