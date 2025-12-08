"""
Working scraper for Magicbricks plot/land listings.
This version inspects the actual page structure and adapts.
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import re
import logging
from urllib.parse import urljoin, quote

logger = logging.getLogger(__name__)


class MagicbricksScraper(BaseScraper):
    """Scraper for Magicbricks plot/land listings"""
    
    def __init__(self):
        super().__init__(
            source_name="magicbricks_listings",
            base_url="https://www.magicbricks.com",
            delay_seconds=3.0
        )
        # Major cities to scrape
        self.cities = [
            'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 
            'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
        ]
    
    def build_search_url(self, city: str, page: int = 1) -> str:
        """
        Build search URL for plots in a city
        
        Args:
            city: City name
            page: Page number
            
        Returns:
            Search URL
        """
        # Property type 10003 = Plot/Land
        url = f"{self.base_url}/property-for-sale/residential-real-estate?proptype=10003&cityName={city}"
        if page > 1:
            url += f"&page={page}"
        
        return url
    
    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text"""
        try:
            # Remove currency symbols and commas
            cleaned = price_text.replace('₹', '').replace(',', '').replace('Rs.', '').replace('Rs', '')
            cleaned = cleaned.replace(' ', '').strip()
            
            # Handle "Lakh" and "Crore"
            multiplier = 1
            if 'lakh' in cleaned.lower() or 'lac' in cleaned.lower():
                multiplier = 100000
                cleaned = re.sub(r'[lL]akh[s]?|[lL]ac[s]?', '', cleaned, flags=re.IGNORECASE)
            elif 'crore' in cleaned.lower() or 'cr' in cleaned.lower():
                multiplier = 10000000
                cleaned = re.sub(r'[cC]rore[s]?|[cC]r[s]?', '', cleaned, flags=re.IGNORECASE)
            
            # Extract number
            match = re.search(r'[\d.]+', cleaned)
            if match:
                return float(match.group()) * multiplier
        except Exception as e:
            logger.debug(f"Error parsing price '{price_text}': {e}")
        
        return None
    
    def extract_area(self, area_text: str) -> Optional[Dict[str, float]]:
        """Extract area in different units"""
        try:
            # Extract number and unit
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
    
    def parse_listing_card(self, card_element) -> Optional[Dict[str, Any]]:
        """
        Parse a listing card - tries multiple selector patterns
        
        Args:
            card_element: BeautifulSoup element containing listing
            
        Returns:
            Parsed listing dictionary or None
        """
        try:
            # Try multiple common patterns for Magicbricks listings
            title = None
            price = None
            price_text = None
            area = None
            location = None
            listing_url = None
            
            # Pattern 1: Look for title in various places
            title_selectors = [
                ('h2', {'class': re.compile(r'.*title.*', re.I)}),
                ('h2', {'class': re.compile(r'.*heading.*', re.I)}),
                ('a', {'class': re.compile(r'.*title.*', re.I)}),
                ('div', {'class': re.compile(r'.*title.*', re.I)}),
                ('span', {'class': re.compile(r'.*title.*', re.I)}),
            ]
            
            for tag, attrs in title_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    title = elem.get_text(strip=True)
                    # Also check for link
                    link_elem = card_element.find('a', href=True)
                    if link_elem:
                        listing_url = urljoin(self.base_url, link_elem.get('href', ''))
                    break
            
            # Pattern 2: Look for price
            price_selectors = [
                ('div', {'class': re.compile(r'.*price.*', re.I)}),
                ('span', {'class': re.compile(r'.*price.*', re.I)}),
                ('div', {'class': re.compile(r'.*amount.*', re.I)}),
                ('span', {'class': re.compile(r'.*cost.*', re.I)}),
            ]
            
            for tag, attrs in price_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    price_text = elem.get_text(strip=True)
                    price = self.extract_price(price_text)
                    if price:
                        break
            
            # Pattern 3: Look for area
            area_selectors = [
                ('div', {'class': re.compile(r'.*area.*', re.I)}),
                ('span', {'class': re.compile(r'.*area.*', re.I)}),
                ('div', {'class': re.compile(r'.*size.*', re.I)}),
                ('span', {'class': re.compile(r'.*sqft.*', re.I)}),
            ]
            
            for tag, attrs in area_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    area_text = elem.get_text(strip=True)
                    area = self.extract_area(area_text)
                    if area:
                        break
            
            # Pattern 4: Look for location
            location_selectors = [
                ('div', {'class': re.compile(r'.*location.*', re.I)}),
                ('span', {'class': re.compile(r'.*location.*', re.I)}),
                ('div', {'class': re.compile(r'.*address.*', re.I)}),
                ('span', {'class': re.compile(r'.*locality.*', re.I)}),
            ]
            
            for tag, attrs in location_selectors:
                elem = card_element.find(tag, attrs)
                if elem:
                    location = elem.get_text(strip=True)
                    break
            
            # If we have at least price or title, create a record
            if price or title:
                return {
                    'raw_data': {
                        'title': title or 'Plot for Sale',
                        'price': price,
                        'price_text': price_text,
                        'area_sqft': area.get('sqft') if area else None,
                        'area_sqm': area.get('sqm') if area else None,
                        'area_sqyd': area.get('sqyd') if area else None,
                        'location': location,
                        'listing_url': listing_url,
                        'property_type': 'plot',
                        'source': 'magicbricks'
                    }
                }
        except Exception as e:
            logger.debug(f"Error parsing listing card: {e}")
        
        return None
    
    def scrape_city(self, city: str, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape all listings for a city"""
        records = []
        
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping {city} - Page {page}")
            
            url = self.build_search_url(city, page)
            response = self.make_request(url)
            
            if not response:
                logger.warning(f"No response for {city} page {page}")
                break
            
            # Check if we got redirected or got an error page
            if '404' in response.url or 'error' in response.url.lower():
                logger.warning(f"Got error page for {city} page {page}")
                break
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try multiple patterns to find listing cards
            listings = []
            
            # Pattern 1: Common card classes
            card_patterns = [
                {'class': re.compile(r'.*card.*', re.I)},
                {'class': re.compile(r'.*listing.*', re.I)},
                {'class': re.compile(r'.*property.*', re.I)},
                {'class': re.compile(r'.*srp.*', re.I)},  # Search Results Page
                {'class': re.compile(r'.*mb-srp.*', re.I)},  # MagicBricks SRP
            ]
            
            for pattern in card_patterns:
                found = soup.find_all('div', pattern)
                if found and len(found) > 0:
                    listings = found
                    logger.debug(f"Found {len(listings)} listings using pattern: {pattern}")
                    break
            
            # If no cards found, try article or section tags
            if not listings:
                listings = soup.find_all(['article', 'section', 'div'], 
                                       {'class': re.compile(r'.*item.*|.*result.*', re.I)})
            
            if not listings:
                logger.warning(f"No listings found for {city} page {page}")
                # Save HTML for debugging
                debug_file = f"data_collection/logs/magicbricks_{city}_page{page}.html"
                with open(debug_file, 'w', encoding='utf-8') as f:
                    f.write(soup.prettify())
                logger.info(f"Saved HTML to {debug_file} for inspection")
                break
            
            logger.info(f"Found {len(listings)} listing cards on page {page}")
            
            page_records = 0
            for listing_elem in listings:
                record = self.parse_listing_card(listing_elem)
                if record:
                    records.append(record)
                    page_records += 1
            
            logger.info(f"Parsed {page_records} valid records from page {page}")
            
            # Check for pagination - look for next button
            next_button = soup.find('a', {'class': re.compile(r'.*next.*', re.I)})
            if not next_button or 'disabled' in str(next_button.get('class', [])):
                logger.info(f"No more pages for {city}")
                break
        
        return records
    
    def scrape(self) -> int:
        """Main scraping method"""
        total_records = 0
        
        for city in self.cities:
            try:
                logger.info(f"\n{'='*50}")
                logger.info(f"Starting collection for {city}")
                logger.info(f"{'='*50}")
                
                records = self.scrape_city(city, max_pages=3)  # Start with 3 pages per city
                saved = self.save_batch(records)
                total_records += saved
                logger.info(f"Collected {saved} listings from {city}")
            except Exception as e:
                logger.error(f"✗ Error scraping {city}: {e}", exc_info=True)
                continue
        
        return total_records


if __name__ == "__main__":
    scraper = MagicbricksScraper()
    summary = scraper.run()
    print(f"\n{'='*60}")
    print(f"Collection Summary")
    print(f"{'='*60}")
    print(f"Status: {summary['status']}")
    if summary['status'] == 'success':
        print(f"Records Collected: {summary['records_collected']}")
        print(f"Duration: {summary['duration_seconds']:.2f}s")
        print(f"Output File: {summary['output_file']}")
    else:
        print(f"Error: {summary.get('error', 'Unknown error')}")

