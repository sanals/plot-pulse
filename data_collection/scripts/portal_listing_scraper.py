"""
Scraper for plot/land listings from Indian real estate portals.
Focuses on extracting actual listing data (asking prices) rather than reports.
"""

from base_scraper import BaseScraper
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import re
import logging
import requests
from urllib.parse import urljoin, urlencode

logger = logging.getLogger(__name__)


class PortalListingScraper(BaseScraper):
    """Base class for scraping property listings from portals"""
    
    def __init__(self, source_name: str, base_url: str):
        super().__init__(
            source_name=source_name,
            base_url=base_url,
            delay_seconds=3.0  # Be respectful
        )
    
    def search_plots(self, city: str, page: int = 1) -> Optional[requests.Response]:
        """
        Search for plot/land listings
        
        Args:
            city: City name
            page: Page number
            
        Returns:
            Response object or None
        """
        raise NotImplementedError("Subclasses must implement search_plots()")
    
    def parse_listing(self, listing_element) -> Optional[Dict[str, Any]]:
        """
        Parse a single listing element
        
        Args:
            listing_element: BeautifulSoup element containing listing
            
        Returns:
            Parsed listing dictionary or None
        """
        raise NotImplementedError("Subclasses must implement parse_listing()")
    
    def extract_price(self, price_text: str) -> Optional[float]:
        """
        Extract numeric price from text
        
        Args:
            price_text: Price as string (e.g., "₹50 Lakh", "50,00,000")
            
        Returns:
            Price in rupees or None
        """
        try:
            # Remove currency symbols and commas
            cleaned = price_text.replace('₹', '').replace(',', '').replace('Rs.', '').replace('Rs', '')
            cleaned = cleaned.strip()
            
            # Handle "Lakh" and "Crore"
            multiplier = 1
            if 'lakh' in cleaned.lower() or 'lac' in cleaned.lower():
                multiplier = 100000
                cleaned = re.sub(r'[lL]akh[s]?|[lL]ac[s]?', '', cleaned)
            elif 'crore' in cleaned.lower() or 'cr' in cleaned.lower():
                multiplier = 10000000
                cleaned = re.sub(r'[cC]rore[s]?|[cC]r[s]?', '', cleaned)
            
            # Extract number
            match = re.search(r'[\d.]+', cleaned)
            if match:
                return float(match.group()) * multiplier
        except Exception as e:
            logger.error(f"Error parsing price '{price_text}': {e}")
        
        return None
    
    def extract_area(self, area_text: str) -> Optional[Dict[str, float]]:
        """
        Extract area in different units
        
        Args:
            area_text: Area string (e.g., "1200 sqft", "150 sqyd", "111 sqm")
            
        Returns:
            Dictionary with sqft, sqm, sqyd or None
        """
        try:
            # Extract number and unit
            match = re.search(r'([\d,]+\.?\d*)\s*(sqft|sqm|sqyd|sq\.ft|sq\.m|sq\.yd)', area_text, re.IGNORECASE)
            if not match:
                return None
            
            value = float(match.group(1).replace(',', ''))
            unit = match.group(2).lower()
            
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
            logger.error(f"Error parsing area '{area_text}': {e}")
        
        return None


class MagicbricksScraper(PortalListingScraper):
    """Scraper for Magicbricks plot/land listings"""
    
    def __init__(self):
        super().__init__(
            source_name="magicbricks_listings",
            base_url="https://www.magicbricks.com"
        )
        self.cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']
    
    def search_plots(self, city: str, page: int = 1) -> Optional[requests.Response]:
        """Search for plots in a city"""
        # Magicbricks search URL structure
        # Note: This is a template - actual URL structure needs to be verified
        search_params = {
            'propertyType': 'plot',
            'city': city,
            'page': page
        }
        
        url = f"{self.base_url}/property-for-sale/plot-in-{city.lower()}"
        if page > 1:
            url += f"?page={page}"
        
        return self.make_request(url)
    
    def parse_listing(self, listing_element) -> Optional[Dict[str, Any]]:
        """Parse a Magicbricks listing"""
        try:
            # Extract listing details (adjust selectors based on actual HTML)
            title_elem = listing_element.find('h2', class_='mb-srp__card--title')
            price_elem = listing_element.find('div', class_='mb-srp__card--price')
            area_elem = listing_element.find('div', class_='mb-srp__card--summary--value')
            location_elem = listing_element.find('div', class_='mb-srp__card--summary--value')
            
            if not title_elem or not price_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            price_text = price_elem.get_text(strip=True)
            price = self.extract_price(price_text)
            
            # Extract area
            area = None
            if area_elem:
                area_text = area_elem.get_text(strip=True)
                area = self.extract_area(area_text)
            
            # Extract location
            location = None
            if location_elem:
                location = location_elem.get_text(strip=True)
            
            # Extract listing URL
            link_elem = listing_element.find('a', href=True)
            listing_url = None
            if link_elem:
                listing_url = urljoin(self.base_url, link_elem['href'])
            
            return {
                'raw_data': {
                    'title': title,
                    'price': price,
                    'price_text': price_text,
                    'area_sqft': area.get('sqft') if area else None,
                    'area_sqm': area.get('sqm') if area else None,
                    'location': location,
                    'listing_url': listing_url,
                    'property_type': 'plot',
                    'source': 'magicbricks'
                }
            }
        except Exception as e:
            logger.error(f"Error parsing listing: {e}")
            return None
    
    def scrape_city(self, city: str, max_pages: int = 10) -> List[Dict[str, Any]]:
        """Scrape all listings for a city"""
        records = []
        
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping {city} - Page {page}")
            
            response = self.search_plots(city, page)
            if not response:
                logger.warning(f"No response for {city} page {page}")
                break
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find listing elements (adjust selector based on actual HTML)
            listings = soup.find_all('div', class_='mb-srp__card')  # Adjust class name
            
            if not listings:
                logger.info(f"No more listings found for {city} at page {page}")
                break
            
            for listing_elem in listings:
                record = self.parse_listing(listing_elem)
                if record:
                    records.append(record)
            
            # Check if there are more pages
            next_button = soup.find('a', class_='next')  # Adjust selector
            if not next_button or 'disabled' in next_button.get('class', []):
                break
        
        return records
    
    def scrape(self) -> int:
        """Main scraping method"""
        total_records = 0
        
        for city in self.cities:
            try:
                records = self.scrape_city(city, max_pages=5)  # Start with 5 pages per city
                saved = self.save_batch(records)
                total_records += saved
                logger.info(f"Collected {saved} listings from {city}")
            except Exception as e:
                logger.error(f"Error scraping {city}: {e}")
                continue
        
        return total_records


if __name__ == "__main__":
    scraper = MagicbricksScraper()
    summary = scraper.run()
    print(f"\nCollection Summary:")
    print(f"Status: {summary['status']}")
    if summary['status'] == 'success':
        print(f"Records: {summary['records_collected']}")
        print(f"Duration: {summary['duration_seconds']:.2f}s")
        print(f"Output: {summary['output_file']}")

