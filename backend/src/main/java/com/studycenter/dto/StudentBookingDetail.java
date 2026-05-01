package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentBookingDetail {

    private Long bookingId;
    private int seatNo;
    private String zone;
    private String timeSlot;
    private String bookingDate;
}