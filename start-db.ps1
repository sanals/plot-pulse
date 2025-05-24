# PowerShell script to start the PostgreSQL with PostGIS database

Write-Host "Starting PostgreSQL with PostGIS database for PlotPulse..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
}
catch {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start the containers
Write-Host "Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempts = 0
$isReady = $false

while (-not $isReady -and $attempts -lt $maxAttempts) {
    try {
        $result = docker exec plotpulse-postgres pg_isready -U postgres
        if ($result -like "*accepting connections*") {
            $isReady = $true
            Write-Host "PostgreSQL is ready!" -ForegroundColor Green
        }
        else {
            $attempts++
            Write-Host "Waiting for PostgreSQL to start... Attempt $attempts of $maxAttempts" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    catch {
        $attempts++
        Write-Host "Waiting for PostgreSQL to start... Attempt $attempts of $maxAttempts" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $isReady) {
    Write-Host "PostgreSQL failed to start after $maxAttempts attempts." -ForegroundColor Red
    exit 1
}

# Create test database if it doesn't exist
Write-Host "Creating test database if it doesn't exist..." -ForegroundColor Yellow
docker exec plotpulse-postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'plotpulse_test'" | Out-Null
$testDbExists = $LASTEXITCODE -eq 0

if (-not $testDbExists) {
    Write-Host "Creating test database..." -ForegroundColor Yellow
    docker exec plotpulse-postgres psql -U postgres -c "CREATE DATABASE plotpulse_test" | Out-Null
    
    # Enable PostGIS extensions on test database
    Write-Host "Enabling PostGIS extensions on test database..." -ForegroundColor Yellow
    docker exec plotpulse-postgres psql -U postgres -d plotpulse_test -c "CREATE EXTENSION IF NOT EXISTS postgis" | Out-Null
    docker exec plotpulse-postgres psql -U postgres -d plotpulse_test -c "CREATE EXTENSION IF NOT EXISTS postgis_topology" | Out-Null
    docker exec plotpulse-postgres psql -U postgres -d plotpulse_test -c "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch" | Out-Null
    docker exec plotpulse-postgres psql -U postgres -d plotpulse_test -c "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder" | Out-Null
}

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host "PostgreSQL is running on localhost:5432" -ForegroundColor Cyan
Write-Host "pgAdmin is running on http://localhost:5050" -ForegroundColor Cyan
Write-Host "  Username: admin@example.com" -ForegroundColor Cyan
Write-Host "  Password: admin" -ForegroundColor Cyan 