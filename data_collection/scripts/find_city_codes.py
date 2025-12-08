"""Find city codes by testing API responses"""
import requests
import json

def find_city_code(city_name: str):
    """Try to find city code by testing API"""
    base_url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
    
    # Test a range of codes
    for code in range(4290, 4320):
        params = {
            'editSearch': 'Y',
            'category': 'S',
            'propertyType': '10001',  # Flats (more common)
            'city': str(code),
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
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.magicbricks.com/'
        }
        
        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                    result_list = data.get('resultList', [])
                    if result_list and len(result_list) > 0:
                        # Check if city name matches
                        first_item = result_list[0]
                        api_city = first_item.get('ctName', '').lower()
                        if city_name.lower() in api_city or api_city in city_name.lower():
                            print(f"✓ Found {city_name}: Code {code} (API city: {api_city})")
                            return str(code)
                except:
                    pass
        except:
            pass
    
    return None

# Test known cities
cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad']

print("Finding city codes...")
print("="*60)

city_codes = {}
for city in cities:
    code = find_city_code(city)
    if code:
        city_codes[city] = code
    else:
        print(f"✗ Could not find code for {city}")

print("\n" + "="*60)
print("City Codes Found:")
print("="*60)
for city, code in city_codes.items():
    print(f"  '{city}': '{code}',")

