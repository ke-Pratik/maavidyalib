package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentBookingsResponse {

    private Long regNo;
    private String studentName;
    private String gender;
    private Boolean isActive;
    private int totalBookings;
    private List<StudentBookingDetail> bookings;
}