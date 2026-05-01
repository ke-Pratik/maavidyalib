package com.studycenter.service;

import com.studycenter.dto.AllStudentsFeeStatusResponse;
import com.studycenter.dto.FeeCalculateResponse;
import com.studycenter.dto.FeeCollectionResponse;
import com.studycenter.dto.FeeLockRequest;
import com.studycenter.dto.FeePaymentRequest;
import com.studycenter.dto.FeePaymentResponse;
import com.studycenter.dto.FeePreviewRequest;
import com.studycenter.dto.StudentFeeStatusResponse;
import com.studycenter.entity.FeeRecord;
import com.studycenter.entity.FeeStructure;
import com.studycenter.entity.Student;
import com.studycenter.exception.InvalidRequestException;
import com.studycenter.exception.StudentNotFoundException;
import com.studycenter.repository.FeeRecordRepository;
import com.studycenter.repository.FeeStructureRepository;
import com.studycenter.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeeService {

    private final FeeStructureRepository feeStructureRepository;
    private final FeeRecordRepository feeRecordRepository;
    private final StudentRepository studentRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ═══════════════════════════════════════════════════════════════════
    // INTERNAL: Core fee calculation logic
    // ═══════════════════════════════════════════════════════════════════
    private FeeCalculateResponse calculateFeeInternal(
            String inTimeStr, String outTimeStr, LocalDate joiningDate, BigDecimal monthlyDiscount) {

        LocalTime inTime = LocalTime.parse(inTimeStr, TIME_FMT);
        LocalTime outTime = LocalTime.parse(outTimeStr, TIME_FMT);

        if (!inTime.isBefore(outTime))
            throw new InvalidRequestException("inTime must be before outTime");

        int feeMonth = joiningDate.getMonthValue();
        int feeYear = joiningDate.getYear();

        long totalHours = Duration.between(inTime, outTime).toHours();
        BigDecimal monthlyFee;
        String slotName;
        String calcMethod;

        Optional<FeeStructure> mapped = feeStructureRepository
                .findByInTimeAndOutTimeAndIsActiveTrue(inTime, outTime);

        if (mapped.isPresent()) {
            monthlyFee = mapped.get().getFeeAmount();
            slotName = mapped.get().getSlotName();
            calcMethod = "MAPPED (from fee structure)";
        } else if (totalHours == 4) {
            monthlyFee = new BigDecimal("500.00");
            slotName = "Custom 4-Hour Slot";
            calcMethod = "DEFAULT_4HR (unmapped 4hr = Rs.500)";
        } else {
            monthlyFee = BigDecimal.valueOf(totalHours * 100);
            slotName = "Custom " + totalHours + "-Hour Slot";
            calcMethod = "HOURLY (" + totalHours + " hrs x Rs.100)";
        }

        YearMonth ym = YearMonth.of(feeYear, feeMonth);
        int totalDays = ym.lengthOfMonth();
        int dayOfMonth = joiningDate.getDayOfMonth();
        int applicableDays = totalDays - dayOfMonth + 1;

        if (applicableDays <= 0 || applicableDays > totalDays)
            throw new InvalidRequestException("Invalid joining date for this month.");

        boolean isMidMonth = (dayOfMonth > 1);

        if (monthlyDiscount == null) monthlyDiscount = BigDecimal.ZERO;
        if (monthlyDiscount.compareTo(monthlyFee) > 0)
            throw new InvalidRequestException(
                    "Monthly discount (Rs." + monthlyDiscount + ") cannot exceed monthly fee (Rs." + monthlyFee + ")");

        BigDecimal proratedFee;
        BigDecimal proratedDiscount;
        BigDecimal finalFee;
        String calcFormula;

        if (!isMidMonth) {
            proratedFee = monthlyFee;
            proratedDiscount = monthlyDiscount;
            finalFee = monthlyFee.subtract(monthlyDiscount).setScale(2, RoundingMode.HALF_UP);
            calcFormula = "Full month: Rs." + monthlyFee + " - Rs." + monthlyDiscount
                    + " (discount) = Rs." + finalFee;
        } else {
            BigDecimal perDayFee = monthlyFee
                    .divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
            BigDecimal perDayDiscount = monthlyDiscount
                    .divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);

            proratedFee = perDayFee
                    .multiply(BigDecimal.valueOf(applicableDays))
                    .setScale(2, RoundingMode.HALF_UP);
            proratedDiscount = perDayDiscount
                    .multiply(BigDecimal.valueOf(applicableDays))
                    .setScale(2, RoundingMode.HALF_UP);

            finalFee = proratedFee.subtract(proratedDiscount).setScale(2, RoundingMode.HALF_UP);

            calcFormula = "Pro-rated Fee: (Rs." + monthlyFee + " / " + totalDays + ") x "
                    + applicableDays + " = Rs." + proratedFee
                    + " | Pro-rated Discount: (Rs." + monthlyDiscount + " / " + totalDays + ") x "
                    + applicableDays + " = Rs." + proratedDiscount
                    + " | Final: Rs." + proratedFee + " - Rs." + proratedDiscount + " = Rs." + finalFee;
        }

        if (finalFee.compareTo(BigDecimal.ZERO) < 0) finalFee = BigDecimal.ZERO;

        YearMonth nextYm = ym.plusMonths(1);
        String nextMonthLabel = nextYm.getMonth().name() + " " + nextYm.getYear();
        BigDecimal nextMonthFinalFee = monthlyFee.subtract(monthlyDiscount).setScale(2, RoundingMode.HALF_UP);
        if (nextMonthFinalFee.compareTo(BigDecimal.ZERO) < 0) nextMonthFinalFee = BigDecimal.ZERO;

        String nextMonthMessage;
        if (isMidMonth) {
            nextMonthMessage = "Student joined on " + joiningDate + " (mid-month). "
                    + "This month: Rs." + finalFee + " (pro-rated). "
                    + "From " + nextMonthLabel + " onwards: Rs." + monthlyFee
                    + " - Rs." + monthlyDiscount + " (discount) = Rs." + nextMonthFinalFee + " per month.";
        } else {
            nextMonthMessage = "Student joined on 1st. Every month: Rs." + monthlyFee
                    + " - Rs." + monthlyDiscount + " (discount) = Rs." + nextMonthFinalFee + ".";
        }

        return FeeCalculateResponse.builder()
                .timeSlot(inTimeStr + " - " + outTimeStr)
                .slotName(slotName)
                .feeMonth(feeMonth).feeYear(feeYear)
                .totalDaysInMonth(totalDays).applicableDays(applicableDays)
                .joiningDate(joiningDate.toString())
                .monthlyFee(monthlyFee).proratedFee(proratedFee)
                .monthlyDiscount(monthlyDiscount).proratedDiscount(proratedDiscount)
                .discountAmount(proratedDiscount).finalFee(finalFee)
                .calculationMethod(calcMethod).calculationFormula(calcFormula)
                .paidAmount(BigDecimal.ZERO).balanceAmount(finalFee)
                .paymentStatus("PENDING").lockedInDb(false)
                .isMidMonthJoining(isMidMonth).nextMonthLabel(nextMonthLabel)
                .nextMonthFee(monthlyFee).nextMonthDiscount(monthlyDiscount)
                .nextMonthFinalFee(nextMonthFinalFee).nextMonthMessage(nextMonthMessage)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // PREVIEW FEE (No RegNo, No DB save)
    // ═══════════════════════════════════════════════════════════════════
    public FeeCalculateResponse previewFee(FeePreviewRequest request) {

        log.info("Fee preview: time={}-{}, joinDate={}",
                request.getInTime(), request.getOutTime(), request.getJoiningDate());

        FeeCalculateResponse response = calculateFeeInternal(
                request.getInTime(), request.getOutTime(),
                request.getJoiningDate(), request.getDiscountAmount());

        response.setStudentName("(Preview — No student linked)");
        response.setLockedInDb(false);
        return response;
    }

    // ═══════════════════════════════════════════════════════════════════
    // LOCK FEE (RegNo required, saves to DB)
    // ═════════════════════��═════════════════════════════════════════════
    @Transactional
    public FeeCalculateResponse lockFee(FeeLockRequest request) {

        log.info("Locking fee: regNo={}, time={}-{}, joinDate={}",
                request.getRegNo(), request.getInTime(), request.getOutTime(), request.getJoiningDate());

        Student student = studentRepository.findById(request.getRegNo())
                .orElseThrow(() -> new StudentNotFoundException(
                        "Student " + request.getRegNo() + " not found. Register first."));

        if (!student.getIsActive())
            throw new InvalidRequestException("Student " + request.getRegNo() + " is inactive.");

        int feeMonth = request.getJoiningDate().getMonthValue();
        int feeYear = request.getJoiningDate().getYear();

        if (feeRecordRepository.existsByRegNoAndFeeMonthAndFeeYear(
                request.getRegNo(), feeMonth, feeYear)) {
            throw new InvalidRequestException(
                    "Fee already locked for RegNo " + request.getRegNo()
                            + " for " + feeMonth + "/" + feeYear
                            + ". Use payment page to pay.");
        }

        FeeCalculateResponse calc = calculateFeeInternal(
                request.getInTime(), request.getOutTime(),
                request.getJoiningDate(), request.getDiscountAmount());

        LocalTime inTime = LocalTime.parse(request.getInTime(), TIME_FMT);
        LocalTime outTime = LocalTime.parse(request.getOutTime(), TIME_FMT);

        FeeRecord record = FeeRecord.builder()
                .regNo(request.getRegNo())
                .feeMonth(feeMonth).feeYear(feeYear)
                .inTime(inTime).outTime(outTime)
                .totalDaysInMonth(calc.getTotalDaysInMonth())
                .applicableDays(calc.getApplicableDays())
                .joiningDateInMonth(request.getJoiningDate())
                .monthlyFee(calc.getMonthlyFee())
                .proratedFee(calc.getProratedFee())
                .discountAmount(calc.getDiscountAmount())
                .finalFee(calc.getFinalFee())
                .paidAmount(BigDecimal.ZERO)
                .balanceAmount(calc.getFinalFee())
                .paymentStatus("PENDING")
                .remarks(request.getRemarks())
                .createdAt(LocalDateTime.now())
                .build();

        FeeRecord saved = feeRecordRepository.save(record);

        log.info("Fee locked: feeId={}, regNo={}, finalFee={}",
                saved.getFeeId(), saved.getRegNo(), saved.getFinalFee());

        calc.setFeeId(saved.getFeeId());
        calc.setRegNo(saved.getRegNo());
        calc.setStudentName(student.getName());
        calc.setLockedInDb(true);
        return calc;
    }

    // ═══════════════════════════════════════════════════════════════════
    // RECORD PAYMENT
    // ═══════════════════════════════════════════════════════════════════
    @Transactional
    public FeePaymentResponse recordPayment(FeePaymentRequest request) {

        log.info("Payment: regNo={}, month={}/{}, amount={}",
                request.getRegNo(), request.getFeeMonth(), request.getFeeYear(), request.getPayAmount());

        String mode = request.getPaymentMode().toUpperCase();
        if (!"CASH".equals(mode) && !"ONLINE".equals(mode))
            throw new InvalidRequestException("paymentMode must be CASH or ONLINE");

        Student student = studentRepository.findById(request.getRegNo())
                .orElseThrow(() -> new StudentNotFoundException(
                        "Student " + request.getRegNo() + " not found."));

        FeeRecord record = feeRecordRepository
                .findByRegNoAndFeeMonthAndFeeYear(
                        request.getRegNo(), request.getFeeMonth(), request.getFeeYear())
                .orElseThrow(() -> new InvalidRequestException(
                        "No fee record found for RegNo " + request.getRegNo()
                                + " for " + request.getFeeMonth() + "/" + request.getFeeYear()
                                + ". Please lock fee first."));

        if ("PAID".equals(record.getPaymentStatus()))
            throw new InvalidRequestException("Fee already fully PAID.");

        BigDecimal payAmount = request.getPayAmount();
        if (payAmount.compareTo(BigDecimal.ZERO) <= 0)
            throw new InvalidRequestException("Amount must be > 0");
        if (payAmount.compareTo(record.getBalanceAmount()) > 0)
            throw new InvalidRequestException("Amount Rs." + payAmount + " exceeds balance Rs." + record.getBalanceAmount());

        BigDecimal newPaid = record.getPaidAmount().add(payAmount);
        BigDecimal newBalance = record.getFinalFee().subtract(newPaid);
        String newStatus = newBalance.compareTo(BigDecimal.ZERO) <= 0 ? "PAID" : "PARTIAL";
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) newBalance = BigDecimal.ZERO;

        String receipt = generateReceiptNumber(record.getFeeMonth(), record.getFeeYear());

        record.setPaidAmount(newPaid);
        record.setBalanceAmount(newBalance);
        record.setPaymentStatus(newStatus);
        record.setPaymentMode(mode);
        record.setPaymentDate(LocalDate.now());
        record.setReceiptNumber(receipt);
        if (request.getRemarks() != null) record.setRemarks(request.getRemarks());
        feeRecordRepository.save(record);

        return FeePaymentResponse.builder()
                .message("Payment recorded successfully!")
                .feeId(record.getFeeId()).regNo(record.getRegNo())
                .studentName(student.getName()).receiptNumber(receipt)
                .feeMonth(record.getFeeMonth()).feeYear(record.getFeeYear())
                .finalFee(record.getFinalFee()).amountPaidNow(payAmount)
                .totalPaidSoFar(newPaid).balanceRemaining(newBalance)
                .paymentStatus(newStatus).paymentMode(mode)
                .paymentDate(LocalDate.now().toString())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // STUDENT FEE STATUS
    // ═══════════════════════════════════════════════════════════════════
    public StudentFeeStatusResponse getStudentFeeStatus(Long regNo) {

        Student student = studentRepository.findById(regNo)
                .orElseThrow(() -> new StudentNotFoundException("Student " + regNo + " not found."));

        List<FeeRecord> records = feeRecordRepository.findByRegNoOrderByFeeYearDescFeeMonthDesc(regNo);

        BigDecimal totalFee = records.stream().map(FeeRecord::getFinalFee).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaid = records.stream().map(FeeRecord::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBalance = records.stream().map(FeeRecord::getBalanceAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return StudentFeeStatusResponse.builder()
                .regNo(regNo).studentName(student.getName()).isActive(student.getIsActive())
                .totalMonths(records.size()).totalFee(totalFee)
                .totalPaid(totalPaid).totalBalance(totalBalance)
                .overallStatus(totalBalance.compareTo(BigDecimal.ZERO) <= 0 ? "ALL_PAID" : "HAS_PENDING")
                .monthlyRecords(records)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ALL STUDENTS FEE STATUS
    // ═══════════════════════════════════════════════════════════════════
    public AllStudentsFeeStatusResponse getAllStudentsFeeStatus(Integer month, Integer year) {

        List<FeeRecord> records = feeRecordRepository.findByFeeMonthAndFeeYear(month, year);

        long paid = records.stream().filter(r -> "PAID".equals(r.getPaymentStatus())).count();
        long pending = records.stream().filter(r -> "PENDING".equals(r.getPaymentStatus())).count();
        long partial = records.stream().filter(r -> "PARTIAL".equals(r.getPaymentStatus())).count();

        BigDecimal totalExpected = records.stream().map(FeeRecord::getFinalFee).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCollected = records.stream().map(FeeRecord::getPaidAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBalance = records.stream().map(FeeRecord::getBalanceAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AllStudentsFeeStatusResponse.StudentFeeDetail> students = records.stream()
                .map(r -> AllStudentsFeeStatusResponse.StudentFeeDetail.builder()
                        .regNo(r.getRegNo())
                        .studentName(studentRepository.findById(r.getRegNo()).map(Student::getName).orElse("Unknown"))
                        .timeSlot(r.getInTime().format(TIME_FMT) + " - " + r.getOutTime().format(TIME_FMT))
                        .finalFee(r.getFinalFee()).paidAmount(r.getPaidAmount())
                        .balanceAmount(r.getBalanceAmount()).paymentStatus(r.getPaymentStatus())
                        .paymentMode(r.getPaymentMode()).receiptNumber(r.getReceiptNumber())
                        .build())
                .toList();

        return AllStudentsFeeStatusResponse.builder()
                .month(month).year(year).totalStudents(records.size())
                .paidCount(paid).pendingCount(pending).partialCount(partial)
                .totalFeeExpected(totalExpected).totalCollected(totalCollected).totalBalance(totalBalance)
                .students(students)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // MONTHLY COLLECTION
    // ═══════════════════════════════════════════════════════════════════
    public FeeCollectionResponse getMonthlyCollection(Integer month, Integer year) {

        List<FeeRecord> records = feeRecordRepository.findByFeeMonthAndFeeYear(month, year);

        return FeeCollectionResponse.builder()
                .period(String.format("%02d/%d", month, year))
                .totalStudents(records.size())
                .paidCount((int) records.stream().filter(r -> "PAID".equals(r.getPaymentStatus())).count())
                .pendingCount((int) records.stream().filter(r -> "PENDING".equals(r.getPaymentStatus())).count())
                .partialCount((int) records.stream().filter(r -> "PARTIAL".equals(r.getPaymentStatus())).count())
                .totalFeeExpected(feeRecordRepository.sumFinalFeeByMonth(month, year))
                .totalCollected(feeRecordRepository.sumPaidAmountByMonth(month, year))
                .totalBalance(feeRecordRepository.sumBalanceByMonth(month, year))
                .cashCollected(feeRecordRepository.sumPaidAmountByMonthAndMode(month, year, "CASH"))
                .onlineCollected(feeRecordRepository.sumPaidAmountByMonthAndMode(month, year, "ONLINE"))
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    // DATE RANGE COLLECTION
    // ═══════════════════════════════════════════════════════════════════
    public FeeCollectionResponse getCollectionByDateRange(LocalDate startDate, LocalDate endDate) {

        if (startDate.isAfter(endDate)) throw new InvalidRequestException("startDate must be before endDate");

        List<FeeRecord> records = feeRecordRepository.findByPaymentDateBetween(startDate, endDate);

        return FeeCollectionResponse.builder()
                .period(startDate + " to " + endDate)
                .totalStudents(records.size())
                .paidCount((int) records.stream().filter(r -> "PAID".equals(r.getPaymentStatus())).count())
                .pendingCount((int) records.stream().filter(r -> "PENDING".equals(r.getPaymentStatus())).count())
                .partialCount((int) records.stream().filter(r -> "PARTIAL".equals(r.getPaymentStatus())).count())
                .totalFeeExpected(feeRecordRepository.sumFinalFeeByDateRange(startDate, endDate))
                .totalCollected(feeRecordRepository.sumPaidAmountByDateRange(startDate, endDate))
                .totalBalance(feeRecordRepository.sumBalanceByDateRange(startDate, endDate))
                .cashCollected(feeRecordRepository.sumPaidAmountByDateRangeAndMode(startDate, endDate, "CASH"))
                .onlineCollected(feeRecordRepository.sumPaidAmountByDateRangeAndMode(startDate, endDate, "ONLINE"))
                .build();
    }

    private String generateReceiptNumber(Integer month, Integer year) {
        long count = feeRecordRepository.countReceiptsByMonthAndYear(month, year);
        return String.format("REC-%d-%02d-%03d", year, month, count + 1);
    }
}