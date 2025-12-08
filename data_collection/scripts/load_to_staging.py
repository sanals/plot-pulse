"""
Script to load JSONL files into staging database for processing.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch, Json
from psycopg2.extensions import register_adapter
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Register JSON adapter for psycopg2
register_adapter(dict, Json)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StagingDatabaseLoader:
    """Load collected data into staging database"""
    
    def __init__(self, db_config: Dict[str, str]):
        """
        Initialize database loader
        
        Args:
            db_config: Database connection parameters
        """
        self.db_config = db_config
        self.conn = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            logger.info("Connected to staging database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Disconnected from database")
    
    def create_staging_table(self):
        """Create staging table if it doesn't exist"""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS staging_plot_data (
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
            location POINT,
            
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
        
        CREATE INDEX IF NOT EXISTS idx_staging_source ON staging_plot_data(source);
        CREATE INDEX IF NOT EXISTS idx_staging_processed ON staging_plot_data(processed);
        CREATE INDEX IF NOT EXISTS idx_staging_duplicate ON staging_plot_data(is_duplicate);
        CREATE INDEX IF NOT EXISTS idx_staging_location ON staging_plot_data USING GIST(location);
        """
        
        try:
            with self.conn.cursor() as cur:
                cur.execute(create_table_sql)
                self.conn.commit()
                logger.info("Staging table created/verified")
        except Exception as e:
            logger.error(f"Error creating staging table: {e}")
            self.conn.rollback()
            raise
    
    def extract_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract and normalize fields from raw data
        
        Args:
            record: Record from JSONL file
            
        Returns:
            Dictionary with extracted fields
        """
        raw_data = record.get('raw_data', {})
        
        # Extract location
        location = {
            'state': raw_data.get('state', '').strip().title(),
            'district': raw_data.get('district', '').strip().title(),
            'taluka': raw_data.get('taluka', '').strip().title(),
            'village': raw_data.get('village', '').strip().title(),
            'zone': raw_data.get('zone', '').strip().upper(),
        }
        
        # Extract rates
        rate_per_sqft = None
        rate_per_sqm = None
        
        if raw_data.get('rate_per_sqft'):
            rate_per_sqft = float(raw_data['rate_per_sqft'])
            rate_per_sqm = rate_per_sqft * 10.764
        elif raw_data.get('rate_per_sqm'):
            rate_per_sqm = float(raw_data['rate_per_sqm'])
            rate_per_sqft = rate_per_sqm / 10.764
        elif raw_data.get('rate_per_sqyd'):
            rate_sqyd = float(raw_data['rate_per_sqyd'])
            rate_per_sqft = rate_sqyd / 9
            rate_per_sqm = rate_per_sqft * 10.764
        
        # Extract date
        effective_date = None
        if raw_data.get('effective_date'):
            try:
                effective_date = datetime.strptime(raw_data['effective_date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        
        # Extract location point (if coordinates available)
        location_point = None
        if raw_data.get('latitude') and raw_data.get('longitude'):
            try:
                lat = float(raw_data['latitude'])
                lng = float(raw_data['longitude'])
                location_point = f"POINT({lng} {lat})"
            except (ValueError, TypeError):
                pass
        
        # Quality score
        quality_score = record.get('metadata', {}).get('quality_score')
        if quality_score is None:
            # Calculate if not present
            quality_score = self._calculate_quality_score(record)
        
        return {
            'state': location['state'] or None,
            'district': location['district'] or None,
            'taluka': location['taluka'] or None,
            'village': location['village'] or None,
            'property_type': raw_data.get('property_type', '').strip() or None,
            'zone': location['zone'] or None,
            'rate_per_sqft': rate_per_sqft,
            'rate_per_sqm': rate_per_sqm,
            'effective_date': effective_date,
            'location': location_point,
            'data_quality_score': quality_score,
            'source_url': raw_data.get('source_url'),
            'scraped_at': self._parse_timestamp(record.get('metadata', {}).get('scraped_at')),
        }
    
    def _calculate_quality_score(self, record: Dict[str, Any]) -> float:
        """Calculate quality score for a record"""
        score = 1.0
        raw_data = record.get('raw_data', {})
        
        if not raw_data.get('village'):
            score -= 0.1
        if not raw_data.get('zone'):
            score -= 0.1
        if not raw_data.get('latitude'):
            score -= 0.2
        
        return max(0.0, score)
    
    def _parse_timestamp(self, timestamp_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO timestamp string"""
        if not timestamp_str:
            return None
        try:
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except:
            return None
    
    def load_jsonl_file(self, file_path: Path) -> int:
        """
        Load records from JSONL file into staging database
        
        Args:
            file_path: Path to JSONL file
            
        Returns:
            Number of records loaded
        """
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return 0
        
        logger.info(f"Loading records from {file_path}")
        
        insert_sql = """
        INSERT INTO staging_plot_data (
            source, collection_date, raw_data,
            state, district, taluka, village, property_type, zone,
            rate_per_sqft, rate_per_sqm, effective_date, location,
            data_quality_score, source_url, scraped_at
        ) VALUES (
            %(source)s, %(collection_date)s, %(raw_data)s,
            %(state)s, %(district)s, %(taluka)s, %(village)s, 
            %(property_type)s, %(zone)s,
            %(rate_per_sqft)s, %(rate_per_sqm)s, %(effective_date)s, 
            ST_GeomFromText(%(location)s, 4326),
            %(data_quality_score)s, %(source_url)s, %(scraped_at)s
        )
        """
        
        loaded_count = 0
        error_count = 0
        
        with open(file_path, 'r', encoding='utf-8') as f:
            records = []
            for line_num, line in enumerate(f, 1):
                try:
                    record = json.loads(line.strip())
                    
                    # Extract fields
                    extracted = self.extract_fields(record)
                    
                    # Prepare insert data
                    insert_data = {
                        'source': record.get('source'),
                        'collection_date': self._parse_timestamp(record.get('collection_date')),
                        'raw_data': Json(record.get('raw_data', {})),
                        'state': extracted['state'],
                        'district': extracted['district'],
                        'taluka': extracted['taluka'],
                        'village': extracted['village'],
                        'property_type': extracted['property_type'],
                        'zone': extracted['zone'],
                        'rate_per_sqft': extracted['rate_per_sqft'],
                        'rate_per_sqm': extracted['rate_per_sqm'],
                        'effective_date': extracted['effective_date'],
                        'location': extracted['location'],
                        'data_quality_score': extracted['data_quality_score'],
                        'source_url': extracted['source_url'],
                        'scraped_at': extracted['scraped_at'],
                    }
                    
                    records.append(insert_data)
                    
                    # Batch insert every 100 records
                    if len(records) >= 100:
                        try:
                            with self.conn.cursor() as cur:
                                execute_batch(cur, insert_sql, records)
                                self.conn.commit()
                                loaded_count += len(records)
                                logger.info(f"Loaded {loaded_count} records so far...")
                        except Exception as e:
                            logger.error(f"Error inserting batch at line {line_num}: {e}")
                            self.conn.rollback()
                            error_count += len(records)
                        records = []
                
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON at line {line_num}: {e}")
                    error_count += 1
                except Exception as e:
                    logger.error(f"Error processing line {line_num}: {e}")
                    error_count += 1
            
            # Insert remaining records
            if records:
                try:
                    with self.conn.cursor() as cur:
                        execute_batch(cur, insert_sql, records)
                        self.conn.commit()
                        loaded_count += len(records)
                except Exception as e:
                    logger.error(f"Error inserting final batch: {e}")
                    self.conn.rollback()
                    error_count += len(records)
        
        logger.info(f"Loading complete: {loaded_count} loaded, {error_count} errors")
        return loaded_count
    
    def load_directory(self, directory: Path) -> Dict[str, int]:
        """
        Load all JSONL files from a directory
        
        Args:
            directory: Directory containing JSONL files
            
        Returns:
            Dictionary with file names and record counts
        """
        results = {}
        
        jsonl_files = list(directory.glob('*.jsonl'))
        logger.info(f"Found {len(jsonl_files)} JSONL files")
        
        for file_path in jsonl_files:
            count = self.load_jsonl_file(file_path)
            results[file_path.name] = count
        
        return results


def main():
    """Main function"""
    # Database configuration (load from environment variables)
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('STAGING_DB_NAME', 'plotpulse_staging'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }
    
    # Directory containing JSONL files
    data_dir = Path('data_collection/raw_data')
    
    # Initialize loader
    loader = StagingDatabaseLoader(db_config)
    
    try:
        loader.connect()
        loader.create_staging_table()
        
        # Load all files
        results = loader.load_directory(data_dir)
        
        print("\nLoading Summary:")
        for filename, count in results.items():
            print(f"  {filename}: {count} records")
        print(f"\nTotal: {sum(results.values())} records")
        
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        loader.disconnect()


if __name__ == "__main__":
    main()

