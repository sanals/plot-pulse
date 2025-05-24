-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create the schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Switch to the public schema
SET search_path TO public;

-- Create a spatial index on the plots table (will be created by Hibernate)
-- CREATE INDEX IF NOT EXISTS plots_location_idx ON plots USING GIST (location);

-- Create the plots table (optional, as Hibernate will create it)
-- CREATE TABLE IF NOT EXISTS plots (
--     id SERIAL PRIMARY KEY,
--     price DECIMAL(15, 2) NOT NULL,
--     is_for_sale BOOLEAN NOT NULL DEFAULT TRUE,
--     description TEXT,
--     location GEOMETRY(Point, 4326) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the users table (optional, as Hibernate will create it)
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     username VARCHAR(255) UNIQUE NOT NULL,
--     email VARCHAR(255) UNIQUE NOT NULL,
--     password_hash VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Add a trigger to update the updated_at timestamp for users table
-- CREATE TRIGGER update_users_updated_at BEFORE UPDATE
-- ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add a trigger to update the updated_at timestamp for plots table
-- CREATE TRIGGER update_plots_updated_at BEFORE UPDATE
-- ON plots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 