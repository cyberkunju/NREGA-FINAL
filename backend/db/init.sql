-- MGNREGA Database Initialization Script
-- This script creates the database schema, tables, indexes, and users

-- Create the mgnrega database (run this as postgres superuser)
-- Note: This CREATE DATABASE command should be run separately before running the rest
-- Example: psql -U postgres -c "CREATE DATABASE mgnrega;"

-- Connect to mgnrega database before running the rest of this script
-- \c mgnrega

-- ============================================
-- Create districts table
-- ============================================
CREATE TABLE IF NOT EXISTS districts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT 'India',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_district_state UNIQUE(name, state)
);

-- Create index on district name for fast lookups
CREATE INDEX IF NOT EXISTS idx_district_name ON districts(name);

-- ============================================
-- Create monthly_performance table
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_performance (
  id SERIAL PRIMARY KEY,
  district_name VARCHAR(100) NOT NULL,
  month VARCHAR(20) NOT NULL,
  fin_year VARCHAR(10) NOT NULL,
  total_households_worked INTEGER NOT NULL,
  avg_days_employment_per_hh DECIMAL(8,2) NOT NULL,
  payment_percentage_15_days DECIMAL(8,2) NOT NULL,
  women_persondays BIGINT,
  persondays_of_central_liability BIGINT,
  sc_persondays BIGINT,
  st_persondays BIGINT,
  households_100_days BIGINT,
  average_wage_rate NUMERIC(10,2),
  total_works_completed BIGINT,
  total_works_ongoing BIGINT,
  agriculture_works_percent NUMERIC(5,2),
  nrm_expenditure_percent NUMERIC(5,2),
  category_b_works_percent NUMERIC(5,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_district_month_year UNIQUE(district_name, month, fin_year)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_district_month ON monthly_performance(district_name, month, fin_year);
CREATE INDEX IF NOT EXISTS idx_last_updated ON monthly_performance(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_households_100_days ON monthly_performance(households_100_days);
CREATE INDEX IF NOT EXISTS idx_average_wage_rate ON monthly_performance(average_wage_rate);

-- ============================================
-- Create database users with appropriate permissions
-- ============================================

-- Create api_user (read-only access for backend API)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'api_user') THEN
    CREATE USER api_user WITH PASSWORD 'api_secure_password_change_me';
  END IF;
END
$$;

-- Create etl_user (read-write access for ETL service)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'etl_user') THEN
    CREATE USER etl_user WITH PASSWORD 'etl_secure_password_change_me';
  END IF;
END
$$;

-- Grant connection privileges
GRANT CONNECT ON DATABASE mgnrega TO api_user;
GRANT CONNECT ON DATABASE mgnrega TO etl_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO api_user;
GRANT USAGE ON SCHEMA public TO etl_user;

-- Grant table permissions to api_user (read-only)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO api_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO api_user;

-- Set default privileges for future tables (api_user)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO api_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO api_user;

-- Grant table permissions to etl_user (read-write)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO etl_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO etl_user;

-- Set default privileges for future tables (etl_user)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO etl_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO etl_user;

-- ============================================
-- Data Loading
-- ============================================
-- Districts and performance data will be automatically populated by the ETL service
-- when it fetches data from the government API (data.gov.in).
-- 
-- To populate data, run:
--   docker compose --profile etl run --rm etl
-- 
-- Or use the setup script:
--   ./setup-with-real-data.sh    (Linux/Mac)
--   setup-with-real-data.bat     (Windows)
--
-- This ensures only REAL government data is used, with no sample/test/demo data.

-- ============================================
-- Verification queries
-- ============================================
-- Run these to verify the setup:
-- SELECT COUNT(*) FROM districts;
-- SELECT * FROM districts LIMIT 5;
-- SELECT COUNT(*) FROM monthly_performance;
-- \du (to list users)
-- \dp (to list table permissions)
