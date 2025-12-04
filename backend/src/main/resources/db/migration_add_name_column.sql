-- Migration script to add name column to users table
-- This script handles existing users by setting name = username for existing records

-- Step 1: Add the column as nullable first
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Step 2: Update existing users to set name = username (if name is null)
UPDATE users SET name = username WHERE name IS NULL;

-- Step 3: Now make the column NOT NULL
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Step 4: Update role check constraint to include USER role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));
