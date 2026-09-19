-- =============================================================================
-- AGRI CRAFT-AI — PostgreSQL Database Schema
-- "Right Crop. Right Time. Right Action. Right Support."
-- =============================================================================

-- Drop existing tables in reverse dependency order if resetting
DROP TABLE IF EXISTS scheme_matches CASCADE;
DROP TABLE IF EXISTS government_schemes CASCADE;
DROP TABLE IF EXISTS loan_recommendations CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Table: farmers
-- Stores core farmer profile details, location, and land characteristics.
-- -----------------------------------------------------------------------------
CREATE TABLE farmers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    location VARCHAR(255),
    land_area NUMERIC(10, 2),
    land_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups by phone and location
CREATE INDEX idx_farmers_phone ON farmers(phone);
CREATE INDEX idx_farmers_location ON farmers(location);

-- -----------------------------------------------------------------------------
-- 2. Table: crops
-- Stores crops registered or actively cultivated by farmers.
-- -----------------------------------------------------------------------------
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_name VARCHAR(255) NOT NULL,
    season VARCHAR(100),
    area NUMERIC(10, 2),
    sowing_date DATE,
    expected_harvest_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX idx_crops_crop_name ON crops(crop_name);

-- -----------------------------------------------------------------------------
-- 3. Table: market_prices
-- Stores daily and historical Mandi market rates from official sources (Agmarknet/e-NAM).
-- -----------------------------------------------------------------------------
CREATE TABLE market_prices (
    id SERIAL PRIMARY KEY,
    crop_name VARCHAR(255) NOT NULL,
    market_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    price NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price_date DATE NOT NULL,
    source VARCHAR(255) DEFAULT 'Agmarknet / Government of India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_prices_crop_name ON market_prices(crop_name);
CREATE INDEX idx_market_prices_location ON market_prices(location);
CREATE INDEX idx_market_prices_price_date ON market_prices(price_date);

-- -----------------------------------------------------------------------------
-- 4. Table: loans
-- Stores agricultural credit products and formal bank loan schemes.
-- -----------------------------------------------------------------------------
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    farmer_id INT REFERENCES farmers(id) ON DELETE SET NULL,
    loan_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    interest_rate VARCHAR(100),
    maximum_amount VARCHAR(100),
    tenure VARCHAR(100),
    eligibility TEXT,
    application_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_farmer_id ON loans(farmer_id);

-- -----------------------------------------------------------------------------
-- 5. Table: loan_recommendations
-- Stores computed multi-factor loan match scores (0-100) and evaluation reasoning.
-- NOTE: Matching score is informational and does NOT guarantee bank approval.
-- -----------------------------------------------------------------------------
CREATE TABLE loan_recommendations (
    id SERIAL PRIMARY KEY,
    farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    cibil_score NUMERIC(5, 2),
    existing_loan_status VARCHAR(100),
    repayment_capacity NUMERIC(5, 2),
    land_crop_score NUMERIC(5, 2),
    location_score NUMERIC(5, 2),
    total_match_score NUMERIC(5, 2) NOT NULL,
    recommendation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loan_rec_farmer_id ON loan_recommendations(farmer_id);

-- -----------------------------------------------------------------------------
-- 6. Table: government_schemes
-- Master catalog of central and state agricultural support schemes.
-- -----------------------------------------------------------------------------
CREATE TABLE government_schemes (
    id SERIAL PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility TEXT,
    benefits TEXT,
    required_documents TEXT,
    official_url VARCHAR(500),
    state VARCHAR(100) DEFAULT 'All India',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schemes_state ON government_schemes(state);

-- -----------------------------------------------------------------------------
-- 7. Table: scheme_matches
-- Records personalized scheme matching assessments for individual farmers.
-- -----------------------------------------------------------------------------
CREATE TABLE scheme_matches (
    id SERIAL PRIMARY KEY,
    farmer_id INT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    scheme_id INT NOT NULL REFERENCES government_schemes(id) ON DELETE CASCADE,
    eligibility_status VARCHAR(50) NOT NULL, -- 'ELIGIBLE', 'POTENTIALLY_ELIGIBLE', 'INELIGIBLE'
    match_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheme_matches_farmer_id ON scheme_matches(farmer_id);
CREATE INDEX idx_scheme_matches_scheme_id ON scheme_matches(scheme_id);

-- -----------------------------------------------------------------------------
-- Trigger: Update updated_at column automatically on record update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_farmers
    BEFORE UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_government_schemes
    BEFORE UPDATE ON government_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
