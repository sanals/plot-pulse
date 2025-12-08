-- Railway Database Setup Script
-- Run this script after enabling PostGIS to set up the complete database schema
-- This combines all necessary migrations for Railway deployment

-- Step 1: Enable PostGIS (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Step 2: Add name column to users table (if not exists)
-- This handles existing users by setting name = username for existing records
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 3: Update existing users to set name = username (if name is null)
UPDATE users SET name = username WHERE name IS NULL;

-- Step 4: Make the name column NOT NULL (if not already)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'name' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE users ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- Step 5: Update role check constraint to include USER role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));

-- Step 6: Add price_unit column to plots table (if not exists)
ALTER TABLE plots ADD COLUMN IF NOT EXISTS price_unit VARCHAR(20) DEFAULT 'per_sqft';

-- Step 7: Update existing data to add "per_" prefix (if needed)
UPDATE plots SET price_unit = 'per_sqft' WHERE price_unit = 'sqft';
UPDATE plots SET price_unit = 'per_sqm' WHERE price_unit = 'sqm';
UPDATE plots SET price_unit = 'per_cent' WHERE price_unit = 'cent';
UPDATE plots SET price_unit = 'per_acre' WHERE price_unit = 'acre';

-- Step 8: Drop old constraint and add new one with "per_" prefix
DO $$
BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'plots_price_unit_check' 
        AND table_name = 'plots'
    ) THEN
        ALTER TABLE plots DROP CONSTRAINT plots_price_unit_check;
    END IF;
    
    -- Add new constraint with "per_" prefix to match frontend
    ALTER TABLE plots ADD CONSTRAINT plots_price_unit_check 
    CHECK (price_unit IN ('per_sqft', 'per_sqm', 'per_cent', 'per_acre', 'per_hectare'));
END $$;

-- Step 8: Create spatial indexes if they don't exist
-- Index for plots.location (geometry column)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_plots_location' 
        AND tablename = 'plots'
    ) THEN
        CREATE INDEX idx_plots_location ON plots USING GIST(location);
    END IF;
END $$;

-- Verification queries (optional - uncomment to check)
-- SELECT * FROM pg_extension WHERE extname = 'postgis';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plots' AND column_name = 'price_unit';

