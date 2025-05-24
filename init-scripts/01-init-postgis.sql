-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Create spatial index function
CREATE OR REPLACE FUNCTION create_spatial_index(
    schema_name TEXT,
    table_name TEXT,
    geom_column TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE INDEX idx_%s_%s ON %I.%I USING GIST(%I)',
        table_name, geom_column, schema_name, table_name, geom_column);
END;
$$ LANGUAGE plpgsql; 