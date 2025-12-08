"""
Test script to inspect Magicbricks page structure and debug scraper.
"""

import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path

def test_magicbricks_page(city: str = "Mumbai"):
    """Test fetching and parsing a Magicbricks page"""
    
    base_url = "https://www.magicbricks.com"
    
    # Try different URL patterns and property type codes
    # Common property type codes: 10001=Apartment, 10002=House/Villa, 10003=Plot/Land
    url_patterns = [
        f"{base_url}/property-for-sale/residential-real-estate?proptype=10003&cityName={city}",  # Plot/Land
        f"{base_url}/property-for-sale/residential-plot-land-for-sale-in-{city.lower()}-{city}",
        f"{base_url}/property-for-sale/plot-in-{city.lower()}",
        f"{base_url}/property-for-sale/plot-in-{city.lower().replace(' ', '-')}",
        f"{base_url}/property-for-sale/residential-real-estate?proptype=10002&cityName={city}",  # House/Villa
        f"{base_url}/property-for-sale/plot/all-residential-real-estate?cityName={city}",
    ]
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    for url in url_patterns:
        print(f"\n{'='*60}")
        print(f"Testing URL: {url}")
        print(f"{'='*60}")
        
        try:
            response = session.get(url, timeout=10)
            print(f"Status Code: {response.status_code}")
            print(f"Final URL: {response.url}")
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Save HTML for inspection
                output_dir = Path("data_collection/logs")
                output_dir.mkdir(parents=True, exist_ok=True)
                html_file = output_dir / f"magicbricks_{city}_test.html"
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(soup.prettify())
                print(f"✓ Saved HTML to: {html_file}")
                
                # Try to find listing elements
                print("\nSearching for listing elements...")
                
                # Common patterns
                patterns = [
                    ('div', {'class': lambda x: x and 'card' in ' '.join(x).lower()}),
                    ('div', {'class': lambda x: x and 'listing' in ' '.join(x).lower()}),
                    ('div', {'class': lambda x: x and 'property' in ' '.join(x).lower()}),
                    ('div', {'class': lambda x: x and 'srp' in ' '.join(x).lower()}),
                    ('article', {}),
                    ('section', {'class': lambda x: x and 'item' in ' '.join(x).lower()}),
                ]
                
                for tag, attrs in patterns:
                    elements = soup.find_all(tag, attrs)
                    if elements:
                        print(f"\n✓ Found {len(elements)} elements with pattern: {tag} {attrs}")
                        if len(elements) > 0:
                            # Show first element structure
                            first = elements[0]
                            print(f"  First element classes: {first.get('class', [])}")
                            print(f"  First element tag: {first.name}")
                            
                            # Look for price, title, area in first element
                            price_elem = first.find(string=lambda x: x and ('₹' in str(x) or 'lakh' in str(x).lower() or 'crore' in str(x).lower()))
                            if price_elem:
                                print(f"  Found price text: {price_elem.strip()[:50]}")
                            
                            title_elem = first.find(['h1', 'h2', 'h3', 'a'], string=True)
                            if title_elem:
                                print(f"  Found title: {title_elem.get_text(strip=True)[:50]}")
                            
                            break
                
                # Look for pagination
                next_links = soup.find_all('a', string=lambda x: x and 'next' in str(x).lower())
                if next_links:
                    print(f"\n✓ Found {len(next_links)} 'next' links")
                
                # Check page title
                title = soup.find('title')
                if title:
                    print(f"\nPage Title: {title.get_text()}")
                
                # Check for error messages
                error_msgs = soup.find_all(string=lambda x: x and ('error' in str(x).lower() or 'not found' in str(x).lower() or '404' in str(x)))
                if error_msgs:
                    print(f"\n⚠ Found potential error messages: {len(error_msgs)}")
                
                print(f"\n✓ This URL works! Use it in the scraper.")
                return url
            else:
                print(f"✗ Status code: {response.status_code}")
        
        except Exception as e:
            print(f"✗ Error: {e}")
            continue
    
    print("\n✗ None of the URL patterns worked. Manual inspection needed.")
    return None


if __name__ == "__main__":
    print("Testing Magicbricks page structure...")
    print("This will help identify the correct URL format and HTML structure.\n")
    
    working_url = test_magicbricks_page("Mumbai")
    
    if working_url:
        print(f"\n{'='*60}")
        print("SUCCESS: Found working URL")
        print(f"Working URL: {working_url}")
        print(f"{'='*60}")
        print("\nNext steps:")
        print("1. Check the saved HTML file in data_collection/logs/")
        print("2. Inspect the HTML structure manually")
        print("3. Update the scraper with correct selectors")
    else:
        print("\nManual inspection required:")
        print("1. Visit Magicbricks.com manually")
        print("2. Search for 'plot' in a city")
        print("3. Inspect the page HTML")
        print("4. Update the scraper with correct selectors")

