package com.studycenter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDetailResponse {

    private Long regNo;
    private String name;
    private String fatherName;
    private String gender;
    private String mobile;
    private String address;
    private String aadhaarNo;
    private String dateOfAdmission;
    private String inTime;
    private String outTime;
    private Boolean isActive;
    private String deactivationDate;
    private String remarks;
}