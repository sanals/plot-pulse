"""
Magicbricks API-based scraper using the propertySearch.html endpoint.
Much more efficient than HTML scraping - gets JSON directly!
"""

from base_scraper import BaseScraper
from typing import List, Dict, Any, Optional, Tuple
import logging
import json
from datetime import datetime
from geocoding_utils import get_geocoder

logger = logging.getLogger(__name__)


# City codes for Magicbricks API
# Auto-discovered using homepageAutoSuggest API
# See discovered_city_codes.py for full list (226+ cities)
# Import ALL discovered city codes - don't hardcode!
try:
    from discovered_city_codes import CITY_CODES as DISCOVERED_CODES
    # Use ALL discovered cities - they were all found, so use them!
    CITY_CODES = DISCOVERED_CODES.copy()
    
    # Special handling for cities with different names
    if 'Chennai' not in CITY_CODES and 'Madras' in CITY_CODES:
        CITY_CODES['Chennai'] = CITY_CODES['Madras']
    
    # Remove any None values (shouldn't be any, but just in case)
    CITY_CODES = {k: v for k, v in CITY_CODES.items() if v is not None}
    
except ImportError:
    # Fallback if discovered_city_codes.py doesn't exist
    CITY_CODES = {
        'Mumbai': '4320',
    'New Delhi': '2624',
    'Bengaluru': '3327',
    'Hyderabad': '2060',
    'Chennai': '5196',  # Listed as 'Madras' in API
    'Pune': '4378',
    'Kolkata': '6903',
    'Ahmedabad': '2690',
    
    # Tier 2 Cities
    'Gurgaon': '2951',
    'Noida': '6403',
    'Faridabad': '2944',
    'Thane': '4442',
    'Navi Mumbai': '4341',
    'Lucknow': '6317',
    'Jaipur': '4949',
    'Kanpur': '6245',
    'Nagpur': '4327',
    'Indore': '3886',
    'Chandigarh': '2481',
    'Bhopal': '3808',
    'Visakhapatnam': '2202',
    'Patna': '2453',
    'Vadodara': '2899',
    'Ghaziabad': None,  # Not found in discovery
    'Agra': '5931',
    'Nashik': '4339',
    'Faridabad': '2944',
    'Meerut': '6354',
    'Rajkot': '2859',
    'Varanasi': '6586',
    'Srinagar': '3147',
    'Amritsar': '4724',
    'Allahabad': None,  # Not found
    'Ranchi': None,  # Not found
    'Coimbatore': '5216',
    'Jabalpur': None,  # Not found
    'Gwalior': '3871',
    'Vijayawada': None,  # Not found
    'Jodhpur': '4957',
    'Madurai': '5420',
    'Raipur': '2562',
    'Kota': None,  # Not found
    'Guwahati': None,  # Not found
    'Chandigarh': '2481',
    'Solapur': '4429',
    'Hubli Dharwad': '3413',
    'Tirupur': '7081',
    'Mysore': '3493',
    'Tirunelveli': '5801',
    'Bhubaneswar': '4596',
    'Salem': '5666',
    'Warangal': '2205',
    'Mira-Bhayandar': None,  # Not found
    'Thiruvananthapuram': None,  # Not found
    'Bhiwandi': '4152',
    'Saharanpur': None,  # Not found
    'Gorakhpur': None,  # Not found
    'Guntur': None,  # Not found
    'Bikaner': None,  # Not found
    'Amravati': None,  # Not found
    'Noida': '6403',
    'Jamshedpur': '3225',
    'Bhilai': '7085',
    'Cuttack': None,  # Not found
    'Firozabad': None,  # Not found
    'Kochi': '3637',
    'Bhavnagar': None,  # Not found
    'Dehradun': None,  # Not found
    'Durgapur': None,  # Not found
    'Asansol': None,  # Not found
    'Nanded Waghala': None,  # Not found
    'Kolhapur': '4274',
    'Ajmer': None,  # Not found
    'Gulbarga': None,  # Not found
    'Jamnagar': None,  # Not found
    'Ujjain': None,  # Not found
    'Loni': None,  # Not found
    'Siliguri': None,  # Not found
    'Jhansi': None,  # Not found
    'Ulhasnagar': None,  # Not found
    'Jammu': None,  # Not found
    'Sangli-Miraj & Kupwad': None,  # Not found
    'Mangalore': '3475',
    'Erode': None,  # Not found
    'Belgaum': '3334',
    'Ambattur': None,  # Not found
    'Tirunelveli': '5801',
    'Malegaon': None,  # Not found
    'Gaya': None,  # Not found
    'Jalgaon': None,  # Not found
    'Udaipur': None,  # Not found
    'Maheshtala': None,  # Not found
    'Tirupati': '2188',
    'Davanagere': None,  # Not found
    'Kozhikode': None,  # Not found
    'Akola': None,  # Not found
    'Kurnool': None,  # Not found
    'Rajpur Sonarpur': None,  # Not found
    'Bokaro Steel City': None,  # Not found
    'South Dumdum': None,  # Not found
    'Bellary': '3335',
    'Patiala': '4830',
    'Gopalpur': None,  # Not found
    'Agartala': '5901',
    'Bhagalpur': None,  # Not found
    'Muzaffarnagar': None,  # Not found
    'Bhatpara': None,  # Not found
    'Panihati': None,  # Not found
    'Latur': None,  # Not found
    'Dhule': None,  # Not found
    'Rohtak': None,  # Not found
    'Korba': None,  # Not found
    'Bhilwara': '4901',
    'Brahmapur': None,  # Not found
    'Muzaffarpur': None,  # Not found
    'Ahmednagar': '4122',
    'Mathura': None,  # Not found
    'Kollam': '3641',
    'Avadi': None,  # Not found
    'Kadapa': None,  # Not found
    'Anantapur': None,  # Not found
    'Kamarhati': None,  # Not found
    'Sambalpur': None,  # Not found
    'Bilaspur': None,  # Not found
    'Shahjahanpur': None,  # Not found
    'Satara': '4402',
    'Bijapur': None,  # Not found
    'Rampur': None,  # Not found
    'Shivamogga': None,  # Not found
    'Chandrapur': '4166',
    'Junagadh': None,  # Not found
    'Thrissur': None,  # Not found
    'Alwar': None,  # Not found
    'Bardhaman': None,  # Not found
    'Kulti': None,  # Not found
    'Nizamabad': None,  # Not found
    'Parbhani': None,  # Not found
    'Tumkur': None,  # Not found
    'Khammam': None,  # Not found
    'Ozhukarai': None,  # Not found
    'Bihar Sharif': None,  # Not found
    'Panipat': '2990',
    'Darbhanga': None,  # Not found
    'Bally': None,  # Not found
    'Aizawl': None,  # Not found
    'Dewas': None,  # Not found
    'Ichalkaranji': None,  # Not found
    'Karnal': None,  # Not found
    'Bathinda': None,  # Not found
    'Jalna': None,  # Not found
    'Eluru': None,  # Not found
    'Barasat': None,  # Not found
    'Kirari Suleman Nagar': None,  # Not found
    'Purnia': None,  # Not found
    'Satna': '4063',
    'Mau': None,  # Not found
    'Sonipat': None,  # Not found
    'Farrukhabad': '6123',
    'Sagar': None,  # Not found
    'Rourkela': None,  # Not found
    'Durg': None,  # Not found
    'Imphal': None,  # Not found
    'Ratlam': None,  # Not found
    'Hapur': None,  # Not found
    'Anantapur': None,  # Not found
    'Arrah': None,  # Not found
    'Karimnagar': None,  # Not found
    'Etawah': None,  # Not found
    'Ambarnath': None,  # Not found
    'North Dumdum': None,  # Not found
    'Bharatpur': None,  # Not found
    'Begusarai': None,  # Not found
    'New Delhi': '2624',
    'Gandhidham': None,  # Not found
    'Baranagar': None,  # Not found
    'Tiruvottiyur': None,  # Not found
    'Puducherry': None,  # Not found
    'Sikar': None,  # Not found
    'Thoothukudi': None,  # Not found
    'Rewa': None,  # Not found
    'Mirzapur': None,  # Not found
    'Raichur': None,  # Not found
    'Pali': None,  # Not found
    'Khora': None,  # Not found
    'Yamunanagar': None,  # Not found
    'Katihar': None,  # Not found
    'Hardwar': None,  # Not found
    'Banda': '5994',
    'Etah': None,  # Not found
    'Haldia': None,  # Not found
    'Nandyal': None,  # Not found
    'Morena': None,  # Not found
    'Amroha': None,  # Not found
    'Anand': None,  # Not found
    'Bhind': '3806',
    'Bhalswa Jahangir Pur': None,  # Not found
    'Madhyamgram': None,  # Not found
    'Bhiwani': '2934',
    'Berhampore': None,  # Not found
    'Ambala': None,  # Not found
    'Sri Ganganagar': None,  # Not found
    'Baidyabati': None,  # Not found
    'Morvi': None,  # Not found
    'Raigarh': None,  # Not found
    'Bansberia': None,  # Not found
    'Fatehpur': None,  # Not found
    'Bangaon': None,  # Not found
    'Pallavaram': None,  # Not found
    'Gandhinagar': None,  # Not found
    'Bhadravati': None,  # Not found
    'Bhiwadi': '4904',
    'Naihati': None,  # Not found
    'Serampore': None,  # Not found
    'Sultan Pur Majra': None,  # Not found
    'Bidhan Nagar': None,  # Not found
    'Bally': None,  # Not found
    'Bhatpara': None,  # Not found
    'Kamarhati': None,  # Not found
    'Panchkula': '2989',
    'Burhanpur': None,  # Not found
    'Khandwa': None,  # Not found
    'Nadiad': None,  # Not found
    'Baran': None,  # Not found
    'Uluberia': None,  # Not found
    'Jaunpur': None,  # Not found
    'Adoni': None,  # Not found
    'Hospet': None,  # Not found
    'Tonk': None,  # Not found
    'Jamalpur': None,  # Not found
    'Hugli': None,  # Not found
    'Alappuzha': None,  # Not found
    'Kadiri': None,  # Not found
    'Chittoor': None,  # Not found
    'Bettiah': None,  # Not found
    'Batala': None,  # Not found
    'Orai': None,  # Not found
    'Haldwani-cum-Kathgodam': None,  # Not found
    'Vidisha': None,  # Not found
    'Saharsa': None,  # Not found
    'Thanesar': None,  # Not found
    'Chittaranjan': None,  # Not found
    'Veraval': None,  # Not found
    'Lakhimpur': None,  # Not found
    'Sitapur': None,  # Not found
    'Hindupur': None,  # Not found
    'Santipur': None,  # Not found
    'Balurghat': None,  # Not found
    'Bansdih': None,  # Not found
    'Banda': '5994',
    'Mandvi': None,  # Not found
    'Nabadwip': None,  # Not found
    'Baran': None,  # Not found
    'Panipat': '2990',
    'Bhiwani': '2934',
    'Bhind': '3806',
    'Banda': '5994',
    'Farrukhabad': '6123',
    'Satna': '4063',
    'Ahmednagar': '4122',
    'Satara': '4402',
    'Chandrapur': '4166',
    'Panipat': '2990',
    'Bhiwani': '2934',
    'Panchkula': '2989',
    'Bhiwadi': '4904',
    'Bhilwara': '4901',
    'Bhind': '3806',
    'Banda': '5994',
    'Farrukhabad': '6123',
    'Satna': '4063',
    'Ahmednagar': '4122',
    'Satara': '4402',
    'Chandrapur': '4166',
    'Panipat': '2990',
    'Bhiwani': '2934',
    'Panchkula': '2989',
    'Bhiwadi': '4904',
    }
    # Add any missing major cities from discovered codes
    major_cities = ['Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 
                   'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida', 'Thane', 'Navi Mumbai',
                   'Lucknow', 'Jaipur', 'Kanpur', 'Nagpur', 'Indore', 'Chandigarh',
                   'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Agra', 'Nashik',
                   'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Coimbatore',
                   'Gwalior', 'Jodhpur', 'Madurai', 'Raipur', 'Solapur', 'Hubli Dharwad',
                   'Tirupur', 'Mysore', 'Tirunelveli', 'Bhubaneswar', 'Salem', 'Warangal',
                   'Bhiwandi', 'Jamshedpur', 'Bhilai', 'Kochi', 'Kolhapur', 'Mangalore',
                   'Belgaum', 'Tirupati', 'Bellary', 'Patiala', 'Agartala', 'Ahmednagar',
                   'Kollam', 'Satara', 'Chandrapur', 'Panipat', 'Bhiwani', 'Panchkula',
                   'Bhiwadi', 'Bhilwara', 'Bhind', 'Banda', 'Farrukhabad', 'Satna']
    
    for city in major_cities:
        # Try exact match first
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
except ImportError:
    # Fallback if discovered_city_codes.py doesn't exist
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
    
    def __init__(self):
        super().__init__(
            source_name="magicbricks_api",
            base_url="https://www.magicbricks.com",
            delay_seconds=1.0  # Can be faster with API
        )
        # Start with cities we have codes for
        self.cities = [city for city, code in CITY_CODES.items() if code]
        self.geocoder = get_geocoder()
        
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
                                'raw_listing': listing  # Save raw for later processing
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

