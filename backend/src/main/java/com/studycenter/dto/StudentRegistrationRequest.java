package com.studycenter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRegistrationRequest {

    @NotNull(message = "Registration number is required")
    private Long regNo;

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String fatherName;

    @NotBlank(message = "Aadhaar number is required")
    @Size(min = 12, max = 12, message = "Aadhaar must be exactly 12 digits")
    private String aadhaarNo;

    @NotBlank(message = "Gender is required")
    @Size(max = 10)
    private String gender;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Mobile number is required")
    @Size(min = 10, max = 15)
    private String mobile;

    @NotNull(message = "Date of admission is required")
    private LocalDate dateOfAdmission;
}