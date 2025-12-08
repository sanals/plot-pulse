"""Find missing cities that were marked as 'Not found'"""
import requests
import json
import time

# Cities that were marked as "Not found"
MISSING_CITIES = [
    'Allahabad', 'Ranchi', 'Ghaziabad', 'Jabalpur', 'Vijayawada', 
    'Kota', 'Guwahati', 'Ghaziabad', 'Cuttack', 'Firozabad',
    'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Ajmer',
    'Gulbarga', 'Jamnagar', 'Ujjain', 'Siliguri', 'Jhansi',
    'Ulhasnagar', 'Jammu', 'Erode', 'Malegaon', 'Gaya',
    'Jalgaon', 'Udaipur', 'Kozhikode', 'Akola', 'Kurnool',
    'Mathura', 'Bijapur', 'Rampur', 'Shivamogga', 'Junagadh',
    'Thrissur', 'Alwar', 'Bardhaman', 'Nizamabad', 'Parbhani',
    'Tumkur', 'Khammam', 'Karnal', 'Bathinda', 'Jalna',
    'Eluru', 'Barasat', 'Saharanpur', 'Gorakhpur', 'Guntur',
    'Bikaner', 'Amravati', 'Mira-Bhayandar', 'Thiruvananthapuram',
]

def search_city(city_name: str):
    """Search for a city using autosuggest API"""
    url = "https://www.magicbricks.com/mbsrp/homepageAutoSuggest"
    
    # Try different search terms
    search_terms = [
        city_name.lower(),
        city_name.lower()[:4],  # First 4 chars
        city_name.lower()[:3],  # First 3 chars
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.magicbricks.com/'
    }
    
    for search_term in search_terms:
        params = {
            'searchtxt': search_term,
            'city': 'null'
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                location_map = data.get('locationMap', {})
                locations = location_map.get('LOCATION', [])
                
                for loc in locations:
                    result = loc.get('result', '')
                    suggest_type = loc.get('suggestType', '')
                    city_code = loc.get('city', '')
                    rfnum = loc.get('rfnum', '')
                    
                    # Check if it matches our city
                    if suggest_type == 'city_name' and city_name.lower() in result.lower():
                        print(f"  ✓ Found '{city_name}' as '{result}' with code {rfnum}")
                        return rfnum, result
                    # Also check for alternate names
                    if city_name.lower() == 'allahabad' and 'prayagraj' in result.lower():
                        print(f"  ✓ Found '{city_name}' as '{result}' (Prayagraj) with code {rfnum}")
                        return rfnum, result
                    if city_name.lower() == 'gulbarga' and 'kalaburagi' in result.lower():
                        print(f"  ✓ Found '{city_name}' as '{result}' (Kalaburagi) with code {rfnum}")
                        return rfnum, result
        except Exception as e:
            pass
        
        time.sleep(0.2)
    
    return None, None

print("Searching for missing cities...")
print("="*60)

found_cities = {}
for city in MISSING_CITIES:
    print(f"\nSearching: {city}...", end=' ')
    code, api_name = search_city(city)
    if code:
        found_cities[city] = {'code': code, 'api_name': api_name}
        print(f"✓")
    else:
        print(f"✗ Not found")

print("\n" + "="*60)
print(f"Found {len(found_cities)} cities:")
print("="*60)
for city, info in found_cities.items():
    print(f"  '{city}': '{info['code']}',  # API name: {info['api_name']}")

