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

    private boolean slotChanged;
    private int     seatBookingsCancelled;
    private Integer assignedSeatNo;        // ← NEW: non-null = old seat auto-reallotted

    /**
     * NOT_CHANGED | NO_RECORD | RECALCULATED_PENDING |
     * HYBRID_RECALCULATED_PARTIAL | HYBRID_RECALCULATED_OVERPAID | PAID_UNTOUCHED
     */
    private String     currentMonthFeeHandling;
    private BigDecimal newFinalFee;
    private BigDecimal newBalanceAmount;

    private String       overpaidWarning;
    private List<String> previousDuesWarning;
}
