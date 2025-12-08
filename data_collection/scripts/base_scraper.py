"""
Base scraper class for collecting plot price data from Indian government portals.
All state-specific scrapers should inherit from this class.
"""

import json
import time
import logging
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_collection/logs/scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BaseScraper:
    """Base class for all plot data scrapers"""
    
    def __init__(
        self,
        source_name: str,
        base_url: str,
        output_dir: str = "data_collection/raw_data",
        delay_seconds: float = 2.0
    ):
        """
        Initialize base scraper
        
        Args:
            source_name: Unique identifier for this data source (e.g., 'maharashtra_igrs')
            base_url: Base URL of the portal
            output_dir: Directory to save JSONL files
            delay_seconds: Delay between requests (rate limiting)
        """
        self.source_name = source_name
        self.base_url = base_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.delay_seconds = delay_seconds
        
        # Setup session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # User-Agent rotation pool (realistic browser user agents)
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]
        
        # Rate limiting tracking
        self.request_count = 0
        self.rate_limit_hits = 0
        self.last_request_time = 0
        self.start_time = time.time()
        
        # Set initial headers with random user agent
        self._rotate_user_agent()
        
        # Output file
        date_str = datetime.now().strftime('%Y-%m-%d')
        self.output_file = self.output_dir / f"{source_name}_{date_str}.jsonl"
        
        logger.info(f"Initialized scraper: {source_name}")
        logger.info(f"Output file: {self.output_file}")
    
    def _rotate_user_agent(self):
        """Rotate to a random user agent"""
        ua = random.choice(self.user_agents)
        self.session.headers.update({
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def _random_delay(self, base_delay: float, variation: float = 0.5) -> float:
        """
        Generate random delay to mimic human behavior
        
        Args:
            base_delay: Base delay in seconds
            variation: Random variation range (±variation)
            
        Returns:
            Random delay value
        """
        delay = base_delay + random.uniform(-variation, variation)
        return max(0.5, delay)  # Minimum 0.5 seconds
    
    def _handle_rate_limit(self, response: requests.Response) -> bool:
        """
        Handle rate limit responses (429)
        
        Args:
            response: Response object
            
        Returns:
            True if should retry, False if should stop
        """
        if response.status_code == 429:
            self.rate_limit_hits += 1
            logger.warning(f"Rate limit hit! (Count: {self.rate_limit_hits})")
            
            # Check Retry-After header
            retry_after = response.headers.get('Retry-After')
            if retry_after:
                wait_time = int(retry_after)
                logger.info(f"Retry-After header: {wait_time} seconds")
            else:
                # Exponential backoff: 60s, 120s, 300s
                wait_times = [60, 120, 300]
                wait_time = wait_times[min(self.rate_limit_hits - 1, len(wait_times) - 1)]
                logger.info(f"Exponential backoff: waiting {wait_time} seconds")
            
            # Stop if rate limited too many times
            if self.rate_limit_hits >= 3:
                logger.error("Rate limited 3+ times. Stopping scraper to avoid IP ban.")
                return False
            
            logger.info(f"Waiting {wait_time} seconds before retrying...")
            time.sleep(wait_time)
            
            # Rotate user agent after rate limit
            self._rotate_user_agent()
            
            return True
        
        return False
    
    def make_request(
        self,
        url: str,
        method: str = 'GET',
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        max_retries: int = 3
    ) -> Optional[requests.Response]:
        """
        Make HTTP request with error handling, rate limiting, and human-like behavior
        
        Args:
            url: URL to request
            method: HTTP method
            params: Query parameters
            data: Request body data
            headers: Additional headers
            max_retries: Maximum retries for rate limit errors
            
        Returns:
            Response object or None if error
        """
        for attempt in range(max_retries):
            try:
                # Add Referer header if not provided (mimic browser navigation)
                request_headers = self.session.headers.copy()
                if headers:
                    request_headers.update(headers)
                
                # Randomly rotate user agent every 10-20 requests
                if self.request_count > 0 and self.request_count % random.randint(10, 20) == 0:
                    self._rotate_user_agent()
                    logger.debug("Rotated user agent")
                
                response = self.session.request(
                    method=method,
                    url=url,
                    params=params,
                    data=data,
                    headers=request_headers,
                    timeout=30
                )
                
                # Handle rate limiting
                if response.status_code == 429:
                    if not self._handle_rate_limit(response):
                        return None  # Stop if too many rate limits
                    continue  # Retry the request
                
                response.raise_for_status()
                
                # Track request
                self.request_count += 1
                self.last_request_time = time.time()
                
                # Human-like delay with random variation
                delay = self._random_delay(self.delay_seconds, variation=1.0)
                time.sleep(delay)
                
                # Occasional longer pause (every 50 requests) to mimic human breaks
                if self.request_count % 50 == 0:
                    break_time = random.uniform(10, 30)
                    logger.info(f"Taking a break after {self.request_count} requests: {break_time:.1f}s")
                    time.sleep(break_time)
                
                return response
                
            except requests.exceptions.HTTPError as e:
                if e.response and e.response.status_code == 429:
                    if not self._handle_rate_limit(e.response):
                        return None
                    continue  # Retry
                logger.error(f"HTTP error for {url}: {e}")
                return None
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed for {url}: {e}")
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # Exponential backoff
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    return None
        
        return None
    
    def save_record(self, record: Dict[str, Any]) -> bool:
        """
        Save a single record to JSONL file
        
        Args:
            record: Dictionary containing the record data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add metadata
            record['source'] = self.source_name
            record['collection_date'] = datetime.now().isoformat()
            
            # Ensure metadata exists
            if 'metadata' not in record:
                record['metadata'] = {}
            record['metadata']['scraped_at'] = datetime.now().isoformat()
            record['metadata']['scraper_version'] = '1.0'
            
            # Write to JSONL file
            with open(self.output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving record: {e}")
            return False
    
    def save_batch(self, records: List[Dict[str, Any]]) -> int:
        """
        Save multiple records to JSONL file
        
        Args:
            records: List of record dictionaries
            
        Returns:
            Number of records successfully saved
        """
        saved_count = 0
        for record in records:
            if self.save_record(record):
                saved_count += 1
        return saved_count
    
    def normalize_location(self, location_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Normalize location data to standard format
        
        Args:
            location_data: Raw location data from source
            
        Returns:
            Normalized location dictionary
        """
        normalized = {
            'state': location_data.get('state', '').strip().title(),
            'district': location_data.get('district', '').strip().title(),
            'taluka': location_data.get('taluka', '').strip().title(),
            'village': location_data.get('village', '').strip().title(),
            'zone': location_data.get('zone', '').strip().upper(),
        }
        
        # Remove empty values
        return {k: v for k, v in normalized.items() if v}
    
    def normalize_rate(self, rate_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalize rate data (handle different units)
        
        Args:
            rate_data: Raw rate data
            
        Returns:
            Normalized rate dictionary with both sqft and sqm
        """
        normalized = {}
        
        # Check for rate_per_sqft
        if 'rate_per_sqft' in rate_data:
            rate_sqft = float(rate_data['rate_per_sqft'])
            normalized['rate_per_sqft'] = rate_sqft
            normalized['rate_per_sqm'] = rate_sqft * 10.764  # Convert to sqm
        
        # Check for rate_per_sqm
        elif 'rate_per_sqm' in rate_data:
            rate_sqm = float(rate_data['rate_per_sqm'])
            normalized['rate_per_sqm'] = rate_sqm
            normalized['rate_per_sqft'] = rate_sqm / 10.764  # Convert to sqft
        
        # Check for rate_per_sqyd (common in some states)
        elif 'rate_per_sqyd' in rate_data:
            rate_sqyd = float(rate_data['rate_per_sqyd'])
            # 1 sqyd = 9 sqft
            normalized['rate_per_sqft'] = rate_sqyd / 9
            normalized['rate_per_sqm'] = (rate_sqyd / 9) * 10.764
        
        return normalized
    
    def validate_record(self, record: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate a record before saving
        
        Args:
            record: Record to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        raw_data = record.get('raw_data', {})
        
        # Check required fields
        if not raw_data.get('district'):
            errors.append("Missing district")
        
        # Check for rate (at least one unit)
        has_rate = any(
            raw_data.get(key) for key in 
            ['rate_per_sqft', 'rate_per_sqm', 'rate_per_sqyd']
        )
        if not has_rate:
            errors.append("Missing rate information")
        else:
            # Validate rate value
            rate = None
            for key in ['rate_per_sqft', 'rate_per_sqm', 'rate_per_sqyd']:
                if raw_data.get(key):
                    try:
                        rate = float(raw_data[key])
                        break
                    except (ValueError, TypeError):
                        errors.append(f"Invalid rate format: {raw_data[key]}")
            
            if rate is not None:
                if rate <= 0:
                    errors.append("Rate must be positive")
                if rate > 1000000:  # Sanity check
                    errors.append(f"Rate seems unrealistic: {rate}")
        
        # Validate date if present
        if raw_data.get('effective_date'):
            try:
                date_obj = datetime.strptime(raw_data['effective_date'], '%Y-%m-%d')
                if date_obj > datetime.now():
                    errors.append("Future date not allowed")
            except ValueError:
                errors.append("Invalid date format (expected YYYY-MM-DD)")
        
        return len(errors) == 0, errors
    
    def calculate_quality_score(self, record: Dict[str, Any]) -> float:
        """
        Calculate data quality score (0.0 to 1.0)
        
        Args:
            record: Record to score
            
        Returns:
            Quality score between 0.0 and 1.0
        """
        score = 1.0
        raw_data = record.get('raw_data', {})
        
        # Deduct for missing optional fields
        if not raw_data.get('village'):
            score -= 0.1
        if not raw_data.get('zone'):
            score -= 0.1
        if not raw_data.get('location'):  # coordinates
            score -= 0.2
        
        # Check rate consistency if both units present
        if raw_data.get('rate_per_sqft') and raw_data.get('rate_per_sqm'):
            try:
                rate_sqft = float(raw_data['rate_per_sqft'])
                rate_sqm = float(raw_data['rate_per_sqm'])
                expected_sqm = rate_sqft * 10.764
                if abs(expected_sqm - rate_sqm) / expected_sqm > 0.1:
                    score -= 0.2
            except (ValueError, TypeError):
                score -= 0.1
        
        return max(0.0, score)
    
    def scrape(self) -> int:
        """
        Main scraping method - to be implemented by subclasses
        
        Returns:
            Number of records collected
        """
        raise NotImplementedError("Subclasses must implement scrape() method")
    
    def run(self) -> Dict[str, Any]:
        """
        Run the scraper and return summary
        
        Returns:
            Dictionary with collection summary
        """
        logger.info(f"Starting collection from {self.source_name}")
        start_time = datetime.now()
        
        try:
            record_count = self.scrape()
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            summary = {
                'source': self.source_name,
                'status': 'success',
                'records_collected': record_count,
                'output_file': str(self.output_file),
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': duration
            }
            
            logger.info(f"Collection completed: {record_count} records in {duration:.2f}s")
            return summary
            
        except Exception as e:
            logger.error(f"Collection failed: {e}", exc_info=True)
            return {
                'source': self.source_name,
                'status': 'failed',
                'error': str(e),
                'start_time': start_time.isoformat(),
                'end_time': datetime.now().isoformat()
            }

