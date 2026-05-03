package com.company.sentinel.domain.model;

public enum InterpretationCode {
    LL("Critical Low"),
    L("Low"),
    N("Normal"),
    H("High"),
    HH("Critical High");

    private final String display;

    InterpretationCode(String display) {
        this.display = display;
    }

    public String getDisplay() {
        return display;
    }
}
