package com.agriease.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseCompatibilityFixes {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseCompatibilityFixes.class);

    private final JdbcTemplate jdbcTemplate;
    private final String datasourceUrl;

    public DatabaseCompatibilityFixes(
            JdbcTemplate jdbcTemplate,
            @Value("${spring.datasource.url:}") String datasourceUrl
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.datasourceUrl = datasourceUrl == null ? "" : datasourceUrl;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void relaxLegacyDeliveryAgentPasswordConstraint() {
        if (!datasourceUrl.toLowerCase().contains("postgresql")) {
            return;
        }

        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS delivery_agents ALTER COLUMN password DROP NOT NULL");
            LOGGER.info("Applied DB compatibility fix: delivery_agents.password is now nullable");
        } catch (Exception ex) {
            LOGGER.debug("DB compatibility fix skipped: {}", ex.getMessage());
        }
    }
}
