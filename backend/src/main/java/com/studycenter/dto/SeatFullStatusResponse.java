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
public class SeatFullStatusResponse {

    private int totalSeats;
    private int occupiedSeats;
    private int vacantSeats;
    private List<SeatDetail> seats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatDetail {
        private int seatNo;
        private String zone;
        private String status;
        private List<BookingInfo> bookings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingInfo {
        private Long bookingId;
        private Long regNo;
        private String studentName;
        private String gender;
        private String timeSlot;
    }
}