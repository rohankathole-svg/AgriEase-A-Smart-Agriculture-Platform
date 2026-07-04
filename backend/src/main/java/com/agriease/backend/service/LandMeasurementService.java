package com.agriease.backend.service;

import com.agriease.backend.dto.GeoPointDto;
import com.agriease.backend.dto.LandMeasurementRequest;
import com.agriease.backend.dto.LandMeasurementResponse;
import com.agriease.backend.entity.LandMeasurementRecord;
import com.agriease.backend.entity.User;
import com.agriease.backend.exception.BadRequestException;
import com.agriease.backend.exception.ResourceNotFoundException;
import com.agriease.backend.repository.LandMeasurementRecordRepository;
import com.agriease.backend.repository.UserRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LandMeasurementService {

    private static final double EARTH_RADIUS_M = 6378137.0;
    private static final double SQM_TO_ACRE = 0.00024710538146717;

    private final UserRepository userRepository;
    private final LandMeasurementRecordRepository landMeasurementRecordRepository;

    public LandMeasurementService(UserRepository userRepository,
                                  LandMeasurementRecordRepository landMeasurementRecordRepository) {
        this.userRepository = userRepository;
        this.landMeasurementRecordRepository = landMeasurementRecordRepository;
    }

    public LandMeasurementResponse saveMeasurement(String email, LandMeasurementRequest request) {
        if (request == null || request.getPoints() == null || request.getPoints().size() < 4) {
            throw new BadRequestException("At least 4 points are required to measure land area");
        }
        validatePoints(request.getPoints());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        double areaSqm = calculateAreaSquareMeters(request.getPoints());
        double areaAcres = round(areaSqm * SQM_TO_ACRE);

        LandMeasurementRecord record = new LandMeasurementRecord();
        record.setUser(user);
        record.setPointsJson(writeJson(request.getPoints()));
        record.setPointCount(request.getPoints().size());
        record.setAreaSquareMeters(round(areaSqm));
        record.setAreaAcres(areaAcres);
        record.setLocationLabel(request.getLocationLabel());

        LandMeasurementRecord saved = landMeasurementRecordRepository.save(record);
        return toResponse(saved);
    }

    public List<LandMeasurementResponse> getHistory(String email) {
        return landMeasurementRecordRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validatePoints(List<GeoPointDto> points) {
        points.forEach(point -> {
            if (point.getLatitude() == null || point.getLongitude() == null) {
                throw new BadRequestException("Each point must include latitude and longitude");
            }
        });
    }

    private double calculateAreaSquareMeters(List<GeoPointDto> points) {
        double avgLatRad = points.stream()
                .mapToDouble(point -> Math.toRadians(point.getLatitude()))
                .average()
                .orElse(0.0);

        int n = points.size();
        double[] x = new double[n];
        double[] y = new double[n];

        for (int i = 0; i < n; i++) {
            GeoPointDto point = points.get(i);
            double latRad = Math.toRadians(point.getLatitude());
            double lonRad = Math.toRadians(point.getLongitude());
            x[i] = EARTH_RADIUS_M * lonRad * Math.cos(avgLatRad);
            y[i] = EARTH_RADIUS_M * latRad;
        }

        double area = 0.0;
        for (int i = 0; i < n; i++) {
            int next = (i + 1) % n;
            area += x[i] * y[next] - x[next] * y[i];
        }

        return Math.abs(area) / 2.0;
    }

    private LandMeasurementResponse toResponse(LandMeasurementRecord record) {
        LandMeasurementResponse response = new LandMeasurementResponse();
        response.setId(record.getId());
        response.setLocationLabel(record.getLocationLabel());
        response.setPointCount(record.getPointCount());
        response.setAreaSquareMeters(record.getAreaSquareMeters());
        response.setAreaAcres(record.getAreaAcres());
        response.setCreatedAt(record.getCreatedAt());
        return response;
    }

    private String writeJson(Object object) {
        if (!(object instanceof List<?> list)) {
            throw new BadRequestException("Unable to process land points payload");
        }
        JSONArray array = new JSONArray();
        list.forEach(item -> {
            GeoPointDto point = (GeoPointDto) item;
            JSONObject json = new JSONObject();
            json.put("latitude", point.getLatitude());
            json.put("longitude", point.getLongitude());
            array.put(json);
        });
        return array.toString();
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
