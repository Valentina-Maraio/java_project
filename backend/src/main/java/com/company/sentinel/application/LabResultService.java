package com.company.sentinel.application;

import com.company.sentinel.domain.model.Observation;
import com.company.sentinel.domain.model.InterpretationCode;
import com.company.sentinel.domain.ports.in.LabResultInPort;
import com.company.sentinel.domain.ports.out.LabResultRepositoryPort;
import com.company.sentinel.domain.ports.out.NotificationPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LabResultService implements LabResultInPort {

    private static final double CRITICAL_LOW_GLUCOSE  = 50.0;
    private static final double CRITICAL_HIGH_GLUCOSE = 400.0;
    private static final double LOW_GLUCOSE           = 70.0;
    private static final double HIGH_GLUCOSE          = 200.0;

    private final LabResultRepositoryPort repository;
    private final NotificationPort notificationPort;

    public LabResultService(LabResultRepositoryPort repository, NotificationPort notificationPort) {
        this.repository = repository;
        this.notificationPort = notificationPort;
    }

    @Override
    @Transactional
    public Observation processLabResult(Observation observation) {
        validate(observation);
        repository.save(observation);
        notificationPort.notifyObservation(observation);
        return observation;
    }

    private void validate(Observation obs) {
        double value = obs.getValueQuantity().value();
        InterpretationCode code;

        if (value < CRITICAL_LOW_GLUCOSE) {
            code = InterpretationCode.LL;
        } else if (value < LOW_GLUCOSE) {
            code = InterpretationCode.L;
        } else if (value > CRITICAL_HIGH_GLUCOSE) {
            code = InterpretationCode.HH;
        } else if (value > HIGH_GLUCOSE) {
            code = InterpretationCode.H;
        } else {
            code = InterpretationCode.N;
        }

        obs.setInterpretation(code);
    }
}
