"""
Discover Magicbricks city codes using the homepageAutoSuggest API endpoint.
This is much better than manual network tab inspection!
"""

import requests
import json
import time
from pathlib import Path
from typing import Dict, Set
from collections import defaultdict

# Common city name prefixes to search for
CITY_SEARCH_TERMS = [
    # Major cities
    'mum', 'mumbai', 'del', 'delhi', 'ban', 'bangalore', 'bengaluru',
    'hyd', 'hyderabad', 'che', 'chennai', 'pun', 'pune', 'kol', 'kolkata',
    'ahm', 'ahmedabad', 'gur', 'gurgaon', 'noi', 'noida', 'far', 'faridabad',
    'jaip', 'jaipur', 'luck', 'lucknow', 'kan', 'kanpur', 'nag', 'nagpur',
    'ind', 'indore', 'thane', 'navi', 'koch', 'kochi', 'coim', 'coimbatore',
    'vad', 'vadodara', 'sur', 'surat', 'vis', 'visakhapatnam', 'pat', 'patna',
    'bhop', 'bhopal', 'lud', 'ludhiana', 'aga', 'agra', 'nas', 'nashik',
    'meer', 'meerut', 'raj', 'rajkot', 'var', 'varanasi', 'srini', 'srinagar',
    'amri', 'amritsar', 'raip', 'raipur', 'chand', 'chandigarh', 'jodh', 'jodhpur',
    'mad', 'madurai', 'raja', 'rajahmundry', 'gwal', 'gwalior', 'jams', 'jamshedpur',
    'bhub', 'bhubaneswar', 'bel', 'belgaum', 'mang', 'mangalore', 'mys', 'mysore',
    'tir', 'tirupati', 'sal', 'salem', 'war', 'warangal', 'aur', 'aurangabad',
    'dhar', 'dharwad', 'kol', 'kolhapur', 'sat', 'satara', 'sang', 'sangli',
    'sol', 'solapur', 'nash', 'nashik', 'pan', 'panvel', 'kal', 'kalyan',
    'ulh', 'ulhasnagar', 'bhi', 'bhiwandi', 'vas', 'vasai', 'vir', 'virar',
]

def get_autosuggest_results(search_term: str) -> Dict:
    """Query the autosuggest API"""
    url = "https://www.magicbricks.com/mbsrp/homepageAutoSuggest"
    params = {
        'searchtxt': search_term,
        'city': 'null'
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.magicbricks.com/'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error querying '{search_term}': {e}")
    
    return {}

def extract_city_codes(autosuggest_data: Dict) -> Dict[str, Dict]:
    """
    Extract city codes from autosuggest response
    
    Returns:
        Dict mapping city_code -> {name, state, suggestType}
    """
    city_codes = {}
    
    location_map = autosuggest_data.get('locationMap', {})
    locations = location_map.get('LOCATION', [])
    
    for loc in locations:
        city_code = loc.get('city')
        suggest_type = loc.get('suggestType', '')
        result = loc.get('result', '')
        state = loc.get('stateName', '')
        state_code = loc.get('state', '')
        
        # Only collect actual cities (not localities, suburbs, etc.)
        if city_code and suggest_type == 'city_name':
            # Use rfnum as the actual city code (sometimes different from city field)
            rfnum = loc.get('rfnum', city_code)
            
            if rfnum not in city_codes or result.lower() == rfnum.lower():
                city_codes[rfnum] = {
                    'name': result,
                    'state': state,
                    'state_code': state_code,
                    'suggest_type': suggest_type,
                    'city_field': city_code,
                    'rfnum': rfnum
                }
    
    return city_codes

def discover_all_city_codes() -> Dict[str, Dict]:
    """Discover all city codes by querying autosuggest API"""
    all_codes = {}
    seen_names = set()
    
    print("Discovering city codes from autosuggest API...")
    print("="*60)
    
    for i, search_term in enumerate(CITY_SEARCH_TERMS, 1):
        print(f"[{i}/{len(CITY_SEARCH_TERMS)}] Searching: '{search_term}'...", end=' ')
        
        data = get_autosuggest_results(search_term)
        codes = extract_city_codes(data)
        
        new_codes = 0
        for code, info in codes.items():
            city_name = info['name']
            # Avoid duplicates by name
            if city_name.lower() not in seen_names:
                all_codes[code] = info
                seen_names.add(city_name.lower())
                new_codes += 1
        
        if new_codes > 0:
            print(f"Found {new_codes} new cities")
        else:
            print("No new cities")
        
        time.sleep(0.3)  # Rate limiting
    
    return all_codes

def format_city_codes_for_scraper(city_codes: Dict[str, Dict]) -> str:
    """Format city codes as Python dict for scraper"""
    lines = ["CITY_CODES = {"]
    
    # Sort by city name for readability
    sorted_codes = sorted(city_codes.items(), key=lambda x: x[1]['name'])
    
    for code, info in sorted_codes:
        city_name = info['name']
        state = info['state']
        comment = f"  # {state}" if state else ""
        lines.append(f"    '{city_name}': '{code}',{comment}")
    
    lines.append("}")
    return "\n".join(lines)

if __name__ == "__main__":
    print("="*60)
    print("Magicbricks City Code Discovery")
    print("="*60)
    print()
    
    city_codes = discover_all_city_codes()
    
    print("\n" + "="*60)
    print(f"Discovered {len(city_codes)} unique cities!")
    print("="*60)
    
    # Group by state
    by_state = defaultdict(list)
    for code, info in city_codes.items():
        state = info['state'] or 'Unknown'
        by_state[state].append((code, info))
    
    print("\nCities by State:")
    print("-"*60)
    for state in sorted(by_state.keys()):
        cities = by_state[state]
        print(f"\n{state} ({len(cities)} cities):")
        for code, info in sorted(cities, key=lambda x: x[1]['name']):
            print(f"  {info['name']}: {code}")
    
    # Save formatted output
    formatted = format_city_codes_for_scraper(city_codes)
    
    print("\n" + "="*60)
    print("Formatted for scraper:")
    print("="*60)
    print(formatted)
    
    # Save to file
    output_path = Path(__file__).parent / 'discovered_city_codes.py'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Auto-discovered city codes from homepageAutoSuggest API\n")
        f.write("# Generated automatically - do not edit manually\n\n")
        f.write(formatted)
    
    print("\n✓ Saved to: data_collection/scripts/discovered_city_codes.py")

