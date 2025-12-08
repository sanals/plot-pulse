"""
Test script to investigate Magicbricks API endpoints found in network tab.
"""

import requests
import json
from bs4 import BeautifulSoup

def test_api_endpoint():
    """Test the propertySearch.html API endpoint"""
    
    # Test URL with plot property type (10003)
    url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
    
    params = {
        'editSearch': 'Y',
        'category': 'S',  # Sale
        'propertyType': '10003',  # Plot/Land
        'city': '4320',  # Mumbai (need to find other city codes)
        'page': '1',
        'groupstart': '0',
        'offset': '0',
        'maxOffset': '100',
        'sortBy': 'premiumRecent',
        'postedSince': '-1',  # All time
        'pType': '10003',
        'isNRI': 'N',
        'multiLang': 'en'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.magicbricks.com/'
    }
    
    print("Testing Magicbricks API endpoint...")
    print(f"URL: {url}")
    print(f"Params: {params}\n")
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
        print(f"Content Length: {len(response.content)} bytes\n")
        
        # Check if it's JSON
        try:
            data = response.json()
            print("✓ Response is JSON!")
            print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            print(f"\nSample data (first 500 chars):")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:500])
            return True, data
        except:
            pass
        
        # Check if it's HTML
        if 'text/html' in response.headers.get('Content-Type', ''):
            print("Response is HTML")
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for JSON data in script tags
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and ('property' in script.string.lower() or 'listing' in script.string.lower()):
                    print(f"\nFound script tag with property/listing data ({len(script.string)} chars)")
                    # Try to extract JSON
                    text = script.string
                    if 'var' in text or 'const' in text or 'let' in text:
                        print("Contains JavaScript variables - might have data")
            
            # Look for data attributes
            data_elements = soup.find_all(attrs={'data-property': True}) or soup.find_all(attrs={'data-listing': True})
            if data_elements:
                print(f"\nFound {len(data_elements)} elements with data attributes")
            
            # Save HTML for inspection
            with open('data_collection/logs/magicbricks_api_response.html', 'w', encoding='utf-8') as f:
                f.write(soup.prettify())
            print("\nSaved HTML response to: data_collection/logs/magicbricks_api_response.html")
            
            return False, soup
        
        # Try to find JSON in response text
        text = response.text
        if '{' in text and '}' in text:
            # Try to extract JSON
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                try:
                    json_data = json.loads(text[start:end])
                    print("✓ Found JSON in response text!")
                    print(f"Keys: {list(json_data.keys()) if isinstance(json_data, dict) else 'Not a dict'}")
                    return True, json_data
                except:
                    pass
        
        print("\nResponse preview (first 1000 chars):")
        print(response.text[:1000])
        
        return False, response.text
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False, None


def find_city_codes():
    """Try to find city codes by testing common cities"""
    cities_to_test = {
        'Mumbai': '4320',
        'Delhi': None,
        'Bangalore': None,
        'Hyderabad': None,
        'Chennai': None,
        'Pune': None,
        'Kolkata': None,
    }
    
    print("\n" + "="*60)
    print("Testing city codes...")
    print("="*60)
    
    # Common city code patterns (might be sequential or based on some logic)
    base_code = 4320  # Mumbai
    for i, city in enumerate(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata']):
        test_code = base_code + i
        print(f"\nTesting {city} with code {test_code}...")
        
        url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
        params = {
            'editSearch': 'Y',
            'category': 'S',
            'propertyType': '10003',
            'city': str(test_code),
            'page': '1',
            'groupstart': '0',
            'offset': '0',
            'maxOffset': '10',
            'sortBy': 'premiumRecent',
            'postedSince': '-1',
            'pType': '10003',
            'isNRI': 'N',
            'multiLang': 'en'
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200 and len(response.content) > 1000:
                print(f"  ✓ Code {test_code} works for {city}!")
                cities_to_test[city] = str(test_code)
            else:
                print(f"  ✗ Code {test_code} didn't work")
        except:
            print(f"  ✗ Error testing code {test_code}")
    
    return cities_to_test


if __name__ == "__main__":
    print("="*60)
    print("Magicbricks API Investigation")
    print("="*60)
    
    # Test the API endpoint
    is_json, data = test_api_endpoint()
    
    if is_json:
        print("\n" + "="*60)
        print("SUCCESS: API returns JSON data!")
        print("="*60)
        print("\nWe can use this API directly instead of scraping HTML!")
    else:
        print("\n" + "="*60)
        print("API returns HTML - might need to parse it")
        print("="*60)
    
    # Try to find city codes
    print("\n")
    city_codes = find_city_codes()
    
    print("\n" + "="*60)
    print("City Codes Found:")
    print("="*60)
    for city, code in city_codes.items():
        if code:
            print(f"  {city}: {code}")
