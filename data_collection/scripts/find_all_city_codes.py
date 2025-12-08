"""Find city codes by testing the Magicbricks website or API"""
import requests
from bs4 import BeautifulSoup
import json
import time

def find_city_codes_from_website():
    """Try to find city codes from the website's search dropdown or API"""
    
    # Try the main search page - might have city dropdown data
    url = "https://www.magicbricks.com/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    
    print("Checking Magicbricks homepage for city data...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for script tags with city data
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string and ('city' in script.string.lower() or 'mumbai' in script.string.lower()):
                text = script.string
                # Look for JSON-like structures
                if '{' in text and 'city' in text.lower():
                    print(f"Found script with city data ({len(text)} chars)")
                    # Try to extract
                    if '4320' in text:
                        print("Found Mumbai code 4320 in script")
    except Exception as e:
        print(f"Error: {e}")

def test_city_codes():
    """Test a range of city codes to find valid ones"""
    
    # Common major cities - test codes around Mumbai's 4320
    cities_to_test = [
        ('Mumbai', 4320),  # Known
        ('Delhi', 4299),
        ('Delhi', 4300),
        ('Bangalore', 4298),
        ('Bangalore', 4301),
        ('Hyderabad', 4302),
        ('Chennai', 4303),
        ('Pune', 4304),
        ('Kolkata', 4305),
        ('Ahmedabad', 4306),
        ('Gurgaon', 4307),
        ('Noida', 4308),
    ]
    
    base_url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.magicbricks.com/'
    }
    
    found_codes = {}
    
    for city_name, test_code in cities_to_test:
        print(f"\nTesting {city_name} with code {test_code}...")
        
        params = {
            'editSearch': 'Y',
            'category': 'S',
            'propertyType': '10001',  # Flats (most common)
            'city': str(test_code),
            'page': '1',
            'groupstart': '0',
            'offset': '0',
            'maxOffset': '10',
            'sortBy': 'premiumRecent',
            'postedSince': '-1',
            'pType': '10001',
            'isNRI': 'N',
            'multiLang': 'en'
        }
        
        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                    result_list = data.get('resultList', [])
                    edit_bean = data.get('editAdditionalDataBean', {})
                    city_info = edit_bean.get('cityName', {})
                    
                    if result_list and len(result_list) > 0:
                        api_city = result_list[0].get('ctName', '')
                        city_key = city_info.get('key', '')
                        city_value = city_info.get('value', '')
                        result_count = edit_bean.get('resultCount', 0)
                        
                        print(f"  ✓ Code {test_code} works!")
                        print(f"    API City: {api_city}")
                        print(f"    City Info: {city_value} (key: {city_key})")
                        print(f"    Results: {result_count}")
                        
                        if city_name.lower() in api_city.lower() or api_city.lower() in city_name.lower() or city_name.lower() in city_value.lower():
                            found_codes[city_name] = str(test_code)
                            print(f"    ✓ MATCHED!")
                        else:
                            print(f"    ⚠ City name mismatch - might be different city")
                    else:
                        print(f"  ✗ No results")
                except Exception as e:
                    print(f"  ✗ Not JSON: {e}")
            else:
                print(f"  ✗ Status {response.status_code}")
        except Exception as e:
            print(f"  ✗ Error: {e}")
        
        time.sleep(0.5)  # Rate limiting
    
    return found_codes

if __name__ == "__main__":
    print("="*60)
    print("Finding Magicbricks City Codes")
    print("="*60)
    
    # Test city codes
    found = test_city_codes()
    
    print("\n" + "="*60)
    print("City Codes Found:")
    print("="*60)
    if found:
        for city, code in found.items():
            print(f"  '{city}': '{code}',")
    else:
        print("  No additional codes found. Need to test more ranges or find another method.")
    
    print("\nNote: You can also check the network tab when using Magicbricks website")
    print("to see what city codes are used in actual searches.")

