package com.company.sentinel.adapter.in.scheduling;

import com.company.sentinel.domain.model.Observation;
import com.company.sentinel.domain.model.ObservationCode;
import com.company.sentinel.domain.model.ValueQuantity;
import com.company.sentinel.domain.ports.in.LabResultInPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
public class IngestionAdapter {

    private static final Logger log = LoggerFactory.getLogger(IngestionAdapter.class);

    private static final List<String> PATIENT_IDS =
            List.of("Patient/101", "Patient/102", "Patient/103", "Patient/104", "Patient/105");

    private static final double MIN_GLUCOSE = 20.0;
    private static final double MAX_GLUCOSE = 500.0;

    private final Random random = new Random();
    private final LabResultInPort labResultInPort;

    public IngestionAdapter(LabResultInPort labResultInPort) {
        this.labResultInPort = labResultInPort;
    }

    @Scheduled(fixedDelayString = "${sentinel.ingestion.interval-ms:5000}")
    public void ingest() {
        String patientRef = PATIENT_IDS.get(random.nextInt(PATIENT_IDS.size()));
        double glucoseValue = MIN_GLUCOSE + random.nextDouble() * (MAX_GLUCOSE - MIN_GLUCOSE);
        glucoseValue = Math.round(glucoseValue * 10.0) / 10.0;

        Observation obs = new Observation(
                patientRef,
                ObservationCode.glucose(),
                new ValueQuantity(glucoseValue, "mg/dL")
        );

        Observation processed = labResultInPort.processLabResult(obs);
        log.info("Ingested {} glucose={} mg/dL interpretation={}",
                patientRef, glucoseValue, processed.getInterpretation());
    }
}
