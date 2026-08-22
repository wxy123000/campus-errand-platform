package com.campus.campuserrand.controller;

import com.campus.campuserrand.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/reverse")
    public Map<String, String> reverseGeocode(
            @RequestParam("lat") double latitude,
            @RequestParam("lon") double longitude
    ) {
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new BusinessException("Location coordinates are invalid.");
        }

        String fallback = String.format("Current location: %.5f, %.5f", latitude, longitude);
        try {
            String url = "https://nominatim.openstreetmap.org/reverse"
                    + "?format=jsonv2"
                    + "&lat=" + URLEncoder.encode(String.valueOf(latitude), StandardCharsets.UTF_8)
                    + "&lon=" + URLEncoder.encode(String.valueOf(longitude), StandardCharsets.UTF_8)
                    + "&zoom=18"
                    + "&addressdetails=1";
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("Accept", "application/json")
                    .header("User-Agent", "campus-errand-demo/1.0")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Map.of("address", fallback);
            }

            JsonNode root = objectMapper.readTree(response.body());
            String address = root.path("display_name").asText("");
            return Map.of("address", address.isBlank() ? fallback : address);
        } catch (Exception ex) {
            return Map.of("address", fallback);
        }
    }
}
