package com.studycenter.config;

import org.springframework.stereotype.Component;

@Component
public class SeatConfig {

    private static final int TOTAL_SEATS = 65;
    private static final int BOYS_START = 1;
    private static final int BOYS_END = 25;
    private static final int GIRLS_START = 26;
    private static final int GIRLS_END = 40;
    private static final int COMMON_START = 41;
    private static final int COMMON_END = 65;

    public int getTotalSeats() {
        return TOTAL_SEATS;
    }

    public String getZoneLabel(int seatNo) {
        if (seatNo >= BOYS_START && seatNo <= BOYS_END) return "BOYS_ONLY";
        if (seatNo >= GIRLS_START && seatNo <= GIRLS_END) return "GIRLS_ONLY";
        if (seatNo >= COMMON_START && seatNo <= COMMON_END) return "COMMON";
        return "UNKNOWN";
    }

    public boolean isGenderAllowedOnSeat(int seatNo, String gender) {
        String zone = getZoneLabel(seatNo);
        if ("COMMON".equals(zone)) return true;
        if ("BOYS_ONLY".equals(zone) && "Male".equalsIgnoreCase(gender)) return true;
        if ("GIRLS_ONLY".equals(zone) && "Female".equalsIgnoreCase(gender)) return true;
        return false;
    }
}