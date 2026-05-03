package com.company.sentinel.domain.model;

public record ObservationCode(String system, String code, String display) {

    public static ObservationCode glucose() {
        return new ObservationCode("http://loinc.org", "2339-0", "Glucose");
    }
}
