package com.OpenStore.user.health.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthcheck() {
        return ResponseEntity.ok(Map.of("service", "user-service", "status", "ok"));
    }
}
