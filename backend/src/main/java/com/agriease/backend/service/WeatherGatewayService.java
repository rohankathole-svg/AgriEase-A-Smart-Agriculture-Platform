package com.agriease.backend.service;

import com.agriease.backend.exception.BadRequestException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class WeatherGatewayService {

    private static final String WEATHER_URL = "https://api.weatherapi.com/v1/current.json";

    @Value("${weather.api.key}")
    private String weatherApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherSnapshot fetchCurrentWeatherByLocation(String location) {
        if (location == null || location.isBlank()) {
            throw new BadRequestException("Location is required");
        }

        String weatherUrl = UriComponentsBuilder.fromUriString(WEATHER_URL)
                .queryParam("key", weatherApiKey)
                .queryParam("q", location)
                .toUriString();

        String weatherResponse = restTemplate.getForObject(weatherUrl, String.class);
        JSONObject weatherJson = new JSONObject(weatherResponse == null ? "{}" : weatherResponse);
        JSONObject current = weatherJson.optJSONObject("current");
        JSONObject weatherLocation = weatherJson.optJSONObject("location");
        if (current == null) {
            throw new BadRequestException("Unable to fetch weather for location: " + location);
        }

        double temperature = current.getDouble("temp_c");
        double humidity = current.getDouble("humidity");
        double latitude = weatherLocation != null ? weatherLocation.optDouble("lat", 0.0) : 0.0;
        double longitude = weatherLocation != null ? weatherLocation.optDouble("lon", 0.0) : 0.0;
        String resolvedName = weatherLocation != null ? weatherLocation.optString("name", location) : location;

        return new WeatherSnapshot(resolvedName, latitude, longitude, temperature, humidity, "WEATHER_API");
    }

    public static class WeatherSnapshot {
        private final String location;
        private final double latitude;
        private final double longitude;
        private final double temperature;
        private final double humidity;
        private final String source;

        public WeatherSnapshot(String location, double latitude, double longitude, double temperature, double humidity, String source) {
            this.location = location;
            this.latitude = latitude;
            this.longitude = longitude;
            this.temperature = temperature;
            this.humidity = humidity;
            this.source = source;
        }

        public String getLocation() {
            return location;
        }

        public double getLatitude() {
            return latitude;
        }

        public double getLongitude() {
            return longitude;
        }

        public double getTemperature() {
            return temperature;
        }

        public double getHumidity() {
            return humidity;
        }

        public String getSource() {
            return source;
        }
    }
}
