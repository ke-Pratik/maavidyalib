package com.studycenter.repository;

import java.math.BigDecimal;
import java.time.LocalTime;

// ── ENHANCEMENT #3: Projection for LEFT JOIN students + fee_records ───────────
// fee_* fields are NULL when student has no record for that month/year
public interface AllStudentFeeProjection {
    Long getRegNo();
    String getName();
    LocalTime getInTime();
    LocalTime getOutTime();
    BigDecimal getFinalFee();       // NULL if no fee record
    BigDecimal getPaidAmount();     // NULL if no fee record
    BigDecimal getBalanceAmount();  // NULL if no fee record
    String getPaymentStatus();      // NULL if no fee record → mapped to "NO_RECORD" in service
    String getPaymentMode();
    String getReceiptNumber();
}
