-- Smart Agriculture feature schema changes
-- Safe to run on PostgreSQL

CREATE TABLE IF NOT EXISTS crop_recommendation_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    location VARCHAR(255) NOT NULL,
    temperature_celsius DOUBLE PRECISION NOT NULL,
    humidity_percentage DOUBLE PRECISION NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    weather_source VARCHAR(32) NOT NULL,
    recommendations_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_recommendation_user_time
    ON crop_recommendation_records (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS land_measurement_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    points_json TEXT NOT NULL,
    point_count INTEGER NOT NULL,
    area_square_meters DOUBLE PRECISION NOT NULL,
    area_acres DOUBLE PRECISION NOT NULL,
    location_label VARCHAR(120),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_land_measurement_user_time
    ON land_measurement_records (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS weekly_schedule_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    crop_name VARCHAR(80) NOT NULL,
    schedule_type VARCHAR(20) NOT NULL,
    total_weeks INTEGER NOT NULL,
    land_area_acres DOUBLE PRECISION NOT NULL,
    schedule_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_schedule_user_time
    ON weekly_schedule_records (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS market_price_records (
    id BIGSERIAL PRIMARY KEY,
    crop_name VARCHAR(80) NOT NULL,
    market_name VARCHAR(120) NOT NULL,
    district VARCHAR(80),
    state VARCHAR(80),
    unit VARCHAR(40),
    min_price DOUBLE PRECISION NOT NULL,
    max_price DOUBLE PRECISION NOT NULL,
    modal_price DOUBLE PRECISION NOT NULL,
    source VARCHAR(30) NOT NULL,
    fetched_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_price_crop_time
    ON market_price_records (crop_name, fetched_at DESC);
