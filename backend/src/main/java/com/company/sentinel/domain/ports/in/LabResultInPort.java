package com.company.sentinel.domain.ports.in;

import com.company.sentinel.domain.model.Observation;

public interface LabResultInPort {
    Observation processLabResult(Observation observation);
}
