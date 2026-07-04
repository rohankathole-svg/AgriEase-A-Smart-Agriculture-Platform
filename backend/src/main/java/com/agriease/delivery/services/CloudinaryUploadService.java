package com.agriease.delivery.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryUploadService {

    private final RestTemplate restTemplate;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.upload-preset:}")
    private String uploadPreset;

    public CloudinaryUploadService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String uploadProof(MultipartFile file) {
        if (cloudName == null || cloudName.isBlank() || uploadPreset == null || uploadPreset.isBlank()) {
            throw new RuntimeException("Cloudinary is not configured. Set cloudinary.cloud-name and cloudinary.upload-preset.");
        }

        String endpoint = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("upload_preset", uploadPreset);
        body.add("file", asResource(file));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
        Object secureUrl = response.getBody() == null ? null : response.getBody().get("secure_url");
        if (secureUrl == null) {
            throw new RuntimeException("Cloudinary upload failed");
        }
        return secureUrl.toString();
    }

    private ByteArrayResource asResource(MultipartFile file) {
        try {
            return new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
        } catch (IOException e) {
            throw new RuntimeException("Unable to read uploaded file", e);
        }
    }
}

