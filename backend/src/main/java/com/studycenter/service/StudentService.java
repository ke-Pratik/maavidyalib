package com.studycenter.service;

import com.studycenter.dto.ActiveStudentDto;
import com.studycenter.dto.ActiveStudentsPageResponse;
import com.studycenter.dto.DeactivateReactivateRequest;
import com.studycenter.dto.DeactivateReactivateResponse;
import com.studycenter.dto.FeeCalculateResponse;
import com.studycenter.dto.FeeLockRequest;
import com.studycenter.dto.StudentDetailResponse;
import com.studycenter.dto.StudentEditRequest;
import com.studycenter.dto.StudentEditResponse;
import com.studycenter.dto.StudentRegisterRequest;
import com.studycenter.dto.StudentRegisterResponse;
import com.studycenter.dto.StudentSummaryResponse;
import com.studycenter.entity.FeeRecord;
import com.studycenter.entity.FeeStructure;
import com.studycenter.entity.SeatBooking;
import com.studycenter.entity.Student;
import com.studycenter.entity.StudentFeeConfig;
import com.studycenter.exception.InvalidRequestException;
import com.studycenter.exception.StudentNotFoundException;
import com.studycenter.repository.ActiveStudentProjection;
import com.studycenter.repository.FeeRecordRepository;
import com.studycenter.repository.FeeStructureRepository;
import com.studycenter.repository.SeatBookingRepository;
import com.studycenter.repository.StudentFeeConfigRepository;
import com.studycenter.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
public class StudentService {

    private final StudentRepository          studentRepository;
    private final SeatBookingRepository      seatBookingRepository;
    private final FeeService                 feeService;
    private final FeeRecordRepository        feeRecordRepository;
    private final StudentFeeConfigRepository feeConfigRepository;
    private final FeeStructureRepository     feeStructureRepository;

    private static final DateTimeFormatter TIME_FMT    = DateTimeFormatter.ofPattern("HH:mm");
    private static final int               TOTAL_SEATS = 65;

    // ═══════════════════════════════════════════════════════════════
    // REGISTER STUDENT (unchanged)
    // ═══════════════════════════════════════════════════════════════
    @Transactional
    public StudentRegisterResponse registerStudent(StudentRegisterRequest request) {

        log.info("Registering: regNo={}, name={}", request.getRegNo(), request.getName());

        if (studentRepository.existsById(request.getRegNo()))
            throw new InvalidRequestException("Student with regNo " + request.getRegNo() + " already exists.");
        if (studentRepository.existsByAadhaarNo(request.getAadhaarNo()))
            throw new InvalidRequestException("Aadhaar " + request.getAadhaarNo() + " is already registered.");

        LocalDate admissionDate = LocalDate.parse(request.getDateOfAdmission());
        if (request.getInTime() == null || request.getInTime().isEmpty())
            throw new InvalidRequestException("inTime is required");
        if (request.getOutTime() == null || request.getOutTime().isEmpty())
            throw new InvalidRequestException("outTime is required");

        LocalTime inTime  = LocalTime.parse(request.getInTime());
        LocalTime outTime = LocalTime.parse(request.getOutTime());

        if (!inTime.isBefore(outTime))
            throw new InvalidRequestException("inTime must be before outTime");

        Student student = Student.builder()
                .regNo(request.getRegNo())
                .name(request.getName())
                .fatherName(request.getFatherName())
                .aadhaarNo(request.getAadhaarNo())
                .gender(request.getGender())
                .address(request.getAddress())
                .mobile(request.getMobile())
                .dateOfAdmission(admissionDate)
                .inTime(inTime)
                .outTime(outTime)
                .isActive(true)
                .build();

        studentRepository.save(student);
        log.info("Student registered: regNo={}", request.getRegNo());

        FeeLockRequest feeLockRequest = FeeLockRequest.builder()
                .regNo(request.getRegNo())
                .inTime(request.getInTime())
                .outTime(request.getOutTime())
                .joiningDate(admissionDate)
                .admissionFee(request.getAdmissionFee()    != null ? request.getAdmissionFee()    : BigDecimal.ZERO)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .remarks(request.getRemarks())
                .build();

        FeeCalculateResponse feeResult = feeService.lockFee(feeLockRequest);
        log.info("Fee auto-locked: feeId={}, finalFee={}", feeResult.getFeeId(), feeResult.getFinalFee());

        return StudentRegisterResponse.builder()
                .message("Student registered and fee locked successfully!")
                .regNo(request.getRegNo())
                .name(request.getName())
                .gender(request.getGender())
                .dateOfAdmission(request.getDateOfAdmission())
                .inTime(inTime.format(TIME_FMT))
                .outTime(outTime.format(TIME_FMT))
                .feeId(feeResult.getFeeId())
                .timeSlot(feeResult.getTimeSlot())
                .monthlyFee(feeResult.getMonthlyFee())
                .proratedFee(feeResult.getProratedFee())
                .admissionFee(feeResult.getAdmissionFee())
                .discountAmount(feeResult.getDiscountAmount())
                .finalFee(feeResult.getFinalFee())
                .feeMonth(feeResult.getFeeMonth())
                .feeYear(feeResult.getFeeYear())
                .nextMonthFee(feeResult.getNextMonthFee())
                .nextMonthMessage(feeResult.getNextMonthMessage())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // DEACTIVATE (unchanged)
    // ═══════════════════════════════════════════════════════════════
    @Transactional
    public DeactivateReactivateResponse deactivateStudent(DeactivateReactivateRequest request) {

        log.info("Deactivating: regNo={}", request.getRegNo());

        Student student = studentRepository.findById(request.getRegNo())
                .orElseThrow(() -> new StudentNotFoundException("Student " + request.getRegNo() + " not found."));

        if (!student.getIsActive())
            throw new InvalidRequestException("Student " + request.getRegNo() + " is already inactive.");

        student.setIsActive(false);
        student.setDeactivationDate(LocalDate.now());
        student.setRemarks(request.getRemarks());
        studentRepository.save(student);

        long cancelled = seatBookingRepository.countByRegNo(request.getRegNo());
        seatBookingRepository.deleteByRegNo(request.getRegNo());

        log.info("Deactivated: regNo={}, bookingsCancelled={}", request.getRegNo(), cancelled);

        return DeactivateReactivateResponse.builder()
                .message("Student deactivated successfully!")
                .regNo(request.getRegNo())
                .name(student.getName())
                .isActive(false)
                .deactivationDate(LocalDate.now().toString())
                .remarks(request.getRemarks())
                .bookingsCancelled((int) cancelled)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // REACTIVATE (unchanged)
    // ═══════════════════════════════════════════════════════════════
    @Transactional
    public DeactivateReactivateResponse reactivateStudent(DeactivateReactivateRequest request) {

        log.info("Reactivating: regNo={}", request.getRegNo());

        Student student = studentRepository.findById(request.getRegNo())
                .orElseThrow(() -> new StudentNotFoundException("Student " + request.getRegNo() + " not found."));

        if (student.getIsActive())
            throw new InvalidRequestException("Student " + request.getRegNo() + " is already active.");

        student.setIsActive(true);
        student.setDeactivationDate(null);
        student.setRemarks(request.getRemarks());
        studentRepository.save(student);

        return DeactivateReactivateResponse.builder()
                .message("Student reactivated successfully!")
                .regNo(request.getRegNo())
                .name(student.getName())
                .isActive(true)
                .remarks(request.getRemarks())
                .bookingsCancelled(0)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════
    // GET STUDENT BY ID — pre-fills edit form
    // ═══════════════════════════════════════════════════════════════
    public StudentDetailResponse getStudentById(Long regNo) {
        Student student = studentRepository.findById(regNo)
                .orElseThrow(() -> new StudentNotFoundException("Student " + regNo + " not found."));
        return toDetailResponse(student);
    }

    // ═══════════════════════════════════════════════════════════════
    // EDIT STUDENT
    // Case 1 — basic fields only: update student, done.
    // Case 2 — slot changed:
    //   STEP 1  gate-check (month-scoped, exclude self)
    //   STEP 2  update student fields + new slot
    //   STEP 3  capture old seat → delete all bookings
    //   STEP 4  close old FeeConfig → create new one
    //   STEP 5  recalculate current-month FeeRecord if needed
    //   AUTO    re-allot old seat if still free for new slot
    //   STEP 6  warn about previous unpaid months
    //   STEP 7  return full response
    // ═══════════════════════════════════════════════════════════════
    @Transactional
    public StudentEditResponse editStudent(Long regNo, StudentEditRequest request) {

        log.info("Editing student: regNo={}", regNo);

        // ── Validate student ───────────────────────────────────────
        Student student = studentRepository.findById(regNo)
                .orElseThrow(() -> new StudentNotFoundException("Student " + regNo + " not found."));

        if (!student.getIsActive())
            throw new InvalidRequestException("Cannot edit inactive student " + regNo + ". Reactivate first.");

        if (studentRepository.existsByAadhaarNoAndRegNoNot(request.getAadhaarNo(), regNo))
            throw new InvalidRequestException(
                    "Aadhaar " + request.getAadhaarNo() + " is already registered to another student.");

        // ── Determine if slot is actually changing ─────────────────
        boolean slotProvided = request.getInTime()  != null && !request.getInTime().isBlank()
                            && request.getOutTime() != null && !request.getOutTime().isBlank();

        LocalTime newInTime  = slotProvided ? LocalTime.parse(request.getInTime(),  TIME_FMT) : student.getInTime();
        LocalTime newOutTime = slotProvided ? LocalTime.parse(request.getOutTime(), TIME_FMT) : student.getOutTime();

        boolean slotChanged = slotProvided
                && (!newInTime.equals(student.getInTime()) || !newOutTime.equals(student.getOutTime()));

        // ── Update basic fields (always, both cases) ───────────────
        student.setName(request.getName());
        student.setFatherName(request.getFatherName());
        student.setAadhaarNo(request.getAadhaarNo());
        student.setGender(request.getGender());
        student.setAddress(request.getAddress());
        student.setMobile(request.getMobile());
        student.setRemarks(request.getRemarks());

        // ══════════════════════════════════════════════════════════
        // CASE 1 — No slot change
        // ══════════════════════════════════════════════════════════
        if (!slotChanged) {
            studentRepository.save(student);
            log.info("Student updated (basic fields only): regNo={}", regNo);

            return StudentEditResponse.builder()
                    .message("Student details updated successfully.")
                    .regNo(regNo)
                    .name(student.getName()).fatherName(student.getFatherName())
                    .aadhaarNo(student.getAadhaarNo()).gender(student.getGender())
                    .address(student.getAddress()).mobile(student.getMobile())
                    .inTime(student.getInTime()  != null ? student.getInTime().format(TIME_FMT)  : null)
                    .outTime(student.getOutTime() != null ? student.getOutTime().format(TIME_FMT) : null)
                    .dateOfAdmission(student.getDateOfAdmission() != null
                            ? student.getDateOfAdmission().toString() : null)
                    .remarks(student.getRemarks())
                    .slotChanged(false)
                    .seatBookingsCancelled(0)
                    .currentMonthFeeHandling("NOT_CHANGED")
                    .build();
        }

        // ══════════════════════════════════════════════════════════
        // CASE 2 — Slot change
        // ══════════════════════════════════════════════════════════

        if (!newInTime.isBefore(newOutTime))
            throw new InvalidRequestException("inTime must be before outTime.");

        // Declare date/time variables here — needed across multiple steps
        LocalDate today        = LocalDate.now();
        int       currentMonth = today.getMonthValue();
        int       currentYear  = today.getYear();
        YearMonth ym           = YearMonth.of(currentYear, currentMonth);
        int       totalDays    = ym.lengthOfMonth();

        // ── STEP 1: Gate check (month-scoped, exclude self) ────────
        long bookedSeats = seatBookingRepository.countBookedSeatsForSlotExcludingStudent(
                newInTime, newOutTime, regNo, currentMonth, currentYear);
        if (bookedSeats >= TOTAL_SEATS)
            throw new InvalidRequestException(
                    "No seats available in slot " + request.getInTime() + " – " + request.getOutTime()
                    + ". All " + TOTAL_SEATS + " seats are occupied.");

        // ── STEP 2: Update student with new slot ───────────────────
        student.setInTime(newInTime);
        student.setOutTime(newOutTime);
        studentRepository.save(student);
        log.info("Student slot updated: regNo={} → {}-{}", regNo, newInTime, newOutTime);

        // ── STEP 3: Capture old seat BEFORE deleting, then cancel ──
        Integer oldSeatNo = null;
        Optional<SeatBooking> oldBookingOpt = seatBookingRepository
                .findFirstByRegNoAndBookingMonthAndBookingYear(regNo, currentMonth, currentYear);
        if (oldBookingOpt.isPresent()) {
            oldSeatNo = oldBookingOpt.get().getSeatNo();
        }
        long cancelledCount = seatBookingRepository.countByRegNo(regNo);
        seatBookingRepository.deleteByRegNo(regNo);
        log.info("Seat bookings cancelled: regNo={}, count={}, oldSeat={}", regNo, cancelledCount, oldSeatNo);

        // ── STEP 4: Close old FeeConfig, create new one ────────────
        BigDecimal carriedDiscount = BigDecimal.ZERO;
        BigDecimal oldMonthlyFee   = BigDecimal.ZERO;

        Optional<StudentFeeConfig> oldConfigOpt = feeConfigRepository.findByRegNoAndEffectiveToDateIsNull(regNo);
        if (oldConfigOpt.isPresent()) {
            StudentFeeConfig oldCfg = oldConfigOpt.get();
            carriedDiscount = oldCfg.getDiscountAmount() != null ? oldCfg.getDiscountAmount() : BigDecimal.ZERO;
            oldMonthlyFee   = oldCfg.getMonthlyFee()    != null ? oldCfg.getMonthlyFee()    : BigDecimal.ZERO;
            oldCfg.setEffectiveToDate(today);
            feeConfigRepository.save(oldCfg);
            log.info("Closed old fee config: configId={}", oldCfg.getConfigId());
        }

        BigDecimal newMonthlyFee = resolveMonthlyFee(newInTime, newOutTime);

        feeConfigRepository.save(StudentFeeConfig.builder()
                .regNo(regNo)
                .inTime(newInTime).outTime(newOutTime)
                .monthlyFee(newMonthlyFee)
                .discountAmount(carriedDiscount)
                .admissionFee(BigDecimal.ZERO)
                .effectiveFromDate(today)
                .effectiveToDate(null)
                .createdAt(LocalDateTime.now())
                .build());
        log.info("New fee config saved: regNo={}, slot={}-{}, monthlyFee={}",
                regNo, newInTime, newOutTime, newMonthlyFee);

        // ── STEP 5: Handle current-month FeeRecord ─────────────────
        Optional<FeeRecord> frOpt = feeRecordRepository
                .findByRegNoAndFeeMonthAndFeeYear(regNo, currentMonth, currentYear);

        String     feeHandling  = "NO_RECORD";
        BigDecimal newFinalFee  = null;
        BigDecimal newBalance   = null;
        String     overpaidWarn = null;

        if (frOpt.isPresent()) {
            FeeRecord fr     = frOpt.get();
            String    status = fr.getPaymentStatus();

            if ("PAID".equals(status)) {
                feeHandling = "PAID_UNTOUCHED";

            } else if ("PENDING".equals(status)) {
                // No payment yet — full recalc at new rate, keep same applicable days
                int        applicableDays   = fr.getApplicableDays() != null ? fr.getApplicableDays() : totalDays;
                BigDecimal perDayFee        = newMonthlyFee.divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
                BigDecimal perDayDiscount   = carriedDiscount.divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
                BigDecimal proratedFee      = perDayFee.multiply(BigDecimal.valueOf(applicableDays)).setScale(2, RoundingMode.HALF_UP);
                BigDecimal proratedDiscount = perDayDiscount.multiply(BigDecimal.valueOf(applicableDays)).setScale(2, RoundingMode.HALF_UP);

                newFinalFee = proratedFee.subtract(proratedDiscount).setScale(2, RoundingMode.HALF_UP);
                if (newFinalFee.compareTo(BigDecimal.ZERO) < 0) newFinalFee = BigDecimal.ZERO;
                newBalance  = newFinalFee;

                fr.setInTime(newInTime);         fr.setOutTime(newOutTime);
                fr.setMonthlyFee(newMonthlyFee); fr.setProratedFee(proratedFee);
                fr.setDiscountAmount(proratedDiscount);
                fr.setFinalFee(newFinalFee);     fr.setBalanceAmount(newBalance);
                feeRecordRepository.save(fr);
                feeHandling = "RECALCULATED_PENDING";
                log.info("PENDING recalculated: regNo={}, newFinalFee={}", regNo, newFinalFee);

            } else if ("PARTIAL".equals(status)) {
                // Hybrid: old rate for days 1..(today-1), new rate for today..end-of-month
                int changeDay = today.getDayOfMonth();
                int oldDays   = changeDay - 1;
                int newDays   = totalDays - changeDay + 1;

                BigDecimal perDayOldFee   = oldMonthlyFee.divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
                BigDecimal perDayNewFee   = newMonthlyFee.divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);
                BigDecimal perDayDiscount = carriedDiscount.divide(BigDecimal.valueOf(totalDays), 6, RoundingMode.HALF_UP);

                BigDecimal oldPart = perDayOldFee.multiply(BigDecimal.valueOf(oldDays))
                        .subtract(perDayDiscount.multiply(BigDecimal.valueOf(oldDays)))
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal newPart = perDayNewFee.multiply(BigDecimal.valueOf(newDays))
                        .subtract(perDayDiscount.multiply(BigDecimal.valueOf(newDays)))
                        .setScale(2, RoundingMode.HALF_UP);

                newFinalFee = oldPart.add(newPart).setScale(2, RoundingMode.HALF_UP);
                if (newFinalFee.compareTo(BigDecimal.ZERO) < 0) newFinalFee = BigDecimal.ZERO;

                newBalance = newFinalFee.subtract(fr.getPaidAmount()).setScale(2, RoundingMode.HALF_UP);

                if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
                    BigDecimal excess = fr.getPaidAmount().subtract(newFinalFee).abs()
                            .setScale(2, RoundingMode.HALF_UP);
                    newBalance   = BigDecimal.ZERO;
                    overpaidWarn = "Student overpaid! Paid Rs." + fr.getPaidAmount()
                            + " but recalculated fee is Rs." + newFinalFee
                            + ". Excess Rs." + excess + " to be adjusted manually.";
                    fr.setPaymentStatus("PAID");
                    feeHandling = "HYBRID_RECALCULATED_OVERPAID";
                } else {
                    fr.setPaymentStatus("PARTIAL");
                    feeHandling = "HYBRID_RECALCULATED_PARTIAL";
                }

                fr.setInTime(newInTime);         fr.setOutTime(newOutTime);
                fr.setMonthlyFee(newMonthlyFee); fr.setFinalFee(newFinalFee);
                fr.setBalanceAmount(newBalance);
                feeRecordRepository.save(fr);
                log.info("PARTIAL hybrid: regNo={}, oldPart={}, newPart={}, newFee={}, newBal={}",
                        regNo, oldPart, newPart, newFinalFee, newBalance);
            }
        }

        // ── AUTO: Re-allot old seat if still free for new slot ─────
        Integer assignedSeatNo = null;
        if (oldSeatNo != null) {
            long conflicts = seatBookingRepository.countConflictsForSeat(
                    oldSeatNo, newInTime, newOutTime, regNo, currentMonth, currentYear);
            if (conflicts == 0) {
                seatBookingRepository.save(SeatBooking.builder()
                        .seatNo(oldSeatNo)
                        .regNo(regNo)
                        .gender(student.getGender())
                        .startTime(newInTime)
                        .endTime(newOutTime)
                        .bookingMonth(currentMonth)
                        .bookingYear(currentYear)
                        .bookingDate(today)
                        .build());
                assignedSeatNo = oldSeatNo;
                log.info("Old seat auto-reallotted: regNo={}, seat={}, newSlot={}-{}",
                        regNo, oldSeatNo, newInTime, newOutTime);
            } else {
                log.info("Old seat {} has conflicts in new slot — manual re-allot required", oldSeatNo);
            }
        }

        // ── STEP 6: Warn about previous unpaid months ──────────────
        List<FeeRecord> prevUnpaid = feeRecordRepository
                .findPreviousUnpaidRecords(regNo, currentMonth, currentYear);
        List<String> prevDuesWarning = prevUnpaid.stream()
                .map(f -> String.format("%02d/%d — Rs.%s balance (%s)",
                        f.getFeeMonth(), f.getFeeYear(), f.getBalanceAmount(), f.getPaymentStatus()))
                .toList();

        // ── STEP 7: Build response ─────────────────────────────────
        String msg = assignedSeatNo != null
                ? "Slot changed. Seat " + assignedSeatNo + " reallotted automatically."
                : "Slot changed. Seat bookings cancelled — please re-allot a seat.";

        return StudentEditResponse.builder()
                .message(msg)
                .regNo(regNo)
                .name(student.getName()).fatherName(student.getFatherName())
                .aadhaarNo(student.getAadhaarNo()).gender(student.getGender())
                .address(student.getAddress()).mobile(student.getMobile())
                .inTime(newInTime.format(TIME_FMT))
                .outTime(newOutTime.format(TIME_FMT))
                .dateOfAdmission(student.getDateOfAdmission() != null
                        ? student.getDateOfAdmission().toString() : null)
                .remarks(student.getRemarks())
                .slotChanged(true)
                .seatBookingsCancelled((int) cancelledCount)
                .assignedSeatNo(assignedSeatNo)
                .currentMonthFeeHandling(feeHandling)
                .newFinalFee(newFinalFee)
                .newBalanceAmount(newBalance)
                .overpaidWarning(overpaidWarn)
                .previousDuesWarning(prevDuesWarning.isEmpty() ? null : prevDuesWarning)
                .build();
    }

    // ── Resolve monthly fee: DB lookup → 4hr default → hourly fallback ─
    private BigDecimal resolveMonthlyFee(LocalTime inTime, LocalTime outTime) {
        Optional<FeeStructure> mapped = feeStructureRepository.findByInTimeAndOutTimeAndIsActiveTrue(inTime, outTime);
        if (mapped.isPresent()) return mapped.get().getFeeAmount();
        long hrs = Duration.between(inTime, outTime).toHours();
        if (hrs == 4) return new BigDecimal("500.00");
        return BigDecimal.valueOf(hrs * 100);
    }

    // ═══════════════════════════════════════════════════════════════
    // EXISTING METHODS (unchanged)
    // ═══════════════════════════════════════════════════════════════
    public List<StudentDetailResponse> getActiveStudents() {
        return studentRepository.findByIsActiveTrue().stream().map(this::toDetailResponse).toList();
    }

    public List<StudentDetailResponse> getInactiveStudents() {
        return studentRepository.findByIsActiveFalse().stream().map(this::toDetailResponse).toList();
    }

    public StudentSummaryResponse getStudentSummary() {
        long active   = studentRepository.countByIsActiveTrue();
        long inactive = studentRepository.countByIsActiveFalse();
        return StudentSummaryResponse.builder()
                .totalStudents(active + inactive)
                .activeStudents(active)
                .inactiveStudents(inactive)
                .build();
    }

    public List<StudentDetailResponse> searchStudents(String type, String value) {
        log.info("Searching students: type={}, value={}", type, value);
        if (type  == null || type.trim().isEmpty())  throw new InvalidRequestException("Search type cannot be empty.");
        if (value == null || value.trim().isEmpty()) throw new InvalidRequestException("Search value cannot be empty.");

        String searchType  = type.trim().toLowerCase();
        String searchValue = value.trim();
        List<Student> students;

        switch (searchType) {
            case "regno" -> {
                try { students = studentRepository.searchActiveByRegNo(Long.parseLong(searchValue)); }
                catch (NumberFormatException ex) { throw new InvalidRequestException("Reg No must be a valid number."); }
            }
            case "mobile" -> students = studentRepository.searchActiveByMobile(searchValue);
            case "name"   -> students = studentRepository.searchActiveByName(searchValue);
            default -> throw new InvalidRequestException("Invalid search type. Use regNo, mobile, or name.");
        }
        return students.stream().map(this::toDetailResponse).toList();
    }

    public List<StudentDetailResponse> searchByName(String name) {
        log.info("Searching: name={}", name);
        if (name == null || name.trim().isEmpty()) throw new InvalidRequestException("Search name cannot be empty.");
        return studentRepository.searchByName(name.trim()).stream().map(this::toDetailResponse).toList();
    }

    private StudentDetailResponse toDetailResponse(Student s) {
        return StudentDetailResponse.builder()
                .regNo(s.getRegNo())
                .name(s.getName()).fatherName(s.getFatherName())
                .gender(s.getGender()).mobile(s.getMobile())
                .address(s.getAddress()).aadhaarNo(s.getAadhaarNo())
                .dateOfAdmission(s.getDateOfAdmission() != null ? s.getDateOfAdmission().toString() : null)
                .inTime(s.getInTime()   != null ? s.getInTime().format(TIME_FMT)   : null)
                .outTime(s.getOutTime() != null ? s.getOutTime().format(TIME_FMT) : null)
                .isActive(s.getIsActive())
                .deactivationDate(s.getDeactivationDate() != null ? s.getDeactivationDate().toString() : null)
                .remarks(s.getRemarks())
                .build();
    }

    public ActiveStudentsPageResponse getActiveStudentsPaged(int page, int size) {
        LocalDate today   = LocalDate.now();
        Pageable  pageable = PageRequest.of(page, size);
        Page<ActiveStudentProjection> result = studentRepository
                .findActiveStudentsWithDetails(today.getMonthValue(), today.getYear(), pageable);

        return ActiveStudentsPageResponse.builder()
                .students(result.getContent().stream().map(this::mapProjectionToDto).toList())
                .page(result.getNumber()).size(result.getSize())
                .totalElements(result.getTotalElements()).totalPages(result.getTotalPages())
                .build();
    }

    private ActiveStudentDto mapProjectionToDto(ActiveStudentProjection p) {
        String timeSlot = (p.getInTime() != null && p.getOutTime() != null)
                ? p.getInTime().format(TIME_FMT) + " - " + p.getOutTime().format(TIME_FMT) : null;

        return ActiveStudentDto.builder()
                .regNo(p.getRegNo()).name(p.getName())
                .gender(p.getGender()).mobile(p.getMobile())
                .seatNo(p.getSeatNo() != null ? p.getSeatNo() : 0)
                .timeSlot(timeSlot).feeStatus(p.getFeeStatus())
                .dateOfAdmission(p.getDateOfAdmission() != null ? p.getDateOfAdmission().toString() : null)
                .build();
    }
}
