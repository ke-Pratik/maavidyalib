package com.studycenter;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class StudycenterApplication {

	// Force the whole JVM to Indian Standard Time so LocalDate.now()
	// stores the correct calendar date even when the server runs in UTC.
	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
	}

	public static void main(String[] args) {
		SpringApplication.run(StudycenterApplication.class, args);
	}

}
