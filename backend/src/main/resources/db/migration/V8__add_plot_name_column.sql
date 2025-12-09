-- Migration V8: Add name column to plots for user-provided plot names
-- Name is required and immutable after creation

ALTER TABLE plots ADD COLUMN IF NOT EXISTS name VARCHAR(150) NOT NULL DEFAULT 'Plot';

-- Optional: backfill existing rows with a generated name if null
UPDATE plots SET name = CONCAT('Plot ', id) WHERE name IS NULL;

