package com.company.sentinel.application;

import com.company.sentinel.domain.model.Observation;
import org.springframework.stereotype.Service;

@Service
public class DataMaskingService {

    private static final String MASKED_SUBJECT = "Patient/REDACTED";

    public Observation mask(Observation original) {
        Observation masked = new Observation(
                original.getId(),
                MASKED_SUBJECT,
                original.getCode(),
                original.getValueQuantity(),
                original.getInterpretation(),
                original.getEffectiveDateTime()
        );
        masked.maskPii();
        return masked;
    }
}
