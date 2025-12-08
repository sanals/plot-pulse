-- Create plots table with PostGIS geometry support
CREATE TABLE IF NOT EXISTS plots (
    id BIGSERIAL PRIMARY KEY,
    price NUMERIC(19, 2) NOT NULL,
    price_unit VARCHAR(50) NOT NULL DEFAULT 'sqft' CHECK (price_unit IN ('sqft', 'cent', 'acre', 'sqm')),
    is_for_sale BOOLEAN NOT NULL DEFAULT true,
    description VARCHAR(500),
    location geometry(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create spatial index on location for faster geospatial queries
CREATE INDEX IF NOT EXISTS idx_plots_location ON plots USING GIST(location);

-- Create index on latitude/longitude for faster coordinate-based queries
CREATE INDEX IF NOT EXISTS idx_plots_coordinates ON plots(latitude, longitude);

-- Create index on user_id for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_plots_user_id ON plots(user_id);

-- Create index on is_for_sale for filtering
CREATE INDEX IF NOT EXISTS idx_plots_is_for_sale ON plots(is_for_sale);

