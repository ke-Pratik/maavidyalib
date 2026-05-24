package com.studycenter.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEditResponse {

    private String message;
    private Long   regNo;

    // Updated student fields
    private String name;
    private String fatherName;
    private String aadhaarNo;
    private String gender;
    private String address;
    private String mobile;
    private String inTime;
    private String outTime;
    private String dateOfAdmission;
    private String remarks;

    // Slot-change result fields (only meaningful when slotChanged=true)
    private boolean slotChanged;
    private int     seatBookingsCancelled;

    /**
     * NOT_CHANGED        – Case 1, no slot update
     * NO_RECORD          – no fee record for current month, nothing to do
     * RECALCULATED_PENDING   – was PENDING, recalculated at new rate
     * HYBRID_RECALCULATED_PARTIAL  – was PARTIAL, hybrid split done
     * HYBRID_RECALCULATED_OVERPAID – hybrid result was <= 0, marked PAID
     * PAID_UNTOUCHED     – was already PAID, left alone
     */
    private String     currentMonthFeeHandling;
    private BigDecimal newFinalFee;
    private BigDecimal newBalanceAmount;

    private String       overpaidWarning;     // non-null only when OVERPAID
    private List<String> previousDuesWarning; // previous months still unpaid
}
