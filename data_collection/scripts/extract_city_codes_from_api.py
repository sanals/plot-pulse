"""Extract city codes from API response"""
import requests
import json

url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
params = {
    'editSearch': 'Y',
    'category': 'S',
    'propertyType': '10003',
    'city': '4320',  # Mumbai
    'page': '1',
    'groupstart': '0',
    'offset': '0',
    'maxOffset': '100',
    'sortBy': 'premiumRecent',
    'postedSince': '-1',
    'pType': '10003',
    'isNRI': 'N',
    'multiLang': 'en'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.magicbricks.com/'
}

response = requests.get(url, params=params, headers=headers, timeout=10)
data = response.json()

print("Checking API response for city codes...")
print("="*60)

# Check editAdditionalDataBean - might have city list
if 'editAdditionalDataBean' in data:
    bean = data['editAdditionalDataBean']
    print(f"editAdditionalDataBean keys: {list(bean.keys()) if isinstance(bean, dict) else 'Not a dict'}")
    print(f"\nFull bean (first 2000 chars):")
    print(json.dumps(bean, indent=2, ensure_ascii=False)[:2000])

# Check if city codes are in the listings
if data.get('resultList'):
    cities_found = {}
    for listing in data['resultList'][:10]:  # Check first 10
        city_name = listing.get('ctName')
        city_code = listing.get('ct')  # Might be city code
        if city_name:
            cities_found[city_name] = city_code
    
    if cities_found:
        print(f"\nCities found in listings:")
        for city, code in cities_found.items():
            print(f"  {city}: {code}")

