-- Migration script to add price_unit column to plots table
-- This script should be run manually before starting the application with the updated entity

-- Add the price_unit column with a default value
ALTER TABLE plots ADD COLUMN IF NOT EXISTS price_unit VARCHAR(50);

-- Set default value for existing records (assuming they are per square foot prices)
UPDATE plots SET price_unit = 'per_sqft' WHERE price_unit IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE plots ALTER COLUMN price_unit SET NOT NULL;

-- Add a comment to the column for documentation
COMMENT ON COLUMN plots.price_unit IS 'Unit of the price (e.g., per_sqft, per_sqm, per_cent, per_acre, per_hectare)';

-- Optional: Add a check constraint to ensure valid price units (ordered by area size)
ALTER TABLE plots ADD CONSTRAINT check_price_unit 
CHECK (price_unit IN ('per_sqft', 'per_sqm', 'per_cent', 'per_acre', 'per_hectare')); 