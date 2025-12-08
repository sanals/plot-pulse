# India Plot Price Data Sources - Free Options
**Documentation Date:** December 6, 2025

## Table of Contents
1. [Government Official Sources (Circle Rates/Guidance Values)](#government-official-sources)
2. [Open Data Portals](#open-data-portals)
3. [State-Specific Portals](#state-specific-portals)
4. [Data Collection Methods](#data-collection-methods)
5. [Temporary Storage Strategy](#temporary-storage-strategy)
6. [Deduplication & Error Handling](#deduplication--error-handling)
7. [Implementation Plan](#implementation-plan)

---

## Government Official Sources

### 1. Circle Rates / Guidance Values (Floor Prices)

**Important Note:** Circle rates are **minimum floor prices** set by state governments for property transactions. They are NOT actual market prices but represent the minimum value for stamp duty calculation. Market prices are typically 20-50% higher than circle rates.

#### States with Online Circle Rate Portals:

**A. Maharashtra (IGRS - Inspector General of Registration & Stamps)**
- **Portal:** https://igrsup.gov.in/
- **Data Type:** Circle rates by area, property type, zone
- **Access Method:** 
  - Web portal with search functionality
  - No official API (requires web scraping)
  - PDF downloads available for some districts
- **Data Format:** HTML tables, PDFs
- **Update Frequency:** Quarterly/Annually
- **Coverage:** All districts, talukas, villages
- **Fields Available:**
  - District, Taluka, Village
  - Property Type (Residential, Commercial, Agricultural)
  - Zone/Area classification
  - Rate per sq.ft or sq.m
  - Effective date

**B. Telangana (Dharani Portal)**
- **Portal:** https://dharani.telangana.gov.in/
- **Data Type:** Guidance values (circle rates)
- **Access Method:**
  - Web portal with search
  - No official API
  - Can download guidance value documents (PDF)
- **Data Format:** HTML, PDF
- **Update Frequency:** Annually
- **Coverage:** All districts, mandals, villages
- **Fields Available:**
  - District, Mandal, Village
  - Survey number
  - Land use type
  - Guidance value per sq.yd or sq.m
  - Effective date

**C. Karnataka (Bhoomi/KAVERI)**
- **Portal:** https://bhoomi.karnataka.gov.in/ or https://kaveri.karnataka.gov.in/
- **Data Type:** Guidance values, land records
- **Access Method:**
  - Web portal (requires registration for detailed access)
  - No official API
- **Data Format:** HTML, PDF
- **Update Frequency:** Annually
- **Coverage:** All districts, taluks, villages
- **Fields Available:**
  - District, Taluk, Village
  - Survey number
  - Land classification
  - Guidance value
  - Effective date

**D. Delhi (Revenue Department)**
- **Portal:** https://revenue.delhi.gov.in/
- **Data Type:** Circle rates
- **Access Method:**
  - Web portal
  - PDF circulars available
- **Data Format:** HTML, PDF
- **Update Frequency:** Annually
- **Coverage:** All zones in Delhi
- **Fields Available:**
  - Zone/Area
  - Property category
  - Rate per sq.m
  - Effective date

**E. Uttar Pradesh (IGRS UP)**
- **Portal:** https://igrsup.gov.in/ (UP section)
- **Data Type:** Circle rates
- **Access Method:** Web portal, PDF downloads
- **Data Format:** HTML, PDF
- **Coverage:** All districts

**F. Gujarat (i-Jamin)**
- **Portal:** https://ijamin.gujarat.gov.in/
- **Data Type:** Jantri rates (circle rates)
- **Access Method:** Web portal
- **Data Format:** HTML, PDF
- **Coverage:** All districts, talukas

**G. Tamil Nadu (Registration Department)**
- **Portal:** https://tnreginet.gov.in/
- **Data Type:** Guideline values
- **Access Method:** Web portal
- **Data Format:** HTML, PDF

**H. Haryana (Haryana Land Records)**
- **Portal:** https://jamabandi.nic.in/
- **Data Type:** Circle rates
- **Access Method:** Web portal
- **Data Format:** HTML

**I. Punjab (Punjab Land Records)**
- **Portal:** https://jamabandi.punjab.gov.in/
- **Data Type:** Circle rates
- **Access Method:** Web portal
- **Data Format:** HTML

**J. Rajasthan (Apna Khata)**
- **Portal:** https://apnakhata.rajasthan.gov.in/
- **Data Type:** Circle rates
- **Access Method:** Web portal
- **Data Format:** HTML

---

## Open Data Portals

### 1. Data.gov.in (National Open Data Portal)
- **URL:** https://data.gov.in/
- **Data Type:** Various government datasets
- **Search Terms to Use:**
  - "property"
  - "land"
  - "real estate"
  - "housing"
  - "circle rate"
  - "guidance value"
- **Data Format:** CSV, JSON, XLS, PDF
- **Access Method:**
  - Direct download from portal
  - Some datasets have APIs
  - Requires registration (free)
- **Coverage:** Varies by dataset
- **Update Frequency:** Varies

**How to Access:**
1. Register at https://data.gov.in/user/register
2. Search for relevant datasets
3. Filter by format (prefer CSV/JSON)
4. Download datasets
5. Some datasets provide API endpoints

### 2. State Open Data Portals

**Maharashtra Open Data Portal**
- URL: https://data.maharashtra.gov.in/
- May contain property-related datasets

**Karnataka Open Data Portal**
- URL: https://data.karnataka.gov.in/
- May contain land records datasets

**Telangana Open Data Portal**
- URL: https://data.telangana.gov.in/
- May contain property datasets

---

## State-Specific Portals

### Additional State Portals (Partial List)

1. **Andhra Pradesh**
   - Portal: https://meebhoomi.ap.gov.in/
   - Data: Land records, guidance values

2. **Kerala**
   - Portal: https://erekha.kerala.gov.in/
   - Data: Land records

3. **West Bengal**
   - Portal: https://banglarbhumi.gov.in/
   - Data: Land records, circle rates

4. **Odisha**
   - Portal: https://bhulekh.odisha.gov.in/
   - Data: Land records

5. **Madhya Pradesh**
   - Portal: https://mpbhulekh.gov.in/
   - Data: Land records

6. **Bihar**
   - Portal: https://bhumijankari.bihar.gov.in/
   - Data: Land records

---

## Data Collection Methods

### Method 1: Web Scraping (Most Common)

**Tools Required:**
- Python with libraries:
  - `requests` - HTTP requests
  - `beautifulsoup4` - HTML parsing
  - `selenium` - For JavaScript-heavy sites
  - `pandas` - Data manipulation
  - `scrapy` - Advanced scraping framework

**Legal Considerations:**
- Check robots.txt of each portal
- Respect rate limits (add delays between requests)
- Review Terms of Service
- Use proper User-Agent headers
- Consider using official APIs if available

**Example Scraping Workflow:**
```python
# Pseudo-code structure
1. Identify target portal URL
2. Analyze page structure (inspect HTML)
3. Identify data extraction patterns
4. Handle pagination/search functionality
5. Extract: location, rate, property type, date
6. Clean and normalize data
7. Store in temporary storage
```

### Method 2: PDF Parsing

**For Portals Providing PDF Downloads:**
- Use `pdfplumber` or `PyPDF2` for text extraction
- Use `tabula-py` for table extraction from PDFs
- Handle various PDF formats and layouts

### Method 3: API Access (If Available)

**Check for:**
- REST APIs
- GraphQL endpoints
- Data.gov.in API keys
- State-specific API portals

**Note:** Most Indian government portals do NOT provide official APIs. Web scraping is the primary method.

### Method 4: Manual Data Entry (For Small Datasets)

- For initial seed data
- For critical missing data points
- Use structured forms

---

## Temporary Storage Strategy

### Recommended Approach: Staging Database + File Storage

### Phase 1: Raw Data Collection

**Storage Format: JSON Lines (JSONL)**
- One record per line
- Easy to append incrementally
- Can be processed line-by-line (memory efficient)
- Human-readable for debugging

**File Structure:**
```
data_collection/
├── raw_data/
│   ├── maharashtra_circle_rates_2025-12-06.jsonl
│   ├── telangana_guidance_values_2025-12-06.jsonl
│   ├── karnataka_guidance_values_2025-12-06.jsonl
│   └── ...
├── metadata/
│   ├── sources.json          # Source URLs, last updated
│   ├── collection_log.json   # Collection timestamps, status
│   └── errors.json           # Failed collections, retry info
└── processed/
    └── (processed data ready for migration)
```

**JSONL Record Format:**
```json
{
  "source": "maharashtra_igrs",
  "collection_date": "2025-12-06T10:30:00Z",
  "raw_data": {
    "district": "Mumbai",
    "taluka": "Andheri",
    "village": "Juhu",
    "property_type": "Residential",
    "zone": "A",
    "rate_per_sqft": 15000,
    "rate_per_sqm": 161458,
    "effective_date": "2025-01-01",
    "url": "https://igrsup.gov.in/..."
  },
  "metadata": {
    "scraped_at": "2025-12-06T10:30:15Z",
    "scraper_version": "1.0",
    "confidence": 0.95
  }
}
```

### Phase 2: Staging Database (PostgreSQL)

**Why PostgreSQL:**
- Supports PostGIS for spatial data
- Excellent for data cleaning and transformation
- Can handle large datasets
- Supports JSON/JSONB for flexible schema
- Easy to query and deduplicate

**Staging Table Schema:**
```sql
CREATE TABLE staging_plot_data (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    collection_date TIMESTAMP NOT NULL,
    raw_data JSONB NOT NULL,
    
    -- Extracted/Normalized Fields
    state VARCHAR(50),
    district VARCHAR(100),
    taluka VARCHAR(100),
    village VARCHAR(100),
    property_type VARCHAR(50),
    zone VARCHAR(50),
    rate_per_sqft DECIMAL(12, 2),
    rate_per_sqm DECIMAL(12, 2),
    effective_date DATE,
    location POINT, -- PostGIS point for coordinates
    
    -- Processing Fields
    processed BOOLEAN DEFAULT FALSE,
    processed_date TIMESTAMP,
    duplicate_of INTEGER REFERENCES staging_plot_data(id),
    is_duplicate BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    data_quality_score DECIMAL(3, 2),
    
    -- Metadata
    source_url TEXT,
    scraped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staging_source ON staging_plot_data(source);
CREATE INDEX idx_staging_location ON staging_plot_data USING GIST(location);
CREATE INDEX idx_staging_processed ON staging_plot_data(processed);
CREATE INDEX idx_staging_duplicate ON staging_plot_data(is_duplicate);
```

### Phase 3: Data Processing Pipeline

**Processing Steps:**
1. **Load JSONL files** → Insert into staging table
2. **Geocode locations** → Add coordinates (using Nominatim/Google Geocoding)
3. **Normalize data** → Standardize formats, units
4. **Deduplicate** → Identify and mark duplicates
5. **Validate** → Check data quality
6. **Transform** → Prepare for final schema
7. **Migrate** → Move to production database

---

## Deduplication & Error Handling

### Deduplication Strategy

#### 1. Exact Duplicate Detection

**Criteria for Exact Duplicates:**
- Same source
- Same location (district + taluka + village)
- Same property type
- Same zone
- Same effective date
- Rate difference < 1%

**SQL Query:**
```sql
WITH duplicates AS (
    SELECT 
        id,
        state, district, taluka, village,
        property_type, zone, effective_date,
        rate_per_sqft,
        LAG(id) OVER (
            PARTITION BY state, district, taluka, village, 
                         property_type, zone, effective_date
            ORDER BY collection_date DESC
        ) AS duplicate_of_id
    FROM staging_plot_data
    WHERE processed = FALSE
)
UPDATE staging_plot_data spd
SET 
    is_duplicate = TRUE,
    duplicate_of = d.duplicate_of_id
FROM duplicates d
WHERE spd.id = d.id 
  AND d.duplicate_of_id IS NOT NULL
  AND ABS(spd.rate_per_sqft - (
      SELECT rate_per_sqft 
      FROM staging_plot_data 
      WHERE id = d.duplicate_of_id
  )) / spd.rate_per_sqft < 0.01; -- 1% tolerance
```

#### 2. Fuzzy Duplicate Detection

**For Similar Records (Typos, Variations):**
- Use Levenshtein distance for location names
- Normalize location names (remove extra spaces, standardize case)
- Group by similar coordinates (within 100m radius)

**Python Example:**
```python
from difflib import SequenceMatcher

def similarity_score(str1, str2):
    return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

# Group potential duplicates
def find_fuzzy_duplicates(records, threshold=0.85):
    duplicates = []
    for i, rec1 in enumerate(records):
        for j, rec2 in enumerate(records[i+1:], i+1):
            if (similarity_score(rec1['district'], rec2['district']) > threshold and
                similarity_score(rec1['village'], rec2['village']) > threshold and
                rec1['property_type'] == rec2['property_type']):
                duplicates.append((rec1['id'], rec2['id']))
    return duplicates
```

#### 3. Temporal Duplicate Handling

**Strategy:**
- If same location has multiple entries with different dates:
  - Keep the most recent entry
  - Or merge if rates are significantly different (market change)

**SQL:**
```sql
-- Keep most recent entry for same location
WITH ranked_data AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY state, district, taluka, village, 
                         property_type, zone
            ORDER BY effective_date DESC, collection_date DESC
        ) AS rn
    FROM staging_plot_data
    WHERE processed = FALSE AND is_duplicate = FALSE
)
UPDATE staging_plot_data
SET is_duplicate = TRUE
FROM ranked_data rd
WHERE staging_plot_data.id = rd.id AND rd.rn > 1;
```

### Error Handling

#### 1. Data Validation Rules

**Required Fields:**
- State, District (minimum)
- Rate (per sqft or sqm)
- Property type
- Effective date

**Validation Checks:**
```python
def validate_record(record):
    errors = []
    
    # Required fields
    if not record.get('district'):
        errors.append("Missing district")
    
    # Rate validation
    rate = record.get('rate_per_sqft') or record.get('rate_per_sqm')
    if not rate or rate <= 0:
        errors.append("Invalid or missing rate")
    if rate > 1000000:  # Sanity check (1M per sqft seems unrealistic)
        errors.append(f"Rate too high: {rate}")
    
    # Date validation
    if record.get('effective_date'):
        try:
            date_obj = datetime.strptime(record['effective_date'], '%Y-%m-%d')
            if date_obj > datetime.now():
                errors.append("Future date not allowed")
        except:
            errors.append("Invalid date format")
    
    # Location validation
    if not record.get('state') and not record.get('district'):
        errors.append("Missing location information")
    
    return errors
```

#### 2. Data Quality Scoring

**Quality Score Calculation:**
```python
def calculate_quality_score(record):
    score = 1.0
    
    # Deduct points for missing optional fields
    if not record.get('village'):
        score -= 0.1
    if not record.get('zone'):
        score -= 0.1
    if not record.get('location'):  # coordinates
        score -= 0.2
    
    # Deduct for data inconsistencies
    if record.get('rate_per_sqft') and record.get('rate_per_sqm'):
        # Check if conversion is approximately correct
        expected_sqm = record['rate_per_sqft'] * 10.764
        actual_sqm = record['rate_per_sqm']
        if abs(expected_sqm - actual_sqm) / expected_sqm > 0.1:
            score -= 0.2
    
    return max(0.0, score)
```

#### 3. Error Logging & Retry Strategy

**Error Log Table:**
```sql
CREATE TABLE data_collection_errors (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    error_type VARCHAR(50), -- 'validation', 'scraping', 'geocoding', etc.
    error_message TEXT,
    record_data JSONB,
    retry_count INTEGER DEFAULT 0,
    last_retry TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Retry Logic:**
- Transient errors (network, timeout): Retry with exponential backoff
- Validation errors: Flag for manual review
- Permanent errors: Log and skip

---

## Implementation Plan

### Phase 1: Setup (Week 1)

1. **Create staging database**
   ```bash
   # Setup PostgreSQL with PostGIS
   createdb plotpulse_staging
   psql plotpulse_staging -c "CREATE EXTENSION postgis;"
   ```

2. **Create directory structure**
   ```bash
   mkdir -p data_collection/{raw_data,metadata,processed,scripts,logs}
   ```

3. **Setup Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install requests beautifulsoup4 selenium pandas scrapy 
                pdfplumber tabula-py psycopg2-binary sqlalchemy 
                python-dotenv
   ```

### Phase 2: Data Collection Scripts (Week 2-3)

1. **Create base scraper class**
   - Handle common patterns (rate limiting, error handling)
   - Logging framework
   - JSONL output

2. **Implement state-specific scrapers**
   - Start with 2-3 major states (Maharashtra, Telangana, Karnataka)
   - Test and refine
   - Expand to other states

3. **Geocoding service**
   - Integrate Nominatim (free) or Google Geocoding API
   - Cache results to avoid duplicate API calls
   - Handle rate limits

### Phase 3: Data Processing (Week 4)

1. **Load JSONL to staging database**
   - Batch insert script
   - Handle large files efficiently

2. **Data normalization**
   - Standardize location names
   - Convert units (sqft ↔ sqm)
   - Normalize property types

3. **Deduplication**
   - Run exact duplicate detection
   - Run fuzzy duplicate detection
   - Manual review for edge cases

4. **Validation & Quality Scoring**
   - Run validation rules
   - Calculate quality scores
   - Flag low-quality records

### Phase 4: Migration to Production (Week 5)

1. **Final data transformation**
   - Map to production schema
   - Ensure data types match
   - Add any computed fields

2. **Migrate to production database**
   - Use transactions for atomicity
   - Batch inserts for performance
   - Verify data integrity

3. **Post-migration validation**
   - Row count checks
   - Sample data verification
   - Query performance testing

### Phase 5: Automation & Maintenance (Ongoing)

1. **Schedule regular updates**
   - Monthly/quarterly collection runs
   - Automated deduplication
   - Quality monitoring

2. **Monitoring & Alerts**
   - Track collection success rates
   - Monitor data quality scores
   - Alert on anomalies

---

## Sample Collection Script Structure

### Example: Maharashtra Circle Rate Scraper

```python
# scripts/scrapers/maharashtra_igrs.py

import requests
from bs4 import BeautifulSoup
import json
import time
from datetime import datetime

class MaharashtraIGRSScraper:
    def __init__(self, output_file):
        self.base_url = "https://igrsup.gov.in/"
        self.output_file = output_file
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (PlotPulse Data Collector)'
        })
    
    def scrape_district(self, district_name):
        """Scrape circle rates for a specific district"""
        # Implementation here
        pass
    
    def save_record(self, record):
        """Append record to JSONL file"""
        with open(self.output_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(record, ensure_ascii=False) + '\n')
    
    def run(self, districts):
        """Main collection loop"""
        for district in districts:
            try:
                data = self.scrape_district(district)
                for record in data:
                    self.save_record({
                        'source': 'maharashtra_igrs',
                        'collection_date': datetime.now().isoformat(),
                        'raw_data': record,
                        'metadata': {
                            'scraped_at': datetime.now().isoformat(),
                            'scraper_version': '1.0'
                        }
                    })
                time.sleep(2)  # Rate limiting
            except Exception as e:
                # Log error
                print(f"Error scraping {district}: {e}")
                continue

if __name__ == "__main__":
    scraper = MaharashtraIGRSScraper('raw_data/maharashtra_2025-12-06.jsonl')
    districts = ['Mumbai', 'Pune', 'Nagpur']  # Start with major cities
    scraper.run(districts)
```

---

## Next Steps

1. **Start with 2-3 states** (Maharashtra, Telangana, Karnataka)
2. **Test collection scripts** on small datasets
3. **Refine deduplication logic** based on actual data patterns
4. **Scale up** to more states gradually
5. **Monitor data quality** and adjust validation rules

---

## Notes & Considerations

1. **Rate Limiting:** Always respect website rate limits. Add delays between requests.

2. **Legal Compliance:** 
   - Review Terms of Service for each portal
   - Use data responsibly
   - Consider reaching out to portals for official data access

3. **Data Freshness:** 
   - Circle rates update infrequently (quarterly/annually)
   - Set up monitoring for updates
   - Version your collected data

4. **Coordinate System:** 
   - Use WGS84 (SRID 4326) for consistency
   - Geocode locations when coordinates not available

5. **Data Attribution:** 
   - Store source information with each record
   - Maintain audit trail of data collection

---

**Last Updated:** December 6, 2025
**Status:** Initial Documentation - Ready for Implementation

