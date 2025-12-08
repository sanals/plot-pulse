"""
Updated Magicbricks scraper with hierarchical data structure and property type detection.
Stores flats and plots separately with hierarchical organization.
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional, Tuple
import re
import logging
import json
from datetime import datetime
from urllib.parse import urljoin
from geocoding_utils import get_geocoder

logger = logging.getLogger(__name__)


class MagicbricksScraperV2(BaseScraper):
    """Updated scraper with hierarchical data structure and property type detection"""
    
    def __init__(self):
        super().__init__(
            source_name="magicbricks_listings",
            base_url="https://www.magicbricks.com",
            delay_seconds=3.0
        )
        self.cities = [
            'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 
            'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
        ]
        self.geocoder = get_geocoder()
        
        # Separate output files for flats and plots
        date_str = self.output_file.stem.split('_')[-1]  # Extract date from filename
        self.plots_file = self.output_dir / f"magicbricks_plots_{date_str}.jsonl"
        self.flats_file = self.output_dir / f"magicbricks_flats_{date_str}.jsonl"
    
    def detect_property_type(self, title: str) -> str:
        """
        Detect if listing is a plot/land or flat/apartment
        
        Args:
            title: Listing title
            
        Returns:
            'plot' or 'flat'
        """
        title_lower = title.lower()
        
        # Strong plot/land indicators (check first)
        plot_keywords = [
            'plot', 'land', 'plot/land', 'residential plot', 'commercial plot',
            'plot for sale', 'land for sale', 'vacant land', 'open plot',
            'residential land', 'commercial land', 'agricultural land',
            'plot available', 'land available', 'plot/land for sale'
        ]
        if any(keyword in title_lower for keyword in plot_keywords):
            return 'plot'
        
        # Strong flat/apartment indicators
        flat_keywords = [
            'flat', 'apartment', 'bhk', 'residential apartment', 'unit',
            'flat for sale', 'apartment for sale', '2 bhk', '3 bhk', '4 bhk',
            '1 bhk', 'studio', 'penthouse', 'villa', 'house', 'residential unit'
        ]
        if any(keyword in title_lower for keyword in flat_keywords):
            return 'flat'
        
        # Office/Commercial space - treat as plot/land category
        commercial_keywords = ['office space', 'commercial space', 'shop', 'retail']
        if any(keyword in title_lower for keyword in commercial_keywords):
            return 'plot'  # Commercial properties closer to plots
        
        # Default based on context - if searching for plots, default to plot
        # Otherwise default to flat
        return 'flat'  # Default to flat since we're getting mostly flats
    
    def extract_location_hierarchy(self, title: str, location: str, city: str) -> Dict[str, Any]:
        """
        Extract hierarchical location data from title and location string
        
        Args:
            title: Listing title (often contains location info)
            location: Location string from listing
            city: City name
            
        Returns:
            Hierarchical location dictionary
        """
        hierarchy = {
            'country': 'India',
            'state': None,
            'district': None,
            'city': city,
            'locality': None,
            'address': location or title,
            'latitude': None,
            'longitude': None
        }
        
        # Try to extract locality from title or location
        # Common patterns: "in [Locality], [City]" or "[Locality], [City]"
        location_text = location or title
        
        if location_text:
            # Try to extract locality (area/neighborhood)
            # Pattern: "in [Locality], [City]" or "[Locality], [City]"
            match = re.search(r'(?:in\s+)?([^,]+?)(?:,\s*)?(?:' + re.escape(city) + r')', location_text, re.I)
            if match:
                locality = match.group(1).strip()
                # Clean up common prefixes
                locality = re.sub(r'^(in|at|near)\s+', '', locality, flags=re.I).strip()
                hierarchy['locality'] = locality if locality and len(locality) > 2 else None
        
        # Geocode to get coordinates
        address_for_geocoding = location or f"{city}, India"
        coords = self.geocoder.geocode(address_for_geocoding, city=city, state=None)
        
        if coords:
            hierarchy['latitude'] = coords['latitude']
            hierarchy['longitude'] = coords['longitude']
        
        return hierarchy
    
    def build_hierarchical_record(self, raw_data: Dict[str, Any], city: str) -> Dict[str, Any]:
        """
        Build hierarchical data structure: source > country > state > district > ... > coordinates > price
        
        Args:
            raw_data: Raw listing data
            city: City name
            
        Returns:
            Hierarchical record structure
        """
        property_type = self.detect_property_type(raw_data.get('title', ''))
        location_hierarchy = self.extract_location_hierarchy(
            raw_data.get('title', ''),
            raw_data.get('location'),
            city
        )
        
        # Build hierarchical structure
        record = {
            'source': 'magicbricks',
            'country': location_hierarchy['country'],
            'state': location_hierarchy['state'],
            'district': location_hierarchy['district'],
            'city': location_hierarchy['city'],
            'locality': location_hierarchy['locality'],
            'address': location_hierarchy['address'],
            'coordinates': {
                'latitude': location_hierarchy['latitude'],
                'longitude': location_hierarchy['longitude']
            } if location_hierarchy['latitude'] else None,
            'price': {
                'amount': raw_data.get('price'),
                'currency': 'INR',
                'text': raw_data.get('price_text')
            } if raw_data.get('price') else None,
            'area': {
                'sqft': raw_data.get('area_sqft'),
                'sqm': raw_data.get('area_sqm'),
                'sqyd': raw_data.get('area_sqyd')
            } if any([raw_data.get('area_sqft'), raw_data.get('area_sqm'), raw_data.get('area_sqyd')]) else None,
            'property_type': property_type,
            'listing_url': raw_data.get('listing_url'),
            'title': raw_data.get('title'),
            'metadata': {
                'scraped_at': raw_data.get('scraped_at'),
                'source_url': raw_data.get('source_url'),
                'collection_date': raw_data.get('collection_date')
            }
        }
        
        return record, property_type
    
    def save_record_by_type(self, record: Dict[str, Any], property_type: str):
        """
        Save record to appropriate file based on property type
        
        Args:
            record: Hierarchical record
            property_type: 'plot' or 'flat'
        """
        output_file = self.plots_file if property_type == 'plot' else self.flats_file
        
        try:
            with open(output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
            return True
        except Exception as e:
            logger.error(f"Error saving {property_type} record: {e}")
            return False
    
    def build_search_url(self, city: str, page: int = 1, property_type: str = None) -> str:
        """
        Build search URL
        
        Args:
            city: City name
            page: Page number
            property_type: 'plot' (10003) or 'flat' (10001) or None for all
        """
        # Property type codes: 10001=Apartment, 10002=House/Villa, 10003=Plot/Land
        if property_type == 'plot':
            url = f"{self.base_url}/property-for-sale/residential-real-estate?proptype=10003&cityName={city}"
        elif property_type == 'flat':
            url = f"{self.base_url}/property-for-sale/residential-real-estate?proptype=10001&cityName={city}"
        else:
            # General search - get both types
            url = f"{self.base_url}/property-for-sale/residential-real-estate?cityName={city}"
        
        if page > 1:
            url += f"&page={page}"
        return url
    
    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text"""
        try:
            cleaned = price_text.replace('₹', '').replace(',', '').replace('Rs.', '').replace('Rs', '')
            cleaned = cleaned.replace(' ', '').strip()
            
            multiplier = 1
            if 'lakh' in cleaned.lower() or 'lac' in cleaned.lower():
                multiplier = 100000
                cleaned = re.sub(r'[lL]akh[s]?|[lL]ac[s]?', '', cleaned, flags=re.IGNORECASE)
            elif 'crore' in cleaned.lower() or 'cr' in cleaned.lower():
                multiplier = 10000000
                cleaned = re.sub(r'[cC]rore[s]?|[cC]r[s]?', '', cleaned, flags=re.IGNORECASE)
            
            match = re.search(r'[\d.]+', cleaned)
            if match:
                return float(match.group()) * multiplier
        except Exception as e:
            logger.debug(f"Error parsing price '{price_text}': {e}")
        return None
    
    def extract_area(self, area_text: str) -> Optional[Dict[str, float]]:
        """Extract area in different units"""
        try:
            match = re.search(r'([\d,]+\.?\d*)\s*(sqft|sqm|sqyd|sq\.ft|sq\.m|sq\.yd|sq\s*ft|sq\s*m|sq\s*yd)', 
                            area_text, re.IGNORECASE)
            if not match:
                return None
            
            value = float(match.group(1).replace(',', ''))
            unit = match.group(2).lower().replace(' ', '')
            
            result = {}
            if 'sqft' in unit or 'sq.ft' in unit:
                result['sqft'] = value
                result['sqm'] = value / 10.764
                result['sqyd'] = value / 9
            elif 'sqm' in unit or 'sq.m' in unit:
                result['sqm'] = value
                result['sqft'] = value * 10.764
                result['sqyd'] = (value * 10.764) / 9
            elif 'sqyd' in unit or 'sq.yd' in unit:
                result['sqyd'] = value
                result['sqft'] = value * 9
                result['sqm'] = (value * 9) / 10.764
            
            return result
        except Exception as e:
            logger.debug(f"Error parsing area '{area_text}': {e}")
        return None
    
    def parse_listing_card(self, card_element, city: str) -> Optional[tuple]:
        """
        Parse a listing card and return hierarchical record with property type
        
        Returns:
            Tuple of (record_dict, property_type) or None
        """
        try:
            title = None
            price = None
            price_text = None
            area = None
            location = None
            listing_url = None
            
            # Extract title
            title_selectors = [
                ('h2', {'class': re.compile(r'.*title.*', re.I)}),
                ('h2', {'class': re.compile(r'.*heading.*', re.I)}),
                ('a', {'class': re.compile(r'.*title.*', re.I)}),
            ]
            
            for tag, attrs in title_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    title = elem.get_text(strip=True)
                    link_elem = card_element.find('a', href=True)
                    if link_elem:
                        listing_url = urljoin(self.base_url, link_elem.get('href', ''))
                    break
            
            # Extract price
            price_selectors = [
                ('div', {'class': re.compile(r'.*price.*', re.I)}),
                ('span', {'class': re.compile(r'.*price.*', re.I)}),
            ]
            
            for tag, attrs in price_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    price_text = elem.get_text(strip=True)
                    price = self.extract_price(price_text)
                    if price:
                        break
            
            # Extract area
            area_selectors = [
                ('div', {'class': re.compile(r'.*area.*', re.I)}),
                ('span', {'class': re.compile(r'.*sqft.*', re.I)}),
            ]
            
            for tag, attrs in area_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    area_text = elem.get_text(strip=True)
                    area = self.extract_area(area_text)
                    if area:
                        break
            
            # Extract location
            location_selectors = [
                ('div', {'class': re.compile(r'.*location.*', re.I)}),
                ('span', {'class': re.compile(r'.*locality.*', re.I)}),
            ]
            
            for tag, attrs in location_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    location = elem.get_text(strip=True)
                    break
            
            if not title:
                return None
            
            # Build raw data
            raw_data = {
                'title': title,
                'price': price,
                'price_text': price_text,
                'area_sqft': area.get('sqft') if area else None,
                'area_sqm': area.get('sqm') if area else None,
                'area_sqyd': area.get('sqyd') if area else None,
                'location': location,
                'listing_url': listing_url,
                'source': 'magicbricks',
                'scraped_at': datetime.now().isoformat(),
                'collection_date': datetime.now().isoformat()
            }
            
            # Build hierarchical record
            record, property_type = self.build_hierarchical_record(raw_data, city)
            
            return record, property_type
            
        except Exception as e:
            logger.debug(f"Error parsing listing card: {e}")
            return None
    
    def scrape_city(self, city: str, max_pages: int = 50) -> Tuple[int, int]:
        """
        Scrape city - scrape plots and flats separately for better coverage
        
        Args:
            city: City name
            max_pages: Maximum pages to scrape per property type
            
        Returns:
            Tuple of (plot_count, flat_count)
        """
        plot_count = 0
        flat_count = 0
        
        # Scrape plots specifically
        logger.info(f"Scraping PLOTS for {city}...")
        plot_count = self._scrape_property_type(city, 'plot', max_pages)
        
        # Scrape flats specifically  
        logger.info(f"Scraping FLATS for {city}...")
        flat_count = self._scrape_property_type(city, 'flat', max_pages)
        
        return plot_count, flat_count
    
    def _scrape_property_type(self, city: str, property_type: str, max_pages: int) -> int:
        """Scrape a specific property type"""
        count = 0
        
        for page in range(1, max_pages + 1):
            logger.info(f"  {property_type.upper()} - Page {page}")
            
            url = self.build_search_url(city, page, property_type)
            response = self.make_request(url)
            
            if not response:
                logger.warning(f"  No response for {property_type} page {page}")
                break
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find listing cards
            listings = []
            card_patterns = [
                {'class': re.compile(r'.*card.*', re.I)},
                {'class': re.compile(r'.*listing.*', re.I)},
                {'class': re.compile(r'.*mb-srp.*', re.I)},  # MagicBricks SRP
            ]
            
            for pattern in card_patterns:
                found = soup.find_all('div', pattern)
                if found and len(found) > 0:
                    listings = found
                    break
            
            if not listings or len(listings) == 0:
                logger.info(f"  No more listings found for {property_type} at page {page}")
                break
            
            logger.info(f"  Found {len(listings)} listing cards")
            
            page_count = 0
            for listing_elem in listings:
                result = self.parse_listing_card(listing_elem, city)
                if result:
                    record, detected_type = result
                    # Override detected type with the search type (more accurate)
                    record['property_type'] = property_type
                    if self.save_record_by_type(record, property_type):
                        count += 1
                        page_count += 1
            
            logger.info(f"  Parsed {page_count} valid records from page {page}")
            
            # If we got very few listings, might be last page
            if len(listings) < 5:
                logger.info(f"  Very few listings ({len(listings)}), likely last page")
                break
            
            # If we got no valid records for 2 consecutive pages, stop
            if page_count == 0 and page > 1:
                logger.info(f"  No valid records on page {page}, checking if last page...")
                # Check one more page to be sure
                if page < max_pages:
                    continue
                else:
                    break
            
            # Check for explicit "no results" message
            page_text = soup.get_text().lower()
            if 'no results' in page_text or 'no listings' in page_text or 'no properties' in page_text:
                logger.info(f"  Found 'no results' message, stopping")
                break
        
        return count
    
    def scrape(self) -> int:
        """Main scraping method"""
        total_plots = 0
        total_flats = 0
        
        for city in self.cities:
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"Starting collection for {city}")
                logger.info(f"{'='*50}")
                
                plot_count, flat_count = self.scrape_city(city, max_pages=100)  # Scrape up to 100 pages per property type
                total_plots += plot_count
                total_flats += flat_count
                
                logger.info(f"Collected {plot_count} plots and {flat_count} flats from {city}")
            except Exception as e:
                logger.error(f"Error scraping {city}: {e}", exc_info=True)
                continue
        
        logger.info(f"\nTotal: {total_plots} plots, {total_flats} flats")
        return total_plots + total_flats


if __name__ == "__main__":
    import json
    from datetime import datetime
    
    scraper = MagicbricksScraperV2()
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

