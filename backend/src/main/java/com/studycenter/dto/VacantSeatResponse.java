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
public class VacantSeatResponse {

    private String gender;
    private String requestedSlot;
    private int totalVacant;
    private List<VacantSeat> vacantSeats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VacantSeat {
        private int seatNo;
        private String zone;
    }
}