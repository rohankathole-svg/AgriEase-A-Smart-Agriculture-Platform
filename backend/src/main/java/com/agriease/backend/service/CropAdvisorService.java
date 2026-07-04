package com.agriease.backend.service;

import com.agriease.backend.dto.CropAdvisorRequest;
import com.agriease.backend.dto.CropAdvisorResponse;
import com.agriease.backend.dto.CropSuitabilityDto;
import com.agriease.backend.entity.CropRecommendationRecord;
import com.agriease.backend.entity.User;
import com.agriease.backend.exception.BadRequestException;
import com.agriease.backend.exception.ResourceNotFoundException;
import com.agriease.backend.repository.CropRecommendationRecordRepository;
import com.agriease.backend.repository.UserRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class CropAdvisorService {

    private final UserRepository userRepository;
    private final CropRecommendationRecordRepository recommendationRecordRepository;
    private final WeatherGatewayService weatherGatewayService;

    private static final List<CropProfile> CROP_PROFILES = List.of(
            new CropProfile("Rice", 24.0, 34.0, 60.0, 90.0),
            new CropProfile("Wheat", 15.0, 25.0, 35.0, 60.0),
            new CropProfile("Maize", 18.0, 32.0, 40.0, 70.0),
            new CropProfile("Cotton", 21.0, 33.0, 35.0, 60.0),
            new CropProfile("Sugarcane", 20.0, 35.0, 50.0, 85.0),
            new CropProfile("Groundnut", 20.0, 30.0, 45.0, 65.0),
            new CropProfile("Soybean", 20.0, 30.0, 45.0, 70.0),
            new CropProfile("Tomato", 18.0, 30.0, 45.0, 75.0),
            new CropProfile("Onion", 13.0, 27.0, 40.0, 65.0),
            new CropProfile("Chilli", 20.0, 32.0, 45.0, 70.0)
    );

    public CropAdvisorService(UserRepository userRepository,
                              CropRecommendationRecordRepository recommendationRecordRepository,
                              WeatherGatewayService weatherGatewayService) {
        this.userRepository = userRepository;
        this.recommendationRecordRepository = recommendationRecordRepository;
        this.weatherGatewayService = weatherGatewayService;
    }

    public CropAdvisorResponse generateRecommendations(String userEmail, CropAdvisorRequest request) {
        if (request == null || request.getLocation() == null || request.getLocation().isBlank()) {
            throw new BadRequestException("Location is required");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        WeatherGatewayService.WeatherSnapshot weather = weatherGatewayService.fetchCurrentWeatherByLocation(request.getLocation());
        List<CropSuitabilityDto> recommendations = buildRecommendations(weather.getTemperature(), weather.getHumidity());

        CropRecommendationRecord record = new CropRecommendationRecord();
        record.setUser(user);
        record.setLocation(weather.getLocation());
        record.setLatitude(weather.getLatitude());
        record.setLongitude(weather.getLongitude());
        record.setTemperatureCelsius(weather.getTemperature());
        record.setHumidityPercentage(weather.getHumidity());
        record.setWeatherSource(weather.getSource());
        record.setRecommendationsJson(writeJson(recommendations));

        CropRecommendationRecord saved = recommendationRecordRepository.save(record);
        return toResponse(saved, recommendations);
    }

    public List<CropAdvisorResponse> getHistory(String userEmail) {
        return recommendationRecordRepository.findTop20ByUserEmailOrderByCreatedAtDesc(userEmail)
                .stream()
                .map(record -> toResponse(record, readRecommendationList(record.getRecommendationsJson())))
                .toList();
    }

    private List<CropSuitabilityDto> buildRecommendations(double temperature, double humidity) {
        return CROP_PROFILES.stream()
                .map(profile -> scoreCrop(profile, temperature, humidity))
                .sorted(Comparator.comparingDouble(CropSuitabilityDto::getSuitabilityPercentage).reversed())
                .limit(6)
                .toList();
    }

    private CropSuitabilityDto scoreCrop(CropProfile profile, double temperature, double humidity) {
        double tempScore = computeRangeScore(temperature, profile.minTemp(), profile.maxTemp());
        double humidityScore = computeRangeScore(humidity, profile.minHumidity(), profile.maxHumidity());
        double finalScore = Math.round((0.65 * tempScore + 0.35 * humidityScore) * 10.0) / 10.0;
        String reason = String.format("Temp %.1fC, humidity %.1f%% matched against ideal %.0f-%.0fC and %.0f-%.0f%%",
                temperature, humidity, profile.minTemp(), profile.maxTemp(), profile.minHumidity(), profile.maxHumidity());
        return new CropSuitabilityDto(profile.name(), finalScore, reason);
    }

    private double computeRangeScore(double value, double min, double max) {
        if (value >= min && value <= max) {
            return 95.0;
        }
        double mid = (min + max) / 2.0;
        double span = Math.max((max - min) / 2.0, 1.0);
        double penalty = Math.abs(value - mid) * (35.0 / span);
        return Math.max(20.0, Math.min(94.0, 94.0 - penalty));
    }

    private CropAdvisorResponse toResponse(CropRecommendationRecord record, List<CropSuitabilityDto> recommendations) {
        CropAdvisorResponse response = new CropAdvisorResponse();
        response.setRecordId(record.getId());
        response.setLocation(record.getLocation());
        response.setLatitude(record.getLatitude());
        response.setLongitude(record.getLongitude());
        response.setTemperatureCelsius(record.getTemperatureCelsius());
        response.setHumidityPercentage(record.getHumidityPercentage());
        response.setWeatherSource(record.getWeatherSource());
        response.setCreatedAt(record.getCreatedAt());
        response.setRecommendations(recommendations);
        return response;
    }

    private String writeJson(Object payload) {
        if (!(payload instanceof List<?> list)) {
            throw new BadRequestException("Unable to process recommendation payload");
        }
        JSONArray array = new JSONArray();
        list.forEach(item -> {
            CropSuitabilityDto dto = (CropSuitabilityDto) item;
            JSONObject json = new JSONObject();
            json.put("cropName", dto.getCropName());
            json.put("suitabilityPercentage", dto.getSuitabilityPercentage());
            json.put("reason", dto.getReason());
            array.put(json);
        });
        return array.toString();
    }

    private List<CropSuitabilityDto> readRecommendationList(String json) {
        try {
            JSONArray array = new JSONArray(json);
            return array.toList().stream().map(item -> {
                JSONObject obj = new JSONObject((java.util.Map<?, ?>) item);
                return new CropSuitabilityDto(
                        obj.optString("cropName", ""),
                        obj.optDouble("suitabilityPercentage", 0.0),
                        obj.optString("reason", "")
                );
            }).toList();
        } catch (Exception e) {
            throw new BadRequestException("Unable to parse saved recommendation payload");
        }
    }

    private record CropProfile(String name, double minTemp, double maxTemp, double minHumidity, double maxHumidity) {
    }
}
