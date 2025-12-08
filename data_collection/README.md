# Plot Price Data Collection System

This directory contains scripts and tools for collecting plot price data from Indian government portals and loading it into the staging database.

## Directory Structure

```
data_collection/
├── raw_data/          # JSONL files from scrapers
├── metadata/          # Collection metadata and logs
├── processed/         # Processed data ready for migration
├── scripts/           # Collection and processing scripts
│   ├── base_scraper.py
│   ├── example_maharashtra_scraper.py
│   └── load_to_staging.py
├── logs/              # Application logs
├── requirements.txt    # Python dependencies
├── .env.example       # Environment variable template
└── README.md          # This file
```

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```
DB_HOST=localhost
DB_PORT=5432
STAGING_DB_NAME=plotpulse_staging
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Setup Staging Database

```bash
# Create database
createdb plotpulse_staging

# Enable PostGIS extension
psql plotpulse_staging -c "CREATE EXTENSION postgis;"
```

## Usage

### Running a Scraper

```bash
cd scripts
python example_maharashtra_scraper.py
```

This will:
1. Scrape data from the Maharashtra IGRS portal
2. Save records to `raw_data/maharashtra_igrs_YYYY-MM-DD.jsonl`
3. Print a summary of collected records

### Loading Data to Staging Database

```bash
cd scripts
python load_to_staging.py
```

This will:
1. Read all JSONL files from `raw_data/` directory
2. Extract and normalize fields
3. Load into `staging_plot_data` table
4. Print loading summary

## Creating New Scrapers

1. Create a new file in `scripts/` directory
2. Inherit from `BaseScraper` class
3. Implement the `scrape()` method
4. Use helper methods from base class:
   - `make_request()` - HTTP requests with rate limiting
   - `save_record()` - Save to JSONL file
   - `validate_record()` - Validate data
   - `calculate_quality_score()` - Quality scoring

Example:

```python
from base_scraper import BaseScraper

class MyStateScraper(BaseScraper):
    def __init__(self):
        super().__init__(
            source_name="my_state_portal",
            base_url="https://example.gov.in/",
            delay_seconds=2.0
        )
    
    def scrape(self) -> int:
        # Your scraping logic here
        records = self.scrape_data()
        return self.save_batch(records)
```

## Data Flow

1. **Collection** → Scrapers collect data → Save to JSONL files
2. **Loading** → Load JSONL files → Insert into staging database
3. **Processing** → Deduplicate, validate, geocode → Mark as processed
4. **Migration** → Move processed data → Production database

## Best Practices

1. **Rate Limiting**: Always add delays between requests (2-3 seconds minimum)
2. **Error Handling**: Log errors but continue processing other records
3. **Validation**: Validate records before saving
4. **Incremental Collection**: Run scrapers regularly to get updates
5. **Respect ToS**: Review Terms of Service for each portal
6. **Data Quality**: Calculate and store quality scores

## Troubleshooting

### Connection Errors
- Check database credentials in `.env`
- Ensure PostgreSQL is running
- Verify database exists

### Scraping Errors
- Check if portal structure has changed
- Verify network connectivity
- Review rate limiting settings

### Data Quality Issues
- Review validation rules
- Check source data format
- Adjust quality scoring logic

## Next Steps

1. Implement scrapers for your target states
2. Test on small datasets first
3. Run deduplication scripts
4. Geocode locations (add coordinates)
5. Migrate to production database

