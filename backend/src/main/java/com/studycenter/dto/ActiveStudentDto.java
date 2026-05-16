package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiveStudentDto {

    private Long regNo;
    private String name;
    private String gender;
    private String mobile;
    private Integer seatNo;
    private String timeSlot;
    private String feeStatus;
    private String dateOfAdmission;
}
