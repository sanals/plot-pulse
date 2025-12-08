"""
Magicbricks API-based scraper using the propertySearch.html endpoint.
FIXED VERSION - Uses ALL discovered city codes, no hardcoded "Not found" entries!
"""

from base_scraper import BaseScraper
from typing import List, Dict, Any, Optional, Tuple
import logging
import json
import random
import time
from datetime import datetime
from geocoding_utils import get_geocoder

logger = logging.getLogger(__name__)


# City codes for Magicbricks API
# Auto-discovered using homepageAutoSuggest API - 226+ cities found!
# See discovered_city_codes.py for full list
try:
    from discovered_city_codes import CITY_CODES as DISCOVERED_CODES
    # Use ALL discovered cities - they were all found, so use them!
    CITY_CODES = DISCOVERED_CODES.copy()
    
    # Special handling for cities with different names
    if 'Chennai' not in CITY_CODES and 'Madras' in CITY_CODES:
        CITY_CODES['Chennai'] = CITY_CODES['Madras']
    
    # Remove any None values (shouldn't be any, but just in case)
    CITY_CODES = {k: v for k, v in CITY_CODES.items() if v is not None}
    
    logger.info(f"Loaded {len(CITY_CODES)} cities from discovered_city_codes.py")
    
except ImportError:
    # Fallback if discovered_city_codes.py doesn't exist
    logger.warning("discovered_city_codes.py not found, using fallback list")
    CITY_CODES = {
        'Mumbai': '4320',
        'New Delhi': '2624',
        'Bengaluru': '3327',
        'Hyderabad': '2060',
        'Chennai': '5196',  # Listed as 'Madras'
        'Pune': '4378',
        'Kolkata': '6903',
        'Ahmedabad': '2690',
    }

# Property type codes
PROPERTY_TYPES = {
    'plot': '10003',  # Plot/Land
    'flat': '10001',  # Apartment
    'house': '10002',  # House/Villa
}


class MagicbricksAPIScraper(BaseScraper):
    """API-based scraper for Magicbricks"""
    
    def __init__(self, max_cities: Optional[int] = None):
        """
        Initialize Magicbricks API scraper
        
        Args:
            max_cities: Limit number of cities to scrape (for testing). None = all cities.
        """
        super().__init__(
            source_name="magicbricks_api",
            base_url="https://www.magicbricks.com",
            delay_seconds=3.0  # Conservative delay to avoid rate limits (2-4s with random variation)
        )
        # Use ALL cities from discovered codes (or limit for testing)
        all_cities = list(CITY_CODES.keys())
        self.cities = all_cities[:max_cities] if max_cities else all_cities
        self.geocoder = get_geocoder()
        
        # Visit homepage first to establish session and get cookies
        self._establish_session()
        
        if max_cities:
            logger.info(f"Limited to {max_cities} cities for testing")
    
    def _establish_session(self):
        """Visit homepage to establish session and get cookies (mimic real browser)"""
        try:
            logger.info("Establishing session by visiting homepage...")
            # Visit homepage first to get cookies
            home_response = self.make_request(
                self.base_url + '/',
                method='GET',
                headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            )
            if home_response:
                logger.info("Session established successfully")
                # Small delay after establishing session
                time.sleep(random.uniform(2, 4))
            else:
                logger.warning("Failed to establish session, continuing anyway...")
        except Exception as e:
            logger.warning(f"Error establishing session: {e}, continuing anyway...")
        
        # Separate output files
        date_str = self.output_file.stem.split('_')[-1]
        self.plots_file = self.output_dir / f"magicbricks_api_plots_{date_str}.jsonl"
        self.flats_file = self.output_dir / f"magicbricks_api_flats_{date_str}.jsonl"
    
    def get_city_code(self, city: str) -> Optional[str]:
        """Get city code for API"""
        return CITY_CODES.get(city)
    
    def fetch_listings_api(self, city: str, property_type: str, page: int = 1) -> Optional[Dict]:
        """
        Fetch listings from API
        
        Args:
            city: City name
            property_type: 'plot' or 'flat'
            page: Page number
            
        Returns:
            API response JSON or None
        """
        city_code = self.get_city_code(city)
        if not city_code:
            logger.warning(f"No city code found for {city}")
            return None
        
        prop_type_code = PROPERTY_TYPES.get(property_type)
        if not prop_type_code:
            logger.warning(f"Invalid property type: {property_type}")
            return None
        
        url = f"{self.base_url}/mbsrp/propertySearch.html"
        
        params = {
            'editSearch': 'Y',
            'category': 'S',  # Sale
            'propertyType': prop_type_code,
            'city': city_code,
            'page': str(page),
            'groupstart': str((page - 1) * 30),  # 30 items per page typically
            'offset': '0',
            'maxOffset': '1000',  # Large number to get all
            'sortBy': 'premiumRecent',
            'postedSince': '-1',  # All time
            'pType': prop_type_code,
            'isNRI': 'N',
            'multiLang': 'en'
        }
        
        # Headers will be set by base_scraper with user-agent rotation
        # Add API-specific headers to mimic browser AJAX request
        headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': f'{self.base_url}/',
            'Origin': self.base_url,
            'X-Requested-With': 'XMLHttpRequest',  # Mimic AJAX request
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }
        
        response = self.make_request(url, method='GET', params=params, headers=headers)
        
        if not response:
            logger.debug(f"No response for {city} {property_type} page {page}")
            return None
        
        # Check if response is empty
        if not response.text or len(response.text.strip()) == 0:
            logger.warning(f"Empty response for {city} {property_type} page {page}")
            return None
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        if 'application/json' not in content_type:
            logger.warning(f"Unexpected content type for {city}: {content_type}. Response preview: {response.text[:200]}")
            return None
        
        try:
            data = response.json()
            return data
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {city} {property_type} page {page}: {e}")
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            logger.debug(f"Response text (first 500 chars): {response.text[:500]}")
            # Some cities might return empty or HTML - that's okay, just skip
            return None
        except Exception as e:
            logger.error(f"Unexpected error parsing response for {city}: {e}")
            return None
    
    def parse_api_listing(self, listing: Dict[str, Any], city: str) -> Tuple[Dict[str, Any], str]:
        """
        Parse API listing to hierarchical structure
        
        Args:
            listing: API listing object
            city: City name
            
        Returns:
            Tuple of (hierarchical_record, property_type)
        """
        # Determine property type from API data
        prop_type_desc = listing.get('propTypeD', '').lower()
        if 'plot' in prop_type_desc or 'land' in prop_type_desc:
            property_type = 'plot'
        elif 'flat' in prop_type_desc or 'apartment' in prop_type_desc or 'bhk' in prop_type_desc:
            property_type = 'flat'
        else:
            # Default based on property type code or description
            property_type = 'plot' if 'plot' in prop_type_desc else 'flat'
        
        # Extract price
        price_amount = listing.get('price')
        price_text = listing.get('priceD', '')
        
        # Extract area
        area_sqft = listing.get('ca') or listing.get('caSqFt')  # Carpet area
        land_area = listing.get('la')  # Land area (for plots)
        
        # Use land area for plots, carpet area for flats
        if property_type == 'plot' and land_area:
            area_sqft = land_area
        elif property_type == 'flat' and area_sqft:
            pass  # Already set
        else:
            area_sqft = area_sqft or land_area
        
        # Extract location
        locality = listing.get('locSeoName') or listing.get('loc') or listing.get('lmtDName')
        address = listing.get('defaultAdddressGoogle') or listing.get('landmark') or listing.get('propertyTitle', '')
        
        # Extract coordinates
        latitude = None
        longitude = None
        
        # Try different coordinate fields
        if listing.get('pmtLat') and listing.get('pmtLong'):
            latitude = float(listing.get('pmtLat'))
            longitude = float(listing.get('pmtLong'))
        elif listing.get('ltcoordGeo'):
            # Might be in format "lat,lng"
            coords = str(listing.get('ltcoordGeo')).split(',')
            if len(coords) == 2:
                try:
                    latitude = float(coords[0].strip())
                    longitude = float(coords[1].strip())
                except:
                    pass
        
        # If no coordinates, geocode
        if not latitude or not longitude:
            geocode_address = address or f"{locality}, {city}, India"
            coords = self.geocoder.geocode(geocode_address, city=city)
            if coords:
                latitude = coords['latitude']
                longitude = coords['longitude']
        
        # Extract city name from API
        api_city = listing.get('ctName') or city
        
        # Build listing URL
        seo_url = listing.get('seoURL') or listing.get('url', '')
        if seo_url and not seo_url.startswith('http'):
            listing_url = f"{self.base_url}/{seo_url}"
        else:
            listing_url = seo_url or None
        
        # Build hierarchical record - save ALL listings, even without prices
        record = {
            'source': 'magicbricks',
            'country': 'India',
            'state': None,  # API doesn't provide state directly
            'district': None,
            'city': api_city or city,
            'locality': locality,
            'address': address or listing.get('propertyTitle', ''),
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude
            } if latitude and longitude else None,
            'price': {
                'amount': price_amount,
                'currency': 'INR',
                'text': price_text
            } if price_amount else None,
            'area': {
                'sqft': area_sqft,
                'sqm': area_sqft / 10.764 if area_sqft else None,
                'sqyd': area_sqft / 9 if area_sqft else None
            } if area_sqft else None,
            'property_type': property_type,
            'listing_url': listing_url,
            'title': listing.get('propertyTitle') or listing.get('seoDesc') or listing.get('dtldesc', 'Unknown'),
            'metadata': {
                'scraped_at': datetime.now().isoformat(),
                'api_listing_id': listing.get('id'),
                'enc_id': listing.get('encId'),
                'collection_date': datetime.now().isoformat(),
                'posted_date': listing.get('postDateT'),
                'price_per_sqft': listing.get('sqFtPrice'),
                'property_type_desc': listing.get('propTypeD'),
                'bedrooms': listing.get('bd'),
                'bathrooms': listing.get('bathD'),
            }
        }
        
        return record, property_type
    
    def scrape_property_type(self, city: str, property_type: str, max_pages: int = 100) -> int:
        """
        Scrape a specific property type for a city
        
        Args:
            city: City name
            property_type: 'plot' or 'flat'
            max_pages: Maximum pages to scrape
            
        Returns:
            Number of records collected
        """
        count = 0
        seen_ids = set()
        
        for page in range(1, max_pages + 1):
            logger.info(f"  {property_type.upper()} - Page {page}")
            
            api_data = self.fetch_listings_api(city, property_type, page)
            
            if not api_data:
                logger.warning(f"  No API data for {property_type} page {page}")
                break
            
            result_list = api_data.get('resultList', [])
            
            if not result_list or len(result_list) == 0:
                logger.info(f"  No more results for {property_type} at page {page}")
                break
            
            logger.info(f"  Found {len(result_list)} listings in API response")
            
            page_count = 0
            for listing in result_list:
                # Skip duplicates
                listing_id = listing.get('id') or listing.get('encId')
                if listing_id and listing_id in seen_ids:
                    continue
                seen_ids.add(listing_id)
                
                try:
                    record, detected_type = self.parse_api_listing(listing, city)
                    # Use the property type from search, not detection
                    record['property_type'] = property_type
                    
                    # Save ALL records - don't require price
                    if self.save_record_by_type(record, property_type):
                        count += 1
                        page_count += 1
                except Exception as e:
                    logger.debug(f"Error parsing listing (trying minimal): {e}")
                    # Save minimal record if full parsing fails
                    try:
                        minimal_record = {
                            'source': 'magicbricks',
                            'country': 'India',
                            'city': city,
                            'property_type': property_type,
                            'title': listing.get('propertyTitle') or listing.get('seoDesc') or listing.get('dtldesc', 'Unknown'),
                            'price': {
                                'amount': listing.get('price'),
                                'currency': 'INR',
                                'text': listing.get('priceD', '')
                            } if listing.get('price') else None,
                            'coordinates': {
                                'latitude': float(listing.get('pmtLat')) if listing.get('pmtLat') else None,
                                'longitude': float(listing.get('pmtLong')) if listing.get('pmtLong') else None
                            } if listing.get('pmtLat') and listing.get('pmtLong') else None,
                            'metadata': {
                                'api_listing_id': listing.get('id'),
                                'enc_id': listing.get('encId'),
                            }
                        }
                        if self.save_record_by_type(minimal_record, property_type):
                            count += 1
                            page_count += 1
                    except Exception as e2:
                        logger.warning(f"Failed to save minimal record: {e2}")
                        continue
            
            logger.info(f"  Saved {page_count} records from page {page} (Total: {count})")
            
            # If we got fewer results than expected, might be last page
            if len(result_list) < 20:  # Typically 30 per page
                logger.info(f"  Fewer results than expected, likely last page")
                break
        
        return count
    
    def save_record_by_type(self, record: Dict[str, Any], property_type: str) -> bool:
        """Save record to appropriate file"""
        output_file = self.plots_file if property_type == 'plot' else self.flats_file
        
        try:
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
            return True
        except Exception as e:
            logger.error(f"Error saving {property_type} record: {e}")
            return False
    
    def scrape_city(self, city: str, max_pages: int = 100) -> Tuple[int, int]:
        """Scrape both plots and flats for a city"""
        logger.info(f"Scraping PLOTS for {city}...")
        plot_count = self.scrape_property_type(city, 'plot', max_pages)
        
        logger.info(f"Scraping FLATS for {city}...")
        flat_count = self.scrape_property_type(city, 'flat', max_pages)
        
        return plot_count, flat_count
    
    def scrape(self) -> int:
        """Main scraping method"""
        total_plots = 0
        total_flats = 0
        
        logger.info(f"Scraping {len(self.cities)} cities")
        logger.info("Rate limiting: 3s base delay with random variation, breaks every 50 requests")
        
        # Randomize city order to avoid patterns
        cities_to_scrape = self.cities.copy()
        random.shuffle(cities_to_scrape)
        
        for idx, city in enumerate(cities_to_scrape):
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"Starting collection for {city}")
                logger.info(f"{'='*50}")
                
                plot_count, flat_count = self.scrape_city(city, max_pages=100)
                total_plots += plot_count
                total_flats += flat_count
                
                logger.info(f"Collected {plot_count} plots and {flat_count} flats from {city}")
                
                # Break between cities (10-30 seconds) to mimic human behavior
                if idx < len(cities_to_scrape) - 1:  # Don't wait after last city
                    break_time = random.uniform(10, 30)
                    logger.info(f"Break before next city: {break_time:.1f}s")
                    time.sleep(break_time)
                    
            except Exception as e:
                logger.error(f"Error scraping {city}: {e}", exc_info=True)
                # Wait before trying next city even on error
                if idx < len(cities_to_scrape) - 1:
                    time.sleep(random.uniform(5, 15))
                continue
        
        logger.info(f"\nTotal: {total_plots} plots, {total_flats} flats")
        return total_plots + total_flats


if __name__ == "__main__":
    import sys
    
    # Allow limiting cities via command line: python magicbricks_api_scraper.py 5
    max_cities = None
    if len(sys.argv) > 1:
        try:
            max_cities = int(sys.argv[1])
            print(f"⚠️  TESTING MODE: Limiting to {max_cities} cities")
        except ValueError:
            print(f"Invalid argument: {sys.argv[1]}. Use: python magicbricks_api_scraper.py [max_cities]")
            sys.exit(1)
    
    scraper = MagicbricksAPIScraper(max_cities=max_cities)
    summary = scraper.run()
    
    print(f"\n{'='*60}")
    print(f"Collection Summary")
    print(f"{'='*60}")
    print(f"Status: {summary['status']}")
    if summary['status'] == 'success':
        print(f"Total Records: {summary['records_collected']}")
        print(f"Plots File: {scraper.plots_file}")
        print(f"Flats File: {scraper.flats_file}")
        print(f"Duration: {summary['duration_seconds']:.2f}s")

