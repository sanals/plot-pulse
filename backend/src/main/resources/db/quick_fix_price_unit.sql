-- Quick Fix: Update price_unit constraint to match frontend
-- Run this manually on Railway database to fix the constraint immediately
-- This will be applied automatically via V6 migration on next deployment

-- Step 1: Update existing data to add "per_" prefix
UPDATE plots SET price_unit = 'per_sqft' WHERE price_unit = 'sqft';
UPDATE plots SET price_unit = 'per_sqm' WHERE price_unit = 'sqm';
UPDATE plots SET price_unit = 'per_cent' WHERE price_unit = 'cent';
UPDATE plots SET price_unit = 'per_acre' WHERE price_unit = 'acre';

-- Step 2: Drop the old constraint
ALTER TABLE plots DROP CONSTRAINT IF EXISTS plots_price_unit_check;

-- Step 3: Add new constraint with "per_" prefix values
ALTER TABLE plots ADD CONSTRAINT plots_price_unit_check 
CHECK (price_unit IN ('per_sqft', 'per_sqm', 'per_cent', 'per_acre', 'per_hectare'));

