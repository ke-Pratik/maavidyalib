package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatAllotResponse {

    private String message;
    private Long bookingId;
    private int seatNo;
    private String zone;
    private Long regNo;
    private String studentName;
    private String gender;
    private String timeSlot;
    private String bookingDate;
}