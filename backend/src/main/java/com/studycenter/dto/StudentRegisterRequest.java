package com.studycenter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRegisterRequest {

    @NotNull(message = "regNo is required")
    private Long regNo;

    @NotBlank(message = "name is required")
    private String name;

    private String fatherName;

    @NotBlank(message = "aadhaarNo is required")
    private String aadhaarNo;

    @NotBlank(message = "gender is required")
    private String gender;

    @NotBlank(message = "address is required")
    private String address;

    @NotBlank(message = "mobile is required")
    private String mobile;

    @NotBlank(message = "dateOfAdmission is required")
    private String dateOfAdmission;

    private String inTime;

    private String outTime;
}