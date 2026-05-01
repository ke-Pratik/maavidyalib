package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRegisterResponse {

    private String message;
    private Long regNo;
    private String name;
    private String gender;
    private String dateOfAdmission;
    private String inTime;
    private String outTime;
}