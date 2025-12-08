"""
Magicbricks API-based scraper - SIMPLIFIED VERSION
Uses discovered city codes from homepageAutoSuggest API
"""

from base_scraper import BaseScraper
from typing import List, Dict, Any, Optional, Tuple
import logging
import json
from datetime import datetime
from geocoding_utils import get_geocoder

logger = logging.getLogger(__name__)

# Import discovered city codes
try:
    from discovered_city_codes import CITY_CODES as DISCOVERED_CODES
    
    # Major cities for data collection
    MAJOR_CITIES = [
        'Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 
        'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida', 'Thane', 'Navi Mumbai',
        'Lucknow', 'Jaipur', 'Kanpur', 'Nagpur', 'Indore', 'Chandigarh',
        'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Agra', 'Nashik',
        'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Coimbatore',
        'Gwalior', 'Jodhpur', 'Madurai', 'Raipur', 'Solapur', 'Hubli Dharwad',
        'Tirupur', 'Mysore', 'Tirunelveli', 'Bhubaneswar', 'Salem', 'Warangal',
        'Bhiwandi', 'Jamshedpur', 'Bhilai', 'Kochi', 'Kolhapur', 'Mangalore',
        'Belgaum', 'Tirupati', 'Bellary', 'Patiala', 'Agartala', 'Ahmednagar',
        'Kollam', 'Satara', 'Chandrapur', 'Panipat', 'Bhiwani', 'Panchkula',
        'Bhiwadi', 'Bhilwara', 'Bhind', 'Banda', 'Farrukhabad', 'Satna'
    ]
    
    # Build CITY_CODES from discovered codes
    CITY_CODES = {}
    for city in MAJOR_CITIES:
        # Try exact match
        if city in DISCOVERED_CODES:
            CITY_CODES[city] = DISCOVERED_CODES[city]
        # Try case-insensitive match
        else:
            for disc_city, code in DISCOVERED_CODES.items():
                if city.lower() == disc_city.lower():
                    CITY_CODES[city] = code
                    break
        # Special cases
        if city == 'Chennai' and 'Madras' in DISCOVERED_CODES:
            CITY_CODES['Chennai'] = DISCOVERED_CODES['Madras']
    
    # Remove None values
    CITY_CODES = {k: v for k, v in CITY_CODES.items() if v is not None}
    
except ImportError:
    # Fallback
    CITY_CODES = {
        'Mumbai': '4320',
        'New Delhi': '2624',
        'Bengaluru': '3327',
        'Hyderabad': '2060',
        'Chennai': '5196',
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
    
    def __init__(self):
        super().__init__(
            source_name="magicbricks_api",
            base_url="https://www.magicbricks.com",
            delay_seconds=1.0
        )
        self.cities = list(CITY_CODES.keys())
        self.geocoder = get_geocoder()
        
        # Separate output files
        date_str = self.output_file.stem.split('_')[-1]
        self.plots_file = self.output_dir / f"magicbricks_api_plots_{date_str}.jsonl"
        self.flats_file = self.output_dir / f"magicbricks_api_flats_{date_str}.jsonl"
    
    def get_city_code(self, city: str) -> Optional[str]:
        """Get city code for API"""
        return CITY_CODES.get(city)
    
    def fetch_listings_api(self, city: str, property_type: str, page: int = 1) -> Optional[Dict]:
        """Fetch listings from API"""
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
            'category': 'S',
            'propertyType': prop_type_code,
            'city': city_code,
            'page': str(page),
            'groupstart': str((page - 1) * 30),
            'offset': '0',
            'maxOffset': '1000',
            'sortBy': 'premiumRecent',
            'postedSince': '-1',
            'pType': prop_type_code,
            'isNRI': 'N',
            'multiLang': 'en'
        }
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Referer': f'{self.base_url}/',
            'Origin': self.base_url
        }
        
        response = self.make_request(url, method='GET', params=params, headers=headers)
        
        if not response:
            return None
        
        try:
            return response.json()
        except Exception as e:
            logger.error(f"Error parsing JSON response: {e}")
            return None
    
    def parse_api_listing(self, listing: Dict[str, Any], city: str) -> Tuple[Dict[str, Any], str]:
        """Parse API listing to hierarchical structure"""
        # Determine property type
        prop_type_desc = listing.get('propTypeD', '').lower()
        if 'plot' in prop_type_desc or 'land' in prop_type_desc:
            property_type = 'plot'
        elif 'flat' in prop_type_desc or 'apartment' in prop_type_desc or 'bhk' in prop_type_desc:
            property_type = 'flat'
        else:
            property_type = 'plot' if 'plot' in prop_type_desc else 'flat'
        
        # Extract price
        price_amount = listing.get('price')
        price_text = listing.get('priceD', '')
        
        # Extract area
        area_sqft = listing.get('ca') or listing.get('caSqFt')
        land_area = listing.get('la')
        
        if property_type == 'plot' and land_area:
            area_sqft = land_area
        elif property_type == 'flat' and area_sqft:
            pass
        else:
            area_sqft = area_sqft or land_area
        
        # Extract location
        locality = listing.get('locSeoName') or listing.get('loc') or listing.get('lmtDName')
        address = listing.get('defaultAdddressGoogle') or listing.get('landmark') or listing.get('propertyTitle', '')
        
        # Extract coordinates
        latitude = None
        longitude = None
        
        if listing.get('pmtLat') and listing.get('pmtLong'):
            latitude = float(listing.get('pmtLat'))
            longitude = float(listing.get('pmtLong'))
        elif listing.get('ltcoordGeo'):
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
        
        # Build hierarchical record
        record = {
            'source': 'magicbricks',
            'country': 'India',
            'state': None,
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
        """Scrape a specific property type for a city"""
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
                listing_id = listing.get('id') or listing.get('encId')
                if listing_id and listing_id in seen_ids:
                    continue
                seen_ids.add(listing_id)
                
                try:
                    record, detected_type = self.parse_api_listing(listing, city)
                    record['property_type'] = property_type
                    
                    if self.save_record_by_type(record, property_type):
                        count += 1
                        page_count += 1
                except Exception as e:
                    logger.debug(f"Error parsing listing (trying minimal): {e}")
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
                    except:
                        pass
                    continue
            
            logger.info(f"  Saved {page_count} records from page {page} (Total: {count})")
            
            if len(result_list) < 20:
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
        
        logger.info(f"Scraping {len(self.cities)} cities: {', '.join(self.cities[:10])}...")
        
        for city in self.cities:
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"Starting collection for {city}")
                logger.info(f"{'='*50}")
                
                plot_count, flat_count = self.scrape_city(city, max_pages=100)
                total_plots += plot_count
                total_flats += flat_count
                
                logger.info(f"Collected {plot_count} plots and {flat_count} flats from {city}")
            except Exception as e:
                logger.error(f"Error scraping {city}: {e}", exc_info=True)
                continue
        
        logger.info(f"\nTotal: {total_plots} plots, {total_flats} flats")
        return total_plots + total_flats


if __name__ == "__main__":
    scraper = MagicbricksAPIScraper()
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

